"use client";

import { useEffect, useState } from "react";
import { CHARACTER_SPEECH_EVENT } from "@/lib/character-speech";

type MouthState = {
  speaking: boolean;
  level: number;
  shape: "closed" | "small" | "wide" | "round";
};

const idle: MouthState = { speaking: false, level: 0, shape: "closed" };

export function CharacterMouth() {
  const [mouth, setMouth] = useState<MouthState>(idle);

  useEffect(() => {
    function update(event: Event) {
      setMouth((event as CustomEvent<MouthState>).detail);
    }
    window.addEventListener(CHARACTER_SPEECH_EVENT, update);
    return () => window.removeEventListener(CHARACTER_SPEECH_EVENT, update);
  }, []);

  return (
    <span
      className={`buddy-mouth buddy-mouth-${mouth.shape} ${mouth.speaking ? "is-speaking" : ""}`}
      style={{ "--mouth-level": mouth.level } as React.CSSProperties}
      aria-hidden="true"
    >
      <span className="buddy-mouth-inner" />
      <span className="buddy-tongue" />
    </span>
  );
}
