import type {AppLocale} from "@/i18n/request";
import {hubSections, type HubSectionSlug} from "@/lib/hub-navigation";
import {hubSectionMap} from "@/lib/agent/hub-map";
import {buildSystemPrompt} from "@/lib/agent/prompt";
import {
  coreKnowledgeTopics,
  docAliases,
  docPages,
  normalizeKnowledgeText,
  type CoreKnowledgeTopic,
  type DocEntry
} from "@/lib/agent/standx-knowledge";

/**
 * Picks the slice of the hub's knowledge that one question actually needs.
 *
 * The prompt used to carry everything: all 21 fact blocks, all 50 documentation
 * pages, and every section's contents — 24,000 characters, about 6,000 tokens,
 * rebuilt identically for every question. That is not merely wasteful, it was
 * the single thing keeping the assistant from working at all.
 *
 * Groq's free tier is metered in TOKENS per minute, not requests: 12,000 for
 * the default model. One answer takes at least two rounds (the model asks to
 * read a page, then answers from it) and each round re-sends the whole prompt,
 * so a single visitor question cost roughly 14,000 tokens and blew the minute's
 * budget on its own. What came back was not an honest 429 either — Groq
 * answered `401 Invalid API Key` for a key that had worked one second earlier,
 * which is why this looked for a while like a credentials problem.
 *
 * Retrieval happens here, on the server, BEFORE the first model call. That
 * matters: letting the model search for its own context would be a cleaner
 * separation but costs an extra round trip per question, and on a free tier
 * latency is the scarcest thing we have.
 *
 * The scoring is lexical — no embeddings, no vector store, no second API to
 * pay for or key to rotate. Three signals, because no one of them survives five
 * languages alone:
 *
 *   1. Curated aliases, per locale. The only signal that understands that
 *      "comisiones" and "수수료" are the trading-fee question.
 *   2. TF-IDF over English titles and summaries. Product vocabulary stays
 *      English in every locale by house style — DUSD, funding, maker, taker,
 *      liquidation — so this carries a Spanish question to an English page.
 *   3. Propagation: a matched topic lends weight to the pages it cites. This is
 *      what gets a Korean question to the right page when (2) finds nothing.
 */

export interface RetrievedContext {
  topics: CoreKnowledgeTopic[];
  docs: DocEntry[];
  /** Sections rendered with their full contents rather than a one-line summary. */
  detailedSections: HubSectionSlug[];
  /**
   * Score of the best-matching page, used to decide whether the server should
   * read it up front rather than hoping the model asks. See `PREREAD_THRESHOLD`.
   */
  topDocScore: number;
}

/**
 * Above this, the top page is confidently the subject of the question and the
 * route reads it before the model's first turn.
 *
 * Measured rather than chosen. Across the questions in `npm run
 * retrieval:check`, ones that need a page score 14 and up, while questions that
 * need none — greetings, "what sections are there", a navigation request —
 * top out at 5.7. Eight sits in that gap with room on both sides.
 *
 * Being below it is not a refusal to check the docs: `read_doc` is still on the
 * table, so a weak match means the model decides rather than the server.
 */
export const PREREAD_THRESHOLD = 8;

/**
 * Renders the prompt with nothing retrieved, to price its fixed parts.
 *
 * `pt-br` because the locale name is interpolated into the prompt and that one
 * is the longest — measuring the cheapest locale would under-budget the rest.
 * The import is one-directional at runtime: `prompt.ts` takes only a type from
 * this module, and types are erased, so there is no cycle.
 */
function measureFixedPrompt(): number {
  return buildSystemPrompt("pt-br", {
    topics: [],
    docs: [],
    detailedSections: [],
    topDocScore: 0
  }).length;
}

/* ------------------------------------------------------------------ budget */

const MAX_TOPICS = 5;
const MAX_DOCS = 12;
const MAX_DETAILED_SECTIONS = 2;

/**
 * What the whole system prompt is allowed to cost, in characters.
 *
 * Set from the provider's limit, not from taste: the default Groq model allows
 * 8,000 tokens per minute on the free tier, shared by every visitor, and one
 * answer also carries a documentation page. At roughly four characters to the
 * token this keeps a typical answer near 3,900 tokens all-in — about two a
 * minute before the chain falls through to OpenRouter.
 */
const PROMPT_BUDGET_CHARS = 10_400;

/** The itemised contents of hub sections, rationed separately. */
const SECTION_DETAIL_BUDGET_CHARS = 800;

