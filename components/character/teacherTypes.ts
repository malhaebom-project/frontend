/**
 * Shared types for the 2D English-teacher character.
 * `viseme` / `visemeCues` are shaped to match AWS Polly "Speech Marks"
 * (`{ time, type: "viseme", value }` -> here `{ timeMs, viseme }`) so a
 * future Polly integration only needs to feed this interface.
 */

export type CharacterState =
  | "idle"
  | "welcome"
  | "listening"
  | "speaking"
  | "thinking"
  | "correct"
  | "feedback"
  | "error";

export type CharacterEmotion =
  | "neutral"
  | "happy"
  | "encouraging"
  | "curious"
  | "surprised"
  | "sorry";

/** Polly viseme ids ("p", "t", "S", "T", "f", "k", "i", "r", "s", "u", "@",
 * "a", "e", "E", "i", "o", "O", "u", "sil", ...) are mapped down to these
 * mouth-shape keys inside `mouthShapes.ts` via `POLLY_VISEME_TO_SHAPE`. */
export type MouthShapeKey =
  | "REST"
  | "A"
  | "E"
  | "I"
  | "O"
  | "U"
  | "MBP"
  | "FV"
  | "L_TH"
  | "SMILE"
  | "SAD";

export type VisemeCue = {
  /** Offset in milliseconds from the start of audio playback. */
  timeMs: number;
  /** Either a MouthShapeKey directly, or a raw Polly viseme id/phoneme. */
  viseme: string;
};

export type CharacterProps = {
  state: CharacterState;
  emotion?: CharacterEmotion;
  /** Explicit mouth shape override (bypasses visemeCues/audio timing). */
  viseme?: MouthShapeKey;
  /** 0..1 openness override, layered on top of the active viseme shape. */
  mouthLevel?: number;
  /** Timestamped viseme track (Polly Speech Marks-shaped) for lip sync. */
  visemeCues?: VisemeCue[];
  /** Audio element whose currentTime drives visemeCues playback. */
  audioElement?: HTMLAudioElement | null;
  /** Render size in px (square). Defaults to 360. */
  size?: number;
  className?: string;
  /** Freezes breathing/sway/gesture loops and eye-blink for QA/screenshots. */
  paused?: boolean;
};
