// Headless verification of the mascot's camera framing.
// Run with: npm run framing:check
//
// Why this exists: the framing has now been solved wrong twice, and both times
// it shipped because "it looks fine" is not a check at 104px.
//
//   1. A second "compact" frame cropped small canvases and cut the leaf.
//   2. The single frame that replaced it was solved to *exactly* the content
//      envelope — and that solve left out the floor ring's tube radius, 0.008
//      of a body diameter. The ellipse's lowest arc ended up 0.13px inside the
//      canvas, so the hairline was half cut away across 62% of the dock's width
//      and the stage's drop-shadow bloomed out of the cut into a bar.
//
// Both are the same class of bug: a number that has to agree with the geometry,
// kept in sync by hand. So the scene now DERIVES the frame from the geometry,
// and this script re-derives it independently and fails if any edge of any
// shipped canvas size stops clearing the character.
//
// It reads the real source rather than a copy of the numbers. Anything it
// cannot derive (the leaf outline, which lives in an SVG path) is sampled from
// a table here — and the geometry that table depends on is asserted too, so it
// cannot silently go stale.

import fs from "node:fs";
import path from "node:path";
import {fileURLToPath} from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const read = (...parts) => fs.readFileSync(path.join(root, ...parts), "utf8");

const scene = read("lib", "hologram-scene.ts");
const motion = read("lib", "mascot", "motion.ts");
const art = read("lib", "mascot-art.ts");
const css = read("app", "globals.css");

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

/** `const NAME = <number>;` — the only shape these constants are allowed. */
function num(source, name, where) {
  const match = source.match(
    new RegExp(`const ${name}\\s*=\\s*(-?[0-9]+(?:\\.[0-9]+)?)\\s*;`)
  );
  if (!match) {
    throw new Error(`${name} not found as a plain numeric constant in ${where}`);
  }
  return Number(match[1]);
}

/** `key: <number>` inside an object literal. */
function field(source, object, key, where) {
  const block = source.match(new RegExp(`const ${object}\\s*=\\s*\\{([^}]*)\\}`));
  if (!block) {
    throw new Error(`${object} not found in ${where}`);
  }
  // The last field of an object literal has no trailing comma, and the closing
  // brace is outside the captured block — so end-of-block counts as a terminator.
  const match = block[1].match(
    new RegExp(`\\b${key}\\s*:\\s*(-?[0-9]+(?:\\.[0-9]+)?)\\s*(?:[,}]|$)`)
  );
  if (!match) {
    throw new Error(`${object}.${key} is not a plain number in ${where}`);
  }
  return Number(match[1]);
}

/* ------------------------------------------------- the scene's own numbers */

const FLOOR_Y = num(scene, "FLOOR_Y", "hologram-scene");
const CONTENT_MARGIN = num(scene, "CONTENT_MARGIN", "hologram-scene");
const OUTER_RING_RADIUS = num(scene, "OUTER_RING_RADIUS", "hologram-scene");
const OUTER_RING_TUBE = num(scene, "OUTER_RING_TUBE", "hologram-scene");

const tiltMatch = scene.match(/const FLOOR_TILT\s*=\s*Math\.PI\s*\/\s*([0-9.]+)\s*;/);
if (!tiltMatch) {
  throw new Error("FLOOR_TILT not found as `Math.PI / n` in hologram-scene");
}
const FLOOR_TILT = Math.PI / Number(tiltMatch[1]);

const LEAF_MAX_ROT = num(motion, "LEAF_MAX_ROT", "motion");
const ARM_REST_ROT = num(motion, "ARM_REST_ROT", "motion");

section("Sources — the frame is derived, not typed");

