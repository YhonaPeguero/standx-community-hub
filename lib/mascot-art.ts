/**
 * The StandX mascot, drawn as separate SVG parts so the rig can animate it.
 *
 * Each part becomes its own textured plane in `lib/hologram-scene.ts`, which is
 * what lets the eye track the pointer, the lid blink, the mouth open while the
 * assistant speaks, and the leaf sway independently of the body. A single flat
 * PNG could not do any of that.
 *
 * These colours ship as drawn. The scene lights the artwork — a lime bounce in
 * the shadows and a lime rim on the silhouette — rather than recolouring it, so
 * the shell stays charcoal and the black outlines stay black. Those outlines are
 * the only thing separating an arm from the body at dock size.
 *
 * Coordinate contract: `width`/`height`/`x`/`y` are in body-diameter units —
 * the body circle is 1.0 wide and centred on (0, 0). The scene applies a single
 * scale factor, so nothing here needs to know about world size.
 *
 * `pivotX`/`pivotY` move a part's rotation origin off its centre. A limb that
 * rotates about the middle of its own plane detaches from the body as it
 * swings; a limb that rotates about its shoulder does not. Every part the rig
 * rotates therefore declares a pivot.
 */

const INK = "#050505";
// These are the mascot's real colours and they render as-is — the shader no
// longer maps luminance onto a lime ramp, it lights the artwork. So the shell
// values are the reference's charcoal, not values chosen to survive a tint.
const SHELL = "#2e2e2e";
const SHELL_LIT = "#4d4d4d";
const SHELL_DEEP = "#151515";
const CREAM = "#f7f4ec";
const IRIS = "#158a3c";
const LEAF = "#22a544";
const LEAF_LIT = "#7ee08f";
const LEAF_VEIN = "#0f6b28";

function svg(width: number, height: number, content: string): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">${content}</svg>`;
}

/* ---------------------------------------------------------------- body ---- */

// Tight highlight, long dark falloff. A wide soft gradient averages the whole
// ball to mid-grey, which the shader then renders as a uniform green disc.
const bodySvg = svg(
  600,
  600,
  `<defs>
     <radialGradient id="shell" cx="33%" cy="25%" r="76%">
       <stop offset="0%" stop-color="${SHELL_LIT}"/>
       <stop offset="34%" stop-color="${SHELL}"/>
       <stop offset="100%" stop-color="${SHELL_DEEP}"/>
     </radialGradient>
   </defs>
   <circle cx="300" cy="300" r="262" fill="url(#shell)" stroke="${INK}" stroke-width="26"/>
   <path d="M 126 214 C 166 128, 250 80, 336 84"
         fill="none" stroke="#6e6e6e" stroke-width="18" stroke-linecap="round" opacity="0.42"/>`
);

/* ---------------------------------------------------------------- limbs --- */

// Tapered flipper. Wide at the shoulder (left edge, which is also the pivot),
// narrowing to a rounded tip. Drawn pointing right and slightly down; the rig
// mirrors it for the other side.
const armSvg = svg(
  300,
  180,
  `<path d="M 10 40
            C 84 16, 176 42, 240 96
            C 276 126, 282 158, 254 168
            C 226 178, 168 148, 112 122
            C 70 102, 28 84, 8 76 Z"
      fill="${SHELL}" stroke="${INK}" stroke-width="22" stroke-linejoin="round"/>`
);

// A straight peg leg with a rounded foot. The reference has simple pegs; the
// old flat ellipse read as a smudge under the body rather than a limb.
const legSvg = svg(
  120,
  280,
  `<path d="M 60 12
            C 90 12, 100 34, 99 78
            L 96 206
            C 95 244, 82 262, 60 262
            C 38 262, 25 244, 24 206
            L 21 78
            C 20 34, 30 12, 60 12 Z"
      fill="${SHELL}" stroke="${INK}" stroke-width="21" stroke-linejoin="round"/>`
);

/* ----------------------------------------------------------------- leaf --- */

