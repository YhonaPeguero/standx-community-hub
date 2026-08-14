// Headless verification of the mascot motion engine.
// Run with: npm run motion:check
//
// This is step 2 of the character-motion workflow (.claude/skills/character-motion):
// simulate each movement in isolation and assert what its curve should look
// like, before it is ever integrated into a scene.
//
// The point is that "looks fine" is not a check. A blink with a symmetric
// close/open looks fine in motion and is wrong. A gaze that lerps toward the
// cursor looks fine in a screenshot and is dead in person. These assertions
// encode the shape each movement is supposed to have, so a regression is a
// failed run rather than a vague feeling that the character got worse.
//
// `lib/mascot/motion.ts` has zero imports on purpose, which is what lets it be
// transpiled and exercised here with no bundler and no browser.

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import {fileURLToPath} from "node:url";
import ts from "typescript";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const source = path.join(__dirname, "..", "lib", "mascot", "motion.ts");

const transpiled = ts.transpileModule(fs.readFileSync(source, "utf8"), {
  compilerOptions: {module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022}
}).outputText;

const tmp = path.join(
  fs.mkdtempSync(path.join(os.tmpdir(), "motion-check-")),
  "motion.mjs"
);
fs.writeFileSync(tmp, transpiled);
const {createMotionEngine, motionChannels} = await import(
  `file://${tmp.split(path.sep).join("/")}`
);

/* ------------------------------------------------------------------ utils */

let failures = 0;
let checks = 0;

function check(label, condition, detail) {
  checks += 1;
  if (condition) {
    console.log(`  ✓ ${label}${detail ? `  ${detail}` : ""}`);
  } else {
    failures += 1;
    console.log(`  ✗ ${label}${detail ? `  ${detail}` : ""}`);
  }
}

function section(name) {
  console.log(`\n${name}`);
}

/** Only the named channels on. Everything else sits at rest. */
function only(...names) {
  const mask = {};
  for (const channel of motionChannels) {
    mask[channel] = names.includes(channel);
  }
  return mask;
}

/** Runs the engine at a fixed frame time and collects a sample per frame. */
function run(engine, {
  seconds,
  dt = 1 / 60,
  mood = "idle",
  active = true,
  pointer = {x: 0, y: 0},
  attention = null,
  interest = 0,
  pick
}) {
  const frames = Math.round(seconds / dt);
  const out = [];
  for (let i = 0; i < frames; i += 1) {
    const pose = engine.update(dt, {
      mood,
      active,
      pointerX: pointer.x,
      pointerY: pointer.y,
      attention,
      interest
    });
    out.push(pick(pose));
  }
  return out;
}

/* ------------------------------------------------- 1. frame independence -- */
// The bug this catches shipped in the previous rig: `lerp(current, target, 0.06)`
// per frame runs at double speed on a 120Hz display. Stochastic channels are
// muted because their RNG draws land on different substep boundaries; the
// deterministic ones must agree.

section("Frame-rate independence (breath + sway + arms + leaf)");
{
  const SECONDS = 6;
  const a = createMotionEngine({seed: 11});
  const b = createMotionEngine({seed: 11});
  a.setChannels(only("breath", "sway", "arms", "leaf"));
  b.setChannels(only("breath", "sway", "arms", "leaf"));

  const slow = run(a, {seconds: SECONDS, dt: 1 / 30, pick: (p) => p});
  const fast = run(b, {seconds: SECONDS, dt: 1 / 144, pick: (p) => p});

  const last30 = slow[slow.length - 1];
  const last144 = fast[fast.length - 1];

  const deltas = {
    "root.y": Math.abs(last30.root.y - last144.root.y),
    "root.rotZ": Math.abs(last30.root.rotZ - last144.root.rotZ),
    "armLeft.rot": Math.abs(last30.armLeft.rot - last144.armLeft.rot),
    stemRot: Math.abs(last30.stemRot - last144.stemRot)
  };

  for (const [name, delta] of Object.entries(deltas)) {
    check(
      `${name} agrees at 30fps and 144fps`,
      delta < 0.004,
      `Δ=${delta.toExponential(2)}`
    );
  }
}

