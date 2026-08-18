# AGENTS.md

Operational notes for this repo. Read before editing.

## Stack snapshot

- Next.js 14 App Router, TypeScript strict, Tailwind, Framer Motion, Three.js, `next-intl`.
- Path alias `@/*` -> repo root (see `tsconfig.json`).
- Node/Next handles i18n; there is no separate server.

## Commands

```
npm install
npm run dev         # next dev (no --turbo configured)
npm run build
npm run start
npm run lint        # next lint (eslint-config-next)
npm run typecheck   # tsc --noEmit (strict)
npm run motion:check # headless assertions on the mascot's movement curves
npm run framing:check # re-solves the mascot's camera framing from the geometry
npm run agent:check  # offline: the knowledge base is internally consistent
npm run guards:check # the visitor budget's tiers, and that a forged cookie fails
npm run docs:check   # ONLINE: the knowledge base still agrees with StandX
```

No test runner is configured. Do not invent one. Verify changes with `typecheck` + `lint` + manual dev run.

`docs:check` is the only script that touches the network, so it is deliberately
outside the offline gate — run it before a release or on a schedule, not in a
tight loop. It exists because `agent:check` can only prove the knowledge base is
*consistent*, never that it is still *true*: the `verifiedAt` stamps were written
by hand and nothing read them, so the hub could drift for months while every
check stayed green. `docs:check` closes the three ways that happens — a page we
link to gets renamed (dead link), StandX documents something new (a gap nobody
hears about), or a number we quote changes (stale stamp). The third can't be
automated without a human reading the page, so `volatility` acts as an expiry
date: `changeable` facts must be re-read within 30 days, `stable` within 90. When
it fails on staleness it names the topic and the exact source pages to re-read.

`motion:check` is not a test runner — it is a standalone script that transpiles
`lib/mascot/motion.ts` (which has no imports, deliberately) and asserts the
shape of each movement curve. It is the gate for any character-motion change;
see `.claude/skills/character-motion/SKILL.md`.

## Routing + i18n (non-obvious)

- Locales: `en`, `es`, `pt-br`, `uk`, `ko`, `ja` (see `i18n/request.ts`). `localePrefix: "always"` in `middleware.ts` — every route is `/{locale}/...`.
- Locale cookie/localStorage key: `standx-hub-locale`. `app/layout.tsx` reads the cookie to set `<html lang>` before hydration; do not remove that read without a replacement or the language will flash.
- Message files: `messages/{locale}.json`. All six files MUST keep identical key structure (`node scripts/check-i18n.mjs` proves it); `next-intl` falls back to `en` on import failure, not on missing keys.
- Hub sections live at `app/[locale]/[section]/page.tsx`. Valid slugs are the `hubSections` tuple in `lib/hub-navigation.ts`; `isHubSectionSlug` guards them and `generateStaticParams` builds the full locale x section matrix. Adding a section requires updating `hubSections`, `sectionLabels` in that file, AND the large `sectionHeaders` / per-section data blocks in `[section]/page.tsx`.
- Per-section copy inside `[section]/page.tsx` is NOT in `messages/*.json`. It uses the local `lv(en, es, ptBr, uk, ko, ja)` helper to build `LocalizedValue` objects. When editing section text, update all six language arguments in place — do not route it through `next-intl`.

## Styling system (source of truth)

- Design tokens in `tailwind.config.ts`: custom `bg-*` (`base`/`elevated`/`surface`/`muted`), `border-*`, `text-*`, `accent-cyan`/`accent-gain`, `signal-*`, plus `shadow-glow`/`shadow-panel` and keyframes `locale-fade`, `ticker-shift`, `grid-drift`. Prefer these tokens over raw hex.
- Shared component classes in `app/globals.css`: `.section-shell` (page width/padding), `.glass-panel`, `.focus-ring`, `.ticker-track`, `.hero-grid-fallback`, `.hero-diagonal-lines`, `.locale-fade`. Reuse before inventing new utilities.
- **Motion tokens are the source of truth for timing.** `:root` in `globals.css` defines
  `--ease-out` / `--ease-out-soft` / `--ease-in-out` / `--ease-in` and `--dur-instant` … `--dur-scene`;
  `lib/motion.ts` mirrors them as `ease` / `duration`; `tailwind.config.ts` points
  `transitionTimingFunction.DEFAULT` and `transitionDuration.DEFAULT` at the same vars, so a bare
  `transition` utility, a hand-written CSS transition and a framer variant all resolve to the same
  curve. Never hard-code a `cubic-bezier` or a bare `Xms ease` in new code. Entrances take
  `--ease-out`, exits take `--ease-in` at roughly half the duration; nothing overshoots.