// The crown is the mascot's version of the StandX delta mark: a charcoal loop
// grows out of the body, curls over itself and resolves into the green blade.
// Two strokes are intentional. A black-only stalk disappears on the site's
// near-black background and leaves a floating leaf; the charcoal inner stroke
// keeps the loop readable while the black outer stroke preserves the inked
// character style. Pivot is the bottom-left corner, where the loop meets the
// head.
const stemSvg = svg(
  560,
  300,
  `<defs>
     <linearGradient id="stem-shell" x1="0%" y1="0%" x2="100%" y2="100%">
       <stop offset="0%" stop-color="${SHELL_LIT}"/>
       <stop offset="58%" stop-color="${SHELL}"/>
       <stop offset="100%" stop-color="${SHELL_DEEP}"/>
     </linearGradient>
   </defs>
   <path d="M 42 292 C 20 216, 30 132, 88 78 C 128 40, 188 40, 244 64"
      fill="none" stroke="${INK}" stroke-width="58" stroke-linecap="round"/>
   <path d="M 42 292 C 20 216, 30 132, 88 78 C 128 40, 188 40, 244 64"
      fill="none" stroke="url(#stem-shell)" stroke-width="34" stroke-linecap="round"/>
   <path d="M 232 62
             C 300 24, 404 12, 546 24
            C 504 92, 404 128, 306 120
            C 266 116, 240 96, 232 62 Z"
      fill="${LEAF}" stroke="${INK}" stroke-width="20" stroke-linejoin="round"/>
   <path d="M 258 100 C 322 126, 420 112, 512 56"
      fill="none" stroke="${LEAF_LIT}" stroke-width="18" opacity="0.62" stroke-linecap="round"/>
   <path d="M 246 70 C 330 60, 434 46, 538 30"
      fill="none" stroke="${LEAF_VEIN}" stroke-width="14" stroke-linecap="round"/>
   <path d="M 306 66 C 320 82, 332 92, 348 100"
      fill="none" stroke="${LEAF_VEIN}" stroke-width="8" opacity="0.7" stroke-linecap="round"/>
   <path d="M 386 54 C 398 70, 410 80, 426 88"
      fill="none" stroke="${LEAF_VEIN}" stroke-width="8" opacity="0.7" stroke-linecap="round"/>`
);

/* ------------------------------------------------------------------ eye --- */

const eyeWhiteSvg = svg(
  360,
  360,
  `<circle cx="180" cy="180" r="168" fill="${CREAM}" stroke="${INK}" stroke-width="14"/>`
);

// No pupil and no rim stroke. The reference iris is a solid green disc with one
// big specular highlight — adding a dark pupil under the shader's luminance ramp
// punches a hole in the eye, and an outline between iris and sclera reads as a
// donut.
const irisSvg = svg(
  280,
  280,
  `<circle cx="140" cy="140" r="134" fill="${IRIS}"/>
   <circle cx="140" cy="98" r="62" fill="#ffffff"/>`
);

// Closed-lid line, cross-faded in as the eye squashes shut.
const blinkSvg = svg(
  360,
  110,
  `<path d="M 30 64 C 112 16, 248 16, 330 64"
      fill="none" stroke="${CREAM}" stroke-width="30" stroke-linecap="round"/>`
);

/* ---------------------------------------------------------------- mouth --- */

const smileSvg = svg(
  280,
  160,
  `<path d="M 24 32 C 70 130, 210 130, 256 32"
      fill="none" stroke="${CREAM}" stroke-width="32" stroke-linecap="round"/>`
);

// Flat-top half disc — the classic open-mouth read.
const talkSvg = svg(
  280,
  160,
  `<path d="M 36 44 L 244 44 A 104 104 0 0 1 36 44 Z" fill="${CREAM}"/>
   <path d="M 92 108 A 52 34 0 0 1 188 108 Z" fill="#c94f4f" opacity="0.85"/>`
);

/** Identifies a part so the scene can rig it by name. */
export type MascotPartId =
  | "stem"
  | "armLeft"
  | "armRight"
  | "footLeft"
  | "footRight"
  | "body"
  | "eyeWhite"
  | "iris"
  | "blink"
  | "smile"
  | "talk";

