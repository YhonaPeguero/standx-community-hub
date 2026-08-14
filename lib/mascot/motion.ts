/**
 * Mascot motion engine.
 *
 * Pure logic: no three.js, no DOM. It takes a mood plus a pointer position and
 * returns a full pose every frame. The scene (`lib/hologram-scene.ts`) does
 * nothing but copy that pose onto meshes, and the motion lab (`/motion-lab`)
 * drives this exact engine — so a movement validated in the lab is the movement
 * that ships. There is no second implementation to drift.
 *
 * Why it looks alive, in one list. Each of these is a thing the old inline
 * `render()` did not do, and each is independently verifiable in the lab:
 *
 * 1. **Nothing is a bare sine.** A single `sin(t * k)` is the tell of computer
 *    animation — constant period, constant amplitude, perfectly symmetric. Every
 *    idle channel here sums three non-harmonic sines, so the pattern never
 *    visibly repeats.
 * 2. **Breathing is asymmetric.** Inhale takes 38% of the cycle, exhale 62%.
 *    A symmetric breath reads as a pulsing balloon.
 * 3. **The eye saccades, it does not track.** Real gaze is ballistic jumps
 *    between fixations, with micro-tremor in between. Smoothly lerping an iris
 *    toward the cursor is the single most robotic thing a character can do.
 * 4. **Limbs lag.** Arms and leaf are springs chasing the body rather than
 *    functions of time, so they overshoot and settle — follow-through.
 * 5. **Speech is a syllable train**, not a fast sine. Attack/decay envelopes,
 *    varying durations, and real pauses.
 * 6. **Speaking has phrase gestures.** Sparse, alternating emphasis beats move
 *    one arm more than the other, with quiet gaps so it never becomes waving.
 * 7. **Mood changes get an impulse**, so the character reacts rather than
 *    cross-fading between two idles.
 * 8. **Everything is frame-rate independent.** Springs run on a fixed substep
 *    and smoothing uses `exp(-lambda * dt)`. The old code used
 *    `lerp(current, target, 0.06)` per frame, which literally ran twice as fast
 *    on a 120Hz display as on a 60Hz one.
 */

export type MascotMood = "idle" | "listening" | "thinking" | "speaking";

/**
 * A named, independently switchable movement. The lab solos and mutes these,
 * which is only meaningful because each one composes onto the rest pose
 * additively — disabling a channel must leave the character in a valid pose,
 * never a broken one.
 */
export type MotionChannel =
  | "breath"
  | "sway"
  | "gaze"
  | "blink"
  | "speech"
  | "gesture"
  | "attention"
  | "arms"
  | "leaf"
  | "reaction";

export const motionChannels: readonly MotionChannel[] = [
  "breath",
  "sway",
  "gaze",
  "blink",
  "speech",
  "gesture",
  "attention",
  "arms",
  "leaf",
  "reaction"
] as const;

export type ChannelMask = Record<MotionChannel, boolean>;

export function allChannelsOn(): ChannelMask {
  return {
    breath: true,
    sway: true,
    gaze: true,
    blink: true,
    speech: true,
    gesture: true,
    attention: true,
    arms: true,
    leaf: true,
    reaction: true
  };
}

/**
 * Something specific for the character to look at, in STAGE-LOCAL normalised
 * space where (0, 0) is the mascot's own centre and 1 is roughly the edge of
 * its frame. The widget converts a real DOM rect into this; the engine keeps
 * zero imports and never touches the DOM itself.
 */
export interface AttentionTarget {
  x: number;
  y: number;
  /**
   * How hard to look. Blends against ambient wandering rather than replacing
   * it — at 0 the character goes back to looking around the room, at 1 it locks
   * on and its fixations lengthen.
   */
  weight: number;
}

export interface MotionInput {
  mood: MascotMood;
  /** The chamber is open — the character stands up and engages. */
  active: boolean;
  /** Pointer in normalised -1..1 space, already damped by the caller. */
  pointerX: number;
  pointerY: number;
  /** A specific thing to look at. Null or omitted = wander. */
  attention?: AttentionTarget | null;
  /**
   * 0..1 arousal. Deliberately not a mood: moods are semantic states the chat
   * owns, interest is a physical alertness that rides on top of any of them.
   * Shortens fixations, widens the eye slightly, adds a small lean.
   */
  interest?: number;
}

/**
 * One-shot beats. Velocity impulses into springs, never position jumps — a
 * jumped position reads as a glitch, an impulse reads as a reaction.
 */
