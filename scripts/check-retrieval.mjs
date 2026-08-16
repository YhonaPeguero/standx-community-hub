// The prompt has to stay small, and small has to stay useful.
// Run with: npm run retrieval:check
//
// Why this file exists, precisely:
//
// The assistant shipped with every fact and all fifty documentation pages
// stuffed into the system prompt — 24,000 characters, about 6,000 tokens,
// rebuilt for every round of every answer. Nothing failed a check. Types passed,
// lint passed, the guards passed, the build passed, and the thing was
// nonetheless incapable of answering a question in production, because the free
// tier meters TOKENS PER MINUTE and one visitor question spent the whole minute.
//
// Worse, the symptom lied: Groq answers `401 Invalid API Key` when a free key
// runs out of tokens, so the failure read as bad credentials rather than an
// oversized prompt.
//
// Two things are asserted here, and neither is worth much without the other:
//
//   1. The prompt stays inside its token budget for real questions.
//   2. Retrieval still puts the right page and the right fact in that budget —
//      in all five locales, which is the part a size check alone would happily
//      let rot to nothing.

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import {fileURLToPath} from "node:url";
import ts from "typescript";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

/* ------------------------------------------------------------------ loader */

// Transpiles a module and everything it imports at RUNTIME into a temp folder.
// Type-only imports vanish during transpile, which is what keeps `i18n/request`
// — and its `next-intl/server` dependency — out of the graph entirely.
const outDir = fs.mkdtempSync(path.join(os.tmpdir(), "retrieval-check-"));
const loaded = new Set();

function flatName(relative) {
  return `${relative.replace(/[\\/]/g, "_").replace(/\.tsx?$/, "")}.mjs`;
}

function loadModule(relative) {
  const name = flatName(relative);
  if (loaded.has(name)) {
    return name;
  }
  loaded.add(name);

  const source = fs.readFileSync(path.join(root, relative), "utf8");
  let code = ts.transpileModule(source, {
    compilerOptions: {module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022}
  }).outputText;

  code = code.replace(/from ["']@\/([^"']+)["']/g, (_match, specifier) => {
    const candidates = [`${specifier}.ts`, `${specifier}.tsx`, `${specifier}/index.ts`];
    const found = candidates.find((candidate) => fs.existsSync(path.join(root, candidate)));
    if (!found) {
      throw new Error(`cannot resolve @/${specifier} from ${relative}`);
    }
    return `from "./${loadModule(found)}"`;
  });

  fs.writeFileSync(path.join(outDir, name), code, "utf8");
  return name;
}

const importModule = async (relative) =>
  import(`file://${path.join(outDir, loadModule(relative)).split(path.sep).join("/")}`);

const {retrieveContext, buildRetrievalQuery, PREREAD_THRESHOLD} = await importModule(
  "lib/agent/retrieval.ts"
);
const {buildSystemPrompt} = await importModule("lib/agent/prompt.ts");
const {docPages, coreKnowledgeTopics} = await importModule("lib/agent/standx-knowledge.ts");

/* ------------------------------------------------------------------- utils */

let failures = 0;
let checks = 0;

function check(label, ok, detail) {
  checks += 1;
  if (!ok) failures += 1;
  console.log(`  ${ok ? "✓" : "✗"} ${label}${detail ? `  ${detail}` : ""}`);
}

function section(name) {
  console.log(`\n${name}`);
}

/**
 * Characters, not tokens — deliberately. A real tokenizer would mean shipping a
 * dependency to measure something we only need an upper bound on, and English
 * prose runs about four characters per token. The budget below is set from the
 * provider's actual limit with that ratio and generous headroom.
 */
const CHARS_PER_TOKEN = 4;

// The default Groq model allows 8,000 tokens per minute on the free tier,
// shared by every visitor on the site. When retrieval is confident the server
// reads the page up front and the whole answer is ONE round carrying that page;
// otherwise it is one round without it, and the model may spend a second on
// `read_doc`. Budgeting 2,600 tokens of prompt puts a typical answer near 3,900
// tokens all-in — about two a minute before OpenRouter takes over, and the
// curated answers after that. Every character saved here is throughput.
const PROMPT_BUDGET_CHARS = 2600 * CHARS_PER_TOKEN;