check(
  "the floor ring is built from the constants the frame is solved from",
  /new THREE\.TorusGeometry\(\s*OUTER_RING_RADIUS,\s*OUTER_RING_TUBE/.test(scene),
  "TorusGeometry(OUTER_RING_RADIUS, OUTER_RING_TUBE, …)"
);
check(
  "the floor group is tilted by FLOOR_TILT, not a repeated literal",
  /floor\.rotation\.x\s*=\s*FLOOR_TILT\s*;/.test(scene)
);
check(
  "ARTWORK covers only the flat planes, leaving the ring to the solve",
  !/ARTWORK\s*=\s*\{[^}]*RING_/s.test(scene) &&
    /bottom:\s*FLOOR_Y/.test(scene),
  "the ring has depth; mixing it in here is what went wrong twice"
);
check(
  "FRAME is solved, not assigned an object literal",
  /const FRAME: Framing = solveFraming\(\);/.test(scene)
);
check(
  "the solve samples the ring's surface instead of naming its extremes",
  /const surface = ringSurface\(\);/.test(scene) &&
    /for \(const \[x, y, z\] of surface\)/.test(scene),
  "every hand-picked extreme on this ring has been wrong"
);
check(
  "the solve builds every extent from ARTWORK and CONTENT_MARGIN",
  /halfWidth:\s*\(right - left\) \/ 2 \+ CONTENT_MARGIN/.test(scene) &&
    /halfHeight:\s*\(ARTWORK\.top - bottom\) \/ 2 \+ CONTENT_MARGIN/.test(scene) &&
    /offsetY:\s*-\(bottom \+ ARTWORK\.top\) \/ 2/.test(scene)
);

/* ----------------------------------------------------- the ring, re-derived */

// A torus of major radius R and tube r, lying in XY and tilted by θ about X.
// A surface point is ((R + r cosψ)cosφ, (R + r cosψ)sinφ, r sinψ); after the
// tilt its height is (R + r cosψ) sinφ cosθ − r sinψ sinθ, whose extreme over
// both angles is ±(R cosθ + r). The `+ r` is the term that was missing.
const RING_HALF_HEIGHT = OUTER_RING_RADIUS * Math.cos(FLOOR_TILT) + OUTER_RING_TUBE;
const RING_HALF_WIDTH = OUTER_RING_RADIUS + OUTER_RING_TUBE;

/* --------------------------------------------------- the sprig, re-measured */

// The leaf lives in an SVG path, so its outline is sampled here rather than
// parsed. Every number the sampling depends on is asserted below, so if the
// artwork moves this script fails instead of quietly trusting a stale table.
const STEM = {width: 0.78, height: 0.482, x: -0.16, y: 0.42, viewBox: [560, 300]};
const STEM_STROKE = 10; // half of the leaf outline's stroke-width

section("Artwork — the sampled sprig table still matches the source");

const stemBlock = art.match(/id:\s*"stem",[\s\S]{0,400}?\n\s*\}/);
check("the stem part is still declared in mascot-art", Boolean(stemBlock));
for (const [key, value] of [
  ["width", STEM.width],
  ["height", STEM.height],
  ["x", STEM.x],
  ["y", STEM.y]
]) {
  check(
    `stem ${key} is still ${value}`,
    Boolean(stemBlock) && new RegExp(`${key}:\\s*${value}\\s*,`).test(stemBlock[0]),
    "the sampled sweep is only valid at this geometry"
  );
}
check(
  "the stem pivots at its bottom-left corner",
  /pivotX:\s*-0\.5,\s*\n\s*pivotY:\s*-0\.5,\s*\n\s*x:\s*-0\.16/.test(art),
  "the sweep is computed about that corner"
);
check(
  "the stem artboard is still 560x300",
  art.includes(`svg(\n  ${STEM.viewBox[0]},\n  ${STEM.viewBox[1]},`) ||
    art.includes(`svg(${STEM.viewBox[0]}, ${STEM.viewBox[1]},`),
  `viewBox ${STEM.viewBox.join("x")}`
);
check(
  "the leaf tip is still at SVG (546, 24)",
  /546\s+24/.test(art),
  "the outermost point of the whole character"
);

