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
  /** Output budget. Per provider because their scarce resources differ. */
  maxTokens: number;
  /** Provider-specific request fields, merged into the body verbatim. */
  extraBody?: Record<string, unknown>;
}

/**
 * Both defaults were chosen by running the real prompt through the candidates
 * and reading the answers, which is the only way this particular choice can be
 * made honestly. Two findings are worth keeping:
 *
 * `llama-3.3-70b-versatile` cannot use these tools. It has the most generous
 * token allowance on Groq's free tier and looked like the obvious primary, but
 * with the real tool schema it fails every time with 400 `tool_use_failed` —
 * Groq rejecting the model's own malformed tool JSON. It answers fine without
 * tools, which is exactly why a smoke test misses this.
 *
 * A model being LISTED is not the same as being usable. Groq's `/models`
 * returns ids that a free key is then refused for, and the refusal is a
 * misleading `401 Invalid API Key`. Confirm a default by generating with it.
 *
 * The primary is picked for latency as much as quality: Groq answers this
 * prompt in about 1.4 seconds against OpenRouter's 4 to 15, and a hologram that
 * stares silently for fifteen seconds reads as broken.
 */
const PROVIDER_DEFAULTS = [
  {
    id: "groq",
    keyVar: "GROQ_API_KEY",
    baseUrlVar: "GROQ_BASE_URL",
    modelVar: "GROQ_MODEL",
    baseUrl: "https://api.groq.com/openai/v1",
    model: "openai/gpt-oss-120b",
    // Output counts against the same per-minute token allowance the prompt
    // does, and here that allowance is the binding constraint. Roughly triple
    // the longest answer the voice rules ask for.
    maxTokens: 1000
  },
  {
    id: "openrouter",
    keyVar: "OPENROUTER_API_KEY",
    baseUrlVar: "OPENROUTER_BASE_URL",
    modelVar: "OPENROUTER_MODEL",
    baseUrl: "https://openrouter.ai/api/v1",
    model: "nvidia/nemotron-3-super-120b-a12b:free",
    /**
     * More than double Groq's, because this model thinks before it writes and
     * the thinking is billed to the same budget: a measured turn spent 375 of
     * its 649 completion tokens on reasoning nobody sees. At 1,000 the visible
     * answer ran out mid-clause — one battery answer stopped at "…inside the
     * qualifying band around the mark price;". OpenRouter meters requests per
     * day rather than tokens per minute, so the room is free here.
     */
    maxTokens: 2400,
    // Keep the reasoning, bound it, and drop it from the response. `exclude`
    // matters for more than bandwidth: without it the reasoning text streams
    // through the same channel as the answer.
    extraBody: {reasoning: {effort: "low", exclude: true}}
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
      model: process.env[preset.modelVar]?.trim() || preset.model,
      maxTokens: preset.maxTokens,
      extraBody: "extraBody" in preset ? preset.extraBody : undefined
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
 * Transient trouble: the provider is fine, it is busy or briefly down. Routine
 * on a free tier, and the next provider is the whole answer.
 */
const TRANSIENT_STATUSES = new Set([408, 409, 425, 429, 500, 502, 503, 504, 529]);

/**
 * Rejected credentials, a plan that does not cover the model, a model id that
 * does not exist — and, on Groq, a plain lie.
 *
 * These used to be fatal, on the theory that failing over would "repeat the
 * mistake at the next provider and hide the cause". Two things were wrong with
 * that. Every provider has its own key and its own model id, so this is
 * per-provider by definition — precisely what the chain exists for. And a 401
 * here is not even reliably about credentials: when a Groq free key exhausts
 * its per-minute TOKEN allowance it answers `401 Invalid API Key`, alternating
 * with a truthful 429 on the very next request. Treating that as fatal took the
 * assistant down for a limit it was supposed to ride out.
 *
 * So it fails over, and it is logged loudly — if it really is a bad key, the
 * log is the only place that will ever say so.
 */
const MISCONFIGURED_STATUSES = new Set([401, 403, 404]);

/**
 * Some models answer a tool-enabled request with malformed tool JSON, and the
 * provider rejects their output as a 400 on our behalf. Nothing about the
 * request is wrong, so the next provider — a different model — usually just
 * answers it.
 */
function isRecoverableBadRequest(status: number, body: string): boolean {
  return status === 400 && /tool[_ ]use[_ ]failed|failed to call a function/i.test(body);
}

/**
 * Which providers have answered at least once in this process.
 *
 * Without this the log cries wolf. Groq reports an exhausted token allowance as
 * `401 Invalid API Key`, so a busy minute would print "check your key" over and
 * over about a key that is perfectly fine — and a log that is wrong most of the
 * time is a log nobody reads on the day it is right. A provider that has
 * already answered has a working key by demonstration, so its 401 is reported
 * as the rate limit it almost certainly is.
 */
const provenProviders = new Set<string>();

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

/**
 * Covers the whole stream, and the chain can spend it once per provider — so
 * this is really "half the worst case a visitor waits before the offline answer
 * appears". At 45 seconds that worst case was a minute and a half of a blinking
 * cursor, which no one waits through. Free-tier answers stream in under ten
 * seconds; a provider still silent at twenty-five is not coming.
 */
const REQUEST_TIMEOUT_MS = 25_000;

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
        max_tokens: provider.maxTokens,
        stream: true,
        messages,
        tools,
        tool_choice: "auto",
        ...(provider.extraBody ?? {})
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

    if (MISCONFIGURED_STATUSES.has(response.status)) {
      if (provenProviders.has(provider.id)) {
        console.warn(
          `hub-agent: ${provider.id} refused a request with ${response.status} after` +
            ` previously succeeding — almost certainly its per-minute token limit,` +
            ` not the key. Falling through.`
        );
      } else {
        console.error(
          `hub-agent: ${provider.id} has never answered and returned ${response.status} —` +
            ` check ${provider.id.toUpperCase()}_API_KEY and that the model` +
            ` "${provider.model}" is available on that plan. ${message}`
        );
      }
    }

    if (
      TRANSIENT_STATUSES.has(response.status) ||
      MISCONFIGURED_STATUSES.has(response.status) ||
      isRecoverableBadRequest(response.status, detail) ||
      !response.body
    ) {
      throw new ProviderUnavailableError(provider.id, response.status, message);
    }
    throw new Error(message);
  }

  provenProviders.add(provider.id);

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
