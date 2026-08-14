import {defaultLocale, isAppLocale, type AppLocale} from "@/i18n/request";
import {buildHref, isNavigableRoute} from "@/lib/agent/hub-map";
import {buildLocalAnswer, type LocalAnswer} from "@/lib/agent/local-fallback";
import {buildSystemPrompt, buildUserContext} from "@/lib/agent/prompt";
import {
  ProviderUnavailableError,
  resolveProviders,
  streamChatTurn,
  toOpenAITools,
  type AgentProvider,
  type ChatMessage,
  type ChatTurn
} from "@/lib/agent/providers";
import {agentTools, allowedLinkUrls} from "@/lib/agent/tools";
import {chargeQuota, quotaCookie, readQuota} from "@/lib/agent/visitor-quota";
import type {
  AgentMessage,
  AgentNavigation,
  AgentStreamEvent
} from "@/lib/agent/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_TURNS = 16;
const MAX_CHARS_PER_MESSAGE = 2000;
const MAX_TOOL_ROUNDS = 3;

// Coarse per-instance throttle. Serverless means each instance keeps its own
// counter, so this bounds abuse from a single client rather than enforcing a
// global quota — the provider's own 429 is what actually caps total spend.
//
// Two budgets, because the two paths cost wildly different things. A model call
// spends free-tier quota; an offline keyword answer is a few string
// comparisons. Charging them against one bucket meant a visitor having an
// actual conversation got cut off mid-thought, and a deployment with no key at
// all — the documented default — was rate-limited for doing nothing but
// substring matching.
const RATE_LIMIT_WINDOW_MS = 60_000;
const MODEL_MAX_REQUESTS = 24;
const LOCAL_MAX_REQUESTS = 90;
const rateLimitBuckets = new Map<string, number[]>();

function clientKey(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  const realIp = request.headers.get("x-real-ip");
  if (realIp) {
    return realIp;
  }
  // No proxy headers — local dev, or a host that does not forward them. Every
  // client collapses into this one bucket, so it must not be the tight budget.
  return "anonymous";
}

interface RateVerdict {
  limited: boolean;
  retryAfterSeconds: number;
}

function checkRate(key: string, max: number): RateVerdict {
  const now = Date.now();
  const bucket = `${key}:${max}`;
  const hits = (rateLimitBuckets.get(bucket) ?? []).filter(
    (timestamp) => now - timestamp < RATE_LIMIT_WINDOW_MS
  );

  if (hits.length >= max) {
    rateLimitBuckets.set(bucket, hits);
    const oldest = hits[0];
    return {
      limited: true,
      retryAfterSeconds: Math.max(
        1,
        Math.ceil((RATE_LIMIT_WINDOW_MS - (now - oldest)) / 1000)
      )
    };
  }

  hits.push(now);
  rateLimitBuckets.set(bucket, hits);

  // Keep the map from growing without bound on a long-lived instance.
  if (rateLimitBuckets.size > 5000) {
    for (const [bucketKey, timestamps] of rateLimitBuckets) {
      if (timestamps.every((timestamp) => now - timestamp >= RATE_LIMIT_WINDOW_MS)) {
        rateLimitBuckets.delete(bucketKey);
      }
    }
  }

  return {limited: false, retryAfterSeconds: 0};
}

/**
 * The endpoint is only ever called by this site's own chat widget, and a
 * browser always sends `Origin` on a cross-document POST. Requiring it to match
 * costs nothing and closes the obvious abuse: a stranger pointing `curl` at the
 * route and using the deployment as a free model proxy.
 *
 * A missing `Origin` is allowed outside production so local scripts and tests
 * still work; in production it is refused.
 */
function isSameOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  if (!origin) {
    return process.env.NODE_ENV !== "production";
  }
  try {
    return new URL(origin).host === request.headers.get("host");
  } catch {
    return false;
  }
}

/**
 * `code` is what the client localises against. The `error` string is a
 * developer-facing fallback only — never render it to a visitor, it is English
 * regardless of their locale.
 */
function errorResponse(
  code: "rate_limited" | "bad_request" | "forbidden",
  message: string,
  status: number,
  retryAfterSeconds?: number
): Response {
  return Response.json(
    {error: message, code, retryAfter: retryAfterSeconds},
    {
      status,
      headers: retryAfterSeconds
        ? {"retry-after": String(retryAfterSeconds)}
        : undefined
    }
  );
}