// Outline extremes in artboard coordinates, stroke included.
const SPRIG_SAMPLES = [
  [546 + STEM_STROKE, 24 - STEM_STROKE], // tip, outermost
  [546 + STEM_STROKE, 24 + STEM_STROKE],
  [404, 12 - STEM_STROKE], // top of the blade
  [306, 120 + STEM_STROKE], // underside
  [232 - STEM_STROKE, 62], // base
  [42, 292], // stalk foot
  [88, 78],
  [244, 64]
];

const PIVOT = {x: STEM.x, y: STEM.y};

function artboardToWorld([sx, sy]) {
  return [
    PIVOT.x + (sx / STEM.viewBox[0]) * STEM.width,
    PIVOT.y + ((STEM.viewBox[1] - sy) / STEM.viewBox[1]) * STEM.height
  ];
}

function rotateAboutPivot([x, y], angle) {
  const dx = x - PIVOT.x;
  const dy = y - PIVOT.y;
  const c = Math.cos(angle);
  const s = Math.sin(angle);
  return [PIVOT.x + dx * c - dy * s, PIVOT.y + dx * s + dy * c];
}

const sprig = {left: Infinity, right: -Infinity, bottom: Infinity, top: -Infinity};
for (let step = 0; step <= 80; step += 1) {
  const angle = -LEAF_MAX_ROT + (2 * LEAF_MAX_ROT * step) / 80;
  for (const sample of SPRIG_SAMPLES) {
    const [x, y] = rotateAboutPivot(artboardToWorld(sample), angle);
    sprig.left = Math.min(sprig.left, x);
    sprig.right = Math.max(sprig.right, x);
    sprig.bottom = Math.min(sprig.bottom, y);
    sprig.top = Math.max(sprig.top, y);
  }
}

/* ------------------------------------------------------- the whole envelope */

// Body plane 1.12 wide; the drawn circle is r=262 with a 26-wide stroke on a
// 600 artboard. Arms are 0.32 long from a shoulder pivot at x=0.30.
const BODY_RADIUS = 1.12 * (275 / 600);
const ARM_REACH = Math.max(
  ...[-0.25, 0, 0.25].map((d) => 0.3 + 0.32 * Math.cos(ARM_REST_ROT + d))
);

const artwork = {
  left: Math.min(sprig.left, -BODY_RADIUS, -ARM_REACH),
  right: Math.max(sprig.right, BODY_RADIUS, ARM_REACH),
  bottom: FLOOR_Y, // the feet stop on the floor line; the ring goes lower
  top: Math.max(sprig.top, BODY_RADIUS)
};

section("Artwork envelope — what the scene declares matches the geometry");

const declaredLeft = field(scene, "ARTWORK", "left", "hologram-scene");
const declaredRight = field(scene, "ARTWORK", "right", "hologram-scene");
const declaredTop = field(scene, "ARTWORK", "top", "hologram-scene");

check(
  "ARTWORK.left still covers the arm at full swing",
  declaredLeft <= artwork.left + 1e-4,
  `declared ${declaredLeft.toFixed(4)} vs measured ${artwork.left.toFixed(4)}`
);
check(
  "ARTWORK.right still covers the leaf tip at full droop",
  declaredRight >= artwork.right - 1e-4,
  `declared ${declaredRight.toFixed(4)} vs measured ${artwork.right.toFixed(4)}`
);
check(
  "ARTWORK.top still covers the leaf tip at full lift",
  declaredTop >= artwork.top - 1e-4,
  `declared ${declaredTop.toFixed(4)} vs measured ${artwork.top.toFixed(4)}`
);
check(
  "the arms reach wider than the body, so they set the left edge",
  ARM_REACH > BODY_RADIUS,
  `arm ${ARM_REACH.toFixed(4)} > body ${BODY_RADIUS.toFixed(4)}`
);

/* ------------------------------------------------------------- the frame */

