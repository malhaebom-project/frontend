"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { Teacher2D } from "@/components/character/Teacher2D";
import {
  LIP_SYNC_DEMO_CUES,
  LIP_SYNC_DEMO_SENTENCE,
  MOUTH_SHAPE_PARAMS,
} from "@/components/character/mouthShapes";
import type {
  CharacterEmotion,
  CharacterState,
  MouthShapeKey,
  VisemeCue,
} from "@/components/character/teacherTypes";

const STATES: CharacterState[] = ["idle", "welcome", "listening", "speaking", "thinking", "correct", "feedback", "error"];
const STATE_LABEL: Record<CharacterState, string> = {
  idle: "idle · 대기",
  welcome: "welcome · 환영",
  listening: "listening · 경청",
  speaking: "speaking · 발화",
  thinking: "thinking · 생각",
  correct: "correct · 정답",
  feedback: "feedback · 피드백",
  error: "error · 오류",
};

const EMOTIONS: CharacterEmotion[] = ["neutral", "happy", "encouraging", "curious", "surprised", "sorry"];
const EMOTION_LABEL: Record<CharacterEmotion, string> = {
  neutral: "neutral · 무표정",
  happy: "happy · 기쁨",
  encouraging: "encouraging · 격려",
  curious: "curious · 궁금",
  surprised: "surprised · 놀람",
  sorry: "sorry · 미안",
};

const VISEMES = Object.keys(MOUTH_SHAPE_PARAMS) as MouthShapeKey[];

const BACKGROUNDS = [
  { name: "화이트", value: "#ffffff" },
  { name: "하늘", value: "#ddf4ff" },
  { name: "민트", value: "#e3fbf3" },
  { name: "네이비", value: "#26324a" },
];

export default function CharacterLabPage() {
  const [characterState, setCharacterState] = useState<CharacterState>("idle");
  const [emotion, setEmotion] = useState<CharacterEmotion>("neutral");
  const [activeViseme, setActiveViseme] = useState<MouthShapeKey | undefined>(undefined);
  const [visemeCues, setVisemeCues] = useState<VisemeCue[] | undefined>(undefined);
  const [paused, setPaused] = useState(false);
  const [size, setSize] = useState(340);
  const [background, setBackground] = useState(BACKGROUNDS[1].value);
  const demoGeneration = useRef(0);

  function toggleViseme(key: MouthShapeKey) {
    setVisemeCues(undefined);
    setActiveViseme(prev => (prev === key ? undefined : key));
  }

  function playLipSyncDemo() {
    const generation = ++demoGeneration.current;
    setActiveViseme(undefined);
    setCharacterState("speaking");
    setVisemeCues([...LIP_SYNC_DEMO_CUES]);

    const lastCue = LIP_SYNC_DEMO_CUES[LIP_SYNC_DEMO_CUES.length - 1];
    window.setTimeout(() => {
      if (demoGeneration.current !== generation) return;
      setVisemeCues(undefined);
      setCharacterState("idle");
    }, lastCue.timeMs + 400);
  }

  return (
    <main className="page-shell">
      <div className="container py-10">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <p className="pill mb-3">🧪 실험 화면 · 다른 페이지에는 영향 없음</p>
            <h1 className="display text-3xl">2D 영어 선생님 캐릭터 랩</h1>
            <p className="subtitle mt-2">Teacher2D 컴포넌트의 상태 · 감정 · 입모양을 직접 확인해 보세요.</p>
          </div>
          <Link href="/" className="btn btn-ghost">← 홈으로</Link>
        </div>

        <div className="grid gap-8 lg:grid-cols-[1.1fr_1fr]">
          <div
            className="card flex flex-col items-center justify-center gap-6 p-8 transition-colors"
            style={{ background }}
          >
            <Teacher2D
              state={characterState}
              emotion={emotion}
              viseme={activeViseme}
              visemeCues={visemeCues}
              paused={paused}
              size={size}
            />
            <div className="flex flex-wrap items-center justify-center gap-2 text-sm font-bold text-[var(--navy)]">
              <span className="pill">state: {characterState}</span>
              <span className="pill">emotion: {emotion}</span>
              <span className="pill">viseme: {activeViseme ?? (visemeCues ? "cues 재생 중" : "auto")}</span>
            </div>
          </div>

          <div className="flex flex-col gap-6">
            <section className="card p-5">
              <h2 className="mb-3 text-sm font-black uppercase tracking-wide text-[var(--muted)]">State</h2>
              <div className="flex flex-wrap gap-2">
                {STATES.map(item => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setCharacterState(item)}
                    className={`btn ${characterState === item ? "btn-primary" : "btn-secondary"}`}
                  >
                    {STATE_LABEL[item]}
                  </button>
                ))}
              </div>
            </section>

            <section className="card p-5">
              <h2 className="mb-3 text-sm font-black uppercase tracking-wide text-[var(--muted)]">Emotion</h2>
              <div className="flex flex-wrap gap-2">
                {EMOTIONS.map(item => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setEmotion(item)}
                    className={`btn ${emotion === item ? "btn-primary" : "btn-secondary"}`}
                  >
                    {EMOTION_LABEL[item]}
                  </button>
                ))}
              </div>
            </section>

            <section className="card p-5">
              <h2 className="mb-3 text-sm font-black uppercase tracking-wide text-[var(--muted)]">Viseme (입 모양)</h2>
              <div className="flex flex-wrap gap-2">
                {VISEMES.map(key => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => toggleViseme(key)}
                    className={`btn ${activeViseme === key ? "btn-primary" : "btn-secondary"}`}
                  >
                    {key}
                  </button>
                ))}
              </div>
            </section>

            <section className="card p-5">
              <h2 className="mb-3 text-sm font-black uppercase tracking-wide text-[var(--muted)]">립싱크 데모</h2>
              <p className="subtitle mb-3 text-sm">“{LIP_SYNC_DEMO_SENTENCE}”</p>
              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={playLipSyncDemo} className="btn btn-primary">▶ 데모 재생</button>
                <button
                  type="button"
                  onClick={() => setPaused(prev => !prev)}
                  className={`btn ${paused ? "btn-primary" : "btn-secondary"}`}
                >
                  {paused ? "▶ 애니메이션 재개" : "⏸ 애니메이션 일시정지"}
                </button>
              </div>
            </section>

            <section className="card p-5">
              <h2 className="mb-3 text-sm font-black uppercase tracking-wide text-[var(--muted)]">크기 · 배경</h2>
              <label className="mb-4 block text-sm font-bold text-[var(--navy)]">
                캐릭터 크기: {size}px
                <input
                  type="range"
                  min={220}
                  max={480}
                  step={10}
                  value={size}
                  onChange={event => setSize(Number(event.target.value))}
                  className="mt-2 w-full"
                />
              </label>
              <div className="flex flex-wrap gap-2">
                {BACKGROUNDS.map(item => (
                  <button
                    key={item.value}
                    type="button"
                    onClick={() => setBackground(item.value)}
                    className={`btn ${background === item.value ? "btn-primary" : "btn-secondary"}`}
                  >
                    {item.name}
                  </button>
                ))}
              </div>
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}