- `@media (prefers-reduced-motion: reduce)` block in `globals.css` — any new animation must have a reduced-motion path.
- **Never branch a server-rendered component's output on `useReducedMotion()`.** The hook reads
  `matchMedia`, so it is `false` during SSR and `true` on a reduced-motion client. Returning
  `null` (or a different `variants` object) on one pass and not the other is a hydration
  mismatch: an early return shifts every following sibling — that is what produced
  "Expected server HTML to contain a matching `<header>`" at the Navbar — and a swapped
  variant emits a different inline `style` and warns. Both bugs shipped and were only visible
  to users who actually have reduced motion enabled.
  Emit **one** variant on both passes and put the reduced-motion path in CSS:
  `.scroll-progress` (`display: none`) and `.section-reveal` (`transform: none`) in
  `globals.css` are the two worked examples.
  Using the hook for props that don't change the rendered tree (`trackPointer`, a `behavior`
  argument) is fine, as is using it inside a subtree that never server-renders — the agent
  overlay only mounts after a click, which is why picking `agentMotionReduced` there is safe.
  For anything that DOES server-render, prefer a CSS animation over a framer `initial`: the dock
  entrance (`agent-dock-in`) and the route entrance (`.route-fade`) both do this, which also means
  they degrade to visible content if hydration never happens, where a framer `initial` would leave
  `opacity: 0` inline forever.
- **Route changes animate via `components/RouteTransition.tsx`.** `app/[locale]/layout.tsx` is not
  re-rendered when the visitor moves between sibling routes, so the wrapper reads `usePathname()`
  on the client and uses it as a `key` — that remount is what replays `.route-fade`. The animation
  ends on `transform: none` deliberately: a lingering transform on a page-level wrapper becomes the
  containing block for every `position: fixed` descendant.
- Tailwind `content` globs cover only `app/`, `components/`, `lib/`. New top-level dirs with JSX won't be scanned until added here.

## Hologram assistant ("Stander")

A floating mascot in the bottom-right that answers StandX questions and navigates the visitor
around the hub. Mounted once in `app/[locale]/layout.tsx` (NOT per page) so the conversation
survives client-side navigation.

- **Server**: `app/api/hub-agent/route.ts` — `runtime = "nodejs"`, streams Server-Sent Events,
  with a manual tool loop capped at `MAX_TOOL_ROUNDS`.
- **Providers are a chain, and every one is OpenAI-compatible** (`lib/agent/providers.ts`):
  Groq, then OpenRouter, then the offline knowledge. Adding a fourth is configuration, not
  code. The chain exists because these are free tiers — rather than counting requests
  ourselves, **the provider's own 429 is the budget signal**. Two rules earned their state
  the hard way: a provider that fails over is **retired for the rest of the request** (a rate
  limit does not clear in the second a tool call takes), and failover is refused once text
  has reached the visitor — tracked **per turn, not per request**, or the second tool round
  can never fail over.
- **`read_doc` is what makes it a docs assistant rather than a FAQ** (`lib/agent/doc-reader.ts`).
  The curated knowledge covers the common questions; this fetches the actual page for
  everything else — an exact rate, a formula, a contract spec. **The model names a page by
  title and never supplies a URL**: the title is resolved against the hardcoded `docPages`
  list, so no model output ever reaches `fetch` and there is no SSRF surface even in
  principle. Pages are capped at `MAX_CHARS`, reads at `MAX_DOC_READS` per answer, and cached
  for 30 minutes per instance. Extraction pulls the docs site's single `<article>`, which
  `docs:check` exercises against a live page — a redesign there would otherwise empty every
  answer without failing anything else.
