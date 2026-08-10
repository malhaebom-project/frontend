import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import {
  buildMouthGeometry,
  lerpMouthParams,
  MOUTH_SHAPE_PARAMS,
  visemeToShapeKey,
  type MouthGeometry,
  type MouthParams,
} from "./mouthShapes";
import type { MouthShapeKey, VisemeCue } from "./teacherTypes";

function subscribeReducedMotion(callback: () => void) {
  if (typeof window === "undefined" || !window.matchMedia) return () => {};
  const query = window.matchMedia("(prefers-reduced-motion: reduce)");
  query.addEventListener("change", callback);
  return () => query.removeEventListener("change", callback);
}

function getReducedMotionSnapshot() {
  if (typeof window === "undefined" || !window.matchMedia) return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function getReducedMotionServerSnapshot() {
  return false;
}

export function usePrefersReducedMotion() {
  return useSyncExternalStore(subscribeReducedMotion, getReducedMotionSnapshot, getReducedMotionServerSnapshot);
}

/**
 * Independent, self-restarting eye-blink timer. Deliberately isolated from
 * mouth/arm state so lip-sync updates never touch (or restart) this timer -
 * that separation is what keeps the face from "flickering" as a whole when
 * only the mouth is supposed to move.
 */
export function useBlink(reducedMotion: boolean) {
  const [blinking, setBlinking] = useState(false);

  useEffect(() => {
    if (reducedMotion) return;
    let closeTimeout: number | undefined;
    let nextBlinkTimeout: number | undefined;

    function scheduleBlink() {
      const delay = 2400 + Math.random() * 3200;
      nextBlinkTimeout = window.setTimeout(() => {
        setBlinking(true);
        closeTimeout = window.setTimeout(() => {
          setBlinking(false);
          scheduleBlink();
        }, 140);
      }, delay);
    }

    scheduleBlink();
    return () => {
      window.clearTimeout(closeTimeout);
      window.clearTimeout(nextBlinkTimeout);
    };
  }, [reducedMotion]);

  return blinking;
}

function findActiveCue(cues: VisemeCue[], elapsedMs: number): VisemeCue | null {
  let active: VisemeCue | null = null;
  for (const cue of cues) {
    if (cue.timeMs <= elapsedMs) active = cue;
    else break;
  }
  return active;
}

type ResolveKeyOptions = {
  viseme?: MouthShapeKey;
  sortedCues: VisemeCue[] | null;
  audioElement?: HTMLAudioElement | null;
  simulatedPlaybackStart: number | null;
  fallbackShape: MouthShapeKey;
};

/** Shared priority order for both the parametric (path-based) and
 * image-based mouth renderers: explicit override > audio-synced cues >
 * simulated-clock cues > state/emotion fallback shape. */
function resolveMouthTargetKey({
  viseme,
  sortedCues,
  audioElement,
  simulatedPlaybackStart,
  fallbackShape,
}: ResolveKeyOptions): MouthShapeKey {
  if (viseme) return viseme;

  if (sortedCues && sortedCues.length) {
    if (audioElement) {
      const elapsedMs = audioElement.currentTime * 1000;
      const cue = findActiveCue(sortedCues, elapsedMs);
      return cue ? visemeToShapeKey(cue.viseme) : fallbackShape;
    }
    if (simulatedPlaybackStart != null) {
      const elapsedMs = performance.now() - simulatedPlaybackStart;
      const cue = findActiveCue(sortedCues, elapsedMs);
      return cue ? visemeToShapeKey(cue.viseme) : fallbackShape;
    }
  }

  return fallbackShape;
}

type MouthAnimationOptions = {
  viseme?: MouthShapeKey;
  mouthLevel?: number;
  visemeCues?: VisemeCue[];
  audioElement?: HTMLAudioElement | null;
  /** Ref holding the performance.now() cue-playback start used when there is
   * no audioElement. A ref (not state) so
   * updating it never needs to restart this hook's animation loop. */
  simulatedPlaybackStartRef: React.RefObject<number | null>;
  fallbackShape: MouthShapeKey;
  reducedMotion: boolean;
  /** Uses the original mascot's continuous pseudo-amplitude pulse when
   * speech is active but timestamped visemes are not available yet. */
  speechPulse?: boolean;
};

/**
 * Resolves the live mouth target every frame (explicit viseme override >
 * audio-synced cues > simulated-clock cues > state/emotion fallback shape),
 * then smoothly lerps the numeric mouth params toward that target and
 * regenerates the lip/teeth/tongue SVG paths from the interpolated numbers.
 */
export function useMouthAnimation(options: MouthAnimationOptions): MouthGeometry {
  const {
    viseme,
    mouthLevel,
    visemeCues,
    audioElement,
    simulatedPlaybackStartRef,
    fallbackShape,
    reducedMotion,
    speechPulse = false,
  } = options;

  const currentRef = useRef<MouthParams>({ ...MOUTH_SHAPE_PARAMS.REST });
  const [geometry, setGeometry] = useState<MouthGeometry>(() => buildMouthGeometry(MOUTH_SHAPE_PARAMS.REST));
  const frameRef = useRef(0);
  const lastTimeRef = useRef<number | null>(null);
  const pulseStartRef = useRef<number | null>(null);

  const sortedCues = useMemo(
    () => (visemeCues ? [...visemeCues].sort((a, b) => a.timeMs - b.timeMs) : null),
    [visemeCues],
  );

  useEffect(() => {
    function tick(time: number) {
      const dtMs = lastTimeRef.current == null ? 16 : time - lastTimeRef.current;
      lastTimeRef.current = time;

      let targetKey = resolveMouthTargetKey({
        viseme,
        sortedCues,
        audioElement,
        simulatedPlaybackStart: simulatedPlaybackStartRef.current,
        fallbackShape,
      });
      let activeLevel = mouthLevel;

      if (speechPulse && !viseme && !sortedCues?.length) {
        if (pulseStartRef.current == null) pulseStartRef.current = time;
        const elapsed = (time - pulseStartRef.current) / 1000;
        const beat = Math.abs(Math.sin(elapsed * 10.5) * 0.65 + Math.sin(elapsed * 17.3) * 0.35);
        activeLevel = 0.18 + beat * 0.82;
        targetKey = activeLevel > 0.76 ? "A" : activeLevel > 0.48 ? "O" : "I";
      } else {
        pulseStartRef.current = null;
      }

      const target = MOUTH_SHAPE_PARAMS[targetKey];
      const boosted: MouthParams = activeLevel != null
        ? { ...target, openness: Math.min(1, Math.max(target.openness, activeLevel)) }
        : target;

      // Mirrors the original mascot's ~70ms CSS transition while retaining
      // continuous viseme geometry instead of discrete image swaps.
      const tau = reducedMotion ? 0.001 : 0.065;
      const t = 1 - Math.exp(-(dtMs / 1000) / tau);
      currentRef.current = lerpMouthParams(currentRef.current, boosted, t);
      setGeometry(buildMouthGeometry(currentRef.current));

      frameRef.current = requestAnimationFrame(tick);
    }

    frameRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameRef.current);
  }, [viseme, mouthLevel, sortedCues, audioElement, simulatedPlaybackStartRef, fallbackShape, reducedMotion, speechPulse]);

  return geometry;
}