const FOV = num(scene, "FOV", "hologram-scene");
const TAN_HALF_FOV = Math.tan((FOV * Math.PI) / 180 / 2);
const RING_BREATH_SCALE = num(scene, "RING_BREATH_SCALE", "hologram-scene");
const PHI_STEPS = num(scene, "RING_PHI_STEPS", "hologram-scene");
const PSI_STEPS = num(scene, "RING_PSI_STEPS", "hologram-scene");

// The ring's surface in root-local space, at the largest its breath makes it.
// Sampled, not reasoned about: on a hoop tilted onto its edge, both the lowest
// and the widest points on screen trade position against depth, and hand-picked
// extremes have been wrong every single time.
const ringSurface = [];
for (let ring = 0; ring < PHI_STEPS; ring += 1) {
  const phi = (ring / PHI_STEPS) * Math.PI * 2;
  for (let tube = 0; tube < PSI_STEPS; tube += 1) {
    const psi = (tube / PSI_STEPS) * Math.PI * 2;
    const radius =
      (OUTER_RING_RADIUS + OUTER_RING_TUBE * Math.cos(psi)) * RING_BREATH_SCALE;
    const flatX = radius * Math.cos(phi);
    const flatY = radius * Math.sin(phi);
    const flatZ = OUTER_RING_TUBE * Math.sin(psi) * RING_BREATH_SCALE;
    ringSurface.push([
      flatX,
      FLOOR_Y + flatY * Math.cos(FLOOR_TILT) - flatZ * Math.sin(FLOOR_TILT),
      flatY * Math.sin(FLOOR_TILT) + flatZ * Math.cos(FLOOR_TILT)
    ]);
  }
}

function solve(margin) {
  let left = artwork.left;
  let right = artwork.right;
  let bottom = artwork.bottom;

  for (let pass = 0; pass < 12; pass += 1) {
    const halfHeight = (artwork.top - bottom) / 2 + margin;
    const offsetX = -(left + right) / 2;
    const offsetY = -(bottom + artwork.top) / 2;
    const distance = halfHeight / TAN_HALF_FOV;

    left = artwork.left;
    right = artwork.right;
    bottom = artwork.bottom;

    for (const [x, y, z] of ringSurface) {
      const magnify = distance / (distance - z);
      left = Math.min(left, (x + offsetX) * magnify - offsetX);
      right = Math.max(right, (x + offsetX) * magnify - offsetX);
      bottom = Math.min(bottom, (y + offsetY) * magnify - offsetY);
    }
  }

  return {
    halfWidth: (right - left) / 2 + margin,
    halfHeight: (artwork.top - bottom) / 2 + margin,
    offsetX: -(left + right) / 2,
    offsetY: -(bottom + artwork.top) / 2,
    projected: {left, right, bottom}
  };
}

const frame = solve(CONTENT_MARGIN);

section("Perspective — the ring's extremes are not where flat maths puts them");

check(
  "the scene samples the ring rather than naming a worst point",
  /function ringSurface\(\)/.test(scene) && /RING_PHI_STEPS/.test(scene),
  `${PHI_STEPS} x ${PSI_STEPS} samples`
);
check(
  "the ring's breathing scale is accounted for",
  /outerRing\.scale\.setScalar\(1 \+ pose\.channels\.breath \* 0\.02\)/.test(scene) &&
    Math.abs(RING_BREATH_SCALE - 1.02) < 1e-9,
  `applyPose scales the ring to ${RING_BREATH_SCALE}x`
);

// What the flat answer would have been, for comparison.
const flatBottom = FLOOR_Y - (OUTER_RING_RADIUS * Math.cos(FLOOR_TILT) + OUTER_RING_TUBE);
const flatSide = (OUTER_RING_RADIUS + OUTER_RING_TUBE) * RING_BREATH_SCALE;

check(
  "perspective pushes the bottom down, so the correction is load-bearing",
  frame.projected.bottom < flatBottom - 1e-4,
  `flat ${flatBottom.toFixed(4)} -> projected ${frame.projected.bottom.toFixed(4)}`
);
check(
  "perspective widens the ring too, which the flat solve also missed",
  frame.projected.left < -flatSide - 1e-4,
  `flat ${(-flatSide).toFixed(4)} -> projected ${frame.projected.left.toFixed(4)}`
);

