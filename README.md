# StandX Community Hub (Next.js Upgrade)

A premium, mobile-first, multilingual Community Hub for **StandX Perpetuals DEX**.

This version is rebuilt with Next.js App Router, TypeScript, Tailwind CSS, Framer Motion, Three.js hero visuals, and next-intl locale routing across English, Spanish, Portuguese (Brazil), Ukrainian, and Korean.

## Attribution

This project is a major upgrade fork of the original StandX Community Hub
initiative started by [@TARZANWEB3](https://github.com/TARZANWEB3).
The original community initiative, concept, and multilingual structure
are recognized and respected.
This version represents a full architectural and visual redesign built on top of that foundation.

## Stack

- Next.js 14+ (App Router)
- TypeScript (strict mode)
- Tailwind CSS
- Framer Motion
- Three.js
- next-intl
- Lucide React
- Geist Sans + Geist Mono

## Routes

- `/{locale}` -> Homepage
- `/{locale}/how-it-works` -> Step-by-step onboarding guide

Supported locales:

- `en`
- `es`
- `pt-br`
- `uk`
- `ko`

## Locale persistence

- Local storage key: `standx-hub-locale`
- Cookie key: `standx-hub-locale`
- Middleware uses locale cookie + detection to avoid language flash on first render

## Development

```bash
npm install
npm run dev
```

Open:

- `http://localhost:3000/en`
- `http://localhost:3000/es`

## Build

```bash
npm run typecheck
npm run build
npm run start
```

## Notes

- Hero canvas is decorative and includes graceful fallback when WebGL is unavailable.
- All user-facing copy is sourced from locale messages files.
- All locale files keep identical key structure (`en`, `es`, `pt-br`, `uk`, `ko`).
