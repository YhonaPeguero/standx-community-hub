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
 * 6. **Mood changes get an impulse**, so the character reacts rather than
 *    cross-fading between two idles.
 * 7. **Everything is frame-rate independent.** Springs run on a fixed substep
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
  | "arms"
  | "leaf"
  | "reaction";

export const motionChannels: readonly MotionChannel[] = [
  "breath",
  "sway",
  "gaze",
  "blink",
  "speech",
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
    arms: true,
    leaf: true,
    reaction: true
  };
}

export interface MotionInput {
  mood: MascotMood;
  /** The chamber is open — the character stands up and engages. */
  active: boolean;
  /** Pointer in normalised -1..1 space, already damped by the caller. */
  pointerX: number;
  pointerY: number;
}

/** One-shot events the lab can fire to inspect a movement in isolation. */
export type MotionTrigger = "blink" | "doubleBlink" | "saccade" | "react";

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

  // Springs -----------------------------------------------------------------
  const rootY = new Spring(0, 90, 13);
  const rootScale = new Spring(1, 110, 15);
  const armL = new Spring(0, 70, 9.5);
  const armR = new Spring(0, 64, 9.0);
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
    breathPhase += dt / (BREATH_PERIOD[mood] * periodJitter);
    breathPhase -= Math.floor(breathPhase);

    // Gaze ------------------------------------------------------------------
    if (channels.gaze) {
      const pointerMoved = Math.hypot(
        input.pointerX - lastPointerX,
        input.pointerY - lastPointerY
      );
      lastPointerX = input.pointerX;
      lastPointerY = input.pointerY;

      if (saccadeT >= 1) {
        fixationLeft -= dt;
        // A decisive pointer move re-targets immediately; small jitter does not,
        // which is what stops the eye from vibrating with a shaky mouse.
        if (fixationLeft <= 0 || pointerMoved > 0.22) {
          const lookAtPointer = mood === "listening" || mood === "speaking"
            ? random() < 0.82
            : random() < 0.55;
          if (lookAtPointer) {
            // Never dead-on — a fraction off-centre reads as looking AT you
            // rather than through you.
            startSaccade(
              input.pointerX + (random() - 0.5) * 0.18,
              input.pointerY + (random() - 0.5) * 0.14
            );
          } else {
            startSaccade((random() - 0.5) * 1.1, (random() - 0.5) * 0.7);
          }
          fixationLeft = 0.55 + random() * (mood === "thinking" ? 1.1 : 2.0);
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

    // Springs ---------------------------------------------------------------
    const breath = channels.breath ? breathCurve(breathPhase) : 0;
    const swayN = channels.sway ? organicNoise(time, 0.29, 0.0) : 0;

    rootY.step(dt, breath * 0.02 + engagement * 0.012);
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
    const rootX = channels.sway ? swayN2 * 0.022 : 0;
    const rotZ = channels.sway ? swayN2 * 0.03 + swayN * 0.012 : 0;
    const rotY = channels.sway ? swayN * 0.1 : 0;

    // Squash and stretch, volume-preserving.
    const squash = channels.breath ? breath * 0.014 : 0;

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
    // Never fully zero: a plane scaled to 0 disappears rather than closing.
    const eyeScale = Math.max(0.04, eyeOpen);

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
        y: rootY.value,
        rotZ,
        rotY,
        scale: rootScale.value
      },
      // Half the torso's travel: the feet shuffle a little under a lean, they
      // do not slide with it.
      stand: {x: rootX * 0.5},
      bodyScaleX: 1 + squash,
      bodyScaleY: 1 - squash,
      eyeOpen: eyeScale,
      lidOpacity: 1 - eyeOpen,
      irisX,
      irisY,
      mouthTalk,
      jawScaleY: mouthTalk > 0.01 ? jawScaleY : 1,
      armLeft: channels.arms
        ? {rot: ARM_REST_ROT + armL.value, y: armL.value * 0.05}
        : {rot: ARM_REST_ROT, y: 0},
      armRight: channels.arms
        ? {rot: -ARM_REST_ROT + armR.value, y: armR.value * 0.05}
        : {rot: -ARM_REST_ROT, y: 0},
      // Clamped, not just damped. HALF_WIDTH/HALF_HEIGHT are solved from this
      // bound, so a large impulse must not be able to swing the tip out of shot.
      stemRot: channels.leaf ? clamp(leaf.value, -LEAF_MAX_ROT, LEAF_MAX_ROT) : 0,
      intensity,
      channels: {
        breath,
        sway: swayN2,
        gaze: gazeX,
        blink: 1 - eyeOpen,
        speech: jaw,
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
      rootY.reset();
      rootScale.reset();
      armL.reset();
      armR.reset();
      leaf.reset();
    }
  };
}
