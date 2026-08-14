import * as THREE from "three";
import {
  mascotParts,
  toDataUri,
  type MascotPart,
  type MascotPartId
} from "@/lib/mascot-art";
import {
  createMotionEngine,
  moodIntensity,
  type ChannelMask,
  type MascotMood,
  type AttentionTarget,
  type MascotPose,
  type MotionTrigger
} from "@/lib/mascot/motion";

/**
 * The mascot's stage.
 *
 * Built with raw three.js to match `lib/three-scene.ts` (the hero canvas) and
 * to avoid pulling a react renderer into the bundle. Each mascot part is a
 * textured plane sharing one material, so the rig can move the iris, blink and
 * open the mouth while every part stays part of the same figure.
 *
 * **This file owns rendering, not movement.** Every transform comes from
 * `lib/mascot/motion.ts`; the render loop does nothing but copy a pose onto
 * meshes. That split is what makes `/motion-lab` able to validate a movement
 * against the real engine instead of a mock.
 *
 * Like the hero canvas this degrades: no WebGL means `webglAvailable: false`
 * and the caller shows a flat CSS fallback instead.
 */

export type HologramMood = MascotMood;
export type MotionPreference = "system" | "full" | "reduced";

const LIME = "#00ff87";
const LIME_SOFT = "#d9ffe8";

const MASCOT_SCALE = 1.0;
const FOV = 30;

// The character's feet rest exactly here. It used to sit a third of a body
// above its own emitter ring, which read as hovering rather than standing.
const FLOOR_Y = -0.63;

/*
 * Floor rings. Declared here rather than beside the meshes they build, because
 * the camera framing is solved from them: the ellipse is both the lowest and the
 * widest thing in the scene, so its extent has to be derived and not remembered.
 */
const FLOOR_TILT = Math.PI / 2.15;
const OUTER_RING_RADIUS = 0.58;
const OUTER_RING_TUBE = 0.008;

/**
 * The character's own artwork, in body-diameter units, across every pose the
 * rig can reach — the sprig through its whole ±LEAF_MAX_ROT sweep, the arms
 * through their swing.
 *
 * All of it is drawn on planes at z ≈ 0, so what it measures is what it
 * projects, and flat maths is enough. The floor rings are the exception and are
 * handled separately below.
 *
 * Motes are deliberately excluded. They drift from the floor to well above the
 * head and are meant to leave the frame; sizing for them would shrink the
 * character to accommodate a decoration.
 *
 *   left    the arm at full swing, wider than the body's 0.513
 *   right   the leaf tip at full droop
 *   bottom  the feet, which stop exactly on the floor line
 *   top     the leaf tip at full lift
 */
const ARTWORK = {
  left: -0.5728,
  right: 0.6777,
  bottom: FLOOR_Y,
  top: 0.997
};

/**
 * Dark space held between the furthest ink and every edge of the canvas.
 *
 * This is not cosmetic padding. The frame used to be solved to *exactly* the
 * envelope, and that solve left the ring's tube radius out — 0.008 of a body
 * diameter, which was all it took. The ellipse's bottom arc landed 0.13px
 * inside the canvas at dock size, so the hairline was half cut away along 62%
 * of the width and the stage's `drop-shadow` bloomed out of the cut into a bar.
 * It read as the floor dissolving under the character. Three of the four edges
 * were sitting on ink; only the right had any room.
 *
 * 0.024 buys about two pixels of black at dock size and a pixel and a half on
 * the smallest phone dock, so the hairline is always drawn whole with visible
 * floor beneath it. `npm run framing:check` reports the figure for every size
 * the widget ships at, measured by projecting the real geometry.
 */
const CONTENT_MARGIN = 0.024;

interface Framing {
  halfWidth: number;
  halfHeight: number;
  offsetX: number;
  offsetY: number;
}

const HALF_FOV = (FOV * Math.PI) / 180 / 2;
const TAN_HALF_FOV = Math.tan(HALF_FOV);

/** `applyPose` breathes the outer ring by this much. Scale, so it grows the
 *  tube and the depth along with the radius. */
const RING_BREATH_SCALE = 1.02;

const RING_PHI_STEPS = 96;
const RING_PSI_STEPS = 24;

/**
 * The outer ring's surface in root-local space, at the largest its breath ever
 * makes it. Sampled rather than reasoned about — see `solveFraming`.
 */
