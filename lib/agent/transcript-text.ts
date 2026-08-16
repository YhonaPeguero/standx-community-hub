/**
 * Makes a model's streamed text safe to render in a plain-text transcript.
 *
 * The transcript renders exactly what it is given — `<p>{content}</p>`, no
 * markdown parser, deliberately, since that keeps model output from ever being
 * interpreted as markup. The cost is that anything the model *writes* as markup
 * shows up as punctuation, and free-tier models write plenty of it however
 * firmly the prompt asks them not to. Two kinds, both observed in production:
 *
 *   1. A tool call typed into the prose. Asked about trading fees,
 *      gpt-oss-120b produced a good answer and then typed
 *      `open_link({"label":"Comisiones","url":"https://…"})` into it.
 *   2. Markdown emphasis: "la tasa es **0.01 %**".
 *
 * Neither is disobedience that better wording fixes — the model has mixed up
 * its channels — and the server is what decides what a visitor sees. So it is
 * cleaned here rather than asked for.
 *
 * The difficulty is that this runs mid-stream. Text arrives token by token, so
 * `open_link(` may be split across three deltas and a `*` may be the first half
 * of an emphasis pair whose second half has not been generated yet. Text is
 * therefore released only up to the last position that cannot begin one of
 * these, and the tail is held until it either completes (clean it) or proves
 * innocent (release it).
 */

const TOOL_CALL_STARTS = ["open_link(", "navigate(", "read_doc("] as const;

/**
 * How far a held-back tail may grow before it is judged prose after all.
 * Comfortably longer than a real artifact — the longest is a label plus a
 * documentation URL — and short enough that a false hold is never visible.
 */
const MAX_ARTIFACT_CHARS = 400;

/**
 * A tool call written out in full, including one level of nested parentheses.
 * Leading spaces go with it so removing one mid-sentence leaves no double gap.
 */
const TOOL_CALL = /[ \t]*(?:open_link|navigate|read_doc)\s*\((?:[^()]|\([^()]*\))*\)/g;

/** `[Funding Rate](https://…)` keeps its text and loses the link syntax. */
const MARKDOWN_LINK = /\[([^\]\n]*)\]\([^)\s]*\)/g;

/**
 * Emphasis runs, but never an asterisk with word characters on both sides —
 * that is arithmetic or a wildcard, and eating it would corrupt the answer
 * rather than tidy it.
 */
function stripEmphasis(value: string): string {
  return value
    .replace(/`+/g, "")
    .replace(/\*+/g, (run, offset: number, whole: string) => {
      const before = whole[offset - 1] ?? "";
      const after = whole[offset + run.length] ?? "";
      return /\w/.test(before) && /\w/.test(after) ? run : "";
    });
}

function clean(value: string): string {
  return stripEmphasis(value.replace(TOOL_CALL, "").replace(MARKDOWN_LINK, "$1"));
}

/**
 * The index from which text must be withheld because it might still become
 * something to clean: a partial tool name, a tool call whose arguments have not
 * closed, or an unclosed markdown link.
 */
function holdFrom(buffer: string): number {
  const earliest = Math.max(0, buffer.length - MAX_ARTIFACT_CHARS);

  for (let index = earliest; index < buffer.length; index += 1) {
    const tail = buffer.slice(index);
    for (const start of TOOL_CALL_STARTS) {
      // "open_li" could still become "open_link(", and "open_link({" is one
      // whose arguments are still arriving.
      if (start.startsWith(tail) || tail.startsWith(start)) {
        return index;
      }
    }
    // An unclosed "[label](" — hold until the closing paren decides it.
    if (tail.startsWith("[") && !tail.includes(")")) {
      return index;
    }
  }

  return buffer.length;
}

/**
 * Trailing whitespace and dangling markers are always held one delta longer.
 * Mid-answer that costs nothing — they ship with the next token — and at the
 * end of a turn it means a stray `*`, or the blank line a removed tool call
 * left behind, never appears under the answer.
 */
function withoutDanglingTail(buffer: string, cut: number): number {
  let index = cut;
  while (index > 0 && /[\s*`[]/.test(buffer[index - 1])) {
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
  let buffer = "";

  return {
    push(delta) {
      buffer = clean(buffer + delta);
      const cut = withoutDanglingTail(buffer, holdFrom(buffer));
      const safe = buffer.slice(0, cut);
      buffer = buffer.slice(cut);
      return safe;
    },
    flush() {
      const rest = clean(buffer).replace(/\s+$/, "");
      buffer = "";
      return rest;
    }
  };
}