const pixelsPerUnit = (w, h) =>
  Math.min(w / (2 * frame.halfWidth), h / (2 * frame.halfHeight));

/* ------------------------------------------- every canvas the widget ships */

// The dock is the tightest case and its size is in CSS, so it is read from
// there. The chamber stage is sized with clamp()/dvh, so representative
// renders are listed instead — these are measured from the running app.
const dockSizes = [...css.matchAll(/\.agent-dock\s*\{[^}]*?width:\s*(\d+)px;[^}]*?height:\s*(\d+)px;/gs)]
  .map((m) => [Number(m[1]), Number(m[2])]);

section("Canvas sizes — no edge may sit on the character");

check(
  "both dock sizes were found in globals.css",
  dockSizes.length === 2,
  dockSizes.map(([w, h]) => `${w}x${h}`).join(", ") || "none"
);

const surfaces = [
  ...dockSizes.map(([w, h], index) => [
    index === 0 ? "dock, desktop" : "dock, phone",
    w,
    h
  ]),
  ["chamber, desktop", 896, 640],
  ["chamber, phone", 375, 288],
  ["chamber, landscape phone", 720, 143]
];

// One device pixel of black is the difference between a hairline that is drawn
// whole and one the compositor eats half of.
const MIN_CLEARANCE_PX = 1;

for (const [label, width, height] of surfaces) {
  const ppu = pixelsPerUnit(width, height);
  const clearance = CONTENT_MARGIN * ppu;
  check(
    `${label} (${width}x${height}) keeps the ring off the edge`,
    clearance >= MIN_CLEARANCE_PX,
    `${clearance.toFixed(2)}px clear, ${ppu.toFixed(1)}px per body diameter`
  );
}

/* --------------------------------------- end to end, through a real camera */

// Everything above is algebra, and algebra is exactly what got this wrong the
// last two times: the first solve forgot the ring's tube, the second modelled a
// perspective scene as if it were flat. So the last word goes to three.js —
// build the real floor group, put a real PerspectiveCamera where the scene
// puts it, and project every vertex of the actual torus.
//
// If a single vertex lands outside the normalised cube, the ring is clipped.

section("Projection — the real torus through a real camera");

const THREE = await import("three");

function projectRing(width, height, using = frame) {
  const aspect = width / height;
  const camera = new THREE.PerspectiveCamera(FOV, aspect, 0.1, 100);
  const halfFov = THREE.MathUtils.degToRad(FOV) / 2;
  camera.position.set(
    0,
    0,
    Math.max(
      using.halfHeight / Math.tan(halfFov),
      using.halfWidth / (Math.tan(halfFov) * aspect)
    )
  );
  camera.lookAt(0, 0, 0);
  camera.updateMatrixWorld(true);
  camera.updateProjectionMatrix();

  const sceneRoot = new THREE.Group();
  sceneRoot.position.set(using.offsetX, using.offsetY, 0);

  const floor = new THREE.Group();
  floor.position.y = FLOOR_Y;
  floor.rotation.x = FLOOR_TILT;
  sceneRoot.add(floor);

  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(OUTER_RING_RADIUS, OUTER_RING_TUBE, 8, 96)
  );
  ring.scale.setScalar(RING_BREATH_SCALE); // caught mid-breath, its largest
  floor.add(ring);
  sceneRoot.updateMatrixWorld(true);

  const position = ring.geometry.getAttribute("position");
  const vertex = new THREE.Vector3();
  const ndc = {minX: Infinity, maxX: -Infinity, minY: Infinity, maxY: -Infinity};
  for (let index = 0; index < position.count; index += 1) {
    vertex.fromBufferAttribute(position, index);
    vertex.applyMatrix4(ring.matrixWorld).project(camera);
    ndc.minX = Math.min(ndc.minX, vertex.x);
    ndc.maxX = Math.max(ndc.maxX, vertex.x);
    ndc.minY = Math.min(ndc.minY, vertex.y);
    ndc.maxY = Math.max(ndc.maxY, vertex.y);
  }
  return ndc;
}