/* ------------------------------------------------------- 2. breath shape -- */

section("Breath — inhale must be faster than exhale");
{
  const engine = createMotionEngine({seed: 3});
  engine.setChannels(only("breath"));
  const dt = 1 / 240;
  const series = run(engine, {seconds: 14, dt, pick: (p) => p.channels.breath});

  // Measure one clean cycle: trough -> peak -> trough.
  let rise = 0;
  let fall = 0;
  let troughIndex = -1;
  for (let i = 1; i < series.length - 1; i += 1) {
    if (series[i] < series[i - 1] && series[i] <= series[i + 1]) {
      if (troughIndex === -1) {
        troughIndex = i;
        continue;
      }
      let peakIndex = troughIndex;
      for (let j = troughIndex; j < i; j += 1) {
        if (series[j] > series[peakIndex]) peakIndex = j;
      }
      rise = (peakIndex - troughIndex) * dt;
      fall = (i - peakIndex) * dt;
      break;
    }
  }

  check("a full cycle was found", rise > 0 && fall > 0, `rise=${rise.toFixed(2)}s fall=${fall.toFixed(2)}s`);
  check(
    "exhale is at least 1.3x the inhale",
    fall > rise * 1.3,
    `ratio=${(fall / rise).toFixed(2)}`
  );
  const amplitude = Math.max(...series) - Math.min(...series);
  check("amplitude is close to full range", amplitude > 1.8, `amp=${amplitude.toFixed(2)}`);
}

/* -------------------------------------------------------- 3. blink shape -- */

section("Blink — fast close, slow open, never symmetric");
{
  const engine = createMotionEngine({seed: 5});
  engine.setChannels(only("blink"));
  const dt = 1 / 480;

  engine.trigger("blink");
  const series = run(engine, {seconds: 0.6, dt, pick: (p) => p.eyeOpen});

  const closedAt = series.findIndex((v) => v <= 0.05);
  const reopenedAt = series.findIndex((v, i) => i > closedAt && closedAt >= 0 && v >= 0.98);
  const closeTime = closedAt * dt;
  const openTime = (reopenedAt - closedAt) * dt;

  check("the eye actually closes", closedAt > 0, `at ${closeTime.toFixed(3)}s`);
  check("the eye reopens", reopenedAt > closedAt, `after ${openTime.toFixed(3)}s`);
  check(
    "opening takes longer than closing",
    openTime > closeTime * 1.4,
    `close=${closeTime.toFixed(3)}s open=${openTime.toFixed(3)}s`
  );
  check(
    "the whole blink is under 350ms",
    closeTime + openTime < 0.35,
    `total=${(closeTime + openTime).toFixed(3)}s`
  );
  check("the lid never scales to zero", Math.min(...series) > 0, `min=${Math.min(...series).toFixed(3)}`);
}

/* --------------------------------------------------------- 4. gaze shape -- */
// A saccadic eye spends most of its time still. A lerp-follower spends most of
// its time moving. That difference is measurable, which is the only reason this
// assertion is worth writing.

section("Gaze — ballistic saccades, not smooth tracking");
{
  const engine = createMotionEngine({seed: 21});
  engine.setChannels(only("gaze"));
  const dt = 1 / 120;
  const series = run(engine, {seconds: 30, dt, pointer: {x: 0.4, y: -0.2}, pick: (p) => p.irisX});

  const speeds = [];
  for (let i = 1; i < series.length; i += 1) {
    speeds.push(Math.abs(series[i] - series[i - 1]) / dt);
  }
  const peak = Math.max(...speeds);
  const moving = speeds.filter((v) => v > peak * 0.2).length;
  const movingFraction = moving / speeds.length;

  let saccades = 0;
  let wasMoving = false;
  for (const v of speeds) {
    const isMoving = v > peak * 0.2;
    if (isMoving && !wasMoving) saccades += 1;
    wasMoving = isMoving;
  }

  check(
    "the eye is still for most of the time",
    movingFraction < 0.2,
    `moving ${(movingFraction * 100).toFixed(1)}% of frames`
  );
  check("several distinct saccades fired", saccades >= 6, `${saccades} in 30s`);
  check("iris stays inside its socket", Math.max(...series.map(Math.abs)) < 0.07);

  // Micro-tremor: a fixating eye that is perfectly still is uncanny.
  const fixationDeltas = speeds.filter((v) => v <= peak * 0.2);
  const tremor = fixationDeltas.reduce((sum, v) => sum + v, 0) / fixationDeltas.length;
  check("fixations still carry micro-tremor", tremor > 0, `mean=${tremor.toExponential(2)}`);
}

