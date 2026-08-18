"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";

type StepPhase = "below" | "active" | "above";

const STEPS = [
  {
    number: "1",
    title: "봄이 선생님의 질문 듣기",
    description: "아이의 학년과 수준에 꼭 맞는 질문을 또렷하고 따뜻한 목소리로 들어요.",
    image: "/home/how-it-works/step-listen-v2.webp",
    alt: "아이가 노트북의 말해봄 학습 화면에서 봄이 선생님의 질문을 듣는 모습",
    support: "✓ 수준에 꼭 맞는 질문으로 시작해요",
  },
  {
    number: "2",
    title: "버튼 누르고 영어로 말하기",
    description: "틀릴 걱정 없이 마이크 버튼을 누르고, 떠오르는 영어를 자신 있게 말해요.",
    image: "/home/how-it-works/step-speak-v2.webp",
    alt: "아이가 노트북의 초록 마이크 버튼을 누르고 봄이 선생님에게 영어로 말하는 모습",
    support: "✓ 틀려도 괜찮아요, 용기 있게 말해요",
  },
  {
    number: "3",
    title: "칭찬과 별로 자신감 키우기",
    description: "바로 도착한 친절한 피드백과 반짝이는 별을 받으며 작은 성취를 차곡차곡 쌓아요.",
    image: "/home/how-it-works/step-grow-v2.webp",
    alt: "영어 답변을 마친 아이가 말해봄 화면에서 봄이 선생님의 칭찬과 황금 별을 받는 모습",
    support: "✓ 바로 칭찬받고 자신감을 쌓아요",
  },
] as const;

export function HowItWorks() {
  const cards = useRef<(HTMLElement | null)[]>([]);
  const [phases, setPhases] = useState<StepPhase[]>(["below", "below", "below"]);

  useEffect(() => {
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let frame = 0;

    function updatePhases() {
      frame = 0;
      if (reducedMotion.matches) {
        setPhases(["active", "active", "active"]);
        return;
      }

      const viewportHeight = window.innerHeight;
      const nextPhases = cards.current.map((card): StepPhase => {
        if (!card) return "below";
        const rect = card.getBoundingClientRect();
        if (rect.bottom < viewportHeight * 0.24) return "above";
        if (rect.top > viewportHeight * 0.76) return "below";
        return "active";
      });

      setPhases((current) => current.every((phase, index) => phase === nextPhases[index]) ? current : nextPhases);
    }

    function requestUpdate() {
      if (!frame) frame = window.requestAnimationFrame(updatePhases);
    }

    updatePhases();
    window.addEventListener("scroll", requestUpdate, { passive: true });
    window.addEventListener("resize", requestUpdate);
    reducedMotion.addEventListener("change", requestUpdate);

    return () => {
      if (frame) window.cancelAnimationFrame(frame);
      window.removeEventListener("scroll", requestUpdate);
      window.removeEventListener("resize", requestUpdate);
      reducedMotion.removeEventListener("change", requestUpdate);
    };
  }, []);

  return (
    <section className="home-section home-how" aria-labelledby="how-it-works-title">
      <div className="container">
        <div className="home-section-title">
          <p className="eyebrow">How it works</p>
          <h2 id="how-it-works-title" className="title mt-3">듣고, 말하고, 바로 성장해요</h2>
          <p className="subtitle mt-4">복잡한 공부 대신 짧고 즐거운 말하기 루틴을 만들어요.</p>
        </div>
        <div className="home-steps">
          {STEPS.map((step, index) => (
            <article
              key={step.number}
              ref={(card) => { cards.current[index] = card; }}
              className={`card home-step home-step-${phases[index]} ${index % 2 ? "home-step-reversed" : ""}`}
            >
              <div className="home-step-media">
                <Image
                  src={step.image}
                  alt={step.alt}
                  fill
                  sizes="(max-width: 767px) calc(100vw - 48px), (max-width: 1200px) 55vw, 660px"
                />
                <span className="home-step-number" aria-hidden="true">{step.number}</span>
              </div>
              <div className="home-step-copy">
                <p className="home-step-kicker">Step 0{step.number}</p>
                <h3>{step.title}</h3>
                <p>{step.description}</p>
                <span className="home-step-check">{step.support}</span>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