function ringSurface(): Array<[number, number, number]> {
  const samples: Array<[number, number, number]> = [];
  const cosTilt = Math.cos(FLOOR_TILT);
  const sinTilt = Math.sin(FLOOR_TILT);

  for (let ring = 0; ring < RING_PHI_STEPS; ring += 1) {
    const phi = (ring / RING_PHI_STEPS) * Math.PI * 2;
    for (let tube = 0; tube < RING_PSI_STEPS; tube += 1) {
      const psi = (tube / RING_PSI_STEPS) * Math.PI * 2;
      const radius =
        (OUTER_RING_RADIUS + OUTER_RING_TUBE * Math.cos(psi)) * RING_BREATH_SCALE;
      const flatX = radius * Math.cos(phi);
      const flatY = radius * Math.sin(phi);
      const flatZ = OUTER_RING_TUBE * Math.sin(psi) * RING_BREATH_SCALE;
      samples.push([
        flatX,
        FLOOR_Y + flatY * cosTilt - flatZ * sinTilt,
        flatY * sinTilt + flatZ * cosTilt
      ]);
    }
  }
  return samples;
}

/**
 * The floor rings are the only part of this scene with real depth, and it
 * matters far more than it looks. The hoop is tilted almost onto its edge, so
 * parts of it sit 0.58 of a body diameter nearer the camera than the planes the
 * character is drawn on, and perspective magnifies those parts by about 22%.
 *
 * Framing it flat is what put the ellipse on the last row of pixels. Framing it
 * with a hand-picked "worst point" was no better, because on a tilted ring the
 * extremes are not where flat intuition puts them — each one trades position
 * against depth:
 *
 *   the lowest point on screen is the tube's UNDERSIDE on the near arc, not
 *   the arc's high point: sitting lower wins more than being nearer loses
 *
 *   the leftmost point is not where the ellipse is widest, but a little around
 *   from it, where leaning toward the camera buys more magnification than the
 *   smaller radius gives away
 *
 * Both were derived wrong by hand, twice, so nothing here is derived: the
 * surface is sampled and the extremes are whatever the samples say. Each point
 * is mapped to the position it would need at the character's own plane to land
 * where it actually lands, and the ordinary envelope maths runs on that.
 *
 * The frame sets the camera distance and the camera distance sets the
 * projection, so it resolves by iteration — a couple of passes is plenty and
 * twelve is free, once, at module load.
 */
function solveFraming(): Framing {
  const surface = ringSurface();
  let left = ARTWORK.left;
  let right = ARTWORK.right;
  let bottom = ARTWORK.bottom;

  for (let pass = 0; pass < 12; pass += 1) {
    const halfHeight = (ARTWORK.top - bottom) / 2 + CONTENT_MARGIN;
    const offsetX = -(left + right) / 2;
    const offsetY = -(bottom + ARTWORK.top) / 2;

    // The shortest the camera ever sits, which is the strongest the perspective
    // ever gets. Any container shape that is not exactly the character's own
    // pushes the camera further back and only flattens the ring from here.
    const distance = halfHeight / TAN_HALF_FOV;

    left = ARTWORK.left;
    right = ARTWORK.right;
    bottom = ARTWORK.bottom;

    for (const [x, y, z] of surface) {
      const magnify = distance / (distance - z);
      left = Math.min(left, (x + offsetX) * magnify - offsetX);
      right = Math.max(right, (x + offsetX) * magnify - offsetX);
      bottom = Math.min(bottom, (y + offsetY) * magnify - offsetY);
    }
  }

  return {
    halfWidth: (right - left) / 2 + CONTENT_MARGIN,
    halfHeight: (ARTWORK.top - bottom) / 2 + CONTENT_MARGIN,
    offsetX: -(left + right) / 2,
    offsetY: -(bottom + ARTWORK.top) / 2
  };
}

/**
 * Derived, never hand-typed. Change a ring, the sprig's reach or the margin and
 * the camera re-solves itself. `npm run framing:check` re-derives this from the
 * source and fails if any edge stops clearing the character.
 */
const FRAME: Framing = solveFraming();

/**
 * Below this many pixels per body diameter, the thin additive floor lines lose
 * contrast and need an opacity lift. Measuring pixels-per-unit rather than the
 * container's width or height matters: which dimension constrains the drawing
 * depends on the aspect, so a wide short strip is "large" by width and tiny in
 * practice.
 */
const SMALL_CANVAS_PX_PER_UNIT = 120;