/**
 * What is left for the retrieved slice once the prompt's fixed prose is paid
 * for — measured at load rather than hand-tuned.
 *
 * The rules, the voice, and every route summary ride in the prompt whatever the
 * question is, and they share one budget with retrieval. When this was a
 * constant, every sentence added to `prompt.ts` quietly took room away from
 * retrieval and the overflow surfaced somewhere unrelated — a Korean question
 * failing a size assertion, three edits after the sentence that caused it.
 * Deriving it means prose and retrieval can no longer silently rob each other.
 *
 * The floor matters: a prompt so verbose that retrieval gets nothing would
 * otherwise "fit" while answering no questions at all. Better to blow the token
 * budget and be told about it by `npm run retrieval:check`.
 */
const VARIABLE_BUDGET_CHARS = Math.max(
  2200,
  PROMPT_BUDGET_CHARS - SECTION_DETAIL_BUDGET_CHARS - measureFixedPrompt()
);

/** Kept regardless of the question, so no answer is ever left without a root. */
const ANCHOR_DOC_TITLES = ["About StandX"];

/* -------------------------------------------------------------- tokenizing */

/**
 * Function words carry no topical signal but appear everywhere, so they would
 * otherwise dominate a short question. Five languages, only the high-frequency
 * ones — this is a noise filter, not a linguistic model.
 */
const STOPWORDS = new Set([
  // en
  "the", "and", "for", "what", "which", "how", "does", "did", "you", "your",
  "are", "was", "were", "can", "with", "from", "that", "this", "there", "here",
  "about", "into", "have", "has", "but", "not", "все", "all", "get", "its",
  // es
  "que", "como", "cual", "cuales", "para", "por", "los", "las", "una", "uno",
  "del", "con", "mas", "muy", "pero", "sobre", "donde", "cuando", "hay", "son",
  "esta", "este", "eso", "sus", "tiene", "puedo", "puede", "exactamente",
  // pt-br
  "como", "para", "por", "com", "mais", "onde", "quando", "tem", "posso",
  "isso", "esse", "essa", "sao", "dos", "das", "uma", "num",
  // uk
  "що", "як", "для", "але", "або", "цей", "яка", "який", "де", "коли", "має",
  "мене", "мені", "все", "так",
  // ko — particles are suffixes, so only free-standing fillers are listed
  "그리고", "그러나", "무엇", "어떻게", "있나요", "인가요"
]);

const CJK =
  /[぀-ヿ㐀-䶿一-鿿가-힯]/u;

/**
 * `$` survives because `$DUSD` is a page title, and a token that becomes "dusd"
 * still matches the same page — dropping the sigil loses nothing and keeps the
 * two spellings interchangeable.
 *
 * Japanese tokenizes badly here, and that is deliberate rather than unnoticed.
 * Two things happen to it. It has no spaces, so a whole phrase arrives as one
 * token; and `normalizeKnowledgeText` runs NFD, which splits voiced kana into
 * base + U+3099 — a mark outside the U+0300-U+036F strip and outside \p{L}, so
 * the split below cuts the word there and drops the voicing (ファンディング
 * becomes ファンテ + ィンク). Korean escapes this only by accident: its NFD
 * output is jamo, and jamo are letters.
 *
 * None of that is worth fixing, because the two indexes below are built from
 * `title + covers` and `title + fact`, which are English in every locale. There
 * is no Japanese in the corpus for a Japanese token to match, however it is
 * cut. Non-Latin questions reach a page through `aliasScore` instead, which is
 * a substring match over curated per-locale terms and normalizes both sides the
 * same way — so the mangling cancels out and the match still lands.
 *
 * Recomposing with NFC was measured and made things worse: Korean fell from
 * rank 2 to rank 3 on "DUSD를 어떻게 발행하나요?" because precomposed syllables
 * then hit the 2-character CJK floor instead of the 3-character one, and
 * Japanese did not improve at all. Add Japanese terms to `docAliases` instead;
 * that is the path that carries every other non-Latin locale.
 */
function tokenize(value: string): string[] {
  const words = normalizeKnowledgeText(value)
    .replace(/\$/g, "")
    .split(/[^\p{L}\p{N}]+/u);

  const tokens: string[] = [];
  for (const word of words) {
    if (!word) {
      continue;
    }
    // Korean and Chinese words reach full meaning in two characters, where a
    // three-character floor in Latin script is still mostly noise.
    const floor = CJK.test(word) ? 2 : 3;
    if (word.length >= floor && !STOPWORDS.has(word)) {
      tokens.push(word);
    }
  }
  return tokens;
}