- **No API key is required to ship.** With no key configured (and on any provider error) the
  route falls back to `lib/agent/local-fallback.ts`, a deterministic keyword engine that still
  routes to the right section and links the right doc. Same SSE contract either way, so the
  client cannot tell them apart. Env vars are documented in `.env.example`.
- **The visitor budget cannot identify a visitor, and does not try** (`lib/agent/visitor-quota.ts`).
  IP fails on CGNAT — one carrier address covers thousands of people, so an IP limit punishes
  the innocent. Cookies die in incognito, fingerprinting is privacy-hostile and defeated by
  the browsers that care, and the hub advertises "No login" on its front page. So the counter
  lives in an HMAC-signed cookie: 20 questions answered normally, 15 more paced, then curated
  answers. A server-side store would buy nothing — it would be keyed on the same cookie.
  Curated answers are never charged, because they cost nothing to serve.
- **`isSameOrigin` refuses cross-origin POSTs.** A browser always sends `Origin` on a
  cross-document POST, so requiring it to match closes the obvious abuse: a stranger pointing
  `curl` at the route and using the deployment as a free model proxy. Missing `Origin` is
  allowed outside production so local scripts still work.
- **Two rate-limit budgets, charged against the path that will actually serve the
  request** — `MODEL_MAX_REQUESTS` (24/min, real money) and `LOCAL_MAX_REQUESTS`
  (90/min, string matching). One shared 12/min bucket shipped and cut visitors off
  mid-conversation; worse, a deployment with **no API key** — the documented
  default — was throttled at model-call prices for doing nothing but keyword
  lookups. With no proxy headers (local dev) every client collapses into the
  `"anonymous"` bucket, which is why that key must never get the tight budget.
- **A failed turn must render.** The route replies `{error, code, retryAfter}`;
  the client localises off `code` and never shows the server's English `error`
  string. `ChatEntry.failed` drives an assistant-voiced apology plus a Retry
  button gated on a `retry-after` countdown. Marking the entry `complete` with
  empty content — which is what it used to do — renders as literally nothing, so
  the visitor saw their own question followed by silence.
- **Knowledge lives in two files and nowhere else**: `lib/agent/hub-map.ts` (this site) and
  `lib/agent/standx-knowledge.ts` (docs.standx.com digest + the doc URL map). `hubSectionMap` is
  typed `Record<HubSectionSlug, ...>`, so **adding a hub section breaks the build here until the
  assistant is taught about it** — that is deliberate, do not widen the type.
- **Never hand-write a docs.standx.com URL.** The docs site restructured (`/docs/about-standx`,
  not `about-stand-x`) and guessed paths 404. Add the page to `docPages` and reference it via
  `findDoc(title)`, which throws on a miss — earlier code indexed `docPages` by position and
  silently ran off the end. `allowedLinkUrls` in `lib/agent/tools.ts` is the runtime allowlist;
  a URL outside it is rejected rather than rendered.
- **Fallback keyword matching is plain substring matching** over `normalize()`d text, scored as
  `MATCH_BASE + min(8, length)`. The flat base exists because pure length scoring under-ranks
  CJK, where a whole word is 2–4 characters. Index distinctive stems, not whole phrases
  (`"працює"`, not `"як працює"` — the latter misses "як **це** працює").
- **Client**: `components/agent/StandxAgent.tsx` (widget), `useAgentChat.ts` (SSE + streaming),
  `useSpeech.ts` (optional Web Speech in/out, both feature-detected), `HologramStage.tsx` (canvas).
- **It is a full-viewport takeover, not a corner panel.** Clicking the dock opens
  `.agent-overlay` — scrim, backdrop mesh, vignette, a top rail holding only the close button, the
  projection, then the console deck. The mascot is the subject; sizing it down to a chat bubble was
  the original mistake.
- **Nothing in it is allowed to look like a box.** The console is one continuous deck running off
  the bottom of the screen (`.agent-console`, gradient background, a top hairline that fades out at
  both ends so it has no corners), not a stack of cards; the transcript has no border of its own;
  the composer is a single `.agent-field` with the voice buttons inside it rather than a bordered
  row wrapping a bordered input. `.agent-overlay__stage` is `pointer-events: none` so clicking the
  projection falls through to the scrim and closes the chamber.
