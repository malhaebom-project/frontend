"use client";

import { useEffect, useId, useMemo, useRef } from "react";
import styles from "./Teacher2D.module.css";
import { getPose } from "./poseConfig";
import { useBlink, useMouthAnimation, usePrefersReducedMotion } from "./useCharacterAnimation";
import type { CharacterProps } from "./teacherTypes";

/**
 * The body stays as one intact illustration. Only the fixed eyelids and the
 * small vector mouth rig animate, so speaking can never disturb the face,
 * arms, or desk alignment.
 */
const ASSET_BASE = "/character/teacher2d-mvp";
const STATE_ASSET_BASE = "/character/teacher2d-states";
const FRAME_WIDTH = 1163;
const FRAME_HEIGHT = 1353;
const MOUTH_SCALE = 2.05;

type FrameConfig = {
  file: string;
  mouthX: number;
  mouthY: number;
  leftEyeX: number;
  rightEyeX: number;
  eyeY: number;
};

const BASE_FRAME: FrameConfig = {
  file: `${ASSET_BASE}/base-neutral.png`,
  mouthX: 575,
  mouthY: 508,
  leftEyeX: 499,
  rightEyeX: 652,
  eyeY: 411,
};

/**
 * AI pose frames keep the character as one intact illustration. Each frame
 * owns only a small set of face anchors because generated canvases differ by
 * a few pixels; blink and lip-sync remain the same SVG rigs on top.
 */
const STATE_FRAME: Record<CharacterProps["state"], FrameConfig> = {
  idle: BASE_FRAME,
  speaking: BASE_FRAME,
  welcome: {
    file: `${STATE_ASSET_BASE}/welcome.png`,
    mouthX: 587,
    mouthY: 505,
    leftEyeX: 506,
    rightEyeX: 670,
    eyeY: 408,
  },
  listening: {
    file: `${STATE_ASSET_BASE}/listening.png`,
    mouthX: 586,
    mouthY: 506,
    leftEyeX: 506,
    rightEyeX: 666,
    eyeY: 407,
  },
  thinking: {
    file: `${STATE_ASSET_BASE}/thinking.png`,
    mouthX: 565,
    mouthY: 506,
    leftEyeX: 488,
    rightEyeX: 644,
    eyeY: 406,
  },
  correct: {
    file: `${STATE_ASSET_BASE}/correct.png`,
    mouthX: 598,
    mouthY: 506,
    leftEyeX: 510,
    rightEyeX: 674,
    eyeY: 404,
  },
  feedback: {
    file: `${STATE_ASSET_BASE}/feedback.png`,
    mouthX: 586,
    mouthY: 506,
    leftEyeX: 506,
    rightEyeX: 666,
    eyeY: 407,
  },
  error: {
    ...BASE_FRAME,
    file: `${STATE_ASSET_BASE}/feedback.png`,
    mouthX: 586,
    mouthY: 506,
    leftEyeX: 506,
    rightEyeX: 666,
    eyeY: 407,
  },
};

function CharacterFrame({ file }: { file: string }) {
  return (
    <image
      href={file}
      x="0"
      y="0"
      width={FRAME_WIDTH}
      height={FRAME_HEIGHT}
      preserveAspectRatio="none"
    />
  );
}

