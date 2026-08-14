/**
 * The model providers Stander can speak through, in the order it tries them.
 *
 * Every provider here is OpenAI-compatible — one request shape, one streaming
 * format, so adding a fourth is a config change rather than a code change. The
 * chain exists because these are free tiers: Groq allows 30 requests a minute
 * and 1,000 a day, OpenRouter 20 a minute, and a busy afternoon can reach
 * either. Rather than count requests ourselves we let the provider count and
 * treat its 429 as the signal to move down the chain.
 *
 * The last link is not a provider at all — it is the curated offline knowledge
 * in `lib/agent/local-fallback.ts`. So the failure mode of every provider being
 * exhausted is the hub answering exactly as it did before any key existed, not
 * an error.
 */

export interface AgentProvider {
  /** Short name, surfaced in the `done` event so the client can tell them apart. */
  id: string;
  baseUrl: string;
  apiKey: string;
  model: string;
}

/**
 * Defaults are the same model family across both providers on purpose: when the
 * chain fails over mid-conversation the visitor should not notice a change of
 * voice. Both are overridable per deployment.
 */
const PROVIDER_DEFAULTS = [
  {
    id: "groq",
    keyVar: "GROQ_API_KEY",
    baseUrlVar: "GROQ_BASE_URL",
    modelVar: "GROQ_MODEL",
    baseUrl: "https://api.groq.com/openai/v1",
    model: "openai/gpt-oss-120b"
  },
  {
    id: "openrouter",
    keyVar: "OPENROUTER_API_KEY",
    baseUrlVar: "OPENROUTER_BASE_URL",
    modelVar: "OPENROUTER_MODEL",
    baseUrl: "https://openrouter.ai/api/v1",
    model: "openai/gpt-oss-20b:free"
  }
] as const;

/** The configured chain, in priority order. Empty means offline-only. */
export function resolveProviders(): AgentProvider[] {
  const chain: AgentProvider[] = [];

  for (const preset of PROVIDER_DEFAULTS) {
    const apiKey = process.env[preset.keyVar]?.trim();
    if (!apiKey) {
      continue;
    }
    chain.push({
      id: preset.id,
      apiKey,
      baseUrl: process.env[preset.baseUrlVar]?.trim() || preset.baseUrl,
      model: process.env[preset.modelVar]?.trim() || preset.model
    });
  }

  return chain;
}

/* ------------------------------------------------------------------ types */

export interface ChatToolCall {
  id: string;
  name: string;
  /** Raw JSON string as the model emitted it. Never trusted — always parsed. */
  arguments: string;
}

export interface ChatMessage {
  role: "system" | "user" | "assistant" | "tool";
  content?: string | null;
  tool_calls?: {
    id: string;
    type: "function";
    function: {name: string; arguments: string};
  }[];
  tool_call_id?: string;
}

export interface ChatTurn {
  text: string;
  toolCalls: ChatToolCall[];
  finishReason: string;
}

/** Thrown when this provider cannot serve the request but another one might. */
export class ProviderUnavailableError extends Error {
  constructor(
    readonly providerId: string,
    readonly status: number,
    message: string
  ) {
    super(message);
    this.name = "ProviderUnavailableError";
  }
}

/**
 * Statuses worth moving down the chain for. A 400 or 401 is our bug or a bad
 * key — failing over would just repeat the mistake at the next provider and
 * hide the cause, so those are thrown as ordinary errors.
 */
const FAILOVER_STATUSES = new Set([408, 409, 425, 429, 500, 502, 503, 504, 529]);

/** Anthropic-shaped tool definitions rendered into OpenAI's function schema. */
export function toOpenAITools(
  tools: readonly {name: string; description: string; input_schema: unknown}[]
): unknown[] {
  return tools.map((tool) => ({
    type: "function",
    function: {
      name: tool.name,
      description: tool.description,
      // `strict` is deliberately not forwarded: support varies across free
      // models, and every argument is validated server-side regardless.
      parameters: tool.input_schema
    }
  }));
}

/* -------------------------------------------------------------- streaming */

const REQUEST_TIMEOUT_MS = 45_000;