- **The chamber entrance is choreographed by explicit delays, not `staggerChildren`** — see
  `agentMotion` in `lib/motion.ts`. Visual order (scrim → mesh → projection → deck → rail) is not
  DOM order, and the deck deliberately does *not* use `when: "beforeChildren"`, which would push
  the composer past 850ms. Input focus is delayed to 520ms to land with it.
- **`agentMotion.overlay` must animate a real value.** `AnimatePresence` keeps the tree mounted
  until its direct child reports an exit complete, and a variant resolving to `{}` never does — the
  children all fade to `opacity: 0` and the overlay stays in the DOM forever, blocking the whole
  page. It owns the exit fade and enters in 10ms so the layered choreography still reads.
- **Navigating closes the overlay** (`NAVIGATE_CLOSE_DELAY_MS`). Since it covers the viewport,
  staying open would hide the very page the visitor was sent to. The transcript is preserved in
  state, so reopening shows the history.
- **Only one WebGL context may be live.** The dock renders on `!open && !overlayMounted`, where
  `overlayMounted` is cleared by `AnimatePresence`'s `onExitComplete` — gating on `open` alone
  mounts the dock's canvas while the overlay's is still animating out.

### Character motion

**Read `.claude/skills/character-motion/SKILL.md` before touching any movement.**
The short version:

- **All movement lives in `lib/mascot/motion.ts`** as named, independently
  switchable channels (`breath`, `sway`, `gaze`, `blink`, `speech`, `arms`,
  `leaf`, `reaction`). `lib/hologram-scene.ts` copies the resulting pose onto
  meshes and makes no decisions. Movement authored in the render loop is the
  thing this split exists to prevent.
- **`lib/mascot/motion.ts` has zero imports and must keep it that way** — that is
  what lets `scripts/verify-motion.mjs` transpile and exercise it with no
  bundler and no browser.
- **The character reacts to being used, not just to a mood.** `MotionInput` carries an
  `attention` target (stage-local, converted from a real DOM rect by the widget) and an
  `interest` arousal level, plus four one-shot beats — `greet`, `perk`, `acknowledge`, `nod`.
  `StandxAgent` owns a small `avatar` surface that routes dock hover/press, composer focus and
  typing, suggestion hover, send, answer and navigation into them. Attention **blends** against
  ambient wandering rather than replacing it; a locked eye stares. See
  `.claude/skills/character-motion/INTERACTION.md`.
- **`interest` decays on its own.** Callers signal that something IS happening (`avatar.engage()`
  refreshes a single timer); nothing has to remember to say it stopped. Per-handler teardown is
  how you end up with a character permanently stuck on alert.
- **The motion preference is a runtime setter, never a remount key.** `HologramStage` creates the
  scene once; `setMotionPreference` flips the render loop in place. Keying the creation effect on
  it tore down the WebGL context, reloaded every texture and zeroed every spring — the visitor saw
  a hard cut in the middle of their own toggle.
- **`npm run motion:check` is the gate.** 63 assertions on curve shape: exhale
  longer than inhale, blink opens slower than it closes, gaze still for >80% of
  frames, speech at a real syllable rate, springs that settle rather than hunt,
  and identical output at 30fps and 144fps. Run it after any motion change.
- **`/motion-lab` is the visual rig** — solo one channel, watch its scope, scrub
  speed. Dev-only (`NEXT_PUBLIC_MOTION_LAB=1` to enable on a preview), lives
  outside `app/[locale]`, and `middleware.ts` excludes the path from the
  next-intl redirect.
- A channel must be gated in **both** `stepPhysics` and `composePose`. Gating
  one leaves either a stale spring in the pose or a spring accumulating
  invisibly; `arms` shipped gated in neither and its solo button did nothing.
- **Never use `lerp(current, target, k)` per frame.** It is frame-rate
  dependent — the old rig literally animated twice as fast on a 120Hz display.
  Use `damp()` or a spring on the fixed substep.