export function Teacher2D({
  state,
  emotion = "neutral",
  viseme,
  mouthLevel,
  visemeCues,
  audioElement,
  size = 360,
  className = "",
  paused = false,
}: CharacterProps) {
  const reducedMotion = usePrefersReducedMotion();
  const blinking = useBlink(reducedMotion || paused);
  const pose = useMemo(() => getPose(state, emotion), [state, emotion]);
  const frame = STATE_FRAME[state];
  const instanceId = useId().replace(/:/g, "");
  const mouthPatchId = `teacher-mouth-patch-${instanceId}`;
  const mouthClipId = `teacher-mouth-inner-${instanceId}`;
  const lipGradientId = `teacher-lip-gradient-${instanceId}`;
  const tongueGradientId = `teacher-tongue-gradient-${instanceId}`;

  const simulatedStartRef = useRef<number | null>(null);
  useEffect(() => {
    simulatedStartRef.current = !audioElement && visemeCues?.length ? performance.now() : null;
  }, [visemeCues, audioElement]);

  /**
   * This uses the same idea as the original mascot: mouth values are updated
   * continuously and eased over roughly 70ms instead of swapping whole mouth
   * pictures. Viseme cues still win when they exist; speaking without cues
   * gets the original mascot's two-frequency speech pulse as a fallback.
   */
  const mouth = useMouthAnimation({
    viseme,
    mouthLevel,
    visemeCues,
    audioElement,
    simulatedPlaybackStartRef: simulatedStartRef,
    fallbackShape: pose.defaultMouth,
    reducedMotion: reducedMotion || paused,
    speechPulse: state === "speaking" && !paused,
  });

  return (
    <div
      className={`${styles.root} ${className}`}
      style={{ width: size, height: (size * FRAME_HEIGHT) / FRAME_WIDTH }}
      role="img"
      aria-label="말해봄 영어 선생님 캐릭터"
    >
      <svg
        className={styles.svg}
        viewBox={`0 0 ${FRAME_WIDTH} ${FRAME_HEIGHT}`}
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <defs>
          {/* Feathered edge hides the neutral mouth without creating a hard
              oval patch against the face's soft skin gradient. */}
          <radialGradient id={mouthPatchId} cx="50%" cy="48%" r="52%">
            <stop offset="0%" stopColor="#fccca2" />
            <stop offset="64%" stopColor="#fccca2" />
            <stop offset="84%" stopColor="#fccca2" stopOpacity="0.82" />
            <stop offset="100%" stopColor="#fccca2" stopOpacity="0" />
          </radialGradient>
          <linearGradient id={lipGradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ce6f68" />
            <stop offset="52%" stopColor="#e58a80" />
            <stop offset="100%" stopColor="#f0a097" />
          </linearGradient>
          <linearGradient id={tongueGradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ef806b" />
            <stop offset="100%" stopColor="#d85d4c" />
          </linearGradient>
          <clipPath id={mouthClipId} clipPathUnits="userSpaceOnUse">
            <path d={mouth.innerPath} />
          </clipPath>
        </defs>

        <CharacterFrame file={frame.file} />

        {/* Continuous mouth rig: all path coordinates interpolate every
            animation frame, so consonants close and vowels open smoothly. */}
        <ellipse
          className={styles.mouthPatch}
          cx={frame.mouthX}
          cy={frame.mouthY + 5}
          rx="67"
          ry="47"
          fill={`url(#${mouthPatchId})`}
        />
        <g
          className={styles.mouthRig}
          transform={`translate(${frame.mouthX} ${frame.mouthY}) scale(${MOUTH_SCALE})`}
        >
          <path className={styles.mouthOuter} d={mouth.outerPath} fill={`url(#${lipGradientId})`} />
          <path className={styles.mouthInner} d={mouth.innerPath} />
          <g clipPath={`url(#${mouthClipId})`}>
            <path className={styles.teeth} d={mouth.teethPath} opacity={mouth.teethOpacity} />
            <path
              className={styles.tongue}
              d={mouth.tonguePath}
              fill={`url(#${tongueGradientId})`}
              opacity={mouth.tongueOpacity}
            />
          </g>
          <path className={styles.lowerLipHighlight} d={mouth.lowerLipHighlightPath} />
        </g>

        {/* Blink is an overlay at fixed coordinates; the open eyes never
            translate or scale, eliminating the old upward jump. */}
        <g className={styles.blinkOverlay} style={{ opacity: blinking ? 1 : 0 }}>
          <ellipse className={styles.eyeMask} cx={frame.leftEyeX} cy={frame.eyeY} rx="52" ry="39" />
          <ellipse className={styles.eyeMask} cx={frame.rightEyeX} cy={frame.eyeY} rx="52" ry="39" />
          <path
            className={styles.closedEye}
            d={`M ${frame.leftEyeX - 41} ${frame.eyeY - 1} Q ${frame.leftEyeX} ${frame.eyeY + 24} ${frame.leftEyeX + 41} ${frame.eyeY - 1}`}
          />
          <path
            className={styles.closedEye}
            d={`M ${frame.rightEyeX - 41} ${frame.eyeY - 1} Q ${frame.rightEyeX} ${frame.eyeY + 24} ${frame.rightEyeX + 41} ${frame.eyeY - 1}`}
          />
        </g>
      </svg>
    </div>
  );
}
