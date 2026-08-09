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
function run(engine, {seconds, dt = 1 / 60, mood = "idle", active = true, pointer = {x: 0, y: 0}, pick}) {
  const frames = Math.round(seconds / dt);
  const out = [];
  for (let i = 0; i < frames; i += 1) {
    const pose = engine.update(dt, {
      mood,
      active,
      pointerX: pointer.x,
      pointerY: pointer.y
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

/* ------------------------------------------------- 6. follow-through ------ */

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

/* ----------------------------------------------------- 7. channel safety -- */
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

/* ------------------------------------------------------------- 8. bounds -- */

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