- `forceAnimate` on `createHologramScene` overrides `prefers-reduced-motion` and
  exists **only** for the lab.

### Hologram rendering

- `lib/mascot-art.ts` draws the mascot as **separate SVG parts**, not one image, because the rig
  animates them independently (iris tracks the pointer, eye squashes to blink, mouth cross-fades
  while speaking, leaf sways). Part geometry is in body-diameter units — the body circle is 1.0
  wide, centred on (0, 0) — and the scene applies the only scale factor.
- **Every part the rig rotates declares a `pivotX`/`pivotY`.** The scene bakes it in with
  `geometry.translate()`. A limb rotating about the centre of its own plane visibly detaches from
  the shoulder as it swings — that is what made the old arms read as flapping fins. Arms pivot at
  the shoulder edge, legs at the hip, the leaf sprig at the stalk base.
- **The legs live in their own group and never take the breath bob.** `pose.stand` drives them;
  `pose.root` drives the torso. Applying one transform to the whole rig lifts the feet with the
  chest, which is exactly what "it is floating" looks like. Legs overlap the ball by 0.11 units so
  the torso can bob and scale without opening a gap at the hip.
- **The layout is solved, not eyeballed** — see the vertical table in `mascot-art.ts`. Foot base
  sits at -0.63, which is `FLOOR_Y`, so the character stands on the emitter ring instead of
  hovering a third of a body above it. The `Framing` values in the scene are derived from the real
  ink bounds; change a part's size and they need re-solving.
- **There is one framing, and it is solved at module load — never typed in.** `solveFraming()`
  unions the flat artwork envelope (`ARTWORK`) with the floor ring's extent and adds
  `CONTENT_MARGIN` on every side. Run `npm run framing:check` after touching any of it: it
  re-derives the frame from the sources and then projects the real torus through a real
  `PerspectiveCamera` at every size the widget ships at.
  There used to be a second, cropping frame for small canvases. It cut the leaf, and it is gone.
- **The floor ring is the only thing in the scene with depth, and it must be sampled, not
  reasoned about.** The hoop is tilted almost onto its edge, so parts of it sit 0.58 of a body
  diameter nearer the camera and perspective magnifies them ~22%. Framing it flat put the ellipse
  on the last row of pixels — twice. Worse, hand-picking a "worst point" also failed, because on a
  tilted ring each extreme trades position against depth: the lowest point on screen is the tube's
  **underside** on the near arc, and the widest point is not where the ellipse is widest but a
  little around from it, where leaning toward the camera buys more than the smaller radius costs.
  Flat maths puts the ring's bottom at -0.7014; it actually projects to -0.7270. That 0.0256 gap
  is larger than the entire margin, which is why adding margin never fixed it.
- Which dimension constrains the drawing depends on the aspect, so **pixels per body diameter** is
  the size to reason about, not container width or height: a 720x143 landscape strip is "large" by
  width and tiny in practice. Docks land at 65-81 px/unit, the open chamber at 160-360. The dock's
  CSS size is kept in proportion to the solved frame so the margin costs no drawn size — 108x143
  still draws the mascot at 80.7 px/unit.
