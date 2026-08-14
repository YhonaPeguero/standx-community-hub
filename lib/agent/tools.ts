import {hubSections} from "@/lib/hub-navigation";
import {docPages} from "@/lib/agent/standx-knowledge";
import {
  DISCORD_URL,
  DOCS_ROOT_URL,
  STANDX_APP_URL,
  STANDX_X_URL,
  extraRoutes,
  hubSectionMap
} from "@/lib/agent/hub-map";

/**
 * The assistant's two client-side tools. Both are pure intent — the server
 * validates the argument and forwards it to the browser, which performs the
 * actual navigation or link render. Nothing here touches state.
 */

const routeEnum = [...extraRoutes.map((route) => route.path), ...hubSections];

/** Allowlist for `open_link`. A URL outside this set is rejected, not rendered. */
export const allowedLinkUrls = new Set<string>([
  STANDX_APP_URL,
  STANDX_X_URL,
  DISCORD_URL,
  DOCS_ROOT_URL,
  ...docPages.map((page) => page.url),
  ...hubSections.flatMap((slug) => hubSectionMap[slug].links?.map((l) => l.url) ?? [])
]);

export const agentTools = [
  {
    name: "read_doc",
    description:
      "Read the current text of one official StandX documentation page. Use it whenever the visitor asks for a specific detail your knowledge summary does not already contain — an exact rate, a formula, a threshold, a contract spec, a step in a guide — instead of saying you do not know. Name the page by its exact title from your documentation list; you cannot pass a URL. Read at most two pages per answer, then answer from what you read and surface the page with open_link.",
    input_schema: {
      type: "object" as const,
      properties: {
        title: {
          type: "string",
          description:
            'The page title, copied exactly from the documentation list in your system prompt, e.g. "Funding Rate".'
        }
      },
      required: ["title"],
      additionalProperties: false
    },
    strict: true
  },
  {
    name: "navigate",
    description:
      "Take the visitor to a page on this hub. Call this when they ask where something is, ask to be shown something, or when your answer lives on another page here. Do not call it for the page they are already on, and call it at most once per reply.",
    input_schema: {
      type: "object" as const,
      properties: {
        route: {
          type: "string",
          enum: routeEnum,
          description: 'The destination route. Use "" for the home page.'
        },
        reason: {
          type: "string",
          description:
            "One short phrase, in the visitor's language, naming what they will find there. Shown on the navigation chip."
        }
      },
      required: ["route", "reason"],
      additionalProperties: false
    },
    strict: true
  },
  {
    name: "open_link",
    description:
      "Surface an official external link as a clickable chip under your answer — the StandX app, Discord, X, a documentation page, or a community project. Only URLs listed in your system prompt are accepted. Use this instead of pasting a raw URL into your text.",
    input_schema: {
      type: "object" as const,
      properties: {
        url: {
          type: "string",
          description: "The exact URL, copied from the system prompt."
        },
        label: {
          type: "string",
          description: "Short link label in the visitor's language, e.g. \"Funding Rate docs\"."
        }
      },
      required: ["url", "label"],
      additionalProperties: false
    },
    strict: true
  }
];
