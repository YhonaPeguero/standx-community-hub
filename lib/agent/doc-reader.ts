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

/**
 * A read page is re-sent to the model on every remaining round, so its size is
 * charged more than once against a per-minute token budget. Measured pages run
 * around 1,800 characters, so this only bites on the few long references — and
 * there, losing the tail costs less than losing the answer to a rate limit.
 */
const MAX_CHARS = 5000;
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

const titleWords = (value: string): Set<string> =>
  new Set(
    value
      .toLowerCase()
      .replace(/\$/g, "")
      .split(/[^a-z0-9]+/)
      .filter((word) => word.length > 1)
  );

/**
 * Resolution is deliberately forgiving. The prompt now lists only the pages
 * retrieved for the current question rather than all fifty, so the model is
 * more likely to name one from memory and slightly wrong. A near miss costing a
 * whole tool round — of two — is a wasted answer, and on this budget rounds are
 * the scarce resource.
 */
function findPage(title: string): DocEntry | null {
  const wanted = title.trim().toLowerCase();
  if (!wanted) {
    return null;
  }

  const exact = docPages.find((page) => page.title.toLowerCase() === wanted);
  if (exact) {
    return exact;
  }

  const prefixed = docPages.find((page) => {
    const actual = page.title.toLowerCase();
    return actual.startsWith(wanted) || wanted.startsWith(actual);
  });
  if (prefixed) {
    return prefixed;
  }

  // "Fees for trading" -> "Trading Fee". Scored both ways so a short real title
  // is not beaten by a long one that merely contains more of the guess.
  const asked = titleWords(wanted);
  let best: {page: DocEntry; score: number} | null = null;
  for (const page of docPages) {
    const actual = titleWords(page.title);
    let shared = 0;
    for (const word of asked) {
      if (actual.has(word)) {
        shared += 1;
      }
    }
    const score = shared / Math.max(asked.size, actual.size);
    if (score > 0.5 && (!best || score > best.score)) {
      best = {page, score};
    }
  }

  return best?.page ?? null;
}

/** Titles sharing any word with the guess, so a miss is correctable in one go. */
function suggestTitles(title: string): string[] {
  const asked = titleWords(title);
  return docPages
    .filter((page) => [...titleWords(page.title)].some((word) => asked.has(word)))
    .slice(0, 5)
    .map((page) => page.title);
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
    const suggestions = suggestTitles(title);
    return {
      ok: false,
      content:
        `error: no documentation page is called "${title}".` +
        (suggestions.length
          ? ` Did you mean one of: ${suggestions.join(", ")}?`
          : " Use a title exactly as it appears in your documentation list.")
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
