"use client";

import { useEffect, useState } from "react";
import {
  CHARACTER_SPEECH_EVENT,
  type CharacterSpeechEventDetail,
} from "@/lib/character-speech";
import { Teacher2D } from "./Teacher2D";
import type {
  CharacterEmotion,
  CharacterState,
  MouthShapeKey,
} from "./teacherTypes";

const IDLE_SPEECH: CharacterSpeechEventDetail = {
  speaking: false,
  level: 0,
  shape: "closed",
};

const SPEECH_SHAPE_TO_VISEME: Record<CharacterSpeechEventDetail["shape"], MouthShapeKey> = {
  closed: "MBP",
  small: "I",
  wide: "A",
  round: "O",
};

const MOTION_EMOTION: Partial<Record<CharacterState, CharacterEmotion>> = {
  welcome: "happy",
  listening: "curious",
  thinking: "curious",
  correct: "happy",
  feedback: "encouraging",
  error: "sorry",
};

/**
 * App-wide bridge between the existing TTS event bus and the new teacher.
 * Every page can keep using the shared `Buddy` API while speech events drive
 * Teacher2D's continuous mouth rig instead of the retired blue mascot mouth.
 */
export function TeacherBuddy({ motion }: { motion: CharacterState }) {
  const [speech, setSpeech] = useState<CharacterSpeechEventDetail>(IDLE_SPEECH);

  useEffect(() => {
    function update(event: Event) {
      setSpeech((event as CustomEvent<CharacterSpeechEventDetail>).detail);
    }

    window.addEventListener(CHARACTER_SPEECH_EVENT, update);
    return () => window.removeEventListener(CHARACTER_SPEECH_EVENT, update);
  }, []);

  return (
    <Teacher2D
      state={motion}
      emotion={MOTION_EMOTION[motion] ?? "neutral"}
      viseme={speech.speaking ? SPEECH_SHAPE_TO_VISEME[speech.shape] : undefined}
      mouthLevel={speech.speaking ? speech.level : undefined}
      size={300}
      className="buddy-teacher-art"
    />
  );
}