function parseMessages(raw: unknown): AgentMessage[] {
  if (!Array.isArray(raw)) {
    return [];
  }

  return raw
    .flatMap((entry): AgentMessage[] => {
      if (!entry || typeof entry !== "object") {
        return [];
      }
      const record = entry as Record<string, unknown>;
      if (record.role !== "user" && record.role !== "assistant") {
        return [];
      }
      if (typeof record.content !== "string") {
        return [];
      }
      const content = record.content.trim();
      if (!content) {
        return [];
      }
      return [{role: record.role, content: content.slice(0, MAX_CHARS_PER_MESSAGE)}];
    })
    .slice(-MAX_TURNS);
}

function parseRoute(raw: unknown): string {
  if (typeof raw !== "string") {
    return "";
  }
  const trimmed = raw.replace(/^\/+|\/+$/g, "");
  return isNavigableRoute(trimmed) ? trimmed : "";
}

function sse(event: AgentStreamEvent): string {
  return `data: ${JSON.stringify(event)}\n\n`;
}

function streamResponse(
  body: ReadableStream<Uint8Array>,
  cookie: string | null
): Response {
  const headers = new Headers({
    "content-type": "text/event-stream; charset=utf-8",
    "cache-control": "no-cache, no-transform",
    connection: "keep-alive",
    "x-accel-buffering": "no"
  });
  if (cookie) {
    headers.append("set-cookie", cookie);
  }
  return new Response(body, {headers});
}

const LOCAL_STREAM_TARGET_CHARS = 26;

/**
 * Groups whole words into short phrases. Local answers used to land as one
 * giant SSE event, so the transcript appeared instantly and the speaking pose
 * had nothing visible to accompany. Phrase-sized chunks feel responsive while
 * preserving punctuation and paragraph spacing exactly.
 */
function chunkLocalText(text: string): string[] {
  const words = text.match(/\S+\s*/gu);
  if (!words) {
    return text ? [text] : [];
  }

  const chunks: string[] = [];
  let current = "";

  for (const word of words) {
    current += word;
    const endsParagraph = /\n\n$/u.test(current);
    const endsSentence = /[.!?]["')\]]?\s*$/u.test(current);
    if (
      current.length >= LOCAL_STREAM_TARGET_CHARS ||
      endsParagraph ||
      endsSentence
    ) {
      chunks.push(current);
      current = "";
    }
  }

  if (current) {
    chunks.push(current);
  }

  return chunks;
}

function localChunkDelay(chunk: string): number {
  if (/\n\n$/u.test(chunk)) return 115;
  if (/[.!?]["')\]]?\s*$/u.test(chunk)) return 82;
  if (/[,;:]\s*$/u.test(chunk)) return 52;
  return 34;
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Said once, in the visitor's own language, when their daily budget is spent.
 * Silently degrading to the curated answers would read as the assistant getting
 * worse for no reason.
 */
const QUOTA_NOTICE: Record<AppLocale, string> = {
  en: "You have reached today's question limit, so I am answering from my core notes rather than thinking it through. The links below are still the real sources.\n\n",
  es: "Has alcanzado el límite de preguntas de hoy, así que respondo desde mis notas base en lugar de razonarlo. Los enlaces de abajo siguen siendo las fuentes reales.\n\n",
  "pt-br":
    "Você atingiu o limite de perguntas de hoje, então respondo a partir das minhas notas básicas em vez de raciocinar. Os links abaixo continuam sendo as fontes reais.\n\n",
  uk: "Ви вичерпали денний ліміт запитань, тож я відповідаю з базових нотаток, а не міркую над відповіддю. Посилання нижче лишаються справжніми джерелами.\n\n",
  ko: "오늘의 질문 한도에 도달해서 추론 대신 기본 노트를 바탕으로 답변합니다. 아래 링크는 그대로 실제 출처입니다.\n\n"
};

/** Emits the offline answer over the same SSE contract the model path uses. */
function localStream(
  messages: AgentMessage[],
  locale: AppLocale,
  currentRoute: string,
  resolvedAnswer: LocalAnswer | undefined,
  cookie: string | null,
  notice: string
): Response {
  const encoder = new TextEncoder();
  const answer = resolvedAnswer ?? buildLocalAnswer(messages, locale, currentRoute);
  let cancelled = false;

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        controller.enqueue(encoder.encode(sse({type: "status", value: "answering"})));

        const chunks = chunkLocalText(`${notice}${answer.text}`);
        for (let index = 0; index < chunks.length; index += 1) {
          if (cancelled) return;
          const chunk = chunks[index];
          controller.enqueue(encoder.encode(sse({type: "text", value: chunk})));
          if (index < chunks.length - 1) {
            await wait(localChunkDelay(chunk));
          }
        }

        if (cancelled) return;
        if (answer.navigation) {
          controller.enqueue(
            encoder.encode(sse({type: "navigate", value: answer.navigation}))
          );
        }
        for (const link of answer.links) {
          controller.enqueue(encoder.encode(sse({type: "link", value: link})));
        }

        controller.enqueue(
          encoder.encode(sse({type: "done", value: {provider: "local"}}))
        );
        controller.close();
      } catch (error) {
        if (!cancelled) {
          controller.error(error);
        }
      }
    },
    cancel() {
      cancelled = true;
    }
  });

  return streamResponse(stream, cookie);
}