/* ------------------------------------------------------------------ tf-idf */

interface Indexed<T> {
  item: T;
  tokens: Set<string>;
}

function buildIndex<T>(items: readonly T[], text: (item: T) => string): {
  entries: Indexed<T>[];
  idf: Map<string, number>;
} {
  const entries = items.map((item) => ({item, tokens: new Set(tokenize(text(item)))}));

  const documentFrequency = new Map<string, number>();
  for (const entry of entries) {
    for (const token of entry.tokens) {
      documentFrequency.set(token, (documentFrequency.get(token) ?? 0) + 1);
    }
  }

  // Plain IDF. A term in almost every record ("standx") ends up near zero and
  // stops drowning out the term that actually separates one page from another.
  const idf = new Map<string, number>();
  for (const [token, frequency] of documentFrequency) {
    idf.set(token, Math.log(entries.length / frequency) + 0.1);
  }

  return {entries, idf};
}

function scoreTokens(
  questionTokens: readonly string[],
  entry: Indexed<unknown>,
  idf: Map<string, number>
): number {
  let score = 0;
  for (const token of questionTokens) {
    if (entry.tokens.has(token)) {
      score += idf.get(token) ?? 0.1;
    }
  }
  return score;
}

// Built once per process — the corpora are static module data.
const docIndex = buildIndex(docPages, (page) => `${page.title} ${page.covers}`);
const topicIndex = buildIndex(
  coreKnowledgeTopics as readonly CoreKnowledgeTopic[],
  (topic) => `${topic.title} ${topic.fact}`
);

/* ------------------------------------------------------------- alias match */

/** Curated phrases, matched whole against the raw question. */
function aliasScore(normalizedQuestion: string, phrases: readonly string[]): number {
  let best = 0;
  for (const phrase of phrases) {
    const needle = normalizeKnowledgeText(phrase);
    if (needle.length >= 2 && normalizedQuestion.includes(needle)) {
      // A longer phrase matched is a more specific hit than a short one.
      best = Math.max(best, 4 + Math.min(12, needle.length));
    }
  }
  return best;
}

/* ---------------------------------------------------------------- retrieve */

/**
 * The question is the last thing the visitor said, plus a fading memory of what
 * they said before it. Without that, "and how is it calculated?" retrieves
 * nothing at all — the follow-up carries none of its own subject.
 */
export function buildRetrievalQuery(
  messages: readonly {role: string; content: string}[]
): string {
  const userTurns = messages.filter((message) => message.role === "user");
  const latest = userTurns[userTurns.length - 1]?.content ?? "";
  const previous = userTurns[userTurns.length - 2]?.content ?? "";
  return `${latest} ${previous}`.trim();
}

