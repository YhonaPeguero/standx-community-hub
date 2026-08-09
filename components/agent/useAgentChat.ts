"use client";

import {useCallback, useEffect, useRef, useState} from "react";
import type {AppLocale} from "@/i18n/request";
import type {
  AgentLink,
  AgentNavigation,
  AgentStreamEvent
} from "@/lib/agent/types";

export interface ChatEntry {
  id: string;
  role: "user" | "assistant";
  content: string;
  links: AgentLink[];
  navigation?: AgentNavigation;
  /** False while the assistant reply is still streaming in. */
  complete: boolean;
  /**
   * The turn ended badly. The widget renders a localised apology in place of
   * the missing answer — an assistant entry that is both `complete` and empty
   * used to render as nothing at all, so the visitor saw their own question
   * followed by silence.
   */
  failed?: boolean;
}

export type AgentStatus = "idle" | "thinking" | "answering" | "error";

/**
 * Why the turn failed, for the widget to localise. The server's `error` string
 * is English no matter who is reading it, so it must never reach the screen.
 */
export type AgentErrorKind = "rate-limit" | "generic";

interface UseAgentChatOptions {
  locale: AppLocale;
  currentRoute: string;
  onNavigate: (navigation: AgentNavigation) => void;
}

function createId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

/** Thrown so the catch below can tell a 429 apart from a network blip. */
class AgentRequestError extends Error {
  constructor(
    message: string,
    readonly kind: AgentErrorKind,
    readonly retryAfter?: number
  ) {
    super(message);
    this.name = "AgentRequestError";
  }
}

export function useAgentChat({locale, currentRoute, onNavigate}: UseAgentChatOptions) {
  const [entries, setEntries] = useState<ChatEntry[]>([]);
  const [status, setStatus] = useState<AgentStatus>("idle");
  const [errorKind, setErrorKind] = useState<AgentErrorKind | null>(null);
  const [retryAfter, setRetryAfter] = useState<number | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const entriesRef = useRef<ChatEntry[]>([]);
  const lastPromptRef = useRef<string | null>(null);

  entriesRef.current = entries;

  useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, []);

  const patchLast = useCallback((patch: (entry: ChatEntry) => ChatEntry) => {
    setEntries((current) => {
      if (current.length === 0) {
        return current;
      }
      const next = current.slice();
      next[next.length - 1] = patch(next[next.length - 1]);
      return next;
    });
  }, []);

  const send = useCallback(
    async (rawText: string) => {
      const text = rawText.trim();
      if (!text || status === "thinking" || status === "answering") {
        return;
      }

      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      setErrorKind(null);
      setRetryAfter(null);
      setStatus("thinking");
      lastPromptRef.current = text;

      const history = entriesRef.current
        .filter((entry) => entry.complete || entry.role === "user")
        .map((entry) => ({role: entry.role, content: entry.content}));

      const userEntry: ChatEntry = {
        id: createId(),
        role: "user",
        content: text,
        links: [],
        complete: true
      };
      const assistantEntry: ChatEntry = {
        id: createId(),
        role: "assistant",
        content: "",
        links: [],
        complete: false
      };

      setEntries((current) => [...current, userEntry, assistantEntry]);

      let pendingNavigation: AgentNavigation | undefined;

      try {
        const response = await fetch("/api/hub-agent", {
          method: "POST",
          headers: {"content-type": "application/json"},
          signal: controller.signal,
          body: JSON.stringify({
            messages: [...history, {role: "user", content: text}],
            locale,
            currentRoute
          })
        });

        if (!response.ok || !response.body) {
          const payload = (await response.json().catch(() => null)) as
            | {error?: string; code?: string; retryAfter?: number}
            | null;
          const kind: AgentErrorKind =
            response.status === 429 || payload?.code === "rate_limited"
              ? "rate-limit"
              : "generic";
          const headerRetry = Number(response.headers.get("retry-after"));
          throw new AgentRequestError(
            payload?.error ?? "The assistant is unavailable.",
            kind,
            payload?.retryAfter ??
              (Number.isFinite(headerRetry) && headerRetry > 0 ? headerRetry : undefined)
          );
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        // eslint-disable-next-line no-constant-condition
        while (true) {
          const {done, value} = await reader.read();
          if (done) {
            break;
          }

          buffer += decoder.decode(value, {stream: true});
          const chunks = buffer.split("\n\n");
          buffer = chunks.pop() ?? "";

          for (const chunk of chunks) {
            const line = chunk.trim();
            if (!line.startsWith("data:")) {
              continue;
            }

            let event: AgentStreamEvent;
            try {
              event = JSON.parse(line.slice(5).trim()) as AgentStreamEvent;
            } catch {
              continue;
            }

            switch (event.type) {
              case "status":
                setStatus(event.value === "answering" ? "answering" : "thinking");
                break;
              case "text":
                setStatus("answering");
                patchLast((entry) => ({...entry, content: entry.content + event.value}));
                break;
              case "link":
                patchLast((entry) =>
                  entry.links.some((link) => link.url === event.value.url)
                    ? entry
                    : {...entry, links: [...entry.links, event.value]}
                );
                break;
              case "navigate":
                pendingNavigation = event.value;
                patchLast((entry) => ({...entry, navigation: event.value}));
                break;
              case "error":
                throw new Error(event.value);
              case "done":
                break;
            }
          }
        }

        patchLast((entry) => ({...entry, complete: true}));
        setStatus("idle");

        // Navigate only once the answer has fully landed, so the visitor reads
        // the reason before the page changes underneath them.
        if (pendingNavigation) {
          onNavigate(pendingNavigation);
        }
      } catch (error) {
        if (controller.signal.aborted) {
          return;
        }
        const kind =
          error instanceof AgentRequestError ? error.kind : ("generic" as const);
        setErrorKind(kind);
        setRetryAfter(
          error instanceof AgentRequestError ? (error.retryAfter ?? null) : null
        );
        setStatus("error");
        // `failed` is what makes the turn render. Marking it complete and
        // leaving the content empty produced a silent, invisible reply.
        patchLast((entry) => ({...entry, complete: true, failed: true}));
      }
    },
    [currentRoute, locale, onNavigate, patchLast, status]
  );

  /** Re-sends the last question after dropping its failed turn. */
  const retry = useCallback(() => {
    const prompt = lastPromptRef.current;
    if (!prompt) {
      return;
    }
    setEntries((current) => {
      const next = current.slice();
      // Drop the failed assistant turn and the user turn that produced it —
      // `send` re-adds both, so keeping them would duplicate the question.
      if (next[next.length - 1]?.role === "assistant") {
        next.pop();
      }
      if (next[next.length - 1]?.role === "user") {
        next.pop();
      }
      return next;
    });
    setErrorKind(null);
    setRetryAfter(null);
    setStatus("idle");
    // The status guard in `send` reads the value captured at render time, so
    // this has to land after React has processed the reset above.
    window.setTimeout(() => void sendRef.current?.(prompt), 0);
  }, []);

  const sendRef = useRef<typeof send | null>(null);
  sendRef.current = send;

  const reset = useCallback(() => {
    abortRef.current?.abort();
    setEntries([]);
    setErrorKind(null);
    setRetryAfter(null);
    setStatus("idle");
    lastPromptRef.current = null;
  }, []);

  const stop = useCallback(() => {
    abortRef.current?.abort();
    patchLast((entry) => ({...entry, complete: true}));
    setStatus("idle");
  }, [patchLast]);

  return {entries, status, errorKind, retryAfter, send, retry, reset, stop};
}