/** Pixels one body diameter gets in a container of this size. */
function pixelsPerUnit(width: number, height: number, frame: Framing): number {
  return Math.min(width / (2 * frame.halfWidth), height / (2 * frame.halfHeight));
}
const MOTE_COUNT = 54;
const MOTE_COUNT_MOBILE = 22;

/**
 * How much projection artefact survives. 0 is a clean character, 1 is the old
 * CRT read. It sits low on purpose: the scanlines, chromatic split and tear
 * glitch were doing the work of a costume, and underneath them the figure was
 * never actually legible. A trace keeps the "projected" identity without
 * shredding the drawing.
 */
const SIGNAL = 0.22;

const vertexShader = /* glsl */ `
  varying vec2 vUv;

  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const fragmentShader = /* glsl */ `
  precision highp float;

  uniform sampler2D uMap;
  uniform float uTime;
  uniform float uIntensity;
  uniform float uOpacity;
  uniform float uPartOpacity;
  uniform float uReady;
  uniform float uSignal;
  uniform vec3 uColor;
  uniform vec3 uColorB;
  varying vec2 vUv;

  void main() {
    if (uReady < 0.5 || uPartOpacity < 0.01) discard;

    vec4 texel = texture2D(uMap, vUv);
    float baseA = texel.a;
    if (baseA < 0.02) discard;

    // The mascot keeps its OWN colours. Mapping luminance onto a lime ramp
    // repainted the whole character green — the charcoal shell, the black
    // outlines and the cream eye all collapsed into one hue, which is why the
    // arms fused into the body and read as a paunch instead of as limbs. The
    // black outlines are what separate the parts, and they only separate them
    // if they are still black.
    vec3 base = texel.rgb;
    float lum = dot(base, vec3(0.299, 0.587, 0.114));

    // Lime bounce light, strongest in the shadows. Enough to seat the character
    // in the page's palette without recolouring it.
    vec3 color = base + uColor * 0.055 * (1.0 - smoothstep(0.0, 0.45, lum));

    // Broad, slow highlight travelling up the figure. Reads as a material
    // property rather than as a raster sweep.
    float sheenPos = fract(uTime * 0.07);
    float sheen = exp(-pow((sheenPos - vUv.y) * 3.4, 2.0)) * 0.14;
    color += uColorB * sheen * (0.35 + lum);

    // What is left of the projection: a whisper of scanline, nothing else.
    color += vec3((sin(vUv.y * 520.0 - uTime * 1.6) * 0.5 + 0.5) * 0.03 * uSignal);

    // Lime rim along the silhouette. This is what keeps a near-black character
    // legible on a near-black page, and it does the job the flat green tint was
    // doing before — without flattening the drawing.
    float edge = smoothstep(0.0, 0.32, baseA) * (1.0 - smoothstep(0.32, 0.8, baseA));
    color += uColor * edge * 0.95;

    color *= 0.92 + uIntensity * 0.16;

    // Solid. The old alpha was multiplied by the scanline and sweep terms,
    // which is precisely why the character looked like a ghost of itself.
    gl_FragColor = vec4(color, baseA * uOpacity * uPartOpacity);
  }
