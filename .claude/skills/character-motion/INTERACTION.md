# Brief — Stander reacts to being used

Scope note: this is the written spec for the "make the avatar interactive" work.
It follows the isolate → simulate → fix → integrate workflow in `SKILL.md`; it
does not replace it.

## The problem, stated precisely

Stander is **animated but not interactive**. The engine performs a state; it does
not react to a person.

Everything the character currently knows about the visitor is four values:

| Input | Source | What it drives |
| --- | --- | --- |
| `mood` | chat status + speech synthesis | breath rate, blink rate, intensity, arm lift, jaw, gesture beats |
| `active` | chamber open | engagement lift + scale |
| `pointerX/Y` | `pointermove` on `window`, normalised against a screen-sized radius | a bias on the next ambient saccade |
| mood change | — | one spring impulse |

Every other thing a visitor actually does produces **no response at all**:

- moving onto the dock, the single most common interaction with the feature
- pressing the dock
- focusing the composer
- typing a question
- hovering a suggestion chip
- sending
- an answer landing, or a link being surfaced
- being navigated to another page

The pointer bias is also too coarse to count as interaction. It is normalised
against `max(innerWidth, innerHeight) * 0.45`, so inside the chamber the eye
drifts vaguely toward the cursor's half of the screen. It never *looks at*
anything: not the field being typed in, not the chip under the cursor, not the
answer it just produced.

## What "fluid and interactive" has to mean here

A character reads as interactive when it demonstrably **notices**, **tracks**,
and **acknowledges**. Three mechanisms, in that order of value:

1. **Attention** — the character looks at the thing the visitor is using. Not at
   the pointer; at the element. This is the single largest win available and
   nothing else comes close.
2. **Interest** — a continuous alertness level that rises while the visitor is
   engaged and decays when they are not. It shortens fixations, widens the eye a
   little, and adds a slight lean. It is what separates "awake" from "idling".
3. **Beats** — short, one-shot acknowledgements at the moments that matter:
   noticed you, got it, here you go.

## Design

### Attention (new channel `attention`)

`MotionInput` gains an optional target in **stage-local** normalised space,
where `(0, 0)` is the mascot's own centre:

```ts
attention?: {x: number; y: number; weight: number} | null;
```

`weight` blends against ambient wandering rather than replacing it: at `1` the
eye locks on and fixations lengthen; at `0` the character goes back to looking
around the room. The widget computes the target from a real DOM rect, which is
what makes the mascot look *at the field* rather than *toward the cursor*.

The target also feeds a small `rotY` turn — the body orients slightly toward
whatever has its attention. Eyes alone read as a doll following you; eyes plus a
fractional turn read as a person.

### Interest

A 0..1 scalar, damped, driven by the widget from real engagement (hovering the
dock, focus in the composer, typing, an answer in flight). Effects, all small:

- fixations shorten (an alert character re-targets more often)
- `eyeOpen` gains a few percent
- a slight lean toward the attention target
- breath period tightens marginally

Deliberately **not** a mood. Moods are semantic states the chat owns; interest is
a physical arousal level that rides on top of any of them.

### Beats (new triggers)

| Trigger | Fired when | Reads as |
| --- | --- | --- |
| `greet` | pointer enters the dock, or the dock takes focus | looks up, blinks, small lift |
| `perk` | dock pressed, before the chamber opens | anticipation — a compress then release |
| `acknowledge` | a message is sent | a single downward beat: "got it" |
| `nod` | an answer completes | two small nods, settling |

Beats are velocity impulses into springs, never position jumps — same rule as
the existing `react`.

## Constraints that do not move

- `lib/mascot/motion.ts` keeps **zero imports**. The attention target arrives as
  plain numbers; the DOM→stage conversion happens in the widget.
- Every new channel is gated in **both** `stepPhysics` and `composePose`, and
  muting it must leave a valid pose.
- Frame-rate independence: springs on the fixed substep, smoothing via
  `damp()`. No per-frame `lerp`.
- `stemRot` stays inside `LEAF_MAX_ROT` — the camera framing is solved from it.
- Everything new is switchable and scoped in `/motion-lab`, and asserted in
  `npm run motion:check`.
- Reduced motion: attention and beats are suppressed with the rest of the
  animation. The character still renders its settled pose.

## Defect found during analysis

`HologramStage` keys its scene-creation effect on `motionPreference`, so
toggling the motion control **disposes the WebGL scene and rebuilds it** —
context teardown, texture reload, and every spring reset to zero. The visitor
sees a hard cut. The preference must be a runtime setter on the existing scene,
not a remount key.

## Out of scope

- Changing the character's artwork or proportions.
- The agent's answer content or the system prompt.
- Voice, which stays behind `NEXT_PUBLIC_STANDER_VOICE`.
