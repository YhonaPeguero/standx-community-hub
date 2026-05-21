// Quick i18n parity check: prints any keys present in one locale but missing from the others.
// Run with: node scripts/check-i18n.mjs
import fs from "node:fs";
import path from "node:path";
import {fileURLToPath} from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const messagesDir = path.join(__dirname, "..", "messages");

const locales = ["en", "es", "pt-br", "uk", "ko"];

function flatten(obj, prefix = "") {
  const out = {};
  for (const [k, v] of Object.entries(obj)) {
    const key = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === "object" && !Array.isArray(v)) {
      Object.assign(out, flatten(v, key));
    } else {
      out[key] = typeof v;
    }
  }
  return out;
}

const flats = {};
for (const locale of locales) {
  const raw = fs.readFileSync(path.join(messagesDir, `${locale}.json`), "utf8");
  flats[locale] = flatten(JSON.parse(raw));
}

const base = "en";
const baseKeys = new Set(Object.keys(flats[base]));
let drift = 0;

for (const locale of locales) {
  if (locale === base) continue;
  const keys = new Set(Object.keys(flats[locale]));
  const missing = [...baseKeys].filter((k) => !keys.has(k));
  const extra = [...keys].filter((k) => !baseKeys.has(k));
  if (missing.length || extra.length) {
    drift += missing.length + extra.length;
    console.log(`\n=== ${locale} ===`);
    if (missing.length) console.log(`  missing (${missing.length}):`, missing.slice(0, 50));
    if (extra.length) console.log(`  extra   (${extra.length}):`, extra.slice(0, 50));
  } else {
    console.log(`OK ${locale}: ${keys.size} keys aligned with ${base}`);
  }
}

if (!drift) {
  console.log(`\nAll ${locales.length} locales aligned. (${baseKeys.size} keys each)`);
} else {
  console.log(`\nTotal drift across non-base locales: ${drift} keys`);
  process.exitCode = 1;
}
