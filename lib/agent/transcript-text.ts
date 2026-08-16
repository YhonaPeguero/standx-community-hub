/**
 * Makes a model's streamed text safe to render in a plain-text transcript.
 *
 * The transcript renders exactly what it is given — `<p>{content}</p>`, no
 * markdown parser, deliberately, since that keeps model output from ever being
 * interpreted as markup. The cost is that anything the model *writes* as markup
 * arrives as punctuation, and free-tier models write plenty of it however
 * firmly the prompt asks them not to.
 *
 * The shapes handled here are not guesses. A 25-question run against the live
 * endpoint put an artifact in 16 of 25 answers, and the single form this filter
 * originally caught — `open_link(...)` with parentheses — did not occur once.
 * What actually turns up, in order of frequency:
 *
 *   raw URLs (9)      "…see https://docs.standx.com/docs/about-standx"
 *   brace calls (6)   open_link {"label":"…","url":"…"}   open_link: { … }
 *   bare labels (6)   "[About StandX docs]"
 *
 * So the rule is not "strip the one syntax we saw". It is: the visitor gets
 * prose, and every link they need is already a chip beneath it, rendered from
 * the allow-listed URL the server resolved. Anything in the text pretending to
 * be a link is plumbing, and plumbing is the server's business.
 *
 * The difficulty is that this runs mid-stream: text arrives token by token, so
 * `open_link {` may be split across three deltas and a URL may be half typed.
 * Text is released only up to the last position that cannot begin one of these
 * shapes, and the tail is held until it either completes (clean it) or proves
 * innocent (release it).
 */

const TOOL_NAMES = ["open_link", "navigate", "read_doc"] as const;
const NAMES = "open_link|navigate|read_doc";

/**
 * How far a held-back tail may grow before it is judged prose after all.
 * Longer than any real artifact — the longest is a label plus a documentation
 * URL — and short enough that a false hold is never visible.
 */
const MAX_ARTIFACT_CHARS = 400;

/**
 * Order matters. Markdown links are unwrapped before bare URLs are deleted, or
 * `[Funding Rate](https://…)` would lose its target first and leave `[Funding
 * Rate]()` behind.
 */
const REWRITES: Array<[RegExp, string | ((...args: string[]) => string)]> = [
  // (open_link label="…" url="…") — parenthesised, attribute style.
  [new RegExp(`[ \\t]*\\(\\s*(?:${NAMES})\\b[^()]*\\)`, "g"), ""],
  // open_link({…}) / navigate("home") — the documented call syntax.
  [new RegExp(`[ \\t]*(?:${NAMES})\\s*\\((?:[^()]|\\([^()]*\\))*\\)`, "g"), ""],
  // open_link {"label":…}  /  open_link: {…}  — by far the most common.
  [new RegExp(`[ \\t]*(?:${NAMES})\\s*[:=]?\\s*\\{[^{}]*\\}`, "g"), ""],
  // [Funding Rate](https://…) keeps its text.
  [/\[([^\]\n]*)\]\([^)\s]*\)/g, "$1"],
  // [About StandX docs] — a label the model bracketed for no one. Unwrapped
  // rather than deleted: the words are usually a real sentence fragment.
  [/\[([^\]\n]{1,80})\](?!\()/g, "$1"],
  /**
   * A bare URL cannot be clicked in a plain-text transcript, and the chip below
   * the answer already carries it.
   *
   * The colon in front of one is swallowed with it and becomes a full stop.
   * Deleting only the URL left "You can verify the details in the official
   * documentation:" pointing at nothing — a defect the cleanup itself created,
   * and one that cannot be repaired later because that line has already
   * streamed by the time the turn ends. Ending the sentence instead costs a
   * character and leaves a true one standing.
   */
  [
    /(:)?[ \t]*\n?[ \t]*<?https?:\/\/[^\s<>)\]]+>?/g,
    (_match: string, colon: string) => (colon ? "." : "")
  ]
];

