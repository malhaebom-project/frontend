"use client";

import { buildApproximateVisemeCues, textToVisemeIds } from "./viseme-timing";

export const CHARACTER_SPEECH_EVENT = "malhaebom:character-speech";

export type CharacterSpeechEventDetail = {
  speaking: boolean;
  level: number;
  shape: "closed" | "small" | "wide" | "round";
};

type MouthShape = CharacterSpeechEventDetail["shape"];

export type CharacterVisemeCue = {
  offsetMs: number;
  shape?: MouthShape;
  visemeId?: number;
};

let activeAudio: HTMLAudioElement | null = null;
let activeUtterance: SpeechSynthesisUtterance | null = null;
let animationFrame = 0;
let startedAt = 0;
let speechGeneration = 0;
let lastVisemeSlot = -1;
let activeVisemes: MouthShape[] = ["small", "wide", "small", "round"];
let activeCueTrack: { offsetMs: number; shape: MouthShape }[] | null = null;
let activeCueIndex = -1;
const koreanFeedbackCache = new Map<string, {
  audioDataUrl: string;
  visemes: CharacterVisemeCue[];
}>();

const preferredVoiceNames = [
  "samantha", "ava", "allison", "susan", "zira", "aria", "jenny",
  "google us english", "google uk english female", "karen", "moira",
  "yuna", "sora", "sunhi", "google 한국의",
];
const avoidedVoiceNames = [
  "alex", "daniel", "fred", "ralph", "bruce", "lee", "david",
  "mark", "guy", "george", "male", "남성", "grandma", "grandpa",
];
const hintVoiceNames = ["google us english", "google uk english female"];

export function toSpeakableText(text: string) {
  return text
    .replace(/[A-Za-z]*_+[A-Za-z]*/g, " … ")
    .replace(/…\s*[.!?]/g, "…")
    .replace(/\s+([,.!?;:])/g, "$1")
    .replace(/\s+/g, " ")
    .trim();
}

export function playHintSpeech(text: string) {
  const koreanCharacters = text.match(/[가-힣]/g)?.length ?? 0;
  const englishCharacters = text.match(/[A-Za-z]/g)?.length ?? 0;

  if (koreanCharacters > englishCharacters) {
    return playKoreanFeedbackSpeech({ text });
  }

  return playCharacterSpeech({ text, lang: "en-US", browserVoiceProfile: "hint" });
}

function emit(detail: CharacterSpeechEventDetail) {
  window.dispatchEvent(new CustomEvent<CharacterSpeechEventDetail>(CHARACTER_SPEECH_EVENT, { detail }));
}

function textToVisemes(text: string): MouthShape[] {
  return textToVisemeIds(text).map(visemeIdToShape).filter((shape, index, shapes) => (
    index < 2 || shape !== shapes[index - 1] || shape !== shapes[index - 2]
  ));
}

function visemeIdToShape(visemeId: number): MouthShape {
  if (visemeId === 0 || visemeId === 21) return "closed";
  if ([3, 7, 8, 9, 10, 13].includes(visemeId)) return "round";
  if ([1, 2, 4, 11, 12].includes(visemeId)) return "wide";
  return "small";
}

function normalizeCueTrack(cues?: CharacterVisemeCue[]) {
  if (!cues?.length) return null;

  return cues
    .filter(cue => Number.isFinite(cue.offsetMs) && cue.offsetMs >= 0)
    .map(cue => ({
      offsetMs: cue.offsetMs,
      shape: cue.shape ?? visemeIdToShape(cue.visemeId ?? 0),
    }))
    .sort((a, b) => a.offsetMs - b.offsetMs);
}

function emitShape(shape: MouthShape) {
  const level = shape === "wide" ? .96 : shape === "round" ? .72 : shape === "small" ? .48 : .08;
  emit({ speaking: true, level, shape });
}

function estimatedVisemeSlot(elapsedMs: number) {
  const durations = activeVisemes.map(shape => (
    shape === "wide" ? 138
      : shape === "round" ? 128
        : shape === "closed" ? 72
          : 96
  ));
  const cycleDuration = durations.reduce((sum, duration) => sum + duration, 0);
  const cycle = Math.floor(elapsedMs / cycleDuration);
  const position = elapsedMs % cycleDuration;
  let accumulated = 0;

  for (let index = 0; index < durations.length; index += 1) {
    accumulated += durations[index];
    if (position < accumulated) return cycle * durations.length + index;
  }

  return cycle * durations.length + durations.length - 1;
}