/* ------------------------------------------------------- 5. speech shape -- */

section("Speech — syllable envelopes with real pauses");
{
  const engine = createMotionEngine({seed: 33});
  engine.setChannels(only("speech"));
  const dt = 1 / 120;
  const series = run(engine, {seconds: 12, dt, mood: "speaking", pick: (p) => p.channels.speech});

  let openings = 0;
  let open = false;
  for (const v of series) {
    if (!open && v > 0.35) {
      open = true;
      openings += 1;
    } else if (open && v < 0.12) {
      open = false;
    }
  }
  const rate = openings / 12;

  check("the mouth opens repeatedly", openings > 10, `${openings} openings`);
  check("syllable rate is speech-like (1.5–8/s)", rate > 1.5 && rate < 8, `${rate.toFixed(1)}/s`);
  check("the mouth fully closes between syllables", Math.min(...series) < 0.05);
  check("the mouth opens wide at least once", Math.max(...series) > 0.7);

  // A sine buzzer would sit near its mean almost always; an envelope train has
  // a long tail of near-zero frames from the pauses.
  const quiet = series.filter((v) => v < 0.05).length / series.length;
  check("there are genuine pauses", quiet > 0.1, `${(quiet * 100).toFixed(0)}% quiet frames`);
}

/* ------------------------------------------------ 6. speaking gestures ---- */

section("Gesture — sparse conversational beats, never constant waving");
{
  const engine = createMotionEngine({seed: 58});
  engine.setChannels(only("gesture"));
  const dt = 1 / 120;
  const series = run(engine, {
    seconds: 16,
    dt,
    mood: "speaking",
    pick: (p) => p.channels.gesture
  });

  let beats = 0;
  let active = false;
  for (const value of series) {
    const moving = Math.abs(value) > 0.16;
    if (moving && !active) beats += 1;
    active = moving;
  }

  const quiet = series.filter((value) => Math.abs(value) < 0.04).length / series.length;
  const peak = Math.max(...series);
  const trough = Math.min(...series);

  check("several distinct emphasis beats fire", beats >= 5 && beats <= 14, `${beats} in 16s`);
  check("the character rests between gestures", quiet > 0.42, `${(quiet * 100).toFixed(0)}% quiet frames`);
  check("gestures use both sides", peak > 0.22 && trough < -0.22, `range=${trough.toFixed(2)}…${peak.toFixed(2)}`);

  const speakingPoses = run(engine, {seconds: 4, dt, mood: "speaking", pick: (p) => p});
  const armTravel = Math.max(
    ...speakingPoses.map((pose) =>
      Math.max(
        Math.abs(pose.armLeft.rot - 0.8),
        Math.abs(pose.armRight.rot + 0.8)
      )
    )
  );
  const bodyLean = Math.max(...speakingPoses.map((pose) => Math.abs(pose.root.rotZ)));
  check("a beat is visible in the arms", armTravel > 0.06, `travel=${armTravel.toFixed(3)}`);
  check("body emphasis stays restrained", bodyLean > 0.008 && bodyLean < 0.075, `lean=${bodyLean.toFixed(3)}`);

  const settling = run(engine, {seconds: 2, dt, mood: "idle", pick: (p) => p});
  const settled = settling[settling.length - 1];
  check(
    "the gesture settles cleanly when speech ends",
    Math.abs(settled.channels.gesture) < 0.02 &&
      Math.abs(settled.root.rotZ) < 0.008 &&
      Math.abs(settled.armLeft.rot - 0.8) < 0.02
  );
}

