import type { MouthShapeKey } from "./teacherTypes";

/**
 * Numeric mouth parameters. The lip/teeth/tongue SVG geometry is generated
 * from these numbers every frame (see `buildMouthGeometry`), so animating
 * between two `MouthShapeKey`s is just lerping these plain numbers - no
 * path-morphing library needed, and no risk of mismatched path commands.
 */
export type MouthParams = {
  /** 0 = fully closed, 1 = fully open. */
  openness: number;
  /** Horizontal scale, 1 = neutral width. */
  width: number;
  /** -1 (frown) .. 1 (smile), lifts/drops the mouth corners. */
  cornerLift: number;
  /** 0..1 opacity of the upper teeth row. */
  teethVisible: number;
  /** 0..1 opacity of the tongue tip. */
  tongueVisible: number;
  /** 0..1, upper teeth resting on the lower lip (for F/V). */
  lipBite: number;
};

export const MOUTH_SHAPE_PARAMS: Record<MouthShapeKey, MouthParams> = {
  REST: { openness: 0.035, width: 1.05, cornerLift: 0.2, teethVisible: 0, tongueVisible: 0, lipBite: 0 },
  A: { openness: 1.0, width: 1.05, cornerLift: 0, teethVisible: 0.5, tongueVisible: 0.58, lipBite: 0 },
  E: { openness: 0.42, width: 1.35, cornerLift: 0.3, teethVisible: 0.65, tongueVisible: 0.16, lipBite: 0 },
  I: { openness: 0.22, width: 1.25, cornerLift: 0.2, teethVisible: 0.3, tongueVisible: 0.08, lipBite: 0 },
  O: { openness: 0.68, width: 0.62, cornerLift: -0.05, teethVisible: 0.15, tongueVisible: 0.24, lipBite: 0 },
  U: { openness: 0.32, width: 0.5, cornerLift: -0.1, teethVisible: 0, tongueVisible: 0.14, lipBite: 0 },
  MBP: { openness: 0.02, width: 0.92, cornerLift: 0, teethVisible: 0, tongueVisible: 0, lipBite: 0 },
  FV: { openness: 0.16, width: 0.95, cornerLift: -0.05, teethVisible: 0.7, tongueVisible: 0, lipBite: 1 },
  L_TH: { openness: 0.34, width: 1.0, cornerLift: 0.1, teethVisible: 0.35, tongueVisible: 1, lipBite: 0 },
  SMILE: { openness: 0.3, width: 1.32, cornerLift: 0.85, teethVisible: 0.55, tongueVisible: 0.12, lipBite: 0 },
  SAD: { openness: 0.14, width: 0.82, cornerLift: -0.75, teethVisible: 0, tongueVisible: 0, lipBite: 0 },
};

export function lerpMouthParams(a: MouthParams, b: MouthParams, t: number): MouthParams {
  const lerp = (x: number, y: number) => x + (y - x) * t;
  return {
    openness: lerp(a.openness, b.openness),
    width: lerp(a.width, b.width),
    cornerLift: lerp(a.cornerLift, b.cornerLift),
    teethVisible: lerp(a.teethVisible, b.teethVisible),
    tongueVisible: lerp(a.tongueVisible, b.tongueVisible),
    lipBite: lerp(a.lipBite, b.lipBite),
  };
}

export type MouthGeometry = {
  outerPath: string;
  innerPath: string;
  teethPath: string;
  teethOpacity: number;
  tonguePath: string;
  tongueOpacity: number;
  lowerLipHighlightPath: string;
};

/**
 * Builds lip/inner-mouth/teeth/tongue path data from numeric params, all
 * centered on (0, 0) in local mouth-space. `Teacher2D` positions the whole
 * group with a single translate to the face's mouth anchor.
 */