function animate() {
  const elapsedMs = performance.now() - startedAt;

  if (activeCueTrack) {
    let cueIndex = activeCueIndex;
    while (
      cueIndex + 1 < activeCueTrack.length
      && activeCueTrack[cueIndex + 1].offsetMs <= elapsedMs
    ) {
      cueIndex += 1;
    }

    if (cueIndex !== activeCueIndex && cueIndex >= 0) {
      activeCueIndex = cueIndex;
      emitShape(activeCueTrack[cueIndex].shape);
    }
    animationFrame = requestAnimationFrame(animate);
    return;
  }

  const slot = estimatedVisemeSlot(elapsedMs);

  if (slot !== lastVisemeSlot) {
    lastVisemeSlot = slot;
    const shape = activeVisemes[slot % activeVisemes.length];
    emitShape(shape);
  }
  animationFrame = requestAnimationFrame(animate);
}

export function stopCharacterSpeech() {
  speechGeneration += 1;
  if (activeAudio) {
    activeAudio.pause();
    activeAudio.currentTime = 0;
    activeAudio = null;
  }
  if (activeUtterance) {
    window.speechSynthesis?.cancel();
    activeUtterance = null;
  }
  cancelAnimationFrame(animationFrame);
  emit({ speaking: false, level: 0, shape: "closed" });
}

function beginAnimation() {
  cancelAnimationFrame(animationFrame);
  startedAt = performance.now();
  lastVisemeSlot = -1;
  activeCueIndex = -1;
  emit({ speaking: true, level: 0, shape: "closed" });
  animate();
}

export function playCharacterSpeech({
  url,
  text,
  lang = "en-US",
  visemes,
  browserVoiceProfile = "default",
}: {
  url?: string | null;
  text: string;
  lang?: string;
  visemes?: CharacterVisemeCue[];
  browserVoiceProfile?: "default" | "hint";
}) {
  stopCharacterSpeech();
  const spokenText = toSpeakableText(text);
  activeVisemes = textToVisemes(spokenText);
  activeCueTrack = normalizeCueTrack(visemes);

  if (url) {
    const audio = new Audio(url);
    activeAudio = audio;
    audio.preload = "auto";
    audio.playbackRate = 1;
    audio.preservesPitch = true;
    const ensureFallbackCueTrack = () => {
      if (activeAudio !== audio || activeCueTrack) return;
      if (!Number.isFinite(audio.duration) || audio.duration <= 0) return;
      activeCueTrack = normalizeCueTrack(buildApproximateVisemeCues(spokenText, audio.duration * 1000));
    };
    audio.addEventListener("loadedmetadata", ensureFallbackCueTrack, { once: true });
    audio.addEventListener("play", () => {
      ensureFallbackCueTrack();
      beginAnimation();
    }, { once: true });
    audio.addEventListener("ended", stopCharacterSpeech, { once: true });
    audio.addEventListener("error", () => {
      activeCueTrack = null;
      void speakWithBrowser(spokenText, lang, browserVoiceProfile);
    }, { once: true });
    return audio.play().catch(() => {
      activeCueTrack = null;
      return speakWithBrowser(spokenText, lang, browserVoiceProfile);
    });
  }

  return speakWithBrowser(spokenText, lang, browserVoiceProfile);
}

export function playQuestionSpeech({
  url,
  text,
  visemes,
}: {
  url?: string | null;
  text: string;
  visemes?: CharacterVisemeCue[];
}) {
  // 배포 환경은 백엔드가 제공하는 음원을 우선 사용하고, URL이 없으면
  // 클릭 시점의 브라우저 TTS로 곧바로 대체합니다. macOS `say` 기반
  // 로컬 보조 경로는 개발 서버에서만 사용할 수 있습니다.
  const source = url?.trim()
    || (process.env.NODE_ENV === "development"
      ? `/api/tts/question?text=${encodeURIComponent(text)}`
      : null);
  return playCharacterSpeech({
    url: source,
    text,
    lang: "en-US",
    visemes,
  });
}

export async function playKoreanFeedbackSpeech({
  text,
  fallbackUrl,
  fallbackVisemes,
}: {
  text: string;
  fallbackUrl?: string | null;
  fallbackVisemes?: CharacterVisemeCue[];
}) {
  const spokenText = toSpeakableText(text);
  // Backend or demo-provided audio is authoritative and can start directly
  // inside the click gesture. Avoiding an unnecessary Azure proxy request
  // here also prevents browsers from dropping media autoplay permission
  // while that request is in flight.
  if (fallbackUrl) {
    return playCharacterSpeech({
      url: fallbackUrl,
      text: spokenText,
      lang: "ko-KR",
      visemes: fallbackVisemes,
    });
  }

  try {
    let speech = koreanFeedbackCache.get(spokenText);

    if (!speech) {
      const response = await fetch("/api/tts/feedback", {
        method: "POST",
        cache: "no-store",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: spokenText }),
      });

      if (!response.ok) throw new Error(`Azure feedback TTS unavailable: ${response.status}`);

      const body = await response.json() as {
        success: boolean;
        data?: {
          audioDataUrl: string;
          visemes: CharacterVisemeCue[];
        };
      };

      if (!body.success || !body.data?.audioDataUrl) {
        throw new Error("Azure feedback TTS response is invalid.");
      }

      speech = {
        audioDataUrl: body.data.audioDataUrl,
        visemes: body.data.visemes ?? [],
      };
      koreanFeedbackCache.set(spokenText, speech);
    }

    return playCharacterSpeech({
      url: speech.audioDataUrl,
      text: spokenText,
      lang: "ko-KR",
      visemes: speech.visemes,
    });
  } catch {
    return playCharacterSpeech({
      url: fallbackUrl,
      text: spokenText,
      lang: "ko-KR",
      visemes: fallbackVisemes,
    });
  }
}