/* ------------------------------------------ 6b. attention, interest, beats - */
// Attention is the difference between a character that follows your cursor and
// one that looks at the thing you are using. The test is directional bias: given
// a target on one side, the eye must actually spend its time over there.

section("Attention — the eye goes to the target, and it blends rather than locks");
{
  const dt = 1 / 120;
  const SECONDS = 24;
  const mean = (xs) => xs.reduce((a, b) => a + b, 0) / xs.length;

  const wander = createMotionEngine({seed: 31});
  wander.setChannels(only("gaze"));
  const loose = run(wander, {seconds: SECONDS, dt, pick: (p) => p.irisX});

  const attend = createMotionEngine({seed: 31});
  attend.setChannels(only("gaze", "attention"));
  const locked = run(attend, {
    seconds: SECONDS,
    dt,
    attention: {x: 0.9, y: 0, weight: 1},
    pick: (p) => p.irisX
  });

  const wanderMean = mean(loose);
  const lockedMean = mean(locked);

  check(
    "a right-hand target pulls the gaze right",
    lockedMean > wanderMean + 0.012,
    `wander=${wanderMean.toFixed(4)} attend=${lockedMean.toFixed(4)}`
  );
  check(
    "the eye still stays inside its socket",
    Math.max(...locked.map(Math.abs)) < 0.07,
    `max=${Math.max(...locked.map(Math.abs)).toFixed(4)}`
  );

  // A blend, not a lock: at half weight the character must still look away, or
  // it stares.
  const half = createMotionEngine({seed: 31});
  half.setChannels(only("gaze", "attention"));
  const blended = run(half, {
    seconds: SECONDS,
    dt,
    attention: {x: 0.9, y: 0, weight: 0.5},
    pick: (p) => p.irisX
  });
  const awayFrames = blended.filter((v) => v < 0.005).length / blended.length;
  check(
    "at half weight it still looks away sometimes",
    awayFrames > 0.1,
    `${(awayFrames * 100).toFixed(0)}% of frames off-target`
  );

  const muted = createMotionEngine({seed: 31});
  muted.setChannels(only("gaze"));
  const ignored = run(muted, {
    seconds: SECONDS,
    dt,
    attention: {x: 0.9, y: 0, weight: 1},
    pick: (p) => p.irisX
  });
  check("muting attention ignores the target", Math.abs(mean(ignored) - wanderMean) < 1e-9);
}

section("Idle rise only ever goes up, and inhale is not a belly");
{
  const dt = 1 / 120;
  const engine = createMotionEngine({seed: 91});
  engine.setChannels(only("breath"));
  const frames = run(engine, {seconds: 30, dt, active: false, pick: (p) => p});

  const ys = frames.map((p) => p.root.y);
  const lowest = Math.min(...ys);
  const highest = Math.max(...ys);

  // Centring the bob on zero meant half of every breath sat below the resting
  // pose, which reads as the character shrinking rather than breathing.
  check("never dips below rest", lowest >= -1e-6, `lowest=${lowest.toExponential(2)}`);
  check("still visibly rises", highest > 0.008, `highest=${highest.toFixed(4)}`);
  check("the rise stays gentle", highest < 0.03, `highest=${highest.toFixed(4)}`);

  // On a round character, widest-and-shortest at peak inhale is the silhouette
  // of a belly. Inhale must read as a chest lifting instead.
  let widestAtInhale = false;
  for (const pose of frames) {
    if (pose.channels.breath > 0.9 && pose.bodyScaleX > pose.bodyScaleY) {
      widestAtInhale = true;
      break;
    }
  }
  check("the shell is not widest at peak inhale", !widestAtInhale);

  const maxWidth = Math.max(...frames.map((p) => p.bodyScaleX));
  check("squash amplitude stays subtle", maxWidth < 1.01, `maxScaleX=${maxWidth.toFixed(4)}`);
}