export type MotionTrigger =
  | "blink"
  | "doubleBlink"
  | "saccade"
  | "react"
  /** Pointer reached the dock: look up, blink, small lift. */
  | "greet"
  /** Dock pressed: compress then release, before the chamber opens. */
  | "perk"
  /** Message sent: one downward beat. */
  | "acknowledge"
  /** Answer landed: two small nods, settling. */
  | "nod";

export interface MascotPose {
  root: {x: number; y: number; rotZ: number; rotY: number; scale: number};
  /**
   * The planted half of the rig. The legs take the weight shift but never the
   * breath bob or the engagement scale — a standing character breathes with its
   * feet on the floor, and applying one transform to everything is what made
   * the mascot look like it was hovering.
   */
  stand: {x: number};
  /** Shell squash-and-stretch. Volume is preserved: x up means y down. */
  bodyScaleX: number;
  bodyScaleY: number;
  /** 1 = wide open, 0 = shut. Drives the sclera/iris vertical squash. */
  eyeOpen: number;
  /** Opacity of the closed-lid line, cross-faded against `eyeOpen`. */
  lidOpacity: number;
  irisX: number;
  irisY: number;
  /** 0 = smile, 1 = open mouth. Cross-fade, not a hard swap. */
  mouthTalk: number;
  jawScaleY: number;
  armLeft: {rot: number; y: number};
  armRight: {rot: number; y: number};
  stemRot: number;
  /** Drives shader brightness and the floor pool. */
  intensity: number;
  /**
   * One representative scalar per channel, for the lab's scopes. Reading a
   * curve is how you tell a good movement from a plausible-looking one.
   */
  channels: Record<MotionChannel, number>;
}

export interface MotionEngineOptions {
  /** Fixed seed keeps a lab session reproducible across reloads. */
  seed?: number;
  channels?: Partial<ChannelMask>;
}

export interface MotionEngine {
  /** Advances by `dt` seconds (already scaled by the caller) and returns the pose. */
  update(dt: number, input: MotionInput): MascotPose;
  /** The pose with every channel at rest — the lab's A/B reference. */
  restPose(): MascotPose;
  setChannels(mask: Partial<ChannelMask>): void;
  getChannels(): ChannelMask;
  trigger(event: MotionTrigger): void;
  /** Total simulated seconds, ignoring real time. */
  elapsed(): number;
  reset(): void;
}

/* ----------------------------------------------------------------- maths -- */

function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function clamp(value: number, min: number, max: number): number {
  return value < min ? min : value > max ? max : value;
}

/**
 * Frame-rate independent smoothing. `lambda` is roughly "how many e-foldings
 * per second", so the result is identical at 60Hz and 144Hz. Plain
 * `lerp(a, b, k)` per frame is not, and that bug is invisible until someone
 * opens the site on a high-refresh display and the character looks twitchy.
 */
function damp(current: number, target: number, lambda: number, dt: number): number {
  return target + (current - target) * Math.exp(-lambda * dt);
}

/**
 * Three non-harmonic sines. The frequency ratios are irrational-ish on purpose:
 * the sum has no short common period, so the idle never visibly loops.
 */
function organicNoise(t: number, rate: number, phase: number): number {
  return (
    Math.sin(t * rate + phase) * 0.55 +
    Math.sin(t * rate * 2.31 + phase * 1.7) * 0.3 +
    Math.sin(t * rate * 0.43 + phase * 2.9) * 0.15
  );
}

const easeInOutSine = (p: number): number => 0.5 - Math.cos(Math.PI * p) / 2;
const easeOutCubic = (p: number): number => 1 - (1 - p) ** 3;
const easeInQuad = (p: number): number => p * p;
/** Ballistic: almost all of the distance in the first third. Saccades and lids. */
const easeOutQuint = (p: number): number => 1 - (1 - p) ** 5;

/**
 * Inhale is faster than exhale, with a beat of hold at the top. Returns -1..1.
 */
function breathCurve(phase: number): number {
  const INHALE = 0.38;
  const HOLD = 0.06;
  if (phase < INHALE) {
    return easeInOutSine(phase / INHALE) * 2 - 1;
  }
  if (phase < INHALE + HOLD) {
    return 1;
  }
  const p = (phase - INHALE - HOLD) / (1 - INHALE - HOLD);
  return (1 - easeInOutSine(p)) * 2 - 1;
}

/**
 * Semi-implicit Euler spring. Used wherever something should trail the thing
 * driving it — that lag is the whole reason the limbs read as attached mass
 * rather than as parented transforms.
 */
class Spring {
  value: number;
  velocity = 0;

  constructor(
    private readonly rest: number,
    private readonly stiffness: number,
    private readonly damping: number
  ) {
    this.value = rest;
  }