async function speakWithBrowser(text: string, lang: string, voiceProfile: "default" | "hint" = "default") {
  if (!("speechSynthesis" in window)) {
    emit({ speaking: false, level: 0, shape: "closed" });
    throw new Error("이 브라우저는 음성 합성을 지원하지 않습니다.");
  }
  const generation = ++speechGeneration;
  const immediateVoices = window.speechSynthesis.getVoices();
  const voices = immediateVoices.length ? immediateVoices : await loadVoices();
  if (generation !== speechGeneration) return;
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = lang;
  utterance.voice = selectFriendlyVoice(voices, lang, voiceProfile);
  utterance.rate = voiceProfile === "hint" ? 1 : lang.startsWith("en") ? .9 : .92;
  utterance.pitch = voiceProfile === "hint" ? 1 : lang.startsWith("en") ? 1.28 : 1.06;
  utterance.volume = lang.startsWith("en") ? .94 : .96;
  activeUtterance = utterance;
  utterance.onstart = beginAnimation;
  utterance.onboundary = event => {
    if (activeCueTrack || (event.name && event.name !== "word")) return;

    const remainingText = text.slice(event.charIndex);
    const nextBoundary = remainingText.search(/\s|[,.!?;:]/);
    const spokenUnit = nextBoundary > 0 ? remainingText.slice(0, nextBoundary) : remainingText;
    const boundaryVisemes = textToVisemes(spokenUnit);

    if (boundaryVisemes.length > 2) {
      activeVisemes = boundaryVisemes;
      startedAt = performance.now();
      lastVisemeSlot = -1;
    }
  };
  utterance.onend = stopCharacterSpeech;
  utterance.onerror = stopCharacterSpeech;
  window.speechSynthesis.speak(utterance);
}

function selectFriendlyVoice(voices: SpeechSynthesisVoice[], lang: string, voiceProfile: "default" | "hint" = "default") {
  const requested = process.env.NEXT_PUBLIC_TTS_VOICE_NAME?.toLowerCase();
  if (requested) {
    const exact = voices.find(voice => voice.name.toLowerCase().includes(requested));
    if (exact) return exact;
  }

  const language = lang.toLowerCase().split("-")[0];
  const matching = voices.filter(voice => voice.lang.toLowerCase().startsWith(language));
  const candidates = matching.length ? matching : voices;

  if (voiceProfile === "hint") {
    const matchedHintVoice = hintVoiceNames
      .map(name => candidates.find(voice => `${voice.name} ${voice.voiceURI}`.toLowerCase().includes(name)))
      .find(Boolean);
    if (matchedHintVoice) return matchedHintVoice;
  }

  if (language === "ko") {
    const yuna = candidates.find(voice => (
      `${voice.name} ${voice.voiceURI}`.toLowerCase().includes("yuna")
    ));
    if (yuna) return yuna;
  }

  return candidates
    .map(voice => {
      const name = `${voice.name} ${voice.voiceURI}`.toLowerCase();
      let score = voice.localService ? 2 : 0;

      const preferredIndex = preferredVoiceNames.findIndex(item => name.includes(item));
      if (preferredIndex >= 0) score += 100 - preferredIndex;
      if (avoidedVoiceNames.some(item => name.includes(item))) score -= 100;
      if (name.includes("female") || name.includes("woman") || name.includes("여성")) score += 30;
      if (name.includes("natural") || name.includes("neural") || name.includes("premium")) score += 12;
      return { voice, score };
    })
    .sort((a, b) => b.score - a.score)[0]?.voice ?? null;
}

function loadVoices() {
  const immediate = window.speechSynthesis.getVoices();
  if (immediate.length) return Promise.resolve(immediate);

  return new Promise<SpeechSynthesisVoice[]>(resolve => {
    const timeout = window.setTimeout(() => {
      window.speechSynthesis.removeEventListener("voiceschanged", handleVoices);
      resolve(window.speechSynthesis.getVoices());
    }, 800);
    function handleVoices() {
      window.clearTimeout(timeout);
      window.speechSynthesis.removeEventListener("voiceschanged", handleVoices);
      resolve(window.speechSynthesis.getVoices());
    }
    window.speechSynthesis.addEventListener("voiceschanged", handleVoices);
  });
}
