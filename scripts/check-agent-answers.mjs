// Every suggestion chip must resolve to a real curated answer, in every locale.
// Run with: npm run agent:check
//
// The chips are a promise. "How do I get started?" shipped as a suggestion with
// no matching topic, so clicking it produced "I do not have a verified answer
// for that yet" — the assistant declining a question the UI had just offered.
// This makes that a failed run instead of something a person has to notice.
//
// Reads the message catalogues directly and calls the real matcher. Do NOT test
// this by piping non-ASCII through curl on Windows: the shell mangles argv and
// every non-English case fails for reasons that have nothing to do with the code.

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import {fileURLToPath} from "node:url";
import ts from "typescript";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const locales = ["en", "es", "pt-br", "uk", "ko", "ja"];

// `standx-knowledge.ts` imports only a type, so it transpiles standalone.
const source = fs
  .readFileSync(path.join(root, "lib", "agent", "standx-knowledge.ts"), "utf8")
  .replace(/^import type \{AppLocale\}.*$/m, "");

const transpiled = ts.transpileModule(source, {
  compilerOptions: {module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022}
}).outputText;

const dir = fs.mkdtempSync(path.join(os.tmpdir(), "agent-check-"));
const file = path.join(dir, "knowledge.mjs");
fs.writeFileSync(file, transpiled, "utf8");
const {matchCoreKnowledge, coreKnowledgeTopics, docPages, findDoc} = await import(
  `file://${file.split(path.sep).join("/")}`
);

let failures = 0;
let checks = 0;

function check(label, ok, detail) {
  checks += 1;
  if (!ok) failures += 1;
  console.log(`  ${ok ? "✓" : "✗"} ${label}${detail ? `  ${detail}` : ""}`);
}

console.log("\nSuggestion chips resolve to a curated answer");
for (const locale of locales) {
  const messages = JSON.parse(
    fs.readFileSync(path.join(root, "messages", `${locale}.json`), "utf8")
  );
  const suggestions = Object.values(messages.agent.suggestions);

  for (const question of suggestions) {
    const match = matchCoreKnowledge(question, locale);
    const answer = match?.topic.answer[locale] ?? "";
    check(
      `${locale}: ${question}`,
      Boolean(match) && answer.length > 120,
      match ? `${match.topic.id} score=${match.score} chars=${answer.length}` : "NO MATCH"
    );
  }
}

console.log("\nEvery topic is answerable and sourced in every locale");
for (const topic of coreKnowledgeTopics) {
  const missing = locales.filter((locale) => !topic.answer?.[locale]?.trim());
  check(`${topic.id}: translated`, missing.length === 0, missing.join(", "));

  const aliasGaps = locales.filter((locale) => !topic.aliases?.[locale]?.length);
  check(`${topic.id}: has aliases`, aliasGaps.length === 0, aliasGaps.join(", "));

  // findDoc throws on a miss, which is the point — a typo here would otherwise
  // surface as a broken link in front of a visitor.
  let docsOk = true;
  let docError = "";
  try {
    for (const title of topic.docTitles) findDoc(title);
  } catch (error) {
    docsOk = false;
    docError = String(error?.message ?? error);
  }
  check(`${topic.id}: doc titles exist`, docsOk, docError);
}

// Shape only — a live fetch would make this script depend on the network. The
// docs site serves SIPs under /sip and the API under /standx-api, so the rule is
// "same host, sane slug path", not "starts with /docs".
console.log("\nDoc URLs are well-formed and unique");
const seenUrls = new Map();
for (const page of docPages) {
  check(
    `${page.title}`,
    /^https:\/\/docs\.standx\.com(\/[a-z0-9-]+)+$/.test(page.url),
    page.url
  );
  if (seenUrls.has(page.url)) {
    check(`${page.title}: url not duplicated`, false, `same as "${seenUrls.get(page.url)}"`);
  }
  seenUrls.set(page.url, page.title);
}

fs.rmSync(dir, {recursive: true, force: true});
console.log(
  `\n${failures === 0 ? "PASS" : "FAIL"} — ${checks - failures}/${checks} checks passed\n`
);
process.exit(failures === 0 ? 0 : 1);