function clean(value: string): string {
  let out = value;
  for (const [pattern, replacement] of REWRITES) {
    out =
      typeof replacement === "string"
        ? out.replace(pattern, replacement)
        : out.replace(pattern, replacement as (substring: string) => string);
  }
  return out
    .replace(/`+/g, "")
    .replace(/\*+/g, (run, offset: number, whole: string) => {
      // Never an asterisk with word characters on both sides — that is
      // arithmetic or a wildcard, and eating it would corrupt the answer.
      const before = whole[offset - 1] ?? "";
      const after = whole[offset + run.length] ?? "";
      return /\w/.test(before) && /\w/.test(after) ? run : "";
    })
    .replace(/[ \t]{2,}/g, " ")
    // A removed artifact usually occupied a line of its own, and the blank line
    // it leaves behind is as visible as the artifact was.
    .replace(/\n{3,}/g, "\n\n");
}

/** A URL under construction, from "h" to the whole address. Empty also matches. */
const URL_PREFIX = /^(?:h(?:t(?:t(?:p(?:s?(?::(?:\/\/?[^\s]*)?)?)?)?)?)?)?$/;

/** True while `tail` could still grow into something `clean` would rewrite. */
function couldStartArtifact(tail: string): boolean {
  // A URL still being typed, from "h" to the whole thing.
  if (tail.length > 0 && URL_PREFIX.test(tail)) {
    return true;
  }
  // A colon that may be introducing one. Held for a delta so the colon and the
  // URL are cleaned together — the colon becomes the sentence's full stop, and
  // once released it can never be taken back.
  if (tail.startsWith(":") && URL_PREFIX.test(tail.slice(1).replace(/^[ \t]*\n?[ \t]*/, ""))) {
    return true;
  }
  // A bracket whose closing bracket has not arrived — it may be a markdown
  // link, a bare label, or neither, and the three are cleaned differently.
  if (tail.startsWith("[") && !tail.includes("]")) {
    return true;
  }
  // Or a closed bracket whose "(" would make it a link.
  if (/^\[[^\]\n]*\]$/.test(tail)) {
    return true;
  }

  const parenthesised = tail.startsWith("(");
  const body = parenthesised ? tail.slice(1).trimStart() : tail;

  for (const name of TOOL_NAMES) {
    // Still spelling the name out: "open_li".
    if (name.startsWith(body)) {
      return true;
    }
    if (body.startsWith(name)) {
      if (parenthesised) {
        return !body.includes(")");
      }
      const after = body.slice(name.length).replace(/^[\s:=]*/, "");
      // Waiting to see whether a delimiter follows, or inside one already.
      if (after === "") {
        return true;
      }
      if (after[0] === "(" || after[0] === "{") {
        return !/[)}]/.test(after);
      }
    }
  }

  return false;
}

/** Each rewrite pattern, anchored, so a finished artifact can be stepped over. */
const ANCHORED = REWRITES.map(
  ([pattern]) => new RegExp(`^(?:${pattern.source})`, pattern.flags.replace("g", ""))
);

function completeArtifactLength(tail: string): number {
  let longest = 0;
  for (const pattern of ANCHORED) {
    const match = pattern.exec(tail);
    if (match && match[0].length > longest) {
      longest = match[0].length;
    }
  }
  return longest;
}

/**
 * The first position that must be withheld, scanning left to right.
 *
 * Finished artifacts are stepped over rather than walked into. Without that the
 * scan fell inside one and stopped at the URL in its arguments — a URL is a
 * valid URL from its first character — which split `open_link {"url":"https://…"}`
 * down the middle and released the first half as prose.
 */
function holdFrom(buffer: string): number {
  const earliest = Math.max(0, buffer.length - MAX_ARTIFACT_CHARS);
  let index = earliest;

  while (index < buffer.length) {
    const tail = buffer.slice(index);
    // Checked before the skip: a bracket or URL that is complete *so far* may
    // still grow into something larger, and only the tail can tell.
    if (couldStartArtifact(tail)) {
      return index;
    }
    const finished = completeArtifactLength(tail);
    index += finished > 0 ? finished : 1;
  }

  return buffer.length;
}

/**
 * Trailing whitespace and dangling markers are always held one delta longer.
 * Mid-answer that costs nothing — they ship with the next token — and at the
 * end of a turn it means the blank line a removed artifact left behind never
 * appears as a gap under the answer.
 */
function withoutDanglingTail(buffer: string, cut: number): number {
  let index = cut;
  while (index > 0 && /[\s*`[(]/.test(buffer[index - 1])) {
    index -= 1;
  }
  return index;
}

export interface TranscriptFilter {
  /** Text safe to show now. Empty while a suspicious tail is held. */
  push(delta: string): string;
  /** Whatever is left once the turn ends, cleaned. */
  flush(): string;
}

export function createTranscriptFilter(): TranscriptFilter {
  /**
   * Held raw, and cleaned only on the way out.
   *
   * Cleaning the buffer on arrival looked equivalent and was not: a URL is a
   * valid URL from its very first character, so `https://d` got deleted as a
   * complete one and the rest of the address — "ocs.standx.com/…" — streamed
   * out as prose. Deciding what to release before deciding what to rewrite is
   * what keeps a half-arrived artifact from being mistaken for a whole one.
   */
  let buffer = "";

  /**
   * Cleaned text waiting on its trailing whitespace to settle. Separate from
   * `buffer` because the blank line an artifact leaves behind only exists after
   * the rewrite: holding whitespace in the raw text holds the wrong whitespace.
   */
  let ready = "";

  return {
    push(delta) {
      buffer += delta;
      const cut = holdFrom(buffer);
      // Everything before `cut` is provably not part of an unfinished artifact,
      // so cleaning it in isolation cannot split one in half.
      // Collapsed across the join, not just within each slice. The blank line
      // an artifact leaves behind and the newline that followed it arrive in
      // different deltas, so a per-slice collapse never sees them together —
      // and trailing whitespace is always still held here, unemitted.
      ready = (ready + clean(buffer.slice(0, cut))).replace(/\n{3,}/g, "\n\n");
      buffer = buffer.slice(cut);

      const stop = withoutDanglingTail(ready, ready.length);
      const safe = ready.slice(0, stop);
      ready = ready.slice(stop);
      return safe;
    },
    flush() {
      const rest = clean(ready + clean(buffer))
        // A line left holding nothing but the punctuation that introduced a
        // removed link ("Sources:", "Documentation home:") reads as a mistake.
        .replace(/(?:^|\n)[^\S\n]*[A-Za-z ]{0,24}:[^\S\n]*(?=\n|$)/g, "")
        // Trimmed first, so the check below sees the real last line rather than
        // the newline the removed URL used to sit behind.
        .replace(/\s+$/, "")
        // …and so does the sentence that introduced one. Removing the URL from
        // "You can verify the details in the official documentation:" leaves a
        // colon pointing at nothing — the one defect the fixes introduced.
        // Only ever the LAST line, and only when something precedes it, so an
        // answer is never emptied and a mid-answer list keeps its heading.
        .replace(/\n[^\n]*:[ \t]*$/, "")
        .replace(/\s+$/, "");
      buffer = "";
      ready = "";
      return rest;
    }
  };
}

/**
 * Cuts a truncated answer back to its last complete sentence.
 *
 * A provider that stops at `max_tokens` leaves the visitor mid-clause — one
 * battery answer ended "…inside the qualifying band around the mark price;".
 * Half a sentence reads as a crash; one sentence fewer reads as an answer.
 * Only used when the provider actually reported truncation, so nothing is
 * trimmed from a reply that simply ended without a full stop.
 *
 * There is no minimum-length guard, and that is deliberate: the only case where
 * trimming could swallow the answer is one with no complete sentence in it at
 * all, and that case already falls through to the untouched text.
 */
export function trimToLastSentence(text: string): string {
  const match = /^[\s\S]*[.!?]["')\]]?/.exec(text.trimEnd());
  return match ? match[0] : text;
}
