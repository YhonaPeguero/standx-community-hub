import Anthropic from "@anthropic-ai/sdk";
import {defaultLocale, isAppLocale, type AppLocale} from "@/i18n/request";
import {buildHref, isNavigableRoute} from "@/lib/agent/hub-map";
import {buildLocalAnswer} from "@/lib/agent/local-fallback";
import {buildSystemPrompt, buildUserContext} from "@/lib/agent/prompt";
import {agentTools, allowedLinkUrls} from "@/lib/agent/tools";
import type {
  AgentMessage,
  AgentNavigation,
  AgentStreamEvent
} from "@/lib/agent/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MODEL = process.env.STANDX_AGENT_MODEL ?? "claude-opus-5";
const MAX_TURNS = 16;
const MAX_CHARS_PER_MESSAGE = 2000;
const MAX_TOOL_ROUNDS = 3;

// Coarse per-instance throttle. Serverless means each instance keeps its own
// counter, so this bounds abuse from a single client rather than enforcing a
// global quota — put a real limiter in front of the route if traffic grows.
//
// Two budgets, because the two paths cost wildly different things. A model call
// costs money; an offline keyword answer is a few string comparisons. Charging
// them against one 12/minute bucket meant a visitor having an actual
// conversation got cut off mid-thought, and a deployment with no API key at all
// — the documented default — was rate-limited for doing nothing but substring
// matching.
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
 * `code` is what the client localises against. The `error` string is a
 * developer-facing fallback only — never render it to a visitor, it is English
 * regardless of their locale.
 */
function errorResponse(
  code: "rate_limited" | "bad_request",
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

function streamResponse(body: ReadableStream<Uint8Array>): Response {
  return new Response(body, {
    headers: {
      "content-type": "text/event-stream; charset=utf-8",
      "cache-control": "no-cache, no-transform",
      connection: "keep-alive",
      "x-accel-buffering": "no"
    }
  });
}

/** Emits the offline answer over the same SSE contract the model path uses. */
function localStream(
  messages: AgentMessage[],
  locale: AppLocale,
  currentRoute: string
): Response {
  const encoder = new TextEncoder();
  const answer = buildLocalAnswer(messages, locale, currentRoute);

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      controller.enqueue(encoder.encode(sse({type: "status", value: "answering"})));
      controller.enqueue(encoder.encode(sse({type: "text", value: answer.text})));

      if (answer.navigation) {
        controller.enqueue(
          encoder.encode(sse({type: "navigate", value: answer.navigation}))
        );
      }
      for (const link of answer.links) {
        controller.enqueue(encoder.encode(sse({type: "link", value: link})));
      }

      controller.enqueue(encoder.encode(sse({type: "done", value: {provider: "local"}})));
      controller.close();
    }
  });

  return streamResponse(stream);
}

export async function POST(request: Request): Promise<Response> {
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

  const apiKey = process.env.ANTHROPIC_API_KEY;
  const key = clientKey(request);

  // Budget is charged against the path that will actually serve the request,
  // so the offline brain is never throttled at a model-call price.
  const verdict = checkRate(key, apiKey ? MODEL_MAX_REQUESTS : LOCAL_MAX_REQUESTS);
  if (verdict.limited) {
    return errorResponse(
      "rate_limited",
      "Too many requests. Please wait a moment.",
      429,
      verdict.retryAfterSeconds
    );
  }

  if (!apiKey) {
    return localStream(messages, locale, currentRoute);
  }

  const client = new Anthropic({apiKey});
  const encoder = new TextEncoder();

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (event: AgentStreamEvent): void => {
        controller.enqueue(encoder.encode(sse(event)));
      };

      // Only the first navigate/open_link of a reply is honoured, so a chatty
      // model cannot yank the visitor through several pages in one turn.
      let navigationSent = false;
      const seenLinks = new Set<string>();

      const conversation: Anthropic.MessageParam[] = messages.map((message, index) => {
        if (index === messages.length - 1 && message.role === "user") {
          return {
            role: "user",
            content: `${buildUserContext(currentRoute, locale)}\n\n${message.content}`
          };
        }
        return {role: message.role, content: message.content};
      });

      try {
        send({type: "status", value: "thinking"});

        for (let round = 0; round <= MAX_TOOL_ROUNDS; round += 1) {
          const modelStream = client.messages.stream({
            model: MODEL,
            max_tokens: 4000,
            thinking: {type: "adaptive"},
            output_config: {effort: "low"},
            system: [
              {
                type: "text",
                text: buildSystemPrompt(locale),
                cache_control: {type: "ephemeral"}
              }
            ],
            tools: agentTools,
            messages: conversation
          });

          let opened = false;
          modelStream.on("text", (delta) => {
            if (!opened) {
              opened = true;
              send({type: "status", value: "answering"});
            }
            send({type: "text", value: delta});
          });

          const message = await modelStream.finalMessage();

          if (message.stop_reason !== "tool_use") {
            break;
          }

          const toolUses = message.content.filter(
            (block): block is Anthropic.ToolUseBlock => block.type === "tool_use"
          );

          conversation.push({role: "assistant", content: message.content});

          const results: Anthropic.ToolResultBlockParam[] = [];

          for (const toolUse of toolUses) {
            const input = (toolUse.input ?? {}) as Record<string, unknown>;
            let result = "ok";

            if (toolUse.name === "navigate") {
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
            } else if (toolUse.name === "open_link") {
              const url = typeof input.url === "string" ? input.url : "";
              const label = typeof input.label === "string" ? input.label : url;

              if (!allowedLinkUrls.has(url)) {
                result = "error: that URL is not in the approved list — use one from the system prompt";
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

            results.push({
              type: "tool_result",
              tool_use_id: toolUse.id,
              content: result,
              is_error: result.startsWith("error")
            });
          }

          conversation.push({role: "user", content: results});
        }

        send({type: "done", value: {provider: "anthropic"}});
      } catch (error) {
        console.error("hub-agent stream error:", error);

        // The visitor already saw a "thinking" state; degrade to the offline
        // brain instead of leaving them with a spinner that never resolves.
        const answer = buildLocalAnswer(messages, locale, currentRoute);
        send({type: "text", value: answer.text});
        if (answer.navigation && !navigationSent) {
          send({type: "navigate", value: answer.navigation});
        }
        for (const link of answer.links) {
          send({type: "link", value: link});
        }
        send({type: "done", value: {provider: "local-fallback"}});
      } finally {
        controller.close();
      }
    }
  });

  return streamResponse(stream);
}