section("Gaze never parks on the floor");
{
  const dt = 1 / 120;
  // Everything the widget points at (composer, chips, transcript) is below the
  // stage. A faithful target used to drag the eye down and pin it there, which
  // reads as sulking rather than as looking.
  const engine = createMotionEngine({seed: 77});
  engine.setChannels(only("gaze", "attention"));
  const series = run(engine, {
    seconds: 20,
    dt,
    attention: {x: 0, y: 1.4, weight: 1},
    pick: (p) => p.irisY
  });

  // irisY is negated from the target, so a downward look is a NEGATIVE irisY.
  const lowest = Math.min(...series);
  check(
    "a target far below only tips the eye down a little",
    lowest > -0.022,
    `lowest irisY=${lowest.toFixed(4)}`
  );

  const idle = createMotionEngine({seed: 78});
  idle.setChannels(only("gaze"));
  const wander = run(idle, {seconds: 40, dt, pick: (p) => p.irisY});
  const mean = wander.reduce((a, b) => a + b, 0) / wander.length;
  check("idle wandering sits at or above eye level", mean >= 0, `mean=${mean.toFixed(4)}`);
}

section("Interest — alertness that is not a mood change");
{
  const dt = 1 / 120;
  const calm = createMotionEngine({seed: 44});
  calm.setChannels(only("blink", "attention"));
  const calmEye = run(calm, {seconds: 6, dt, interest: 0, pick: (p) => p.eyeOpen});

  const alert = createMotionEngine({seed: 44});
  alert.setChannels(only("blink", "attention"));
  const alertEye = run(alert, {seconds: 6, dt, interest: 1, pick: (p) => p.eyeOpen});

  check(
    "interest widens the eye",
    Math.max(...alertEye) > Math.max(...calmEye),
    `calm=${Math.max(...calmEye).toFixed(3)} alert=${Math.max(...alertEye).toFixed(3)}`
  );
  check(
    "but never past the socket",
    Math.max(...alertEye) <= 1.06,
    `max=${Math.max(...alertEye).toFixed(3)}`
  );
}

section("Beats — impulses that travel and settle, never position jumps");
{
  const dt = 1 / 240;
  for (const beat of ["greet", "perk", "acknowledge", "nod"]) {
    const engine = createMotionEngine({seed: 52});
    engine.setChannels(only("attention"));
    // Settle first, so the beat is the only thing that moves.
    run(engine, {seconds: 0.5, dt, pick: (p) => p.root.y});
    const before = run(engine, {seconds: 4 / 240, dt, pick: (p) => p.root.y}).pop();

    engine.trigger(beat);
    const series = run(engine, {seconds: 3, dt, pick: (p) => p.root.y});

    const firstStep = Math.abs(series[0] - before);
    const travel = Math.max(...series.map((v) => Math.abs(v - before)));
    const tail = Math.max(...series.slice(-240).map((v) => Math.abs(v - before)));

    check(`${beat}: produces real travel`, travel > 0.002, `travel=${travel.toFixed(4)}`);
    check(
      `${beat}: starts from rest, not a jump`,
      firstStep < travel * 0.25,
      `first frame ${firstStep.toFixed(5)} of ${travel.toFixed(4)}`
    );
    check(`${beat}: settles back`, tail < travel * 0.2, `tail=${tail.toFixed(5)}`);
  }
}

/* ------------------------------------------------- 7. follow-through ------ */