  step(dt: number, target: number): number {
    const accel = (target - this.value) * this.stiffness - this.velocity * this.damping;
    this.velocity += accel * dt;
    this.value += this.velocity * dt;
    return this.value;
  }

  /** Velocity kick — an impulse reads as a reaction, a position jump as a glitch. */
  impulse(amount: number): void {
    this.velocity += amount;
  }

  reset(): void {
    this.value = this.rest;
    this.velocity = 0;
  }
}

/* ------------------------------------------------------------ sub-systems - */

interface BlinkPhase {
  /** closing -> closed -> opening -> idle */
  stage: "idle" | "closing" | "closed" | "opening";
  t: number;
  queued: number;
}

const BLINK_CLOSE_S = 0.085;
const BLINK_HOLD_S = 0.035;
const BLINK_OPEN_S = 0.15;

/** Mean seconds between blinks. Thinking blinks more, listening stares more. */
const BLINK_INTERVAL: Record<MascotMood, number> = {
  idle: 4.4,
  listening: 5.8,
  thinking: 2.9,
  speaking: 3.6
};

const BREATH_PERIOD: Record<MascotMood, number> = {
  idle: 4.3,
  listening: 3.6,
  thinking: 3.1,
  speaking: 2.7
};

const INTENSITY: Record<MascotMood, number> = {
  idle: 0.42,
  listening: 1.3,
  thinking: 0.88,
  speaking: 1.12
};

/**
 * The settled intensity for a mood, with no simulation run. The reduced-motion
 * path paints a single frame, so it needs the destination value rather than
 * whatever the damper happens to be holding.
 */
export function moodIntensity(mood: MascotMood): number {
  return INTENSITY[mood];
}

interface Syllable {
  duration: number;
  peak: number;
}

/** Fixed physics step. Springs stay stable and identical at any refresh rate. */
const SUBSTEP = 1 / 120;
const MAX_SUBSTEPS = 8;

/**
 * Arms hang down from the shoulder at rest. Without this they sit horizontal
 * and read as ears rather than arms.
 */
// 0.8 rad. The arm hangs along the body rather than sticking out sideways —
// in the reference its tip only clears the silhouette near the lower right.
const ARM_REST_ROT = 0.8;

/** Hard bound on the sprig's bend. The camera framing depends on it. */
const LEAF_MAX_ROT = 0.16;

/**
 * The eye reads a downward target as sulking long before it reads it as
 * looking. Both numbers are deliberately mean: the character should acknowledge
 * that something is down there, then go back to facing the visitor.
 */
/** Total idle rise, all of it above the resting pose. */
const BREATH_LIFT = 0.016;

const VERTICAL_ATTENTION_GAIN = 0.34;
const MAX_LOOK_DOWN = 0.42;

/* ------------------------------------------------------------------ engine */