- **Colours in `mascot-art.ts` ship as drawn**, so they are the reference's real values, not
  values picked to survive a tint. Keep the shell charcoal (~#2e2e2e) and the outlines near-black:
  the outlines are the only thing separating an arm from the body at 104px.
- `lib/hologram-scene.ts` is raw three.js in the same imperative style as `lib/three-scene.ts`
  (no react renderer). Every part plane shares one holographic `ShaderMaterial`; time/intensity
  uniforms are **shared objects by reference**, so one write per frame drives the whole projection.
- **The shader lights the artwork, it does not recolour it.** The mascot keeps its own colours:
  charcoal shell, black outlines, cream eye and smile, green leaf and iris. The scene adds a lime
  bounce in the shadows, a lime rim on the silhouette, and the CSS bloom on the canvas — that is
  what seats a near-black character on a near-black page. An earlier version mapped luminance onto
  a lime ramp, which repainted everything one hue: the black outlines stopped being black, so at
  dock size the arms fused into the body and the character read as a green paunch.
- **The figure is opaque, and the CRT costume is mostly gone.** The scanlines, chromatic split,
  tear glitch and vertex jitter were doing the work of a character design, and underneath them the
  drawing was never legible — peak alpha stayed under 1.0, so it read as a ghost of itself rather
  than as somebody. What is left is a single `SIGNAL` constant (0.22) scaling a whisper of
  scanline, plus a slow sheen and a rim light. Raise `SIGNAL` to get the old look back; do not
  reintroduce the artefacts individually.
- **No light-shaft cone, and no scan ring through the body.** A `ConeGeometry` has a hard
  silhouette, so under additive blending its slanted edges stay visible as lines at any opacity —
  it reads as a wireframe triangle. A hoop sweeping through the character is a special effect, not
  characterisation. The floor rings plus the CSS bloom on `.agent-overlay__stage` carry the
  staging instead.
- `FRAME` is solved against the real content extent — leaf tip +0.997 at full lift, floor ellipse
  projecting to -0.7270 — so the figure fills the frame instead of floating in padding, and no
  edge ever sits on ink.
- `HologramStage` imports the scene with a dynamic `import()`. three.js is ~300KB and this widget
  is decorative — keep it out of first load. Until the chunk lands (or if WebGL is unavailable)
  the `.hologram-stage--fallback` CSS silhouette holds the space.
- **Reduced motion paints on demand, not once.** There is no rAF loop on that path, so every
  input that changes the image must call `scheduleStaticRedraw()` — texture load, `resize()`,
  `setMood`, `setActive`. A fixed burst of frames at startup is not enough: `setSize()`
  reallocates the drawing buffer, so the canvas goes **permanently blank** after any later
  resize or orientation change. The repaint is synchronous on purpose; deferring it to rAF
  leaves a visible blank frame between `setSize` and the paint.
- **Do not verify rendering with `gl.readPixels`.** `preserveDrawingBuffer` is `false`, so the
  buffer is cleared after compositing and a later read always returns zeroes whether or not the
  scene drew. Use a screenshot.
- The dock (`.agent-dock`) is **frameless, but the canvas still needs something behind it.** The
  stage is transparent, so a bare canvas renders the mascot straight over page copy and the text
  shows through it. An opaque housing solved that and looked like a bolted-on widget; the fix is
  `.agent-dock__aura` — two radial gradients plus a `backdrop-filter` that is **masked to the same
  falloff**. Skipping the mask puts the box straight back, because an unmasked blur clips to the
  element's rectangle. Dock size stays fixed and has no visible caption; its localized invitation
  remains in the accessible label and first-visit hint, so copy cannot grow the footprint over card
  text.

## Hero canvas

- `components/HeroCanvas.tsx` mounts `createThreeScene` from `lib/three-scene.ts` (client-only). On WebGL failure it toggles a CSS grid fallback (`.hero-grid-fallback`). Keep both paths working and keep it `pointer-events-none` / `aria-hidden` — it is decorative.

## Config gotchas

- Both `next.config.mjs` and `next.config.ts` exist with equivalent contents. Next 14 picks one (currently `.mjs`); when changing build config, update BOTH or delete the unused one to avoid silent drift.
- `middleware.ts` matcher excludes paths with a dot, so static files pass through.
- `next.config` only allows remote images from `pbs.twimg.com`. Add hostnames there before using `next/image` with new sources.

## Legacy files at repo root

- `index.html`, `es.html`, `pt-br.html`, `uk.html`, `ko.html` are the original v1 static site (credit: @TARZANWEB3). They are NOT served by the Next app and are not linked from it. Do not edit them when working on the Next.js hub unless explicitly asked to touch the legacy site.

## Conventions worth preserving

- Strict TS is on; avoid `any`. External links use `target="_blank" rel="noreferrer"` and an `aria-label` from the `common` namespace — match this pattern for new anchors.
- Icons come from `lucide-react`; fonts via `geist/font/{sans,mono}` wired to `--font-geist-sans` / `--font-geist-mono` in Tailwind.
- Credit to @TARZANWEB3 in `README.md` and `about` section is intentional — preserve it when rewriting copy.