for (const [label, width, height] of surfaces) {
  const ndc = projectRing(width, height);
  const bottomPx = ((1 + ndc.minY) * height) / 2;
  const leftPx = ((1 + ndc.minX) * width) / 2;
  const rightPx = ((1 - ndc.maxX) * width) / 2;
  const worst = Math.min(bottomPx, leftPx, rightPx);
  check(
    `${label} (${width}x${height}) draws the whole ellipse`,
    worst >= MIN_CLEARANCE_PX,
    `bottom ${bottomPx.toFixed(2)}px, left ${leftPx.toFixed(2)}px, right ${rightPx.toFixed(2)}px`
  );
}

// The bug in one assertion: solve the frame the flat way — the way it shipped
// twice — and the very same projection puts the ellipse through the floor of
// the canvas. This is the regression, reproduced on demand.
const flatEnvelope = {
  left: Math.min(artwork.left, -flatSide),
  right: Math.max(artwork.right, flatSide),
  bottom: flatBottom,
  top: artwork.top
};
const flatFrame = {
  halfWidth: (flatEnvelope.right - flatEnvelope.left) / 2 + CONTENT_MARGIN,
  halfHeight: (flatEnvelope.top - flatEnvelope.bottom) / 2 + CONTENT_MARGIN,
  offsetX: -(flatEnvelope.left + flatEnvelope.right) / 2,
  offsetY: -(flatEnvelope.bottom + flatEnvelope.top) / 2
};
const flatNdc = projectRing(896, 640, flatFrame);
check(
  "a flat-solved frame still clips — the sampling is what fixes it",
  (1 + flatNdc.minY) * 320 < MIN_CLEARANCE_PX,
  `flat solve leaves ${((1 + flatNdc.minY) * 320).toFixed(2)}px at 896x640`
);

section("Dock proportions — the margin must not cost drawn size");

const contentAspect = frame.halfWidth / frame.halfHeight;
for (const [width, height] of dockSizes) {
  const aspect = width / height;
  check(
    `dock ${width}x${height} is shaped like the character`,
    Math.abs(aspect - contentAspect) < 0.02,
    `dock ${aspect.toFixed(4)} vs content ${contentAspect.toFixed(4)}`
  );
}

section("Drift — the sampled table is only valid at this sway");

check(
  "LEAF_MAX_ROT is still the angle the envelope was sampled at",
  Math.abs(LEAF_MAX_ROT - 0.16) < 1e-9,
  `${LEAF_MAX_ROT} — if this changes, re-measure ARTWORK.right and ARTWORK.top`
);

/* -------------------------------------------------------------------- done */

console.log(`\nFrame solved from the geometry:`);
console.log(
  `  halfWidth ${frame.halfWidth.toFixed(4)}  halfHeight ${frame.halfHeight.toFixed(4)}` +
    `  offsetX ${frame.offsetX.toFixed(4)}  offsetY ${frame.offsetY.toFixed(4)}`
);
console.log(
  `  artwork   x [${artwork.left.toFixed(4)}, ${artwork.right.toFixed(4)}]` +
    `  y [${artwork.bottom.toFixed(4)}, ${artwork.top.toFixed(4)}]`
);
console.log(
  `  ring as projected  left ${frame.projected.left.toFixed(4)}` +
    `  right ${frame.projected.right.toFixed(4)}` +
    `  bottom ${frame.projected.bottom.toFixed(4)}` +
    `   (flat would say ${(-flatSide).toFixed(4)} / ${flatSide.toFixed(4)} / ${flatBottom.toFixed(4)})`
);

console.log(`\n${checks - failures}/${checks} checks passed`);
process.exit(failures > 0 ? 1 : 0);