export function createMotionEngine(options: MotionEngineOptions = {}): MotionEngine {
  const random = mulberry32(options.seed ?? 0x57a9d);
  let channels: ChannelMask = {...allChannelsOn(), ...options.channels};

  let time = 0;
  let breathPhase = 0;
  let intensity = INTENSITY.idle;
  let lastMood: MascotMood = "idle";
  let engagement = 0;

  // Gaze --------------------------------------------------------------------
  let gazeX = 0;
  let gazeY = 0;
  let saccadeFromX = 0;
  let saccadeFromY = 0;
  let saccadeToX = 0;
  let saccadeToY = 0;
  let saccadeT = 1;
  let saccadeDuration = 0.06;
  let fixationLeft = 1.2;
  // Attention + interest -----------------------------------------------------
  // `attentionWeight` is damped rather than read raw so a target appearing or
  // vanishing does not snap the eye; `interest` is the arousal level.
  let attentionX = 0;
  let attentionY = 0;
  let attentionWeight = 0;
  let interest = 0;
  let lastAttentionX = 0;
  let lastAttentionY = 0;
  let lastPointerX = 0;
  let lastPointerY = 0;

  // Blink -------------------------------------------------------------------
  const blink: BlinkPhase = {stage: "idle", t: 0, queued: 0};
  let blinkCountdown = 1.5;

  // Speech ------------------------------------------------------------------
  let syllable: Syllable = {duration: 0.15, peak: 0};
  let syllableT = 0;
  let jaw = 0;
  let mouthTalk = 0;

  // Conversational gesture -------------------------------------------------
  // A gesture is a phrase-level beat, not a second speech oscillator. Its
  // long quiet gaps are as important as the movement itself.
  let gestureT = 0;
  let gestureDuration = 0;
  let gestureCooldown = 0.38;
  let gesturePeak = 0;
  let gestureSide: -1 | 1 = -1;
  let gestureSignal = 0;

  // Springs -----------------------------------------------------------------
  const rootY = new Spring(0, 90, 13);
  const rootScale = new Spring(1, 110, 15);
  const armL = new Spring(0, 70, 9.5);
  const armR = new Spring(0, 64, 9.0);
  // Separate springs keep the gesture independently switchable in the lab.
  // The dominant arm arrives first; the supporting arm and leaf trail it.
  const gestureArmL = new Spring(0, 92, 14.5);
  const gestureArmR = new Spring(0, 76, 12.5);
  const gestureLean = new Spring(0, 88, 14);
  const gestureLift = new Spring(0, 96, 15);
  const gestureLeaf = new Spring(0, 38, 7.4);
  // Beats: the one-shot acknowledgements. Vertical for nods, scale for the
  // press anticipation. Separate from the mood impulse so the lab can solo them.
  const beatY = new Spring(0, 128, 14);
  const beatScale = new Spring(0, 150, 16);
  // Stiffer and better damped than the arms: a 0.9-unit blade pivoting at its
  // base magnifies every radian, so what read as a gentle sway on the old stubby
  // leaf swung this one clean out of frame.
  const leaf = new Spring(0, 46, 7.2);

  function startSaccade(toX: number, toY: number): void {
    saccadeFromX = gazeX;
    saccadeFromY = gazeY;
    saccadeToX = clamp(toX, -1, 1);
    saccadeToY = clamp(toY, -1, 1);
    const amplitude = Math.hypot(saccadeToX - saccadeFromX, saccadeToY - saccadeFromY);
    // Real saccades are ballistic: duration scales with amplitude, and even a
    // large one is under ~120ms. Anything slower reads as a security camera.
    saccadeDuration = 0.028 + amplitude * 0.075;
    saccadeT = 0;
    // Humans frequently blink through a large gaze shift. Free naturalness.
    if (amplitude > 0.55 && random() < 0.28 && blink.stage === "idle") {
      blink.stage = "closing";
      blink.t = 0;
    }
  }

  function nextSyllable(): Syllable {
    if (random() < 0.22) {
      return {duration: 0.12 + random() * 0.26, peak: 0};
    }
    return {duration: 0.09 + random() * 0.12, peak: 0.42 + random() * 0.58};
  }

  function startGesture(): void {
    gestureT = 0;
    gestureDuration = 0.58 + random() * 0.24;
    gesturePeak = 0.58 + random() * 0.34;
    // Alternate the leading hand. Occasional same-side repetition would read
    // as a habit at this scale, while perfect simultaneous arms read robotic.
    gestureSide = gestureSide === -1 ? 1 : -1;
  }

  function stepPhysics(dt: number, input: MotionInput): void {
    const {mood} = input;

    if (mood !== lastMood) {
      if (channels.reaction) {
        // A settle, not a cross-fade: kick the springs and let them resolve.
        rootY.impulse(mood === "listening" ? 0.55 : 0.3);
        rootScale.impulse(mood === "speaking" ? 0.28 : 0.18);
        armL.impulse(-0.9);
        armR.impulse(0.9);
        leaf.impulse(mood === "listening" ? 0.7 : 0.4);
      }
      if (mood === "listening" || mood === "thinking") {
        // Look up and re-engage when addressed.
        startSaccade(input.pointerX * 0.8, input.pointerY * 0.6 - 0.15);
      }
      lastMood = mood;
    }

    time += dt;
    intensity = damp(intensity, INTENSITY[mood], 3.2, dt);
    engagement = damp(engagement, input.active ? 1 : 0, 4.5, dt);

    // Breath ----------------------------------------------------------------
    // The period itself drifts slightly, so consecutive breaths differ.
    const periodJitter = 1 + organicNoise(time, 0.11, 4.1) * 0.09;
    // Engagement tightens the breath a little. Small on purpose: a visible
    // change of breathing rate reads as alarm, not attention.
    const interestPace = 1 - interest * 0.12;
    breathPhase += dt / (BREATH_PERIOD[mood] * periodJitter * interestPace);
    breathPhase -= Math.floor(breathPhase);

    // Attention + interest ---------------------------------------------------
    // Damped so that a target appearing, moving or vanishing never snaps the
    // eye. `interest` decays on its own, so the widget only has to say when
    // something IS happening, never when it stops.
    const wantWeight = channels.attention ? (input.attention?.weight ?? 0) : 0;
    if (input.attention && channels.attention) {
      attentionX = damp(attentionX, input.attention.x, 9, dt);
      // Vertical is compressed hard and floored. Almost every element the
      // widget points at — composer, chips, transcript — is BELOW the stage, so
      // a faithful target parks the eye on the floor and the character reads as
      // sulking. It should register the direction, not stare at its own feet.
      attentionY = damp(
        attentionY,
        clamp(input.attention.y * VERTICAL_ATTENTION_GAIN, -1, MAX_LOOK_DOWN),
        9,
        dt
      );
    }
    attentionWeight = damp(attentionWeight, clamp(wantWeight, 0, 1), 6.5, dt);
    interest = damp(interest, clamp(input.interest ?? 0, 0, 1), 3.4, dt);

    // Gaze ------------------------------------------------------------------
    if (channels.gaze) {
      const pointerMoved = Math.hypot(
        input.pointerX - lastPointerX,
        input.pointerY - lastPointerY
      );
      lastPointerX = input.pointerX;
      lastPointerY = input.pointerY;

      // A target that moves far enough is a new thing to look at, so it earns a
      // saccade of its own rather than waiting out the current fixation.
      const attentionMoved = Math.hypot(
        attentionX - lastAttentionX,
        attentionY - lastAttentionY
      );

      if (saccadeT >= 1) {
        fixationLeft -= dt;
        // A decisive pointer move re-targets immediately; small jitter does not,
        // which is what stops the eye from vibrating with a shaky mouse.
        const retarget =
          fixationLeft <= 0 ||
          pointerMoved > 0.22 ||
          (attentionWeight > 0.35 && attentionMoved > 0.16);

        if (retarget) {
          lastAttentionX = attentionX;
          lastAttentionY = attentionY;

          // Attention beats the pointer and beats wandering, in that order. It
          // is a specific element the visitor is using, not a guess at where
          // they might be looking.
          const lookAtTarget = attentionWeight > 0.3 && random() < attentionWeight;
          const lookAtPointer =
            mood === "listening" || mood === "speaking"
              ? random() < 0.82
              : random() < 0.55;

          if (lookAtTarget) {
            // Still not dead-on. A fraction off-centre reads as looking AT the
            // thing rather than through it.
            startSaccade(
              attentionX + (random() - 0.5) * 0.12,
              attentionY + (random() - 0.5) * 0.1
            );
          } else if (lookAtPointer) {
            startSaccade(
              input.pointerX + (random() - 0.5) * 0.18,
              input.pointerY + (random() - 0.5) * 0.14
            );
          } else {
            // Biased slightly up: a character that wanders evenly spends half
            // its idle time looking at the ground.
            startSaccade((random() - 0.5) * 1.1, (random() - 0.55) * 0.6);
          }

          // Locked-on attention holds; an alert character re-targets sooner.
          const base = 0.55 + random() * (mood === "thinking" ? 1.1 : 2.0);
          fixationLeft =
            base * (1 + attentionWeight * 0.55) * (1 - interest * 0.3);
        }
      } else {
        saccadeT = Math.min(1, saccadeT + dt / saccadeDuration);
        const p = easeOutQuint(saccadeT);
        gazeX = saccadeFromX + (saccadeToX - saccadeFromX) * p;
        gazeY = saccadeFromY + (saccadeToY - saccadeFromY) * p;
      }
    }

    // Blink -----------------------------------------------------------------
    if (channels.blink) {
      if (blink.stage === "idle") {
        blinkCountdown -= dt;
        if (blinkCountdown <= 0) {
          blink.stage = "closing";
          blink.t = 0;
          if (random() < 0.15) {
            blink.queued = 1;
          }
        }
      } else {
        blink.t += dt;
        if (blink.stage === "closing" && blink.t >= BLINK_CLOSE_S) {
          blink.stage = "closed";
          blink.t = 0;
        } else if (blink.stage === "closed" && blink.t >= BLINK_HOLD_S) {
          blink.stage = "opening";
          blink.t = 0;
        } else if (blink.stage === "opening" && blink.t >= BLINK_OPEN_S) {
          blink.stage = "idle";
          blink.t = 0;
          if (blink.queued > 0) {
            blink.queued -= 1;
            blink.stage = "closing";
          } else {
            const mean = BLINK_INTERVAL[mood];
            blinkCountdown = mean * (0.45 + random() * 1.3);
          }
        }
      }
    }

    // Speech ----------------------------------------------------------------
    const speaking = channels.speech && mood === "speaking";
    mouthTalk = damp(mouthTalk, speaking ? 1 : 0, 11, dt);
    if (speaking) {
      syllableT += dt;
      if (syllableT >= syllable.duration) {
        syllableT = 0;
        syllable = nextSyllable();
      }
      const p = clamp(syllableT / syllable.duration, 0, 1);
      // Fast open, slower close — the shape of an actual mouth, and the reason
      // this reads as speech where `abs(sin(t * 11.5))` read as a buzzer.
      //
      // VOICED ends before the syllable does. Without that silent tail the
      // envelope of one syllable runs straight into the next and the damper
      // never gets back to zero, so a 5/s syllable train renders as ~1/s of
      // sustained mouth-hanging-open. The harness measures this directly.
      const VOICED = 0.82;
      const envelope =
        p >= VOICED
          ? 0
          : p < 0.34 * VOICED
            ? easeOutCubic(p / (0.34 * VOICED))
            : 1 - easeInQuad((p - 0.34 * VOICED) / (VOICED - 0.34 * VOICED));
      // Fast enough to resolve a 90ms syllable. At the old lambda of 26 the
      // jaw could not physically keep up with the shape it was being given.
      jaw = damp(jaw, syllable.peak * envelope, 42, dt);
    } else {
      jaw = damp(jaw, 0, 14, dt);
      syllableT = 0;
    }

    // Conversational gesture ------------------------------------------------
    if (channels.gesture) {
      if (mood === "speaking" && input.active) {
        if (gestureDuration > 0 && gestureT < gestureDuration) {
          gestureT += dt;
          const p = clamp(gestureT / gestureDuration, 0, 1);
          // Quick intent, a tiny hold, then a relaxed return. The side is kept
          // in the sign so the lab can verify that both hands take turns.
          const envelope =
            p < 0.22
              ? easeOutCubic(p / 0.22)
              : p < 0.36
                ? 1
                : 1 - easeInOutSine((p - 0.36) / 0.64);
          gestureSignal = gestureSide * gesturePeak * envelope;
        } else {
          gestureSignal = 0;
          gestureCooldown -= dt;
          if (gestureCooldown <= 0) {
            startGesture();
            gestureCooldown = gestureDuration + 0.72 + random() * 0.7;
          }
        }
      } else {
        gestureSignal = 0;
        gestureT = gestureDuration;
        // Re-enter with a short listening beat, never mid-gesture.
        gestureCooldown = 0.32;
      }

      const amount = Math.abs(gestureSignal);
      const leftLeads = gestureSignal < 0;
      gestureArmL.step(dt, leftLeads ? -amount * 0.18 : -amount * 0.052);
      gestureArmR.step(dt, leftLeads ? amount * 0.052 : amount * 0.18);
      gestureLean.step(dt, gestureSignal * 0.031);
      gestureLift.step(dt, amount * 0.008);
      gestureLeaf.step(dt, -gestureSignal * 0.04);
    } else {
      // Muting a channel must not leave a hidden spring accumulating state.
      gestureSignal = 0;
      gestureArmL.reset();
      gestureArmR.reset();
      gestureLean.reset();
      gestureLift.reset();
      gestureLeaf.reset();
    }

    // Beats -----------------------------------------------------------------
    // Target is always rest; these only ever move because something kicked
    // them. Stepped unconditionally so a beat already in flight settles even if
    // the channel is muted mid-swing.
    beatY.step(dt, 0);
    beatScale.step(dt, 0);

    // Springs ---------------------------------------------------------------
    const breath = channels.breath ? breathCurve(breathPhase) : 0;
    const swayN = channels.sway ? organicNoise(time, 0.29, 0.0) : 0;

    // The idle rise only ever goes UP from rest. Centring it on zero meant half
    // of every breath was spent below the resting pose, which read as the
    // character shrinking rather than breathing. Softer, too: 0.016 of total
    // travel where the old symmetric version covered 0.04.
    rootY.step(dt, (breath * 0.5 + 0.5) * BREATH_LIFT + engagement * 0.012);
    rootScale.step(dt, 1 + engagement * 0.03);

    // Arms are driven by the body but reach it late and overshoot. Different
    // stiffness per side stops them mirroring each other exactly.
    const lift = mood === "listening" ? 0.2 : mood === "speaking" ? 0.07 : 0;
    const armDrive = breath * 0.06 + swayN * 0.05;
    armL.step(dt, -armDrive - lift);
    armR.step(dt, armDrive + lift);

    // The leaf trails the body's lean by a wide margin and settles slowly —
    // it is the lightest thing on the character, so it should be the last to
    // stop moving.
    const leafDrive = channels.leaf
      ? swayN * 0.11 + organicNoise(time, 0.62, 2.2) * 0.04 + (mood === "listening" ? 0.05 : 0)
      : 0;
    leaf.step(dt, leafDrive);
  }

  function composePose(): MascotPose {
    const breath = channels.breath ? breathCurve(breathPhase) : 0;
    const swayN = channels.sway ? organicNoise(time, 0.29, 0.0) : 0;
    const swayN2 = channels.sway ? organicNoise(time, 0.19, 3.4) : 0;

    // Weight shift: the body leans and counter-rotates, feet planted. Without
    // the rotZ coupling a lateral slide reads as the whole rig being dragged.
    const gestureX = channels.gesture ? gestureLean.value * 0.12 : 0;

    // Attention turns the body a fraction toward whatever has it. Eyes alone
    // read as a doll following you around a room; eyes plus a partial turn read
    // as somebody looking at something. It stays small — this rig has no neck,
    // so the turn is the whole body and it oversells fast.
    const attend = channels.attention ? attentionWeight : 0;
    const attendTurn = attend * attentionX * 0.16;
    const attendLean = attend * attentionX * 0.018;

    const rootX = (channels.sway ? swayN2 * 0.022 : 0) + gestureX + attendLean;
    const rotZ =
      (channels.sway ? swayN2 * 0.03 + swayN * 0.012 : 0) +
      (channels.gesture ? gestureLean.value : 0);
    const rotY = (channels.sway ? swayN * 0.1 : 0) + attendTurn;

    // Squash and stretch. The sign matters more than the amount: the old mapping
    // made the shell WIDEST and SHORTEST at peak inhale, which on a round
    // character is exactly the silhouette of a belly. An inhale should read as a
    // chest lifting, so it now goes fractionally taller and narrower, at little
    // over half the previous amplitude.
    const squash = channels.breath ? breath * 0.008 : 0;

    // Blink -------------------------------------------------------------
    let eyeOpen = 1;
    if (channels.blink) {
      if (blink.stage === "closing") {
        eyeOpen = 1 - easeInQuad(clamp(blink.t / BLINK_CLOSE_S, 0, 1));
      } else if (blink.stage === "closed") {
        eyeOpen = 0;
      } else if (blink.stage === "opening") {
        eyeOpen = easeOutCubic(clamp(blink.t / BLINK_OPEN_S, 0, 1));
      }
    }
    // Interest widens the eye a few percent. Any more and it reads as a stare.
    const alertOpen = channels.attention ? 1 + interest * 0.06 : 1;
    // Never fully zero: a plane scaled to 0 disappears rather than closing.
    // Clamped above too, or the widening pushes the sclera past its socket.
    const eyeScale = clamp(eyeOpen * alertOpen, 0.04, 1.06);

    // Gaze --------------------------------------------------------------
    // Micro-tremor during fixation. Tiny — but a perfectly still eye is
    // uncanny, and this is the cheapest fix for it in the whole file.
    const tremor = saccadeT >= 1 && channels.gaze
      ? organicNoise(time, 7.3, 1.1) * 0.0035
      : 0;
    const irisX = channels.gaze ? gazeX * 0.055 + tremor : 0;
    const irisY = channels.gaze ? -gazeY * 0.04 + tremor * 0.6 : 0;

    // Taller plane = more open. 0.45 is a nearly shut mouth, 1.3 a wide one.
    const jawScaleY = 0.45 + jaw * 0.85;

    return {
      root: {
        x: rootX,
        y:
          rootY.value +
          (channels.gesture ? gestureLift.value : 0) +
          (channels.attention ? beatY.value : 0),
        rotZ,
        rotY,
        scale: rootScale.value + (channels.attention ? beatScale.value : 0)
      },
      // Half the torso's travel: the feet shuffle a little under a lean, they
      // do not slide with it.
      stand: {x: rootX * 0.5},
      bodyScaleX: 1 - squash * 0.5,
      bodyScaleY: 1 + squash,
      eyeOpen: eyeScale,
      lidOpacity: 1 - eyeOpen,
      irisX,
      irisY,
      mouthTalk,
      jawScaleY: mouthTalk > 0.01 ? jawScaleY : 1,
      armLeft: {
        rot:
          ARM_REST_ROT +
          (channels.arms ? armL.value : 0) +
          (channels.gesture ? gestureArmL.value : 0),
        y:
          (channels.arms ? armL.value * 0.05 : 0) +
          (channels.gesture ? gestureArmL.value * 0.035 : 0)
      },
      armRight: {
        rot:
          -ARM_REST_ROT +
          (channels.arms ? armR.value : 0) +
          (channels.gesture ? gestureArmR.value : 0),
        y:
          (channels.arms ? armR.value * 0.05 : 0) +
          (channels.gesture ? gestureArmR.value * 0.035 : 0)
      },
      // Clamped, not just damped. HALF_WIDTH/HALF_HEIGHT are solved from this
      // bound, so a large impulse must not be able to swing the tip out of shot.
      stemRot: clamp(
        (channels.leaf ? leaf.value : 0) +
          (channels.gesture ? gestureLeaf.value : 0),
        -LEAF_MAX_ROT,
        LEAF_MAX_ROT
      ),
      intensity,
      channels: {
        breath,
        sway: swayN2,
        gaze: gazeX,
        blink: 1 - eyeOpen,
        speech: jaw,
        gesture: gestureSignal,
        attention: attentionWeight * attentionX,
        arms: armL.value,
        leaf: leaf.value,
        reaction: rootY.velocity
      }
    };
  }

  return {
    update(dt, input) {
      // Fixed substeps keep the springs identical at 30fps and 144fps, and stop
      // a tab-switch dt spike from exploding them.
      let remaining = clamp(dt, 0, MAX_SUBSTEPS * SUBSTEP);
      let guard = 0;
      while (remaining > 1e-6 && guard < MAX_SUBSTEPS) {
        const step = Math.min(SUBSTEP, remaining);
        stepPhysics(step, input);
        remaining -= step;
        guard += 1;
      }
      return composePose();
    },

    restPose() {
      const saved = channels;
      channels = {
        breath: false,
        sway: false,
        gaze: false,
        blink: false,
        speech: false,
        gesture: false,
        attention: false,
        arms: false,
        leaf: false,
        reaction: false
      };
      const pose = composePose();
      channels = saved;
      return pose;
    },

    setChannels(mask) {
      channels = {...channels, ...mask};
    },

    getChannels() {
      return {...channels};
    },

    trigger(event) {
      if (event === "blink" || event === "doubleBlink") {
        blink.stage = "closing";
        blink.t = 0;
        blink.queued = event === "doubleBlink" ? 1 : 0;
      } else if (event === "saccade") {
        startSaccade((random() - 0.5) * 1.6, (random() - 0.5) * 0.9);
        fixationLeft = 0.6 + random() * 1.4;
      } else if (event === "greet") {
        // Noticed you. Look up toward the visitor, blink, and lift a little.
        startSaccade((random() - 0.5) * 0.3, -0.35 - random() * 0.2);
        fixationLeft = 0.9 + random() * 0.6;
        blink.stage = "closing";
        blink.t = 0;
        beatY.impulse(0.42);
        leaf.impulse(0.5);
      } else if (event === "perk") {
        // Anticipation before the chamber opens: compress, then the spring
        // releases on its own. A character that braces before it moves reads as
        // having decided to move.
        beatScale.impulse(-0.9);
        beatY.impulse(-0.5);
        armL.impulse(-0.6);
        armR.impulse(0.6);
        leaf.impulse(0.9);
      } else if (event === "acknowledge") {
        // Got it. One downward beat, no bounce back past rest.
        beatY.impulse(-0.6);
        beatScale.impulse(0.32);
        leaf.impulse(0.55);
      } else if (event === "nod") {
        // Here you go. Two small nods — the second is queued by the spring's
        // own overshoot rather than by a second timer.
        beatY.impulse(-0.85);
        leaf.impulse(0.7);
      } else if (event === "react") {
        rootY.impulse(0.7);
        rootScale.impulse(0.3);
        armL.impulse(-1.2);
        armR.impulse(1.2);
        leaf.impulse(0.9);
      }
    },

    elapsed() {
      return time;
    },

    reset() {
      time = 0;
      breathPhase = 0;
      intensity = INTENSITY.idle;
      engagement = 0;
      gazeX = 0;
      gazeY = 0;
      saccadeT = 1;
      fixationLeft = 1.2;
      blink.stage = "idle";
      blink.t = 0;
      blink.queued = 0;
      blinkCountdown = 1.5;
      jaw = 0;
      mouthTalk = 0;
      syllableT = 0;
      gestureT = 0;
      gestureDuration = 0;
      gestureCooldown = 0.38;
      gesturePeak = 0;
      gestureSide = -1;
      gestureSignal = 0;
      rootY.reset();
      rootScale.reset();
      armL.reset();
      armR.reset();
      gestureArmL.reset();
      gestureArmR.reset();
      gestureLean.reset();
      gestureLift.reset();
      gestureLeaf.reset();
      beatY.reset();
      beatScale.reset();
      attentionX = 0;
      attentionY = 0;
      attentionWeight = 0;
      interest = 0;
      lastAttentionX = 0;
      lastAttentionY = 0;
      leaf.reset();
    }
  };
}
