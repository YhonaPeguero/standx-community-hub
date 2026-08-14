import {docPages, type DocEntry} from "@/lib/agent/standx-knowledge";

/**
 * Reads one official StandX documentation page, live.
 *
 * This is what turns Stander from a FAQ into what it was meant to be: the
 * curated knowledge in `standx-knowledge.ts` covers the common questions, and
 * this covers everything else — the exact funding formula, a margin tier, a
 * contract spec — by fetching the page the answer actually lives on.
 *
 * **The model never supplies a URL.** It names a page by title and the server
 * resolves that title against `docPages`, which is a hardcoded list. So there
 * is no SSRF surface here at all: no model output ever reaches `fetch`, and a
 * hallucinated or attacker-suggested URL cannot be requested even in principle.
 * That is also why the model cannot be tricked into reading an internal address
 * — the set of reachable URLs is fixed at build time.
 */

/** Enough for any single page here; the longest run about 12k characters. */
const MAX_CHARS = 6000;
const FETCH_TIMEOUT_MS = 8000;

/**
 * Pages change rarely and a visitor often asks two questions about the same
 * one, so a short memory cache turns the second read into no network call at
 * all. Per-instance on serverless, which is fine — this is latency, not truth.
 */
const CACHE_TTL_MS = 30 * 60 * 1000;
const cache = new Map<string, {text: string; fetchedAt: number}>();

export interface DocReadResult {
  ok: boolean;
  /** Page text on success, or an explanation the model can act on. */
  content: string;
  page?: DocEntry;
}

function findPage(title: string): DocEntry | null {
  const wanted = title.trim().toLowerCase();
  if (!wanted) {
    return null;
  }
  return (
    docPages.find((page) => page.title.toLowerCase() === wanted) ??
    // The model paraphrases titles more often than it gets them exactly right
    // ("Trading Fees" for "Trading Fee"), and a near miss should not cost a
    // whole tool round.
    docPages.find((page) => {
      const actual = page.title.toLowerCase();
      return actual.startsWith(wanted) || wanted.startsWith(actual);
    }) ??
    null
  );
}

const ENTITIES: Record<string, string> = {
  "&nbsp;": " ",
  "&amp;": "&",
  "&lt;": "<",
  "&gt;": ">",
  "&quot;": '"',
  "&#39;": "'",
  "&apos;": "'"
};

/**
 * HTML to something a model can read.
 *
 * The docs are server-rendered with the body in a single `<article>`, so the
 * useful text is isolated before any tag stripping — that drops the nav, the
 * sidebar and the search widget without having to recognise them. List and
 * cell boundaries survive as punctuation, because a margin table read as one
 * run-on sentence is worse than not reading it.
 */
function htmlToText(html: string): string {
  const body =
    html.match(/<article[^>]*>([\s\S]*?)<\/article>/i)?.[1] ??
    html.match(/<main[^>]*>([\s\S]*?)<\/main>/i)?.[1] ??
    html;

  return body
    .replace(/<(script|style|nav|button|svg)[^>]*>[\s\S]*?<\/\1>/gi, " ")
    .replace(/<li[^>]*>/gi, "\n- ")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/t[dh]>/gi, " | ")
    .replace(/<\/(p|div|li|tr|h[1-6]|section|table)>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&[a-z#0-9]+;/gi, (entity) => ENTITIES[entity.toLowerCase()] ?? entity)
    .replace(/[ \t]+/g, " ")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export async function readDocPage(title: string): Promise<DocReadResult> {
  const page = findPage(title);
  if (!page) {
    return {
      ok: false,
      content: `error: no documentation page is called "${title}". Use one of the titles exactly as they appear in your documentation list.`
    };
  }

  const cached = cache.get(page.url);
  if (cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS) {
    return {ok: true, content: cached.text, page};
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const response = await fetch(page.url, {
      signal: controller.signal,
      headers: {accept: "text/html"}
    });
    if (!response.ok) {
      return {
        ok: false,
        content: `error: "${page.title}" could not be read right now (${response.status}). Answer from what you already know and link the page instead.`,
        page
      };
    }

    const text = htmlToText(await response.text());
    if (text.length < 40) {
      return {
        ok: false,
        content: `error: "${page.title}" returned nothing readable. Answer from what you already know and link the page instead.`,
        page
      };
    }

    const clipped =
      text.length > MAX_CHARS
        ? `${text.slice(0, MAX_CHARS)}\n\n[truncated — the rest of the page is at ${page.url}]`
        : text;

    cache.set(page.url, {text: clipped, fetchedAt: Date.now()});
    if (cache.size > 80) {
      for (const [key, value] of cache) {
        if (Date.now() - value.fetchedAt >= CACHE_TTL_MS) {
          cache.delete(key);
        }
      }
    }

    return {ok: true, content: clipped, page};
  } catch {
    return {
      ok: false,
      content: `error: "${page.title}" timed out. Answer from what you already know and link the page instead.`,
      page
    };
  } finally {
    clearTimeout(timeout);
  }
}
