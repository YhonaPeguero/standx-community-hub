// The assistant's request guards, exercised headlessly.
// Run with: npm run guards:check
//
// These two pieces decide who gets to spend the deployment's free-tier quota,
// so a silent regression here is a bill or an outage rather than a cosmetic
// bug. Neither is testable by clicking: the visitor budget only misbehaves at
// its boundaries, and forging a cookie is the whole point of signing it.
//
// What is deliberately NOT asserted: that the budget identifies a visitor. It
// cannot, and it is not trying to — see the reasoning at the top of
// `lib/agent/visitor-quota.ts`. These assertions cover the parts that are
// supposed to hold: the tier boundaries, and that an edited cookie is refused.

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import {fileURLToPath} from "node:url";
import ts from "typescript";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

process.env.STANDX_AGENT_COOKIE_SECRET = "test-secret-not-used-anywhere-real";

const source = path.join(root, "lib", "agent", "visitor-quota.ts");
const transpiled = ts.transpileModule(fs.readFileSync(source, "utf8"), {
  compilerOptions: {module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022}
}).outputText;

const tmp = path.join(
  fs.mkdtempSync(path.join(os.tmpdir(), "guards-check-")),
  "visitor-quota.mjs"
);
fs.writeFileSync(tmp, transpiled);
const {readQuota, chargeQuota, quotaCookie} = await import(
  `file://${tmp.split(path.sep).join("/")}`
);

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

/** A request carrying whatever `Set-Cookie` value the last one produced. */
function requestWith(setCookie) {
  const value = setCookie ? setCookie.split(";")[0] : "";
  return new Request("https://hub.test/api/hub-agent", {
    headers: value ? {cookie: value} : {}
  });
}

/** Charges the budget `times` times, carrying the cookie forward each time. */
function spend(times) {
  let cookie = null;
  let verdict = null;
  for (let index = 0; index < times; index += 1) {
    verdict = chargeQuota(readQuota(requestWith(cookie)));
    cookie = quotaCookie(verdict.state);
  }
  return {verdict, cookie};
}

/* ------------------------------------------------------- the tier boundaries */

section("Visitor budget — the tiers land where they are documented");

check("the first question is answered normally", spend(1).verdict.tier === "open");
check("question 20 is still normal", spend(20).verdict.tier === "open");

const twentyOne = spend(21).verdict;
check(
  "question 21 is paced rather than refused",
  twentyOne.tier === "throttled" && twentyOne.delayMs > 0,
  `tier ${twentyOne.tier}, ${twentyOne.delayMs}ms`
);
check("question 35 is still answered", spend(35).verdict.tier === "throttled");
check(
  "question 36 falls back to the curated answers",
  spend(36).verdict.tier === "exhausted"
);

check(
  "the count survives across requests",
  spend(7).verdict.state.count === 7,
  `counted ${spend(7).verdict.state.count}`
);

/* ---------------------------------------------------------------- tampering */

section("Visitor budget — an edited cookie buys nothing");

const spent = spend(30);
check("the honest cookie carries its count", readQuota(requestWith(spent.cookie)).count === 30);

// Rewrite the count in the payload but keep the original signature.
const forged = spent.cookie.split(";")[0].replace(/=(\d+)\./, "=0.");
check(
  "a hand-edited count is rejected and restarts at zero",
  readQuota(requestWith(forged)).count === 0,
  "the signature no longer matches the payload"
);

const truncated = spent.cookie.split(";")[0].slice(0, -6);
check(
  "a truncated signature is rejected rather than throwing",
  readQuota(requestWith(truncated)).count === 0
);

check(
  "a cookie with no signature at all is rejected",
  readQuota(requestWith("stander_q=99.1700000000000")).count === 0
);

/* ------------------------------------------------------------------ expiry */

section("Visitor budget — the window actually expires");

const stale = chargeQuota({count: 30, windowStart: Date.now() - 25 * 60 * 60 * 1000});
const staleCookie = quotaCookie(stale.state);
check(
  "a window older than a day starts over",
  readQuota(requestWith(staleCookie)).count <= 1 ||
    chargeQuota(readQuota(requestWith(staleCookie))).tier === "open"
);

const fresh = readQuota(
  requestWith(quotaCookie({count: 5, windowStart: Date.now() - 60_000}))
);
check("a window from a minute ago is kept", fresh.count === 5);

/* ------------------------------------------------------------- no secret */

