// Builds the HyperFrames composition as one self-contained HTML file.
//
// The importer fetches a single file and there is no file tree on the other
// side, so the brand fonts and the logo are inlined as base64 here. The footage
// is too large to inline and is referenced from jsDelivr, pinned to a commit —
// a branch URL would drift under the render and a signed URL would expire.
//
// Timing lives in SCENES below, in one place, because a scene duration changed
// in isolation silently untiles every scene after it.
import fs from "node:fs";
import path from "node:path";

const REPO = "E:/standx-community-hub";
const HERE = path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Z]:)/, "$1"));
const FOOTAGE_BASE = process.env.FOOTAGE_BASE ?? "FOOTAGE_BASE_NOT_SET";

const W = 1080;
const H = 1350;

/* ------------------------------------------------------------------ brand */

const b64 = (file) => fs.readFileSync(file).toString("base64");
const font = (file) => b64(path.join(REPO, "node_modules/geist/dist/fonts", file));

const FONTS = {
  black: font("geist-sans/Geist-Black.woff2"),
  medium: font("geist-sans/Geist-Medium.woff2"),
  mono: font("geist-mono/GeistMono-SemiBold.woff2")
};
const LOGO = b64(path.join(REPO, "public/assets/logo.png"));

/* ----------------------------------------------------------------- script */

// `clip` picks the passage of a take and the speed it plays at: the source
// window is (in -> out) and it is spread across the scene's whole duration, so
// a 9s window in a 6s scene is a 1.5x ramp. Answers are streamed at reading
// speed by a real model; at 1x the middle of a paragraph is dead air.
const SCENES = [
  {
    id: "s1", duration: 3.2, kind: "bleed",
    clip: {file: "01-open.mp4", in: 0.1, out: 3.3},
    kicker: "StandX · Community Hub"
  },
  {
    id: "s2", duration: 3.2, kind: "bleed",
    clip: {file: "01-open.mp4", in: 4.2, out: 7.6},
    title: "Meet Stander."
  },
  {
    id: "s3", duration: 9.0, kind: "framed",
    clip: {file: "02-funding.mp4", in: 2.8, out: 11.5},
    kicker: "Ask anything",
    caption: "It reads the official docs. Live."
  },
  {
    id: "s4", duration: 3.6, kind: "punch",
    clip: {file: "02-funding.mp4", in: 10.0, out: 11.55},
    caption: "Every answer carries its source."
  },
  {
    id: "s5", duration: 8.5, kind: "framed",
    clip: {file: "03-sip6.mp4", in: 2.0, out: 11.15},
    kicker: "So we told it something that never happened",
    caption: "\u201cStandX launched SIP-6 last week.\u201d"
  },
  {
    id: "s6", duration: 4.0, kind: "statement",
    statement: "StandX has not\nlaunched a SIP-6.",
    caption: "It will not invent what is not there."
  },
  {
    id: "s7", duration: 1.75, kind: "lang", label: "Espa\u00f1ol",
    clip: {file: "04-lang-es.mp4", in: 5.57, out: 7.57}
  },
  {
    id: "s8", duration: 1.75, kind: "lang", label: "Portugu\u00eas",
    clip: {file: "04-lang-pt-br.mp4", in: 5.03, out: 7.03}
  },
  {
    id: "s9", duration: 1.75, kind: "lang", label: "\u0423\u043a\u0440\u0430\u0457\u043d\u0441\u044c\u043a\u0430",
    clip: {file: "04-lang-uk.mp4", in: 5.13, out: 7.13}
  },
  {
    id: "s10", duration: 1.75, kind: "lang", label: "\ud55c\uad6d\uc5b4",
    clip: {file: "04-lang-ko.mp4", in: 5.00, out: 7.00},
    caption: "Five languages. Same answers."
  },
  {
    id: "s11", duration: 6.0, kind: "framed",
    clip: {file: "05-navigate.mp4", in: 3.0, out: 9.6},
    kicker: "\u201ctake me to the brand kit\u201d",
    caption: "And it can take you there."
  },
  {
    id: "s12", duration: 4.5, kind: "close",
    clip: {file: "06-close.mp4", in: 0.4, out: 5.4},
    caption: "standx-community-hub.vercel.app"
  }
];