section("Springs — limbs overshoot then settle");
{
  const engine = createMotionEngine({seed: 44});
  engine.setChannels(only("arms", "leaf", "reaction"));
  const dt = 1 / 240;

  engine.trigger("react");
  const series = run(engine, {seconds: 4, dt, pick: (p) => p.stemRot});

  const peak = Math.max(...series);
  const troughAfterPeak = Math.min(...series.slice(series.indexOf(peak)));

  check("the impulse produces real travel", peak > 0.05, `peak=${peak.toFixed(3)}`);
  check(
    "it overshoots back past rest (follow-through)",
    troughAfterPeak < 0,
    `undershoot=${troughAfterPeak.toFixed(3)}`
  );

  const tail = series.slice(-240);
  const settled = Math.max(...tail.map(Math.abs));
  check("it settles rather than hunting", settled < peak * 0.35, `tail max=${settled.toFixed(3)}`);
}

/* ----------------------------------------------------- 8. channel safety -- */
// Soloing must always leave a valid pose. If muting a channel could produce a
// broken figure, the lab's solo buttons would be lying to you.

section("Channel isolation — every solo leaves a valid pose");
{
  const finite = (value) => Number.isFinite(value);
  for (const channel of motionChannels) {
    const engine = createMotionEngine({seed: 9});
    engine.setChannels(only(channel));
    const frames = run(engine, {seconds: 3, mood: "speaking", pick: (p) => p});
    const last = frames[frames.length - 1];
    const ok =
      finite(last.root.x) &&
      finite(last.root.y) &&
      finite(last.root.rotZ) &&
      finite(last.root.scale) &&
      last.root.scale > 0.5 &&
      last.root.scale < 1.5 &&
      last.eyeOpen > 0 &&
      last.eyeOpen <= 1 &&
      finite(last.armLeft.rot) &&
      finite(last.stemRot) &&
      Math.abs(last.root.x) < 0.5 &&
      Math.abs(last.root.y) < 0.5;
    check(`solo:${channel}`, ok);
  }

  const engine = createMotionEngine({seed: 9});
  engine.setChannels(only());
  const rest = engine.update(1 / 60, {mood: "idle", active: false, pointerX: 0, pointerY: 0});
  check(
    "rest pose is neutral",
    Math.abs(rest.root.rotZ) < 1e-6 && Math.abs(rest.irisX) < 1e-6 && rest.eyeOpen === 1
  );
}

/* ------------------------------------------------------------- 9. bounds -- */

section("Bounds — a long run never leaves a sane envelope");
{
  const engine = createMotionEngine({seed: 77});
  const moods = ["idle", "listening", "thinking", "speaking"];
  let worst = {scale: 1, x: 0, y: 0, arm: 0, leaf: 0};

  for (let block = 0; block < 8; block += 1) {
    const mood = moods[block % moods.length];
    const frames = run(engine, {
      seconds: 8,
      mood,
      pointer: {x: Math.sin(block) * 0.9, y: Math.cos(block) * 0.6},
      pick: (p) => p
    });
    for (const pose of frames) {
      worst.x = Math.max(worst.x, Math.abs(pose.root.x));
      worst.y = Math.max(worst.y, Math.abs(pose.root.y));
      worst.arm = Math.max(worst.arm, Math.abs(pose.armLeft.rot));
      worst.leaf = Math.max(worst.leaf, Math.abs(pose.stemRot));
      worst.scale = Math.max(worst.scale, pose.root.scale);
    }
  }

  check("root drift stays small", worst.x < 0.1 && worst.y < 0.12, `x=${worst.x.toFixed(3)} y=${worst.y.toFixed(3)}`);
  check("arms stay in a plausible arc", worst.arm < 1.0, `max=${worst.arm.toFixed(3)}`);
  // Tight, because the camera framing is solved from LEAF_MAX_ROT. If the blade
  // can exceed it the tip leaves the frame.
  check("the leaf stays inside its clamp", worst.leaf <= 0.161, `max=${worst.leaf.toFixed(3)}`);
  check("scale never blows up", worst.scale < 1.2, `max=${worst.scale.toFixed(3)}`);
}

/* ------------------------------------------------------------------ done -- */

fs.rmSync(path.dirname(tmp), {recursive: true, force: true});

console.log(
  `\n${failures === 0 ? "PASS" : "FAIL"} — ${checks - failures}/${checks} checks passed\n`
);
process.exit(failures === 0 ? 0 : 1);