type MouthImageKeyOptions = {
  viseme?: MouthShapeKey;
  visemeCues?: VisemeCue[];
  audioElement?: HTMLAudioElement | null;
  simulatedPlaybackStartRef: React.RefObject<number | null>;
  fallbackShape: MouthShapeKey;
};

/**
 * Image-layer counterpart to `useMouthAnimation`: resolves the same
 * priority order every frame, but only exposes the discrete
 * `MouthShapeKey` (no path geometry) since illustrated mouth art is
 * swapped, not morphed. Only updates React state when the key actually
 * changes, so this doesn't re-render every frame like the path version
 * needs to for smooth interpolation.
 */
export function useMouthImageKey(options: MouthImageKeyOptions): MouthShapeKey {
  const { viseme, visemeCues, audioElement, simulatedPlaybackStartRef, fallbackShape } = options;
  const [key, setKey] = useState<MouthShapeKey>(fallbackShape);
  const keyRef = useRef(key);
  const frameRef = useRef(0);

  const sortedCues = useMemo(
    () => (visemeCues ? [...visemeCues].sort((a, b) => a.timeMs - b.timeMs) : null),
    [visemeCues],
  );

  useEffect(() => {
    function tick() {
      const targetKey = resolveMouthTargetKey({
        viseme,
        sortedCues,
        audioElement,
        simulatedPlaybackStart: simulatedPlaybackStartRef.current,
        fallbackShape,
      });
      if (targetKey !== keyRef.current) {
        keyRef.current = targetKey;
        setKey(targetKey);
      }
      frameRef.current = requestAnimationFrame(tick);
    }

    frameRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameRef.current);
  }, [viseme, sortedCues, audioElement, simulatedPlaybackStartRef, fallbackShape]);

  return key;
}