/**
 * The provider chain for one request, walked until somebody answers.
 *
 * Two pieces of state, and both were bugs before they were state:
 *
 * A provider that fails over is **retired for the rest of the request**. Rate
 * limits do not clear in the second it takes to run a tool, so retrying the
 * same exhausted provider on the next round only spends latency to be told 429
 * again.
 *
 * Failover is refused once text has reached the visitor — but that is tracked
 * **per turn**, not per request. Restarting a half-written answer on another
 * provider would replay it from the beginning on screen; starting a *fresh*
 * turn elsewhere after a tool call is invisible and perfectly safe.
 */
function createProviderChain(providers: AgentProvider[]) {
  let available = [...providers];

  return {
    async run(
      conversation: ChatMessage[],
      tools: unknown[],
      onText: (delta: string) => void
    ): Promise<{turn: ChatTurn; provider: AgentProvider}> {
      let emittedThisTurn = false;
      let lastFailure: unknown = null;

      while (available.length > 0) {
        const provider = available[0];
        try {
          const turn = await streamChatTurn(provider, conversation, tools, (delta) => {
            emittedThisTurn = true;
            onText(delta);
          });
          return {turn, provider};
        } catch (error) {
          if (error instanceof ProviderUnavailableError && !emittedThisTurn) {
            console.warn(`hub-agent: falling past ${provider.id} — ${error.message}`);
            available = available.slice(1);
            lastFailure = error;
            continue;
          }
          throw error;
        }
      }

      throw lastFailure ?? new Error("no model provider is configured");
    }
  };
}

