import type {AppLocale} from "@/i18n/request";

export type AgentRole = "user" | "assistant";

export interface AgentMessage {
  role: AgentRole;
  content: string;
}

export interface AgentRequestBody {
  messages: AgentMessage[];
  locale: AppLocale;
  /** Route the visitor is currently on, without the locale prefix ("" = home). */
  currentRoute?: string;
}

/** A navigation the client should perform once the answer finishes streaming. */
export interface AgentNavigation {
  route: string;
  href: string;
  label: string;
  reason: string;
}

/** An outbound link the assistant surfaced, rendered as a chip under the answer. */
export interface AgentLink {
  label: string;
  url: string;
}

/** Server-sent events emitted by /api/hub-agent. */
export type AgentStreamEvent =
  | {type: "text"; value: string}
  | {type: "navigate"; value: AgentNavigation}
  | {type: "link"; value: AgentLink}
  | {type: "status"; value: "thinking" | "searching" | "answering"}
  | {type: "done"; value: {provider: string}}
  | {type: "error"; value: string};