// The pre-read page is capped at 5,000 characters by lib/agent/doc-reader.ts.
const PAGE_CAP_CHARS = 5000;
const ANSWER_BUDGET_CHARS = PROMPT_BUDGET_CHARS + PAGE_CAP_CHARS + 600;

const contextFor = (question, locale = "en", route = "") =>
  retrieveContext(buildRetrievalQuery([{role: "user", content: question}]), locale, route);

const prompt = (question, locale = "en", route = "") =>
  buildSystemPrompt(locale, contextFor(question, locale, route));

/* -------------------------------------------------------------- the budget */

section("The system prompt fits the free tier's per-minute token budget");

const probes = [
  ["en", "what is exactly the funding rate per hour?"],
  ["es", "¿cuál es exactamente el funding rate por hora?"],
  ["pt-br", "como faço para mintar DUSD e quais são as taxas?"],
  ["uk", "як працює ліквідація і що таке маржа?"],
  ["ko", "StandX 포인트는 어떻게 모으나요?"],
  ["en", "tell me everything about standx, dusd, perps, sips, points, fees and the api"],
  ["es", "hola"],
  ["en", "what sections does this site have?"]
];

let worst = 0;
for (const [locale, question] of probes) {
  const size = prompt(question, locale).length;
  worst = Math.max(worst, size);
  check(
    `${locale}: ${question.slice(0, 46)}`,
    size <= PROMPT_BUDGET_CHARS,
    `${size} chars (~${Math.round(size / CHARS_PER_TOKEN)} tokens)`
  );
}
check(
  `the worst case stays under budget`,
  worst <= PROMPT_BUDGET_CHARS,
  `${worst} / ${PROMPT_BUDGET_CHARS} chars`
);

// The fixed prose — voice, rules, site map — and the retrieved slice share one
// budget, so every sentence added to the prompt silently takes room away from
// retrieval. Twice now that surfaced as an unrelated-looking locale failing on
// size, which sends you looking in the wrong file. Measured separately so the
// real cause is named: if this is tight, shorten the prose or lower
// VARIABLE_BUDGET_CHARS in lib/agent/retrieval.ts on purpose.
const fixed = buildSystemPrompt("en", {
  topics: [],
  docs: [],
  detailedSections: [],
  topDocScore: 0
}).length;
check(
  "the fixed prose leaves room for what retrieval selects",
  PROMPT_BUDGET_CHARS - fixed >= 3800,
  `${fixed} chars fixed, ${PROMPT_BUDGET_CHARS - fixed} left for retrieval`
);

/* ----------------------------------------------------------- the retrieval */

section("A pre-read answer still fits, and fits in ONE round");

// The whole point of reading up front is that the expensive second round goes
// away. If the combined prompt ever outgrows the budget the trade stops paying.
const withPage = prompt("¿cuál es exactamente el funding rate por hora?", "es").length + PAGE_CAP_CHARS;
check(
  "prompt plus a full documentation page stays inside one round's budget",
  withPage <= ANSWER_BUDGET_CHARS,
  `${withPage} / ${ANSWER_BUDGET_CHARS} chars (~${Math.round(withPage / CHARS_PER_TOKEN)} tokens)`
);

section("The server reads a page exactly when it should");

// Above the threshold the route fetches the page before the model's first turn;
// below it, it does not. Both mistakes are expensive: reading for "hola" wastes
// a fetch and a thousand tokens, and NOT reading for a rates question is how
// the assistant ends up inventing a plausible number.
const shouldPreRead = [
  ["es", "¿cuál es exactamente el funding rate por hora?"],
  ["es", "¿cómo se calcula la liquidación en StandX?"],
  ["en", "what are the maker and taker fees?"],
  ["uk", "як працює ліквідація?"],
  ["pt-br", "como faço para mintar DUSD?"]
];
const shouldNot = [
  ["es", "hola"],
  ["es", "¿quién eres?"],
  ["en", "what sections does this site have?"],
  ["en", "take me to the community page"]
];

