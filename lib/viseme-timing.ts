/**
 * Lightweight text-to-viseme timing used when a TTS provider returns audio
 * without speech marks. Provider supplied visemes always take precedence;
 * this keeps arbitrary AI-generated English/Korean sentences moving in a
 * deterministic way instead of falling back to a random mouth pulse.
 */

export type ApproximateVisemeCue = {
  offsetMs: number;
  visemeId: number;
};

const CLOSED = 0;
const WIDE = 1;
const ROUND = 3;
const SMALL = 5;

const VISEME_DURATION_MS: Record<number, number> = {
  [CLOSED]: 72,
  [WIDE]: 138,
  [ROUND]: 128,
  [SMALL]: 96,
};

const ENGLISH_PAIR_VISEME: Record<string, number> = {
  oo: ROUND,
  ou: ROUND,
  ow: ROUND,
  oa: ROUND,
  ai: WIDE,
  ay: WIDE,
  au: WIDE,
  aw: WIDE,
  th: SMALL,
  sh: SMALL,
  ch: SMALL,
  zh: SMALL,
  ph: SMALL,
  ee: SMALL,
  ea: SMALL,
  ie: SMALL,
};

function englishLetterViseme(character: string) {
  if (/[bmp]/.test(character)) return CLOSED;
  if (/[ouwqr]/.test(character)) return ROUND;
  if (character === "a") return WIDE;
  return SMALL;
}

function koreanSyllableVisemes(character: string) {
  const code = character.charCodeAt(0) - 0xac00;
  if (code < 0 || code > 11171) return null;

  const initial = Math.floor(code / 588);
  const vowel = Math.floor((code % 588) / 28);
  const result: number[] = [];

  // ㅁ, ㅂ, ㅃ close the lips before the vowel opens.
  if ([6, 7, 8].includes(initial)) result.push(CLOSED);

  if ([0, 1, 2, 3].includes(vowel)) result.push(WIDE); // ㅏ/ㅐ 계열
  else if ([8, 9, 12, 13, 17, 18].includes(vowel)) result.push(ROUND); // ㅗ/ㅜ 계열
  else result.push(SMALL);

  return result;
}

export function textToVisemeIds(text: string) {
  const result: number[] = [CLOSED];
  const source = text.toLowerCase();

  for (let index = 0; index < source.length; index += 1) {
    const character = source[index];
    const pair = source.slice(index, index + 2);

    if (/\s|[,.!?;:()[\]{}'"-]/.test(character)) {
      result.push(CLOSED);
      continue;
    }

    const pairViseme = ENGLISH_PAIR_VISEME[pair];
    if (pairViseme != null) {
      result.push(pairViseme);
      index += 1;
      continue;
    }

    if (/[a-z]/.test(character)) {
      result.push(englishLetterViseme(character));
      continue;
    }

    const koreanVisemes = koreanSyllableVisemes(character);
    if (koreanVisemes) result.push(...koreanVisemes);
  }

  result.push(CLOSED);
  return result;
}

export function buildApproximateVisemeCues(text: string, durationMs?: number): ApproximateVisemeCue[] {
  const visemes = textToVisemeIds(text);
  const naturalDuration = visemes.reduce(
    (sum, visemeId) => sum + (VISEME_DURATION_MS[visemeId] ?? VISEME_DURATION_MS[SMALL]),
    0,
  );
  const targetDuration = durationMs && Number.isFinite(durationMs)
    ? Math.max(320, durationMs)
    : naturalDuration;
  const scale = targetDuration / naturalDuration;
  const cues: ApproximateVisemeCue[] = [];
  let elapsedMs = 0;
  let previousViseme = -1;

  for (const visemeId of visemes) {
    if (visemeId !== previousViseme) {
      cues.push({ offsetMs: Math.round(elapsedMs), visemeId });
      previousViseme = visemeId;
    }
    elapsedMs += (VISEME_DURATION_MS[visemeId] ?? VISEME_DURATION_MS[SMALL]) * scale;
  }

  if (previousViseme !== CLOSED) {
    cues.push({ offsetMs: Math.max(0, Math.round(targetDuration - 48)), visemeId: CLOSED });
  }

  return cues;
}