let cursor = 0;
for (const scene of SCENES) {
  scene.start = Number(cursor.toFixed(3));
  cursor = Number((cursor + scene.duration).toFixed(3));
}
const TOTAL = cursor;

/* ------------------------------------------------------------------ parts */

const videoTag = (scene) =>
  scene.clip
    ? `<video id="${scene.id}-v" class="shot" src="${FOOTAGE_BASE}/${scene.clip.file}" muted playsinline preload="auto"></video>`
    : "";

function body(scene) {
  switch (scene.kind) {
    case "bleed":
      return `
        <div class="bleed">${videoTag(scene)}</div>
        ${scene.kicker ? `<p id="${scene.id}-k" class="kicker floating">${scene.kicker}</p>` : ""}
        ${scene.title ? `<h1 id="${scene.id}-t" class="display title-bl">${scene.title}</h1>` : ""}`;
    case "framed":
      return `
        ${scene.kicker ? `<p id="${scene.id}-k" class="kicker">${scene.kicker}</p>` : ""}
        <div id="${scene.id}-f" class="frame">${videoTag(scene)}</div>
        <p id="${scene.id}-c" class="caption"><span class="sweep">${scene.caption}</span></p>`;
    case "punch":
      return `
        <div class="bleed punch">${videoTag(scene)}</div>
        <p id="${scene.id}-c" class="caption caption-over"><span class="sweep">${scene.caption}</span></p>`;
    case "statement":
      return `
        <h2 id="${scene.id}-s" class="statement">${scene.statement.replace(/\n/g, "<br/>")}</h2>
        <p id="${scene.id}-c" class="caption caption-lime">${scene.caption}</p>`;
    case "lang":
      return `
        <div id="${scene.id}-f" class="frame frame-lang">${videoTag(scene)}</div>
        <p id="${scene.id}-l" class="lang-label">${scene.label}</p>
        ${scene.caption ? `<p id="${scene.id}-c" class="caption">${scene.caption}</p>` : ""}`;
    case "close":
      return `
        <div class="bleed close-bleed">${videoTag(scene)}</div>
        <div class="close-stack">
          <h1 id="${scene.id}-t" class="display close-title">Meet Stander.</h1>
          <p id="${scene.id}-c" class="kicker close-url">${scene.caption}</p>
        </div>`;
    default:
      throw new Error(`unknown scene kind ${scene.kind}`);
  }
}

const sceneMarkup = SCENES.map(
  (scene, index) => `
      <div class="scene clip" id="${scene.id}" data-start="${scene.start}" data-duration="${scene.duration}" data-track-index="0"${index === 0 ? "" : ' style="visibility:hidden;"'}>
        <div class="scene-content sc-${scene.kind}">${body(scene)}</div>
        <div class="grain"></div>
      </div>`
).join("\n");

/* --------------------------------------------------------------- timeline */

const lines = [];

// Every scene but the first starts hidden and is shown for its own window.
// autoAlpha rather than visibility: a shader reset would leave a
// visibility-only toggle visible at zero opacity.
for (const scene of SCENES) {
  const end = Number((scene.start + scene.duration).toFixed(3));
  if (scene.start > 0) lines.push(`tl.set("#${scene.id}", {autoAlpha: 1}, ${scene.start});`);
  lines.push(`tl.set("#${scene.id}", {autoAlpha: 0}, ${end});`);
}

// Playback is a tween over currentTime, never video.play(): the renderer seeks
// the timeline frame by frame and a self-driving element would desynchronise.
for (const scene of SCENES) {
  if (!scene.clip) continue;
  lines.push(
    `playhead("${scene.id}-v", ${scene.clip.in}, ${scene.clip.out}, ${scene.start}, ${scene.duration});`
  );
}