section("Visitor budget — an unconfigured secret is explicit, not silent");

const realSecret = process.env.STANDX_AGENT_COOKIE_SECRET;
delete process.env.STANDX_AGENT_COOKIE_SECRET;
check(
  "without a secret the budget reports itself disabled",
  chargeQuota({count: 999, windowStart: Date.now()}).tier === "disabled",
  "the provider rate limit and offline fallback still apply"
);
check("and no cookie is set", quotaCookie({count: 1, windowStart: Date.now()}) === null);
process.env.STANDX_AGENT_COOKIE_SECRET = realSecret;

/* ------------------------------------------------ the route still guards */

section("Route — the guards are still wired in");

const route = fs.readFileSync(path.join(root, "app", "api", "hub-agent", "route.ts"), "utf8");

check(
  "cross-origin requests are refused",
  /if \(!isSameOrigin\(request\)\)/.test(route) && /"forbidden"/.test(route)
);
check(
  "external links are checked against the allowlist",
  /allowedLinkUrls\.has\(url\)/.test(route)
);
check(
  "navigation targets are checked against known routes",
  /isNavigableRoute\(route\)/.test(route)
);
check(
  "a curated answer is never charged to the visitor's budget",
  /if \(!usesModel\) \{[\s\S]{0,200}?return localStream\(/.test(route)
);
check(
  "an exhausted budget degrades to curated answers, not an error",
  /quota\.tier === "exhausted"[\s\S]{0,200}?return localStream\(/.test(route)
);
check(
  "a retired provider is not retried later in the same request",
  /available = available\.slice\(1\)/.test(route)
);
check(
  "documentation reads are capped per answer",
  /docsRead >= MAX_DOC_READS/.test(route) && /docsRead \+= 1/.test(route)
);

// The offline brain used to intercept anything it recognised, so a question
// containing "funding" was answered with a bare link while a working model sat
// unused. Only an explicit navigation request may skip the model now.
check(
  "the offline brain only short-circuits navigation",
  /handledWithoutModel = localAnswer\.kind === "navigation"/.test(route),
  "a recognised keyword must not preempt a configured model"
);

// The prompt is per-question now. If this ever goes back to a constant the
// whole knowledge base rides along on every round and the free tier's
// per-minute token budget is gone — see scripts/check-retrieval.mjs.
check(
  "the prompt is built from retrieved context, not the whole knowledge base",
  /retrieveContext\(/.test(route) && /buildSystemPrompt\(locale, retrieved/.test(route)
);

section("Providers — one bad provider must not take the chain down");

const providers = fs.readFileSync(path.join(root, "lib", "agent", "providers.ts"), "utf8");

check(
  "a rejected key or model fails over instead of ending the request",
  /MISCONFIGURED_STATUSES = new Set\(\[401, 403, 404\]\)/.test(providers),
  "Groq reports an exhausted token allowance as 401"
);
check(
  "a model that emits malformed tool JSON fails over too",
  /isRecoverableBadRequest/.test(providers) && /tool\[_ \]use\[_ \]failed/.test(providers)
);
check(
  "a 401 from a provider that already answered is not reported as a bad key",
  /provenProviders/.test(providers),
  "otherwise every busy minute cries wolf about a working key"
);

section("Doc reader — the model names a page, it never supplies a URL");

const tools = fs.readFileSync(path.join(root, "lib", "agent", "tools.ts"), "utf8");
const readerBlock = tools.match(/name: "read_doc",[\s\S]*?strict: true/);

check("the read_doc tool exists", Boolean(readerBlock));
check(
  "its only input is a title — there is no url parameter",
  Boolean(readerBlock) &&
    /title: \{/.test(readerBlock[0]) &&
    !/\burl\b\s*:/.test(readerBlock[0]),
  "this is what makes server-side fetching SSRF-free"
);

const reader = fs.readFileSync(path.join(root, "lib", "agent", "doc-reader.ts"), "utf8");
check(
  "the reader resolves titles against the hardcoded docPages list",
  /docPages\.find\(/.test(reader)
);
check(
  "the only thing ever fetched is a resolved page's own url",
  /fetch\(page\.url,/.test(reader) && !/fetch\((?!page\.url)/.test(reader),
  "no model-supplied string can reach fetch()"
);
check(
  "page text is bounded before it enters the conversation",
  /MAX_CHARS/.test(reader) && /slice\(0, MAX_CHARS\)/.test(reader)
);

/* --------------------------------------------------- tool calls as prose */

section("A tool call typed into the answer never reaches the visitor");

const filterSource = path.join(root, "lib", "agent", "transcript-text.ts");
const filterOut = path.join(fs.mkdtempSync(path.join(os.tmpdir(), "tfilter-")), "filter.mjs");
fs.writeFileSync(
  filterOut,
  ts.transpileModule(fs.readFileSync(filterSource, "utf8"), {
    compilerOptions: {module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022}
  }).outputText
);
const {createTranscriptFilter} = await import(`file://${filterOut.split(path.sep).join("/")}`);

/** Runs text through the filter in the given chunks, as the stream would. */
function filtered(chunks) {
  const filter = createTranscriptFilter();
  let out = "";
  for (const chunk of chunks) {
    out += filter.push(chunk);
  }
  return out + filter.flush();
}

const artifact =
  'open_link({"label":"Comisiones de Trading","url":"https://docs.standx.com/docs/x"})';

check(
  "a whole artifact arriving at once is removed",
  filtered([`La comisión maker es 0,01%.\n\n${artifact}`]) === "La comisión maker es 0,01%.",
  JSON.stringify(filtered([`La comisión maker es 0,01%.\n\n${artifact}`]))
);

// The real case: it arrives a few tokens at a time, so the opening is already
// on screen by the time the artifact is recognisable — unless text is held.
const streamed = ["La comisión maker es 0,01%.\n\n", "open_", "link(", '{"label":"C', 'omisiones"', ',"url":"https://docs.standx.com/docs/x"', "})"];
check(
  "an artifact split across deltas is still removed",
  filtered(streamed) === "La comisión maker es 0,01%.",
  JSON.stringify(filtered(streamed))
);

check(
  "an artifact in the middle of a sentence is removed without a double space",
  filtered([`Mira ${artifact} y listo.`]) === "Mira y listo.",
  JSON.stringify(filtered([`Mira ${artifact} y listo.`]))
);

// A filter that eats ordinary prose is worse than the leak it prevents.
check(
  "prose that merely mentions a tool name survives",
  filtered(["Puedes navigate por la documentación oficial."]) ===
    "Puedes navigate por la documentación oficial.",
  JSON.stringify(filtered(["Puedes navigate por la documentación oficial."]))
);
check(
  "a normal answer passes through byte for byte",
  filtered(["StandX cobra 0,01% maker ", "y 0,04% taker."]) ===
    "StandX cobra 0,01% maker y 0,04% taker.",
);
check(
  "an unterminated tool name is released rather than swallowed",
  filtered([`Habla de read_doc${"x".repeat(500)}`]).length > 400
);

// The transcript has no markdown parser on purpose — that is what keeps model
// output from ever being interpreted as markup — so markdown the model writes
// anyway lands as literal punctuation in front of the visitor.
check(
  "bold markers are stripped, split across deltas like a real stream",
  filtered(["La tasa maker es ", "**0.0", "1 %**", " del nocional."]) ===
    "La tasa maker es 0.01 % del nocional.",
  JSON.stringify(filtered(["La tasa maker es ", "**0.0", "1 %**", " del nocional."]))
);
check(
  "backticks and single emphasis go too",
  filtered(["Usa `read_doc` para leer la *página* oficial."]) ===
    "Usa read_doc para leer la página oficial.",
  JSON.stringify(filtered(["Usa `read_doc` para leer la *página* oficial."]))
);
check(
  "a markdown link keeps its text and loses the syntax",
  filtered(["Mira [Funding Rate](https://docs.standx.com/x) ahora."]) ===
    "Mira Funding Rate ahora.",
  JSON.stringify(filtered(["Mira [Funding Rate](https://docs.standx.com/x) ahora."]))
);

// Stripping every asterisk would be simpler and would corrupt real answers.
check(
  "an asterisk between word characters is left alone",
  filtered(["El cálculo es 2*3 y nada más."]) === "El cálculo es 2*3 y nada más.",
  JSON.stringify(filtered(["El cálculo es 2*3 y nada más."]))
);

check(
  "the filter is actually wired into the streamed answer",
  /createTranscriptFilter\(\)/.test(route) && /transcript\.push\(delta\)/.test(route)
);

/* -------------------------------------------------------------------- done */

console.log(`\n${checks - failures}/${checks} checks passed`);
process.exit(failures > 0 ? 1 : 0);
