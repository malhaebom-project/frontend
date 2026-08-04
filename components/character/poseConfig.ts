import type { CharacterEmotion, CharacterState, MouthShapeKey } from "./teacherTypes";

/**
 * Arms/head/torso are now a single fixed illustrated pose (see
 * `Teacher2D.tsx`) - per-state limb articulation was cut because the
 * illustrated arm art has no separate shoulder/elbow/wrist pieces, and
 * rotating it exposed seams that read as "not human-shaped". The only two
 * things that still animate are eye blink and mouth/viseme, so this file
 * only needs to resolve the two visual cues that come from state/emotion:
 * which of the 4 illustrated mouths to rest on, and how strong the blush is.
 */
export type Pose = {
  defaultMouth: MouthShapeKey;
  blush: number;
};

const BASE_POSE: Pose = {
  defaultMouth: "REST",
  blush: 0.25,
};

const STATE_POSE: Record<CharacterState, Partial<Pose>> = {
  idle: {},
  welcome: { defaultMouth: "SMILE", blush: 0.45 },
  listening: {},
  speaking: {},
  thinking: {},
  correct: { defaultMouth: "SMILE", blush: 0.6 },
  feedback: { defaultMouth: "SMILE" },
  error: { defaultMouth: "SAD" },
};

const EMOTION_OVERRIDE: Record<CharacterEmotion, Partial<Pose>> = {
  neutral: {},
  happy: { defaultMouth: "SMILE", blush: 0.55 },
  encouraging: { defaultMouth: "SMILE", blush: 0.45 },
  curious: {},
  surprised: { defaultMouth: "O" },
  sorry: { defaultMouth: "SAD" },
};

export function getPose(state: CharacterState, emotion: CharacterEmotion = "neutral"): Pose {
  return {
    ...BASE_POSE,
    ...STATE_POSE[state],
    ...(emotion !== "neutral" ? EMOTION_OVERRIDE[emotion] : null),
  };
}