const enter = (selector, vars, at) => lines.push(`tl.from("${selector}", ${vars}, ${at});`);
const move = (selector, vars, at) => lines.push(`tl.to("${selector}", ${vars}, ${at});`);

for (const scene of SCENES) {
  const t = scene.start;
  const d = scene.duration;

  if (scene.kicker) {
    enter(`#${scene.id}-k`, `{autoAlpha: 0, x: -26, duration: 0.55, ease: "power3.out"}`, t + 0.15);
  }
  if (scene.title) {
    enter(`#${scene.id}-t`, `{autoAlpha: 0, yPercent: 115, duration: 0.7, ease: "power4.out"}`, t + 0.2);
  }

  if (scene.kind === "framed") {
    enter(`#${scene.id}-f`, `{autoAlpha: 0, y: 34, duration: 0.6, ease: "power3.out"}`, t + 0.1);
    // A slow drift for the whole scene — a still frame under moving text reads
    // as a slide, not a shot.
    move(`#${scene.id}-f`, `{scale: 1.035, duration: ${(d - 0.2).toFixed(2)}, ease: "sine.inOut"}`, t + 0.2);
    enter(`#${scene.id}-c`, `{autoAlpha: 0, y: 18, duration: 0.5, ease: "power2.out"}`, t + 0.55);
    move(`#${scene.id}-c .sweep`, `{backgroundSize: "100% 9%", duration: 0.7, ease: "power2.out"}`, t + 0.85);
  }

  if (scene.kind === "punch") {
    enter(`#${scene.id}-c`, `{autoAlpha: 0, y: 20, duration: 0.5, ease: "back.out(1.6)"}`, t + 0.3);
    move(`#${scene.id}-c .sweep`, `{backgroundSize: "100% 9%", duration: 0.6, ease: "power2.out"}`, t + 0.6);
  }

  if (scene.kind === "statement") {
    enter(`#${scene.id}-s`, `{autoAlpha: 0, y: 40, duration: 0.75, ease: "power4.out"}`, t + 0.15);
    enter(`#${scene.id}-c`, `{autoAlpha: 0, y: 22, duration: 0.6, ease: "power2.out"}`, t + 0.9);
    move(`#${scene.id}-s`, `{letterSpacing: "-0.045em", duration: ${(d - 0.4).toFixed(2)}, ease: "sine.inOut"}`, t + 0.3);
  }

  if (scene.kind === "lang") {
    enter(`#${scene.id}-f`, `{autoAlpha: 0, scale: 0.965, duration: 0.4, ease: "power3.out"}`, t + 0.05);
    enter(`#${scene.id}-l`, `{autoAlpha: 0, y: 14, duration: 0.35, ease: "power2.out"}`, t + 0.15);
    if (scene.caption) {
      enter(`#${scene.id}-c`, `{autoAlpha: 0, y: 14, duration: 0.4, ease: "power2.out"}`, t + 0.4);
    }
  }

  if (scene.kind === "close") {
    enter(`#${scene.id}-t`, `{autoAlpha: 0, yPercent: 110, duration: 0.7, ease: "power4.out"}`, t + 0.3);
    enter(`#${scene.id}-c`, `{autoAlpha: 0, y: 16, duration: 0.5, ease: "power2.out"}`, t + 0.8);
    move(`#${scene.id}-t`, `{y: -8, duration: 1.4, ease: "sine.inOut", yoyo: true, repeat: 1}`, t + 1.2);
  }
}

/* ------------------------------------------------------------------- html */

