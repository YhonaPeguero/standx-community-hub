// Does the hub still agree with the official StandX documentation?
// Run with: npm run docs:check
//
// This one goes over the network on purpose, which is why it is NOT part of the
// offline gate. Run it before a release, or on a schedule.
//
// Why it exists: `agent:check` proves the knowledge base is internally
// consistent — every chip resolves, every locale is translated, every doc title
// exists, every URL is well formed and unique. What it could never prove is
// that any of it is still TRUE. The `verifiedAt` stamps were written by hand and
// nothing read them, so the hub could drift for months and look perfectly
// healthy the whole time. An audit found the content was in fact still accurate,
// which is luck, not a process.
//
// So this script checks the three ways the hub can silently go out of date:
//
//   1. A page we link to gets renamed or removed  -> dead link
//   2. StandX documents something new             -> a gap we never hear about
//   3. A number we quote quietly changes          -> stale `verifiedAt`
//
// (3) cannot be automated without a human reading the page, so it is treated as
// an expiry date instead: `volatility` decides how long a fact is trusted before
// it must be re-read against the source.

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import {fileURLToPath} from "node:url";
import ts from "typescript";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const source = path.join(__dirname, "..", "lib", "agent", "standx-knowledge.ts");

// Transpile and import the real module rather than regexing it: the records are
// the source of truth, and a regex would quietly miss a page added in a shape it
// did not anticipate — the exact class of blind spot this script is here to close.
const transpiled = ts.transpileModule(fs.readFileSync(source, "utf8"), {
  compilerOptions: {module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022}
}).outputText;

const tmp = path.join(
  fs.mkdtempSync(path.join(os.tmpdir(), "docs-check-")),
  "knowledge.mjs"
);
fs.writeFileSync(tmp, transpiled);
const {docPages, coreKnowledgeTopics} = await import(
  `file://${tmp.split(path.sep).join("/")}`
);

/* ------------------------------------------------------------------ config */

/** How long a fact is trusted before someone has to re-read the source page. */
const MAX_AGE_DAYS = {
  changeable: 30,
  stable: 90
};

/** Pages crawled to discover what the official docs currently publish. */
const CRAWL_SEEDS = [
  "https://docs.standx.com/docs/about-standx",
  "https://docs.standx.com/sip/sip"
];

/**
 * Section landing pages. They exist and resolve, but they are tables of
 * contents rather than content, so the hub links to the pages beneath them
 * instead. Listed explicitly so "not linked" stays a deliberate decision.
 */
const IGNORED_PATHS = new Set([
  "/docs/dusd-solutions",
  "/docs/resources",
  "/docs/standx-perps-solutions"
]);

const REQUEST_TIMEOUT_MS = 25_000;
const CONCURRENCY = 6;

/* ------------------------------------------------------------------ utils */

let failures = 0;
let checks = 0;

function check(label, condition, detail) {
  checks += 1;
  if (condition) {
    console.log(`  ✓ ${label}${detail ? `  ${detail}` : ""}`);
  } else {
    failures += 1;
    console.log(`  ✗ ${label}${detail ? `  ${detail}` : ""}`);
  }
}

function section(name) {
  console.log(`\n${name}`);
}

/** One retry, because a flaky socket must not read as a renamed page. */
async function fetchOnce(url, method) {
  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      const response = await fetch(url, {
        method,
        redirect: "follow",
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS)
      });
      return {status: response.status, response};
    } catch (error) {
      if (attempt === 1) {
        return {status: 0, error: String(error?.message ?? error)};
      }
    }
  }
  return {status: 0, error: "unreachable"};
}

async function mapWithLimit(items, limit, worker) {
  const results = new Array(items.length);
  let cursor = 0;
  const runners = Array.from({length: Math.min(limit, items.length)}, async () => {
    while (cursor < items.length) {
      const index = cursor;
      cursor += 1;
      results[index] = await worker(items[index], index);
    }
  });
  await Promise.all(runners);
  return results;
}

const pathOf = (url) => new URL(url).pathname.replace(/\/$/, "");

/* --------------------------------------------------------- 1. dead links */

section("Every page the hub links to still resolves");

const linkResults = await mapWithLimit(docPages, CONCURRENCY, async (page) => ({
  page,
  ...(await fetchOnce(page.url, "GET"))
}));

const unreachable = linkResults.filter((result) => result.status === 0);
const broken = linkResults.filter(
  (result) => result.status !== 0 && result.status !== 200
);

check(
  `all ${docPages.length} documentation links return 200`,
  broken.length === 0,
  broken.length
    ? broken.map((r) => `${r.status} ${r.page.title}`).join("; ")
    : "no renamed or removed pages"
);