export function buildMouthGeometry(p: MouthParams): MouthGeometry {
  const halfWidth = 15 * p.width;
  const openHalf = 3 + 15 * p.openness;
  const lift = -p.cornerLift * 7;
  const topCurve = -openHalf * 0.55 - Math.max(p.cornerLift, 0) * 2.4;
  const bottomCurve = openHalf * 0.95 + Math.max(-p.cornerLift, 0) * 2;

  // Three cubic sections form a soft cupid's bow instead of the previous
  // single quadratic arc, while the two lower sections keep O/U shapes round
  // rather than triangular. The command structure stays identical for every
  // viseme, so the existing numeric interpolation remains unchanged.
  const outerPath = [
    `M ${-halfWidth} ${lift}`,
    `C ${-halfWidth * 0.74} ${(lift + topCurve) * 0.5} ${-halfWidth * 0.38} ${topCurve} ${-halfWidth * 0.14} ${topCurve * 0.82}`,
    `C ${-halfWidth * 0.06} ${topCurve * 0.62} ${halfWidth * 0.06} ${topCurve * 0.62} ${halfWidth * 0.14} ${topCurve * 0.82}`,
    `C ${halfWidth * 0.38} ${topCurve} ${halfWidth * 0.74} ${(lift + topCurve) * 0.5} ${halfWidth} ${lift}`,
    `C ${halfWidth * 0.8} ${(lift + bottomCurve) * 0.55} ${halfWidth * 0.48} ${bottomCurve} 0 ${bottomCurve}`,
    `C ${-halfWidth * 0.48} ${bottomCurve} ${-halfWidth * 0.8} ${(lift + bottomCurve) * 0.55} ${-halfWidth} ${lift}`,
    "Z",
  ].join(" ");

  // A slightly smaller opening leaves a fuller upper/lower lip. The inner
  // contour still follows the outer contour, so both shapes read as one
  // mouth instead of a dark cavity floating inside a separate lip ring.
  const innerHalfWidth = halfWidth * 0.77;
  const innerTop = topCurve * 0.6;
  const innerBottom = bottomCurve * 0.7;
  const innerCorner = lift * 0.68;
  const innerPath = [
    `M ${-innerHalfWidth} ${innerCorner}`,
    `C ${-innerHalfWidth * 0.62} ${innerTop} ${-innerHalfWidth * 0.28} ${innerTop} 0 ${innerTop * 0.9}`,
    `C ${innerHalfWidth * 0.28} ${innerTop} ${innerHalfWidth * 0.62} ${innerTop} ${innerHalfWidth} ${innerCorner}`,
    `C ${innerHalfWidth * 0.68} ${innerBottom * 0.72} ${innerHalfWidth * 0.42} ${innerBottom} 0 ${innerBottom}`,
    `C ${-innerHalfWidth * 0.42} ${innerBottom} ${-innerHalfWidth * 0.68} ${innerBottom * 0.72} ${-innerHalfWidth} ${innerCorner}`,
    "Z",
  ].join(" ");

  const teethWidth = innerHalfWidth * 0.9;
  const teethTop = innerTop * 0.36 + innerCorner * 0.64 - p.lipBite * 2.5;
  const teethBottom = teethTop + 4.2 + p.lipBite * 1.6;
  const teethPath = [
    `M ${-teethWidth} ${teethTop}`,
    `Q 0 ${teethTop + 1.1} ${teethWidth} ${teethTop}`,
    `L ${teethWidth * 0.86} ${teethBottom}`,
    `Q 0 ${teethBottom + 1.2} ${-teethWidth * 0.86} ${teethBottom}`,
    "Z",
  ].join(" ");

  const tongueWidth = innerHalfWidth * 0.62;
  const tongueY = innerBottom * 0.52;
  const tonguePath = [
    `M ${-tongueWidth} ${tongueY}`,
    `Q 0 ${tongueY - 1.2} ${tongueWidth} ${tongueY}`,
    `Q ${tongueWidth * 0.74} ${innerBottom * 0.96} 0 ${innerBottom * 0.98}`,
    `Q ${-tongueWidth * 0.74} ${innerBottom * 0.96} ${-tongueWidth} ${tongueY}`,
    "Z",
  ].join(" ");

  const lowerLipHighlightPath = [
    `M ${-halfWidth * 0.4} ${bottomCurve * 0.86}`,
    `Q 0 ${bottomCurve * 1.02} ${halfWidth * 0.4} ${bottomCurve * 0.86}`,
  ].join(" ");

  return {
    outerPath,
    innerPath,
    teethPath,
    teethOpacity: p.teethVisible,
    tonguePath,
    tongueOpacity: p.tongueVisible,
    lowerLipHighlightPath,
  };
}

/**
 * Approximate mapping from Amazon Polly viseme ids to our mouth shapes.
 * Polly's exact viseme set should be re-verified against the live API
 * response when real Speech Marks are wired up (see `Teacher2D`'s
 * `visemeCues` docs) - this table only needs to be "close enough" today
 * since no live Polly traffic depends on it yet.
 */
const POLLY_VISEME_TO_SHAPE: Record<string, MouthShapeKey> = {
  sil: "REST",
  p: "MBP",
  f: "FV",
  T: "L_TH",
  t: "I",
  s: "I",
  S: "E",
  k: "I",
  i: "I",
  r: "E",
  u: "U",
  "@": "E",
  a: "A",
  e: "E",
  E: "E",
  o: "O",
  O: "O",
};

const KNOWN_SHAPES = new Set<string>(Object.keys(MOUTH_SHAPE_PARAMS));

export function visemeToShapeKey(viseme: string): MouthShapeKey {
  if (KNOWN_SHAPES.has(viseme)) return viseme as MouthShapeKey;
  return POLLY_VISEME_TO_SHAPE[viseme] ?? "REST";
}