`;

function supportsWebGL(): boolean {
  if (typeof window === "undefined") {
    return false;
  }
  try {
    const canvas = document.createElement("canvas");
    const context =
      canvas.getContext("webgl") ?? canvas.getContext("experimental-webgl");
    return context !== null;
  } catch {
    return false;
  }
}

function seededRandom(seed: number): number {
  const value = Math.sin(seed * 12.9898) * 43758.5453;
  return value - Math.floor(value);
}

interface RiggedPart {
  part: MascotPart;
  mesh: THREE.Mesh;
  material: THREE.ShaderMaterial;
  texture: THREE.Texture;
  partOpacity: {value: number};
}

export interface HologramSceneOptions {
  container: HTMLDivElement;
  /**
   * Visitor-owned preference from the chat control. `system` is the production
   * default; `full` and `reduced` are only written after an explicit choice.
   * This is separate from the lab-only `forceAnimate` escape hatch below.
   */
  motionPreference?: MotionPreference;
  /**
   * Runs the animation loop even when the visitor prefers reduced motion.
   * Only `/motion-lab` sets this — inspecting movement is the entire point of
   * that page, and it ships with a pause control.
   */
  forceAnimate?: boolean;
  motionSeed?: number;
}

/** Inspection surface used by `/motion-lab`. Inert in production. */
export interface MotionDebugHandle {
  setChannels: (mask: Partial<ChannelMask>) => void;
  getChannels: () => ChannelMask;
  setTimeScale: (scale: number) => void;
  setPaused: (paused: boolean) => void;
  /** Advances exactly one step while paused, for frame-by-frame inspection. */
  step: (dt?: number) => void;
  trigger: (event: MotionTrigger) => void;
  getPose: () => MascotPose | null;
  /** Pins the pointer so gaze can be tested without moving a real mouse. */
  setPointerOverride: (pointer: {x: number; y: number} | null) => void;
  /** Raw stage-local attention, bypassing the DOM-rect conversion in `lookAt`. */
  setAttention: (target: AttentionTarget | null) => void;
  setInterest: (interest: number) => void;
  reset: () => void;
}

export interface HologramSceneHandle {
  webglAvailable: boolean;
  setMood: (mood: HologramMood) => void;
  setActive: (active: boolean) => void;
  /** Pointer position in normalised -1..1 viewport space. */
  setPointer: (x: number, y: number) => void;
  /**
   * Give the character something specific to look at, as a viewport rect.
   * The scene converts it to stage-local space, which is why the widget can
   * hand over a real element and the mascot ends up looking at THAT — not at
   * a guess derived from the cursor. Pass `null` to go back to wandering.
   */
  lookAt: (rect: DOMRect | null, weight?: number) => void;
  /** 0..1 arousal. Decays on its own, so callers only signal engagement. */
  setInterest: (interest: number) => void;
  /** Fire a one-shot acknowledgement beat. */
  beat: (event: MotionTrigger) => void;
  /**
   * Runtime motion preference. A setter rather than a construction option
   * because rebuilding the scene to change it tears down the WebGL context and
   * resets every spring — the visitor sees a hard cut mid-toggle.
   */
  setMotionPreference: (preference: MotionPreference) => void;
  motion: MotionDebugHandle;
  dispose: () => void;
}

const NOOP_MOTION: MotionDebugHandle = {
  setChannels: () => undefined,
  getChannels: () => ({
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
  }),
  setTimeScale: () => undefined,
  setPaused: () => undefined,
  step: () => undefined,
  trigger: () => undefined,
  getPose: () => null,
  setPointerOverride: () => undefined,
  setAttention: () => undefined,
  setInterest: () => undefined,
  reset: () => undefined
};

export function createHologramScene({
  container,
  motionPreference = "system",
  forceAnimate = false,
  motionSeed
}: HologramSceneOptions): HologramSceneHandle {
  if (!supportsWebGL()) {
    return {
      webglAvailable: false,
      setMood: () => undefined,
      setActive: () => undefined,
      setPointer: () => undefined,
      lookAt: () => undefined,
      setInterest: () => undefined,
      beat: () => undefined,
      setMotionPreference: () => undefined,
      motion: NOOP_MOTION,
      dispose: () => undefined
    };
  }

  const systemPrefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;
  const prefersReducedMotion =
    !forceAnimate &&
    (motionPreference === "reduced" ||
      (motionPreference === "system" && systemPrefersReducedMotion));
  const isMobile = window.matchMedia("(max-width: 768px)").matches;

  const renderer = new THREE.WebGLRenderer({
    alpha: true,
    antialias: !isMobile,
    powerPreference: "high-performance"
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, isMobile ? 1.5 : 2));
  renderer.setClearColor(0x000000, 0);
  renderer.domElement.setAttribute("aria-hidden", "true");
  renderer.domElement.setAttribute("role", "presentation");
  renderer.domElement.style.width = "100%";
  renderer.domElement.style.height = "100%";
  renderer.domElement.style.display = "block";
  container.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(FOV, 1, 0.1, 100);

  const root = new THREE.Group();
  root.position.set(FRAME.offsetX, FRAME.offsetY, 0);
  scene.add(root);

  const mascot = new THREE.Group();
  mascot.scale.setScalar(MASCOT_SCALE);
  root.add(mascot);

  // A standing character breathes with its feet on the floor. Driving the whole
  // rig from one transform made the legs rise and fall with the torso, which is
  // exactly what "it is floating" looks like. The legs live in their own group
  // and stay planted; they overlap the ball by 0.11 units, so the torso can bob
  // and scale without opening a gap at the hip.
  const stand = new THREE.Group();
  const torso = new THREE.Group();
  mascot.add(stand);
  mascot.add(torso);

  const STAND_PARTS = new Set<MascotPartId>(["footLeft", "footRight"]);

  // Shared uniform objects — every part material references the same object, so
  // one write per frame drives the whole figure.
  const uTime = {value: 0};
  const uIntensity = {value: moodIntensity("idle")};
  const uOpacity = {value: 1};
  const uSignal = {value: SIGNAL};
  const uColor = {value: new THREE.Color(LIME)};
  const uColorB = {value: new THREE.Color(LIME_SOFT)};

  const rig = new Map<MascotPartId, RiggedPart>();
  const disposables: Array<{dispose: () => void}> = [];

  // Declared up front because the texture-load callbacks below need to request
  // a repaint. Stays a no-op on the animated path, which repaints every frame.
  let scheduleStaticRedraw: () => void = () => undefined;

  for (const part of mascotParts) {
    const texture = new THREE.Texture();
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.minFilter = THREE.LinearMipMapLinearFilter;
    texture.magFilter = THREE.LinearFilter;
    texture.generateMipmaps = true;
    texture.anisotropy = renderer.capabilities.getMaxAnisotropy();

    const uReady = {value: 0};
    const partOpacity = {value: part.initialOpacity ?? 1};

    const material = new THREE.ShaderMaterial({
      uniforms: {
        uMap: {value: texture},
        uTime,
        uIntensity,
        uOpacity,
        uPartOpacity: partOpacity,
        uReady,
        uSignal,
        uColor,
        uColorB
      },
      vertexShader,
      fragmentShader,
      transparent: true,
      depthWrite: false,
      depthTest: false,
      side: THREE.DoubleSide
    });

    const geometry = new THREE.PlaneGeometry(part.width, part.height, 1, 1);
    // Move the geometry so the declared pivot lands on the mesh origin. A limb
    // that rotates about the centre of its own plane visibly detaches from the
    // shoulder as it swings; one that rotates about the shoulder does not.
    if (part.pivotX || part.pivotY) {
      geometry.translate(
        -(part.pivotX ?? 0) * part.width,
        -(part.pivotY ?? 0) * part.height,
        0
      );
    }
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(part.x, part.y, part.z);
    mesh.renderOrder = Math.round((part.z + 1) * 100);
    if (part.flipX) {
      mesh.scale.x = -1;
    }
    (STAND_PARTS.has(part.id) ? stand : torso).add(mesh);

    disposables.push(geometry, material, texture);
    rig.set(part.id, {part, mesh, material, texture, partOpacity});

    const image = new Image();
    image.decoding = "async";
    image.onload = () => {
      texture.image = image;
      texture.needsUpdate = true;
      uReady.value = 1;
      scheduleStaticRedraw();
    };
    image.onerror = () => {
      // A missing part is better than a broken figure — leave it hidden.
      uReady.value = 0;
    };
    image.src = toDataUri(part.svg);
  }

  // ---- Floor ------------------------------------------------------------
  // Two slow rings and a pool. This is the one piece of "projection" staging
  // that earns its place: it grounds the figure so it is standing rather than
  // hovering. The scan ring that used to sweep the body has gone — a hoop
  // travelling through a character is a special effect, not characterisation.

  const floor = new THREE.Group();
  floor.position.y = FLOOR_Y;
  floor.rotation.x = FLOOR_TILT;
  root.add(floor);

  // Sized from the same constants the camera framing is solved from, so the
  // ellipse can never quietly grow past the edge of the canvas again.
  const outerRingGeometry = new THREE.TorusGeometry(
    OUTER_RING_RADIUS,
    OUTER_RING_TUBE,
    8,
    96
  );
  const outerRingMaterial = new THREE.MeshBasicMaterial({
    color: LIME,
    transparent: true,
    opacity: 0.55,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  });
  const outerRing = new THREE.Mesh(outerRingGeometry, outerRingMaterial);
  floor.add(outerRing);

  const innerRingGeometry = new THREE.TorusGeometry(0.41, 0.005, 8, 72);
  const innerRingMaterial = new THREE.MeshBasicMaterial({
    color: LIME_SOFT,
    transparent: true,
    opacity: 0.45,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  });
  const innerRing = new THREE.Mesh(innerRingGeometry, innerRingMaterial);
  floor.add(innerRing);

  const discGeometry = new THREE.CircleGeometry(0.34, 48);
  const discMaterial = new THREE.MeshBasicMaterial({
    color: LIME,
    transparent: true,
    opacity: 0.12,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  });
  const disc = new THREE.Mesh(discGeometry, discMaterial);
  floor.add(disc);

  disposables.push(
    outerRingGeometry,
    outerRingMaterial,
    innerRingGeometry,
    innerRingMaterial,
    discGeometry,
    discMaterial
  );

  /*
   * No light-shaft cone here on purpose. A ConeGeometry has a hard silhouette,
   * so under additive blending its two slanted edges stay visible as lines no
   * matter how far the opacity drops — it reads as a wireframe triangle behind
   * the mascot rather than as light. The floor rings plus the CSS bloom on the
   * canvas sell the staging without it.
   */

  // ---- Ambient motes ----------------------------------------------------
  // Fewer and dimmer than the old particle field, which read as a status
  // effect. At this density they are dust in a light beam.

  const moteCount = isMobile ? MOTE_COUNT_MOBILE : MOTE_COUNT;
  const motePositions = new Float32Array(moteCount * 3);
  const moteSpeeds = new Float32Array(moteCount);

  for (let index = 0; index < moteCount; index += 1) {
    const radius = 0.25 + seededRandom(index + 1) * 0.95;
    const theta = seededRandom(index + 101) * Math.PI * 2;
    motePositions[index * 3] = Math.cos(theta) * radius;
    motePositions[index * 3 + 1] = FLOOR_Y + seededRandom(index + 201) * 2.4;
    motePositions[index * 3 + 2] = Math.sin(theta) * radius * 0.45;
    moteSpeeds[index] = 0.04 + seededRandom(index + 301) * 0.16;
  }

  const moteGeometry = new THREE.BufferGeometry();
  const moteAttribute = new THREE.BufferAttribute(motePositions, 3);
  moteGeometry.setAttribute("position", moteAttribute);

  const moteMaterial = new THREE.PointsMaterial({
    color: LIME_SOFT,
    size: 0.014,
    transparent: true,
    opacity: 0.24,
    depthWrite: false,
    blending: THREE.AdditiveBlending
  });
  const motes = new THREE.Points(moteGeometry, moteMaterial);
  root.add(motes);
  disposables.push(moteGeometry, moteMaterial);

  // ---- Rig --------------------------------------------------------------

  const engine = createMotionEngine({seed: motionSeed});

  let mood: HologramMood = "idle";
  let active = false;
  let pointerX = 0;
  let pointerY = 0;
  let pointerOverride: {x: number; y: number} | null = null;
  let attentionTarget: AttentionTarget | null = null;
  let interest = 0;
  let motionMode: MotionPreference = motionPreference;
  let frameId = 0;
  let timeScale = 1;
  let paused = false;
  let lastPose: MascotPose | null = null;
  const clock = new THREE.Clock();

  const eyeWhite = rig.get("eyeWhite");
  const iris = rig.get("iris");
  const blink = rig.get("blink");
  const smile = rig.get("smile");
  const talk = rig.get("talk");
  const stem = rig.get("stem");
  const armLeft = rig.get("armLeft");
  const armRight = rig.get("armRight");
  const body = rig.get("body");

  const resize = (): void => {
    const width = container.clientWidth;
    const height = container.clientHeight;
    if (width <= 0 || height <= 0) {
      return;
    }

    const aspect = width / height;
    camera.aspect = aspect;

    root.position.set(FRAME.offsetX, FRAME.offsetY, 0);

    // Thin additive lines lose contrast first as the canvas shrinks, so a small
    // canvas still gets the opacity lift. It keys off rendered size now rather
    // than off which frame was picked — there is only one frame.
    const small = pixelsPerUnit(width, height, FRAME) < SMALL_CANVAS_PX_PER_UNIT;
    outerRingMaterial.opacity = small ? 0.78 : 0.55;
    innerRingMaterial.opacity = small ? 0.62 : 0.45;

    // Frame the figure whatever the container shape: solve for the distance
    // that fits both the vertical and the horizontal extent.
    const halfFov = THREE.MathUtils.degToRad(FOV) / 2;
    const distanceForHeight = FRAME.halfHeight / Math.tan(halfFov);
    const distanceForWidth = FRAME.halfWidth / (Math.tan(halfFov) * aspect);
    camera.position.set(0, 0, Math.max(distanceForHeight, distanceForWidth));
    camera.lookAt(0, 0, 0);
    camera.updateProjectionMatrix();

    renderer.setSize(width, height, false);

    // setSize reallocates the drawing buffer, so a static scene must repaint or
    // it stays blank for the rest of the session.
    scheduleStaticRedraw();
  };

  resize();

  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(container);

  /** Copies a pose onto the meshes. No decisions are made here. */
  const applyPose = (pose: MascotPose, elapsed: number): void => {
    uTime.value = elapsed;
    uIntensity.value = pose.intensity;

    torso.position.set(pose.root.x, pose.root.y, 0);
    torso.rotation.y = pose.root.rotY;
    torso.rotation.z = pose.root.rotZ;
    torso.scale.setScalar(pose.root.scale);
    // Feet follow the weight shift a little, but never the bob or the scale.
    stand.position.x = pose.stand.x;

    if (body) {
      body.mesh.scale.x = pose.bodyScaleX;
      body.mesh.scale.y = pose.bodyScaleY;
    }

    if (eyeWhite) {
      eyeWhite.mesh.scale.y = pose.eyeOpen;
    }
    if (iris) {
      iris.mesh.scale.y = pose.eyeOpen;
      iris.mesh.position.x = iris.part.x + pose.irisX;
      iris.mesh.position.y = iris.part.y + pose.irisY;
    }
    if (blink) {
      blink.partOpacity.value = pose.lidOpacity;
    }

    if (talk && smile) {
      talk.partOpacity.value = pose.mouthTalk;
      smile.partOpacity.value = 1 - pose.mouthTalk;
      talk.mesh.scale.y = pose.jawScaleY;
    }

    if (stem) {
      stem.mesh.rotation.z = pose.stemRot;
    }
    if (armLeft) {
      armLeft.mesh.rotation.z = pose.armLeft.rot;
      armLeft.mesh.position.y = armLeft.part.y + pose.armLeft.y;
    }
    if (armRight) {
      armRight.mesh.rotation.z = pose.armRight.rot;
      armRight.mesh.position.y = armRight.part.y + pose.armRight.y;
    }

    // Floor reacts to the figure's energy rather than running its own clock.
    outerRing.rotation.z = elapsed * 0.34;
    innerRing.rotation.z = -elapsed * 0.22;
    outerRing.scale.setScalar(1 + pose.channels.breath * 0.02);
    innerRing.scale.setScalar(1 - pose.channels.breath * 0.015);
    discMaterial.opacity = 0.08 + pose.intensity * 0.07;

    moteMaterial.opacity = 0.16 + pose.intensity * 0.1;
  };

  const advanceMotes = (dt: number, energy: number): void => {
    for (let index = 0; index < moteCount; index += 1) {
      motePositions[index * 3 + 1] += moteSpeeds[index] * dt * (0.5 + energy * 0.5);
      if (motePositions[index * 3 + 1] > FLOOR_Y + 2.5) {
        motePositions[index * 3 + 1] = FLOOR_Y;
      }
    }
    moteAttribute.needsUpdate = true;
    motes.rotation.y += dt * 0.04;
  };

  const advance = (dt: number): void => {
    const pointer = pointerOverride ?? {x: pointerX, y: pointerY};
    const pose = engine.update(dt, {
      mood,
      active,
      pointerX: pointer.x,
      pointerY: pointer.y,
      attention: attentionTarget,
      interest
    });
    lastPose = pose;
    applyPose(pose, engine.elapsed());
    advanceMotes(dt, pose.intensity);
    renderer.render(scene, camera);
  };

  // One settled frame — present, but not alive. It must be redrawn on demand:
  // a fixed burst of frames at startup leaves the canvas permanently blank
  // after any later resize, because setSize reallocates the drawing buffer and
  // nothing repaints it. Every input that changes the image schedules a repaint
  // instead (texture load, resize, mood, active).
  // Synchronous on purpose. Deferring to rAF leaves the canvas visibly blank
  // between setSize (which clears the drawing buffer) and the repaint, which is
  // long enough to catch on a resize. The scene is a handful of planes, so
  // painting inline costs nothing.
  const paintStaticFrame = (): void => {
    const pose = engine.restPose();
    // No simulation runs on this path, so the damped intensity would be stuck
    // at its initial value. Jump it to the mood's destination.
    pose.intensity = moodIntensity(mood);
    lastPose = pose;
    applyPose(pose, 0);
    renderer.render(scene, camera);
  };

  const animate = (): void => {
    frameId = window.requestAnimationFrame(animate);
    const raw = Math.min(clock.getDelta(), 0.05);
    if (paused) {
      return;
    }
    advance(raw * timeScale);
  };

  /**
   * Switches between the live loop and the settled frame **without rebuilding
   * the scene**. Recreating it to honour a preference change tore down the
   * WebGL context, reloaded every texture and zeroed every spring, which the
   * visitor saw as a hard cut in the middle of their own toggle.
   */
  let animating = false;
  const setAnimating = (next: boolean): void => {
    if (next === animating) {
      return;
    }
    animating = next;
    if (animating) {
      scheduleStaticRedraw = () => undefined;
      // Discard the wall-clock time spent stopped, or resuming jumps forward.
      clock.getDelta();
      animate();
    } else {
      window.cancelAnimationFrame(frameId);
      frameId = 0;
      scheduleStaticRedraw = paintStaticFrame;
      paintStaticFrame();
    }
  };

  // Not `setAnimating(!prefersReducedMotion)`: `animating` starts false, so the
  // reduced-motion case would early-return and never paint its first frame.
  if (prefersReducedMotion) {
    scheduleStaticRedraw = paintStaticFrame;
    paintStaticFrame();
  } else {
    setAnimating(true);
  }

  return {
    webglAvailable: true,
    setMood: (next) => {
      mood = next;
      scheduleStaticRedraw();
    },
    setActive: (next) => {
      active = next;
      scheduleStaticRedraw();
    },
    setPointer: (x, y) => {
      pointerX = THREE.MathUtils.clamp(x, -1, 1);
      pointerY = THREE.MathUtils.clamp(y, -1, 1);
    },
    lookAt: (rect, weight = 1) => {
      if (!rect) {
        attentionTarget = null;
        return;
      }
      const bounds = container.getBoundingClientRect();
      if (bounds.width === 0 || bounds.height === 0) {
        return;
      }
      // Convert a viewport rect into the mascot's own space. Normalising by
      // half the stage means 1.0 is roughly the edge of its frame, so a target
      // beside the canvas — the composer, a chip — lands just outside and the
      // character looks toward it rather than through it.
      const targetX = rect.left + rect.width / 2;
      const targetY = rect.top + rect.height / 2;
      const originX = bounds.left + bounds.width / 2;
      const originY = bounds.top + bounds.height / 2;
      attentionTarget = {
        x: THREE.MathUtils.clamp((targetX - originX) / (bounds.width / 2), -1.6, 1.6),
        y: THREE.MathUtils.clamp((targetY - originY) / (bounds.height / 2), -1.6, 1.6),
        weight: THREE.MathUtils.clamp(weight, 0, 1)
      };
      // No repaint: the settled pose ignores attention, and this fires on every
      // pointer move.
    },
    setInterest: (next) => {
      interest = THREE.MathUtils.clamp(next, 0, 1);
    },
    beat: (event) => {
      // Impulses land in springs, which the settled pose does not read — so on
      // the reduced-motion path a beat is correctly invisible and costs nothing.
      engine.trigger(event);
    },
    setMotionPreference: (preference) => {
      if (preference === motionMode) {
        return;
      }
      motionMode = preference;
      const reduced =
        !forceAnimate &&
        (motionMode === "reduced" ||
          (motionMode === "system" && systemPrefersReducedMotion));
      setAnimating(!reduced);
    },
    motion: {
      setChannels: (mask) => {
        engine.setChannels(mask);
        scheduleStaticRedraw();
      },
      getChannels: () => engine.getChannels(),
      setTimeScale: (scale) => {
        timeScale = Math.max(0, scale);
      },
      setPaused: (next) => {
        paused = next;
        // Discard the wall-clock time spent paused, or resuming jumps.
        clock.getDelta();
      },
      step: (dt = 1 / 60) => {
        advance(dt);
      },
      trigger: (event) => {
        engine.trigger(event);
      },
      getPose: () => lastPose,
      setPointerOverride: (pointer) => {
        pointerOverride = pointer;
      },
      setAttention: (target) => {
        attentionTarget = target;
      },
      setInterest: (next) => {
        interest = Math.min(1, Math.max(0, next));
      },
      reset: () => {
        engine.reset();
      }
    },
    dispose: () => {
      window.cancelAnimationFrame(frameId);
      // Nothing to cancel for the static path — it paints inline.
      scheduleStaticRedraw = () => undefined;
      resizeObserver.disconnect();
      for (const item of disposables) {
        item.dispose();
      }
      scene.clear();
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    }
  };
}
