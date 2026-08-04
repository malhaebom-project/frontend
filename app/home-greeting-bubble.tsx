"use client";

import { useEffect, useState } from "react";

const GREETINGS = [
  "안녕! 오늘도 영어로 신나게 말해볼까?",
  "Hello! 만나서 정말 반가워!",
  "오늘은 어떤 영어 표현을 배워볼까?",
  "틀려도 괜찮아. 천천히 말해보자!",
  "네 목소리를 들려줘!",
  "준비됐어? Let's speak English!",
  "작은 한마디가 큰 자신감이 돼!",
  "오늘도 멋진 영어 모험을 시작해볼까?",
  "궁금한 건 언제든 나에게 물어봐!",
  "You can do it! 내가 옆에서 도와줄게.",
] as const;

const VISIBLE_MS = 3000;
const HIDDEN_MS = 1100;
const FIRST_APPEARANCE_DELAY_MS = 450;

function nextGreetingIndex(previous: number) {
  if (GREETINGS.length < 2) return 0;
  let next = previous;
  while (next === previous) {
    next = Math.floor(Math.random() * GREETINGS.length);
  }
  return next;
}

export function HomeGreetingBubble() {
  const [greetingIndex, setGreetingIndex] = useState(0);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let phaseTimer: ReturnType<typeof setTimeout>;

    function showNextGreeting() {
      if (cancelled) return;
      setGreetingIndex(previous => nextGreetingIndex(previous));
      setVisible(true);
      phaseTimer = setTimeout(() => {
        setVisible(false);
        phaseTimer = setTimeout(showNextGreeting, HIDDEN_MS);
      }, VISIBLE_MS);
    }

    phaseTimer = setTimeout(showNextGreeting, FIRST_APPEARANCE_DELAY_MS);
    return () => {
      cancelled = true;
      clearTimeout(phaseTimer);
    };
  }, []);

  return (
    <div
      className={`speech home-greeting-bubble ${visible ? "is-visible" : ""}`}
      role="status"
      aria-live="polite"
      aria-atomic="true"
      aria-hidden={!visible}
    >
      <p className="home-greeting-label">봄이 선생님의 한마디</p>
      <p className="home-greeting-message">{GREETINGS[greetingIndex]}</p>
    </div>
  );
}