export async function POST(request: Request): Promise<Response> {
  if (!isSameOrigin(request)) {
    return errorResponse("forbidden", "Cross-origin requests are not accepted.", 403);
  }

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return Response.json({error: "Invalid JSON body."}, {status: 400});
  }

  const messages = parseMessages(body.messages);
  if (messages.length === 0 || !messages.some((message) => message.role === "user")) {
    return errorResponse(
      "bad_request",
      "At least one user message is required.",
      400
    );
  }

  const locale: AppLocale =
    typeof body.locale === "string" && isAppLocale(body.locale) ? body.locale : defaultLocale;
  const currentRoute = parseRoute(body.currentRoute);

  const providers = resolveProviders();
  const localAnswer = buildLocalAnswer(messages, locale, currentRoute);
  const isLocallyResolved = localAnswer.kind !== "fallback";
  const key = clientKey(request);

  // Budget is charged against the path that will actually serve the request, so
  // a curated answer never spends provider quota or gets throttled at a model
  // call's price. Unknown and conversational questions may use a provider.
  const usesModel = providers.length > 0 && !isLocallyResolved;
  const verdict = checkRate(key, usesModel ? MODEL_MAX_REQUESTS : LOCAL_MAX_REQUESTS);
  if (verdict.limited) {
    return errorResponse(
      "rate_limited",
      "Too many requests. Please wait a moment.",
      429,
      verdict.retryAfterSeconds
    );
  }

  // A curated answer costs nothing to serve, so it is never charged against the
  // visitor's daily budget — only turns that can reach a provider are.
  if (!usesModel) {
    return localStream(messages, locale, currentRoute, localAnswer, null, "");
  }

  const quota = chargeQuota(readQuota(request));
  const cookie = quotaCookie(quota.state);

  if (quota.tier === "exhausted") {
    return localStream(
      messages,
      locale,
      currentRoute,
      localAnswer,
      cookie,
      QUOTA_NOTICE[locale]
    );
  }

  const encoder = new TextEncoder();
  const tools = toOpenAITools(agentTools);

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (event: AgentStreamEvent): void => {
        controller.enqueue(encoder.encode(sse(event)));
      };

      // Only the first navigate/open_link of a reply is honoured, so a chatty
      // model cannot yank the visitor through several pages in one turn.
      let navigationSent = false;
      let emitted = false;
      const seenLinks = new Set<string>();

      const conversation: ChatMessage[] = [
        {role: "system", content: buildSystemPrompt(locale)},
        ...messages.map((message, index) => {
          if (index === messages.length - 1 && message.role === "user") {
            return {
              role: "user" as const,
              content: `${buildUserContext(currentRoute, locale)}\n\n${message.content}`
            };
          }
          return {role: message.role, content: message.content};
        })
      ];

      try {
        send({type: "status", value: "thinking"});

        // The throttled tier is paced here rather than refused. It sits between
        // the two `status` events, so the visitor reads it as thinking.
        if (quota.delayMs > 0) {
          await wait(quota.delayMs);
        }

        const chain = createProviderChain(providers);
        let servedBy = providers[0]?.id ?? "local";

        for (let round = 0; round <= MAX_TOOL_ROUNDS; round += 1) {
          const {turn, provider} = await chain.run(conversation, tools, (delta) => {
            if (!emitted) {
              emitted = true;
              send({type: "status", value: "answering"});
            }
            send({type: "text", value: delta});
          });
          servedBy = provider.id;

          if (turn.toolCalls.length === 0) {
            break;
          }

          conversation.push({
            role: "assistant",
            content: turn.text || null,
            tool_calls: turn.toolCalls.map((call) => ({
              id: call.id,
              type: "function" as const,
              function: {name: call.name, arguments: call.arguments}
            }))
          });

          for (const call of turn.toolCalls) {
            let input: Record<string, unknown> = {};
            try {
              const parsed: unknown = JSON.parse(call.arguments || "{}");
              if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
                input = parsed as Record<string, unknown>;
              }
            } catch {
              // Malformed arguments are a tool error, not a crash — the model
              // gets told and can retry within its remaining rounds.
            }

            let result = "ok";

            if (call.name === "navigate") {
              const route = parseRoute(input.route);
              const reason = typeof input.reason === "string" ? input.reason : "";

              if (navigationSent) {
                result = "skipped: a navigation was already performed this turn";
              } else if (route === currentRoute) {
                result = "skipped: the visitor is already on that page";
              } else if (!isNavigableRoute(route) && route !== "") {
                result = "error: unknown route";
              } else {
                const navigation: AgentNavigation = {
                  route,
                  href: buildHref(locale, route),
                  label: reason || route || "Home",
                  reason
                };
                send({type: "navigate", value: navigation});
                navigationSent = true;
                result = "ok: the visitor is being taken there now";
              }
            } else if (call.name === "open_link") {
              const url = typeof input.url === "string" ? input.url : "";
              const label = typeof input.label === "string" ? input.label : url;

              if (!allowedLinkUrls.has(url)) {
                result =
                  "error: that URL is not in the approved list — use one from the system prompt";
              } else if (seenLinks.has(url)) {
                result = "ok: already shown";
              } else {
                seenLinks.add(url);
                send({type: "link", value: {label, url}});
                result = "ok: link shown to the visitor";
              }
            } else {
              result = "error: unknown tool";
            }

            conversation.push({
              role: "tool",
              tool_call_id: call.id,
              content: result
            });
          }
        }

        send({type: "done", value: {provider: servedBy}});
      } catch (error) {
        console.error("hub-agent stream error:", error);

        // Nothing reached the visitor yet, so the offline brain can still serve
        // a whole answer. Once text has been sent, appending a second complete
        // answer under it would read as the assistant repeating itself — the
        // partial reply plus its links is the better outcome.
        if (!emitted) {
          const answer = buildLocalAnswer(messages, locale, currentRoute);
          send({type: "text", value: answer.text});
          if (answer.navigation && !navigationSent) {
            send({type: "navigate", value: answer.navigation});
          }
          for (const link of answer.links) {
            send({type: "link", value: link});
          }
        }
        send({type: "done", value: {provider: "local-fallback"}});
      } finally {
        controller.close();
      }
    }
  });

  return streamResponse(stream, cookie);
}