for (const [locale, question] of shouldPreRead) {
  const {topDocScore, docs} = contextFor(question, locale);
  check(
    `reads for "${question.slice(0, 40)}"`,
    topDocScore >= PREREAD_THRESHOLD,
    `score ${topDocScore.toFixed(1)} >= ${PREREAD_THRESHOLD} -> ${docs[0]?.title ?? "none"}`
  );
}
for (const [locale, question] of shouldNot) {
  const {topDocScore} = contextFor(question, locale);
  check(
    `does not read for "${question.slice(0, 40)}"`,
    topDocScore < PREREAD_THRESHOLD,
    `score ${topDocScore.toFixed(1)} < ${PREREAD_THRESHOLD}`
  );
}

section("Retrieval puts the right page in that budget, in every locale");

// One subject per row, asked the way each language actually asks it. The page
// named must be the one the answer lives on — this is what a size check alone
// cannot see going wrong.
const expectations = [
  ["en", "what is exactly the funding rate per hour?", "Funding Rate"],
  ["es", "¿cuál es exactamente el funding rate por hora?", "Funding Rate"],
  ["es", "¿qué comisiones cobra StandX por operar?", "Trading Fee"],
  ["pt-br", "quais são as taxas de trading?", "Trading Fee"],
  ["es", "¿cómo se calcula la liquidación?", "Liquidation"],
  ["uk", "як працює ліквідація?", "Liquidation"],
  ["en", "how do I mint DUSD?", "Minting DUSD"],
  ["pt-br", "como faço para mintar DUSD?", "Minting DUSD"],
  ["ko", "DUSD를 어떻게 발행하나요?", "Minting DUSD"],
  ["en", "what is the API endpoint for orders?", "API Reference"],
  ["es", "¿qué es el margen y el apalancamiento?", "Margin & Leverage"]
];

for (const [locale, question, expected] of expectations) {
  const context = retrieveContext(
    buildRetrievalQuery([{role: "user", content: question}]),
    locale,
    ""
  );
  const titles = context.docs.map((page) => page.title);
  const rank = titles.indexOf(expected);
  check(
    `${locale}: "${question.slice(0, 38)}" -> ${expected}`,
    rank !== -1,
    rank === -1 ? `got: ${titles.slice(0, 4).join(", ")}` : `rank ${rank + 1} of ${titles.length}`
  );
}

section("A follow-up inherits the subject of the question before it");

// "And how is it calculated?" carries no subject of its own. Retrieved alone it
// finds nothing, and the model would answer the wrong question confidently.
const followUp = retrieveContext(
  buildRetrievalQuery([
    {role: "user", content: "¿qué es el funding rate?"},
    {role: "assistant", content: "..."},
    {role: "user", content: "¿y cómo se calcula?"}
  ]),
  "es",
  ""
);
check(
  "the earlier subject survives into the follow-up",
  followUp.docs.some((page) => page.title === "Funding Rate"),
  followUp.docs
    .slice(0, 3)
    .map((page) => page.title)
    .join(", ")
);

/* ------------------------------------------------------- the always-theres */

section("What must never be rationed away is still always present");

const siteQuestion = prompt("what sections does this site have?", "en");
check(
  "every hub route is in the prompt regardless of retrieval",
  ["getting-started", "brand-kit", "templates", "references", "community", "about"].every(
    (slug) => siteQuestion.includes(`route "${slug}"`)
  )
);

const nonsense = prompt("xyzzy qwerty plugh", "en");
check(
  "an unmatched question still gets a documentation root",
  nonsense.includes("About StandX"),
  "so the model always has somewhere honest to point"
);
check(
  "and it still carries the rules and the tool contract",
  nonsense.includes("Rules that matter") && nonsense.includes("read_doc")
);

section("Every retrieved title is one the reader can actually resolve");

const known = new Set(docPages.map((page) => page.title));
const bogus = new Set();
for (const [locale, question] of probes) {
  for (const page of retrieveContext(question, locale, "").docs) {
    if (!known.has(page.title)) {
      bogus.add(page.title);
    }
  }
}
check(
  "retrieval never invents a page title",
  bogus.size === 0,
  bogus.size ? [...bogus].join(", ") : `${docPages.length} pages indexed`
);

check(
  "every topic's cited pages exist",
  coreKnowledgeTopics.every((topic) => topic.docTitles.every((title) => known.has(title))),
  `${coreKnowledgeTopics.length} topics`
);

/* -------------------------------------------------------------------- done */

console.log(`\n${checks - failures}/${checks} checks passed`);
process.exit(failures > 0 ? 1 : 0);