// Network trouble is not the same finding as a renamed page, and reporting it as
// one would train everybody to ignore this script.
check(
  "every link was actually reachable",
  unreachable.length === 0,
  unreachable.length
    ? `could not check: ${unreachable.map((r) => r.page.title).join(", ")}`
    : "no timeouts or DNS failures"
);

/* ------------------------------------------------- 2. undocumented pages */

section("The official docs publish nothing the hub has not noticed");

const discovered = new Set();
for (const seed of CRAWL_SEEDS) {
  const {status, response} = await fetchOnce(seed, "GET");
  if (status !== 200 || !response) {
    continue;
  }
  const html = await response.text();
  for (const match of html.matchAll(/href="(\/(?:docs|sip|standx-api)[^"#?]*)"/g)) {
    discovered.add(match[1].replace(/\/$/, ""));
  }
}

// If the crawl comes back empty the site was redesigned or is now rendered
// client-side. Passing silently would be the worst outcome: the check would keep
// reporting "nothing new" forever while seeing nothing at all.
check(
  "the documentation navigation could be read",
  discovered.size > 10,
  `${discovered.size} links found across ${CRAWL_SEEDS.length} seed pages`
);

const linked = new Set(docPages.map((page) => pathOf(page.url)));
const unlisted = [...discovered]
  .filter((href) => !linked.has(href) && !IGNORED_PATHS.has(href))
  .sort();

check(
  "no official page is missing from the hub's index",
  unlisted.length === 0,
  unlisted.length ? unlisted.join("\n      ") : `${linked.size} pages indexed`
);

/* ------------------------------------------------------ 3. stale answers */

section("No answer is older than its facts are allowed to be");

const today = new Date();
const ageInDays = (stamp) =>
  Math.floor((today - new Date(`${stamp}T00:00:00Z`)) / 86_400_000);

const stale = [];
for (const topic of coreKnowledgeTopics) {
  const age = ageInDays(topic.verifiedAt);
  const limit = MAX_AGE_DAYS[topic.volatility];
  if (age > limit) {
    stale.push({topic, age, limit});
  }
}

for (const [volatility, limit] of Object.entries(MAX_AGE_DAYS)) {
  const group = coreKnowledgeTopics.filter((t) => t.volatility === volatility);
  const worst = group.reduce(
    (max, t) => Math.max(max, ageInDays(t.verifiedAt)),
    0
  );
  check(
    `${volatility} facts re-read within ${limit} days`,
    worst <= limit,
    `${group.length} topics, oldest is ${worst} days`
  );
}

if (stale.length) {
  console.log("\n  Needs re-reading against the official source:");
  for (const {topic, age, limit} of stale) {
    console.log(
      `    ${topic.id} — ${age} days old (limit ${limit})` +
        `  sources: ${topic.docTitles.join(", ")}`
    );
  }
}

/* ------------------------------------------------- 4. the reader still reads */

section("Stander can still read a page, not just link to it");

// `read_doc` turns the hub from a FAQ into a docs assistant, and it rests on
// scraping text out of the docs site's HTML. A redesign there — or a switch to
// client-side rendering — would empty every answer without failing anything
// else in this file, so the extraction is exercised against a live page.
const readerSource = fs
  .readFileSync(
    path.join(__dirname, "..", "lib", "agent", "doc-reader.ts"),
    "utf8"
  )
  .replace('from "@/lib/agent/standx-knowledge"', 'from "./standx-knowledge.mjs"');

const readerDir = path.dirname(tmp);
fs.writeFileSync(path.join(readerDir, "standx-knowledge.mjs"), transpiled);
const readerFile = path.join(readerDir, "doc-reader.mjs");
fs.writeFileSync(
  readerFile,
  ts.transpileModule(readerSource, {
    compilerOptions: {module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022}
  }).outputText
);
const {readDocPage} = await import(`file://${readerFile.split(path.sep).join("/")}`);

const sample = await readDocPage("Funding Rate");
check(
  "a known page still yields readable text",
  sample.ok && sample.content.length > 500,
  sample.ok ? `${sample.content.length} characters` : sample.content
);
check(
  "and the text is the page's own content, not chrome",
  sample.ok && /funding/i.test(sample.content),
  sample.ok ? `opens: ${sample.content.slice(0, 60).replace(/\n/g, " ")}…` : "unreadable"
);

const bogus = await readDocPage("A Page That Does Not Exist");
check(
  "an unknown title is refused rather than fetched",
  !bogus.ok && /no documentation page/.test(bogus.content)
);

/* -------------------------------------------------------------------- done */

console.log(
  `\n${checks - failures}/${checks} checks passed` +
    ` — ${docPages.length} pages, ${coreKnowledgeTopics.length} topics`
);
process.exit(failures > 0 ? 1 : 0);
