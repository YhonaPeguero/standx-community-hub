---
name: character-motion
description: Author, change, or debug any movement of the Stander mascot — breathing, gaze, blinking, speech, limbs, reactions — or any new animated character. Use whenever a task touches lib/mascot/motion.ts, lib/hologram-scene.ts, the /motion-lab page, or asks to make the character feel more alive, more natural, less robotic. Enforces isolate → simulate → fix → integrate, so no movement is ever authored directly into a scene.
---

# Character motion

Movement is never authored directly into a scene. It is built and validated in
isolation first, then integrated. A character in a finished scene has a
backdrop, lighting, a console, page copy and a bloom filter competing for your
attention — you cannot tell whether a movement is right in there, and you
certainly cannot tell *why* it is wrong.

## The rule

**No new or changed movement lands in a scene until it has been isolated,
simulated, and verified on its own.**

## The workflow

### 1. Isolate

The movement must exist as a **named channel** in `lib/mascot/motion.ts`, not as
a line inside a render loop.

```ts
export type MotionChannel = "breath" | "sway" | "gaze" | … | "yourNewChannel";
```

Requirements for a channel:

- It composes onto the rest pose **additively**. Muting it must leave a valid
  character, never a broken one — the lab's solo buttons depend on this, and
  `scripts/verify-motion.mjs` asserts it for every channel.
- It is gated in **both** `stepPhysics` and `composePose`. Gating only the
  physics leaves the pose reading a stale spring; gating only the pose leaves
  the spring accumulating invisibly. (This exact bug shipped once: `arms` was
  gated in neither, so its solo button did nothing.)
- It exports one representative scalar into `pose.channels[name]` so the lab can
  plot it.

`lib/mascot/motion.ts` **has no imports and must keep it that way.** That is what
lets it be transpiled and exercised headlessly. Do not reach for three.js, the
DOM, or `window` in it — if a movement needs input from outside, it comes in
through `MotionInput`.

### 2. Simulate

Two harnesses. Use both; they catch different things.

**Headless — the one that fails builds:**

```bash
npm run motion:check
```

Add assertions for the new channel describing the shape the curve is supposed to
have. Write the assertion *before* tuning the constants — it forces you to say
what "right" means. Examples already in there:

| Movement | What is asserted |
| --- | --- |
| breath | exhale ≥ 1.3× inhale (a symmetric breath reads as a pulsing balloon) |
| blink | open ≥ 1.4× close; whole blink under 350ms; lid never scales to 0 |
| gaze | still for >80% of frames; ≥6 distinct saccades in 30s |
| speech | 1.5–8 openings/s; genuine closures between syllables |
| springs | overshoots past rest, then settles instead of hunting |
| all | identical output at 30fps and 144fps |

**Visual — the one that tells you if it is *good*:**

```bash
npm run dev
```

Then open `/motion-lab`. Solo the channel, watch the figure and the scope
together. The scope is not decoration: it is how you tell a movement that is
subtly wrong from one that is right. Use `Speed` to slow it down — **the curve
shape must not change with speed.** If it does, something is frame-coupled.

### 3. Fix

Common failures, in the order they actually occur:

- **It looks robotic.** Almost always a bare `sin(t * k)`. Constant period,
  constant amplitude, perfect symmetry — the signature of computer animation.
  Sum three non-harmonic sines (`organicNoise`) so nothing visibly loops.
- **It looks like it is on rails.** Nothing lags. Limbs should be springs
  chasing the body, not functions of time; the lag *is* the life.
- **It runs at the wrong speed on some machines.** `lerp(current, target, k)`
  per frame is frame-rate dependent. Use `damp()` (`exp(-lambda * dt)`) or a
  spring on the fixed substep.
- **The damper cannot keep up with the envelope you gave it.** Symptom: the
  scope shows a smooth blob where you expected distinct pulses. Either raise
  lambda or put a real gap in the signal. (This is exactly how the speech
  channel was found rendering ~1 syllable/s instead of ~4.)
- **Two things move in lockstep.** Give them different stiffness and a phase
  offset. Perfect mirroring reads as a machine.
- **A state change cross-fades.** Characters react. Inject a velocity impulse
  into the springs and let them resolve — never jump a position.

### 4. Integrate

There is nothing to do. `lib/hologram-scene.ts` copies the pose onto meshes and
makes no decisions of its own, so a validated channel is already live in both
the dock and the chamber. **If integration requires writing movement code in the
scene, the channel was not finished in step 1 — go back.**

Then confirm nothing else moved:

```bash
npm run motion:check && npm run typecheck && npm run lint
```

## Files

| Path | Role |
| --- | --- |
| `lib/mascot/motion.ts` | The engine. All movement lives here. No imports. |
| `lib/mascot-art.ts` | The drawing — SVG parts in body-diameter units. |
| `lib/hologram-scene.ts` | Rendering only. Copies a pose onto meshes. |
| `scripts/verify-motion.mjs` | Headless assertions. `npm run motion:check`. |
| `app/motion-lab/page.tsx` | The isolation rig. Dev-only. |
| `components/motion-lab/MotionLab.tsx` | Lab UI — solo, transport, scopes. |

## Applying this to a new character

The pattern is not mascot-specific. For any new animated character:

1. Split the artwork into independently riggable parts with a documented
   coordinate contract.
2. Write a pure pose engine with named channels — no renderer imports.
3. Point the lab at it (`createHologramScene` takes `forceAnimate` and
   `motionSeed`; a new character needs an equivalent scene factory exposing the
   same `motion` debug handle).
4. Write the assertions before tuning the numbers.
5. Only then wire it into a scene.

## Notes

- The lab passes `forceAnimate: true`, deliberately overriding
  `prefers-reduced-motion`. Inspecting movement is the page's entire purpose and
  it ships with a pause control. **Never set that flag anywhere else.**
- The lab is off in production unless `NEXT_PUBLIC_MOTION_LAB=1`, so a Vercel
  preview can enable it for review without exposing it on the live hub.
- The engine takes a `seed`. Use a fixed one when reproducing a bug.
- Do not verify WebGL rendering with `gl.readPixels` — `preserveDrawingBuffer`
  is `false`, so a later read always returns zeroes. Use a screenshot, or read
  the pose numerically via the lab's scopes.