const html = `<!doctype html>
<html lang="en" style="overflow:hidden; margin:0">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=${W}, height=${H}" />
    <script src="https://cdn.jsdelivr.net/npm/gsap@3.14.2/dist/gsap.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/@hyperframes/core/dist/hyperframe.runtime.iife.js"></script>
    <style>
      @font-face { font-family: "Geist"; font-weight: 900; font-style: normal; font-display: block;
        src: url(data:font/woff2;base64,${FONTS.black}) format("woff2"); }
      @font-face { font-family: "Geist"; font-weight: 500; font-style: normal; font-display: block;
        src: url(data:font/woff2;base64,${FONTS.medium}) format("woff2"); }
      @font-face { font-family: "Geist Mono"; font-weight: 600; font-style: normal; font-display: block;
        src: url(data:font/woff2;base64,${FONTS.mono}) format("woff2"); }

      :root {
        --bg: #0a0a0a;
        --ink: #ffffff;
        --muted: #909090;
        --lime: #00ff87;
        --hairline: #1f1f1f;
        --font-display: "Geist", system-ui, sans-serif;
        --font-mono: "Geist Mono", monospace;
      }

      * { margin: 0; padding: 0; box-sizing: border-box; }
      html, body { width: ${W}px; height: ${H}px; overflow: hidden; background: var(--bg); color: var(--ink); }

      .scene { position: absolute; top: 0; left: 0; width: ${W}px; height: ${H}px; overflow: hidden; background: var(--bg); }
      .scene-content { width: 100%; height: 100%; position: relative; z-index: 1;
        display: flex; flex-direction: column; align-items: center; justify-content: center; }

      .display { font-family: var(--font-display); font-weight: 900; line-height: 0.94; letter-spacing: -0.035em; }
      .kicker { font-family: var(--font-mono); font-weight: 600; font-size: 26px; letter-spacing: 0.2em;
        text-transform: uppercase; color: var(--lime); }
      .caption { font-family: var(--font-display); font-weight: 500; font-size: 40px; line-height: 1.28;
        color: var(--ink); text-align: center; max-width: 900px; }
      .caption-lime { color: var(--lime); font-size: 34px; }

      /* The lime wipe under a caption, drawn on rather than sitting there. */
      .sweep { background: linear-gradient(var(--lime), var(--lime)) no-repeat 0 96% / 0% 9%;
        padding: 0 2px 6px; box-decoration-break: clone; }

      /* The shot is 16:10 inside a 4:5 canvas. Cropping it to fill cut the
         hero headline off at both ends, so it is fitted to the width and the
         black above and below becomes where the type lives. */
      .bleed { position: absolute; inset: 0; overflow: hidden; }
      .bleed .shot { position: absolute; top: 50%; left: 50%; width: 100%; height: auto;
        object-fit: contain; transform: translate(-50%, -50%); }
      .bleed::after { content: ""; position: absolute; inset: 0;
        background: linear-gradient(180deg, rgba(10,10,10,.82) 0%, rgba(10,10,10,0) 26%, rgba(10,10,10,0) 58%, rgba(10,10,10,.92) 100%); }

      .floating { position: absolute; top: 74px; left: 72px; z-index: 3; }
      .title-bl { position: absolute; left: 72px; bottom: 96px; z-index: 3; font-size: 128px; }

      /* Framed: the shot is 16:10, so the frame is sized to it exactly and the
         type gets the space that is left rather than overlapping the product. */
      .sc-framed { justify-content: center; padding: 0 0 0 0; gap: 54px; }
      .frame { width: 1080px; height: 810px; overflow: hidden;
        position: relative; background: #000;
        border-top: 1px solid var(--hairline); border-bottom: 1px solid var(--hairline); }
      .frame .shot { width: 100%; height: 100%; object-fit: cover; display: block; }
      .sc-framed .kicker { align-self: flex-start; padding-left: 72px; }
      .sc-framed .caption { padding: 0 72px; }

      /* Punch: same shot, 1.6x, parked on the answer and its source chip. */
      .punch .shot { width: 168%; height: auto; top: 58%; left: 44%; object-fit: contain; }
      .caption-over { position: absolute; left: 0; right: 0; bottom: 96px; z-index: 3; }

      .statement { font-family: var(--font-display); font-weight: 900; font-size: 104px; line-height: 1.02;
        letter-spacing: -0.03em; text-align: center; padding: 0 64px; }
      .sc-statement { gap: 46px; }

      .sc-lang { justify-content: center; gap: 34px; padding: 0 48px; }
      .frame-lang { width: 1080px; height: 810px; }
      .lang-label { font-family: var(--font-mono); font-weight: 600; font-size: 30px;
        letter-spacing: 0.18em; text-transform: uppercase; color: var(--lime); }

      /* The shot sits high and the lower half goes to black, so the app's own
         composer does not sit behind the closing type. */
      .close-bleed .shot { top: 40%; }
      .close-bleed::after { background: linear-gradient(180deg, rgba(10,10,10,.55) 0%, rgba(10,10,10,0) 18%,
        rgba(10,10,10,0) 34%, rgba(10,10,10,.99) 52%, #0a0a0a 100%); }
      .close-stack { position: absolute; left: 0; right: 0; bottom: 150px; z-index: 3;
        display: flex; flex-direction: column; align-items: center; gap: 30px; }
      /* The wordmark ships on an opaque black plate; screen knocks the plate out. */
      .logo { width: 82px; height: 82px; object-fit: contain; mix-blend-mode: screen; }
      .close-title { font-size: 104px; }
      .close-url { color: var(--muted); font-size: 24px; letter-spacing: 0.16em; text-transform: none; }

      .grain { position: absolute; inset: 0; pointer-events: none; z-index: 50; opacity: 0.14; mix-blend-mode: overlay;
        background-image: radial-gradient(rgba(255,255,255,.08) 1px, transparent 1.2px), radial-gradient(rgba(0,0,0,.18) 1px, transparent 1.2px);
        background-size: 3px 3px, 5px 5px; background-position: 0 0, 1px 2px; }
    </style>
  </head>
  <body>
    <div id="main" data-composition-id="main" data-width="${W}" data-height="${H}" data-start="0" data-duration="${TOTAL}">
${sceneMarkup}
    </div>

    <script>
      window.__timelines = window.__timelines || {};
      var tl = gsap.timeline({ paused: true });

      // Seeks the element rather than playing it, so the footage advances with
      // the timeline the renderer is stepping through.
      //
      // Written as a property tween and deliberately not as an onUpdate
      // callback: GSAP suppresses callbacks when a timeline is seeked, and
      // seeking is the only thing the renderer ever does. Driving currentTime
      // from onUpdate looks right in a browser that plays and leaves every
      // shot frozen on its first frame in the render.
      function playhead(id, from, to, start, duration) {
        var el = document.getElementById(id);
        if (!el) return;
        el.currentTime = from;
        tl.to(el, { currentTime: to, duration: duration, ease: "none" }, start);
      }

${lines.map((line) => "      " + line).join("\n")}

      window.__timelines["main"] = tl;
    </script>
  </body>
</html>
`;

const outDir = path.join(HERE, "dist");
fs.mkdirSync(outDir, {recursive: true});
const outFile = path.join(outDir, "index.html");
fs.writeFileSync(outFile, html, "utf8");

console.log(`${SCENES.length} scenes, ${TOTAL.toFixed(2)}s, ${W}x${H}`);
for (const scene of SCENES) {
  const clip = scene.clip;
  const rate = clip ? ((clip.out - clip.in) / scene.duration).toFixed(2) + "x" : "—";
  console.log(
    `  ${scene.id.padEnd(4)} ${String(scene.start).padStart(6)}s +${String(scene.duration).padEnd(5)}` +
      ` ${scene.kind.padEnd(10)} ${(clip?.file ?? "").padEnd(20)} ${rate}`
  );
}
console.log(`\n${outFile}  ${(fs.statSync(outFile).size / 1024).toFixed(0)} KB`);
console.log(`footage base: ${FOOTAGE_BASE}`);