/**
 * One streamed turn against one provider.
 *
 * `onText` fires per delta so the visitor sees the answer as it is written.
 * Tool-call fragments are accumulated by index — providers split the JSON
 * arguments across chunks, and a chunk boundary can fall anywhere, including
 * mid-escape-sequence.
 */
export async function streamChatTurn(
  provider: AgentProvider,
  messages: ChatMessage[],
  tools: unknown[],
  onText: (delta: string) => void
): Promise<ChatTurn> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  let response: Response;
  try {
    response = await fetch(`${provider.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${provider.apiKey}`
      },
      body: JSON.stringify({
        model: provider.model,
        max_tokens: 1400,
        stream: true,
        messages,
        tools,
        tool_choice: "auto"
      }),
      signal: controller.signal
    });
  } catch (error) {
    clearTimeout(timeout);
    // A timeout or socket failure is exactly the case the next provider exists
    // for, so it is failover-shaped rather than fatal.
    throw new ProviderUnavailableError(
      provider.id,
      0,
      `${provider.id} unreachable: ${String((error as Error)?.message ?? error)}`
    );
  }

  if (!response.ok || !response.body) {
    clearTimeout(timeout);
    const detail = await response.text().catch(() => "");
    const message = `${provider.id} returned ${response.status}: ${detail.slice(0, 200)}`;
    if (FAILOVER_STATUSES.has(response.status) || !response.body) {
      throw new ProviderUnavailableError(provider.id, response.status, message);
    }
    throw new Error(message);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  const partials = new Map<number, ChatToolCall>();
  let text = "";
  let finishReason = "stop";
  let buffer = "";

  try {
    for (;;) {
      const {done, value} = await reader.read();
      if (done) {
        break;
      }
      buffer += decoder.decode(value, {stream: true});

      // SSE frames are newline-delimited, but a network chunk can end mid-line.
      // Keep the tail in the buffer until its newline arrives.
      let newline = buffer.indexOf("\n");
      while (newline !== -1) {
        const line = buffer.slice(0, newline).trim();
        buffer = buffer.slice(newline + 1);
        newline = buffer.indexOf("\n");

        if (!line.startsWith("data:")) {
          continue;
        }
        const payload = line.slice(5).trim();
        if (!payload || payload === "[DONE]") {
          continue;
        }

        let parsed: Record<string, unknown>;
        try {
          parsed = JSON.parse(payload) as Record<string, unknown>;
        } catch {
          // A malformed frame is not worth losing the whole turn over.
          continue;
        }

        const choice = (parsed.choices as Record<string, unknown>[] | undefined)?.[0];
        if (!choice) {
          continue;
        }
        if (typeof choice.finish_reason === "string") {
          finishReason = choice.finish_reason;
        }

        const delta = choice.delta as Record<string, unknown> | undefined;
        if (!delta) {
          continue;
        }

        if (typeof delta.content === "string" && delta.content) {
          text += delta.content;
          onText(delta.content);
        }

        const deltaCalls = delta.tool_calls as Record<string, unknown>[] | undefined;
        for (const call of deltaCalls ?? []) {
          const index = typeof call.index === "number" ? call.index : 0;
          const fn = call.function as Record<string, unknown> | undefined;
          const existing = partials.get(index) ?? {id: "", name: "", arguments: ""};

          if (typeof call.id === "string" && call.id) {
            existing.id = call.id;
          }
          if (typeof fn?.name === "string" && fn.name) {
            existing.name = fn.name;
          }
          if (typeof fn?.arguments === "string") {
            existing.arguments += fn.arguments;
          }
          partials.set(index, existing);
        }
      }
    }
  } finally {
    clearTimeout(timeout);
    reader.releaseLock();
  }

  const toolCalls = [...partials.entries()]
    .sort(([left], [right]) => left - right)
    .map(([index, call]) => ({
      ...call,
      // Not every provider sends an id when there is only one call, and the
      // tool-result message needs something to reference it by.
      id: call.id || `call_${index}`
    }))
    .filter((call) => call.name);

  // Some free models emit tool calls without ever setting finish_reason.
  if (toolCalls.length > 0 && finishReason !== "tool_calls") {
    finishReason = "tool_calls";
  }

  return {text, toolCalls, finishReason};
}