export interface MascotPart {
  id: MascotPartId;
  svg: string;
  /** Plane size in body-diameter units. */
  width: number;
  height: number;
  /** Rotation origin, and the point `x`/`y` positions. Plane-local, where 0 is
   *  the centre and -0.5/+0.5 are the edges. Defaults to the centre. */
  pivotX?: number;
  pivotY?: number;
  /** Where the pivot sits, in body-diameter units relative to the body centre. */
  x: number;
  y: number;
  /** Draw order. Higher renders in front. */
  z: number;
  /** Mirrors the texture horizontally — lets both arms share one drawing. */
  flipX?: boolean;
  /** Parts that start hidden and are faded in by the rig. */
  initialOpacity?: number;
}

/**
 * Vertical layout, in body-diameter units. The body circle's visible radius is
 * 0.513 (r=262 plus a 26 stroke, over a 600 box, on a 1.12 plane), so:
 *
 *   leaf top   +0.88
 *   stalk base +0.42  (inside the ball, so the sprig has something to grow from)
 *   crown      +0.51
 *   centre      0.00
 *   ball base  -0.51
 *   foot base  -0.63  <- FLOOR_Y in the scene. The character stands on the ring.
 *
 * Measured off the reference art rather than guessed: the legs show only 0.12
 * below the silhouette (12% of body diameter) and the arm tip clears it by
 * 0.13. Both were more than double that and read as spider limbs.
 *
 * Legs overlap the ball by 0.16, which is what lets the torso breathe without
 * opening a gap at the hip.
 */
export const mascotParts: MascotPart[] = [
  // Pivot at the stalk's base so the sprig bends from the crown, not from the
  // middle of its own bounding box.
  {
    id: "stem",
    svg: stemSvg,
    width: 0.78,
    height: 0.482,
    pivotX: -0.5,
    pivotY: -0.5,
    x: -0.16,
    y: 0.42,
    z: -0.03
  },
  // Limbs sit behind the shell and must overlap it, or they read as detached
  // blobs. Pivot at the shoulder edge, so a swing rotates the free end.
  {
    id: "armLeft",
    svg: armSvg,
    width: 0.32,
    height: 0.24,
    pivotX: -0.5,
    pivotY: 0,
    x: -0.3,
    y: -0.1,
    z: -0.02,
    flipX: true
  },
  {
    id: "armRight",
    svg: armSvg,
    width: 0.32,
    height: 0.24,
    pivotX: -0.5,
    pivotY: 0,
    x: 0.3,
    y: -0.1,
    z: -0.02
  },
  // Pivot at the hip so a leg can swing from the top rather than the knee.
  {
    id: "footLeft",
    svg: legSvg,
    width: 0.15,
    height: 0.28,
    pivotX: 0,
    pivotY: 0.5,
    x: -0.15,
    y: -0.35,
    z: -0.02
  },
  {
    id: "footRight",
    svg: legSvg,
    width: 0.15,
    height: 0.28,
    pivotX: 0,
    pivotY: 0.5,
    x: 0.15,
    y: -0.35,
    z: -0.02
  },
  {id: "body", svg: bodySvg, width: 1.12, height: 1.12, x: 0, y: 0, z: 0},
  {id: "eyeWhite", svg: eyeWhiteSvg, width: 0.54, height: 0.54, x: -0.01, y: 0.07, z: 0.01},
  {id: "iris", svg: irisSvg, width: 0.37, height: 0.37, x: -0.01, y: 0.07, z: 0.02},
  {id: "blink", svg: blinkSvg, width: 0.54, height: 0.17, x: -0.01, y: 0.07, z: 0.03, initialOpacity: 0},
  // The reference smile is a compact expression, not a second horizontal
  // feature spanning the torso. Keeping it near one third of the shell width
  // stops the circular body reading as a wide belly while preserving the
  // mascot's friendly face. Rest and speech share the same footprint so their
  // cross-fade never changes the apparent proportions of the head.
  {id: "smile", svg: smileSvg, width: 0.34, height: 0.22, x: 0, y: -0.29, z: 0.02},
  {id: "talk", svg: talkSvg, width: 0.34, height: 0.22, x: 0, y: -0.29, z: 0.02, initialOpacity: 0}
];

export function toDataUri(source: string): string {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(source)}`;
}