export function retrieveContext(
  query: string,
  locale: AppLocale,
  currentRoute: string
): RetrievedContext {
  const normalized = normalizeKnowledgeText(query);
  const tokens = tokenize(query);

  /* --- topics ------------------------------------------------------------ */

  const topicScores = topicIndex.entries.map((entry) => {
    const topic = entry.item;
    const aliases = aliasScore(normalized, topic.aliases[locale]);
    // English aliases always count: product terms stay English in every locale,
    // so a Spanish visitor still types "funding rate" and "maker".
    const english = locale === "en" ? 0 : aliasScore(normalized, topic.aliases.en);
    return {
      topic,
      score:
        Math.max(aliases, english) +
        scoreTokens(tokens, entry, topicIndex.idf) +
        (aliases > 0 ? (topic.matchPriority ?? 0) : 0)
    };
  });

  const topics = topicScores
    .filter((entry) => entry.score > 0)
    .sort((left, right) => right.score - left.score)
    .slice(0, MAX_TOPICS);

  /* --- curated term bridges ----------------------------------------------- */

  // The only signal that carries "liquidación", "ліквідація" or "청산" to a page
  // titled "Liquidation". Scored high on purpose: a human wrote these terms
  // against that page, which beats any inference from an English summary.
  const aliasHits = new Map<string, number>();
  for (const alias of docAliases) {
    const matched = aliasScore(normalized, alias.terms);
    if (matched > 0) {
      aliasHits.set(alias.title, Math.max(aliasHits.get(alias.title) ?? 0, matched));
    }
  }

  /* --- documentation pages ----------------------------------------------- */

  const docScores = new Map<string, number>();
  for (const entry of docIndex.entries) {
    const direct =
      scoreTokens(tokens, entry, docIndex.idf) +
      (normalized.includes(normalizeKnowledgeText(entry.item.title)) ? 8 : 0);
    if (direct > 0) {
      docScores.set(entry.item.title, direct);
    }
  }

  // A topic that matched knows which pages back it up. This is the bridge for
  // any language whose vocabulary never touches the English index.
  for (const [rank, entry] of topics.entries()) {
    const inherited = entry.score / (rank + 1);
    for (const title of entry.topic.docTitles) {
      docScores.set(title, (docScores.get(title) ?? 0) + inherited);
    }
  }

  for (const [title, score] of aliasHits) {
    docScores.set(title, (docScores.get(title) ?? 0) + score);
  }

  for (const title of ANCHOR_DOC_TITLES) {
    docScores.set(title, (docScores.get(title) ?? 0) + 0.01);
  }

  const byTitle = new Map(docPages.map((page) => [page.title, page]));
  const sorted = [...docScores.entries()].sort(([, left], [, right]) => right - left);
  const topDocScore = sorted[0]?.[1] ?? 0;
  const ranked = sorted
    .slice(0, MAX_DOCS)
    .map(([title]) => byTitle.get(title))
    .filter((page): page is DocEntry => Boolean(page));

  /* --- fit the budget ----------------------------------------------------- */

  // Spent on facts first. A fact block answers the question; a page title only
  // says where the answer might be, and the model can always read a page it was
  // told about. Both lists are already in descending relevance, so trimming
  // from the tail drops the least useful thing left.
  const kept: CoreKnowledgeTopic[] = [];
  const docs: DocEntry[] = [];
  let spent = 0;

  for (const entry of topics) {
    const cost = entry.topic.title.length + entry.topic.fact.length + 90;
    if (kept.length > 0 && spent + cost > VARIABLE_BUDGET_CHARS * 0.62) {
      break;
    }
    kept.push(entry.topic);
    spent += cost;
  }

  for (const page of ranked) {
    const cost = page.title.length + page.covers.length + page.url.length + 8;
    if (docs.length > 0 && spent + cost > VARIABLE_BUDGET_CHARS) {
      break;
    }
    docs.push(page);
    spent += cost;
  }

  /* --- hub sections ------------------------------------------------------- */

  // Every section's one-line summary is always in the prompt — "what sections
  // does this site have?" must never depend on retrieval guessing right. Only
  // the itemised contents are rationed, and the page the visitor is standing on
  // is always one of them.
  const sectionScores = hubSections
    .map((slug) => ({
      slug,
      score:
        aliasScore(normalized, hubSectionMap[slug].keywords) +
        scoreTokens(
          tokens,
          {
            item: slug,
            tokens: new Set(
              tokenize(
                `${hubSectionMap[slug].summary} ${hubSectionMap[slug].contains.join(" ")}`
              )
            )
          },
          docIndex.idf
        )
    }))
    .filter((entry) => entry.score > 0)
    .sort((left, right) => right.score - left.score);

  // Budgeted like everything else. Sections differ enormously in how much they
  // itemise — one lists six Discord channels, another lists twenty assets — so
  // "at most two sections" is not a bound on size, only on count.
  const detailCost = (slug: HubSectionSlug): number =>
    hubSectionMap[slug].contains.reduce((total, item) => total + item.length + 7, 0) +
    (hubSectionMap[slug].links?.reduce((total, link) => total + link.label.length + link.url.length + 5, 0) ?? 0);

  const detailedSections: HubSectionSlug[] = [];
  let detailSpent = 0;

  const considered = hubSections.includes(currentRoute as HubSectionSlug)
    ? [currentRoute as HubSectionSlug, ...sectionScores.map((entry) => entry.slug)]
    : sectionScores.map((entry) => entry.slug);

  for (const slug of considered) {
    if (detailedSections.length >= MAX_DETAILED_SECTIONS) {
      break;
    }
    if (detailedSections.includes(slug)) {
      continue;
    }
    const cost = detailCost(slug);
    if (detailedSections.length > 0 && detailSpent + cost > SECTION_DETAIL_BUDGET_CHARS) {
      continue;
    }
    detailedSections.push(slug);
    detailSpent += cost;
  }

  return {topics: kept, docs, detailedSections, topDocScore};
}
