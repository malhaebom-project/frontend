"use client";

export const CHARACTER_SPEECH_EVENT = "malhaebom:character-speech";

type SpeechEventDetail = {
  speaking: boolean;
  level: number;
  shape: "closed" | "small" | "wide" | "round";
};

let activeAudio: HTMLAudioElement | null = null;
let activeUtterance: SpeechSynthesisUtterance | null = null;
let animationFrame = 0;
let startedAt = 0;
let speechGeneration = 0;

const preferredVoiceNames = [
  "samantha", "ava", "allison", "susan", "zira", "aria", "jenny",
  "google us english", "google uk english female", "karen", "moira",
  "yuna", "sora", "sunhi", "google 한국의",
];
const avoidedVoiceNames = [
  "alex", "daniel", "fred", "ralph", "bruce", "lee", "david",
  "mark", "guy", "george", "male", "남성",
];

function emit(detail: SpeechEventDetail) {
  window.dispatchEvent(new CustomEvent<SpeechEventDetail>(CHARACTER_SPEECH_EVENT, { detail }));
}

function animate() {
  const elapsed = (performance.now() - startedAt) / 1000;
  const beat = Math.abs(Math.sin(elapsed * 10.5) * .65 + Math.sin(elapsed * 17.3) * .35);
  const level = .18 + beat * .82;
  const shape = level > .76 ? "wide" : level > .48 ? "round" : "small";
  emit({ speaking: true, level, shape });
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
  animate();
}

export function playCharacterSpeech({ url, text, lang = "en-US" }: { url?: string | null; text: string; lang?: string }) {
  stopCharacterSpeech();

  if (url) {
    const audio = new Audio(url);
    activeAudio = audio;
    audio.playbackRate = 1.04;
    audio.preservesPitch = false;
    audio.addEventListener("play", beginAnimation, { once: true });
    audio.addEventListener("ended", stopCharacterSpeech, { once: true });
    audio.addEventListener("error", () => speakWithBrowser(text, lang), { once: true });
    return audio.play().catch(() => speakWithBrowser(text, lang));
  }

  return speakWithBrowser(text, lang);
}

async function speakWithBrowser(text: string, lang: string) {
  if (!("speechSynthesis" in window)) {
    emit({ speaking: false, level: 0, shape: "closed" });
    throw new Error("이 브라우저는 음성 합성을 지원하지 않습니다.");
  }
  const generation = ++speechGeneration;
  const voices = await loadVoices();
  if (generation !== speechGeneration) return;
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = lang;
  utterance.voice = selectFriendlyVoice(voices, lang);
  utterance.rate = lang.startsWith("en") ? .9 : .94;
  utterance.pitch = lang.startsWith("en") ? 1.28 : 1.18;
  utterance.volume = .94;
  activeUtterance = utterance;
  utterance.onstart = beginAnimation;
  utterance.onend = stopCharacterSpeech;
  utterance.onerror = stopCharacterSpeech;
  window.speechSynthesis.speak(utterance);
}

function selectFriendlyVoice(voices: SpeechSynthesisVoice[], lang: string) {
  const requested = process.env.NEXT_PUBLIC_TTS_VOICE_NAME?.toLowerCase();
  if (requested) {
    const exact = voices.find(voice => voice.name.toLowerCase().includes(requested));
    if (exact) return exact;
  }

  const language = lang.toLowerCase().split("-")[0];
  const matching = voices.filter(voice => voice.lang.toLowerCase().startsWith(language));
  const candidates = matching.length ? matching : voices;

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
