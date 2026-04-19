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
```

No test runner is configured. Do not invent one. Verify changes with `typecheck` + `lint` + manual dev run.

## Routing + i18n (non-obvious)

- Locales: `en`, `es`, `pt-br`, `uk`, `ko` (see `i18n/request.ts`). `localePrefix: "always"` in `middleware.ts` — every route is `/{locale}/...`.
- Locale cookie/localStorage key: `standx-hub-locale`. `app/layout.tsx` reads the cookie to set `<html lang>` before hydration; do not remove that read without a replacement or the language will flash.
- Message files: `messages/{locale}.json`. All five files MUST keep identical key structure; `next-intl` falls back to `en` on import failure, not on missing keys.
- Hub sections live at `app/[locale]/[section]/page.tsx`. Valid slugs are the `hubSections` tuple in `lib/hub-navigation.ts`; `isHubSectionSlug` guards them and `generateStaticParams` builds the full locale x section matrix. Adding a section requires updating `hubSections`, `sectionLabels` in that file, AND the large `sectionHeaders` / per-section data blocks in `[section]/page.tsx`.
- Per-section copy inside `[section]/page.tsx` is NOT in `messages/*.json`. It uses the local `lv(en, es, ptBr, uk, ko)` helper to build `LocalizedValue` objects. When editing section text, update all five language arguments in place — do not route it through `next-intl`.

## Styling system (source of truth)

- Design tokens in `tailwind.config.ts`: custom `bg-*` (`base`/`elevated`/`surface`/`muted`), `border-*`, `text-*`, `accent-cyan`/`accent-gain`, `signal-*`, plus `shadow-glow`/`shadow-panel` and keyframes `locale-fade`, `ticker-shift`, `grid-drift`. Prefer these tokens over raw hex.
- Shared component classes in `app/globals.css`: `.section-shell` (page width/padding), `.glass-panel`, `.focus-ring`, `.ticker-track`, `.hero-grid-fallback`, `.hero-diagonal-lines`, `.locale-fade`. Reuse before inventing new utilities.
- `@media (prefers-reduced-motion: reduce)` block in `globals.css` AND `sectionRevealReducedVariants` / `useReducedMotion()` in `lib/motion.ts` + `components/SectionReveal.tsx` — any new animation must have a reduced-motion path.
- Tailwind `content` globs cover only `app/`, `components/`, `lib/`. New top-level dirs with JSX won't be scanned until added here.

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
