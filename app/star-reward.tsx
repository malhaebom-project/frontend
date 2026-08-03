"use client";

import { useEffect, useState, type CSSProperties } from "react";
import { claimCorrectAnswerReward } from "@/lib/rewards";

type RewardGaugeStyle = CSSProperties & {
  "--gauge-before": string;
  "--gauge-after": string;
  "--ring-before": string;
  "--ring-after": string;
};

interface StarRewardProps {
  answerId: number;
  sessionId: number;
  sessionStartedAt: string;
  questionIndex: number;
  totalQuestions: number;
  onTotalChange: (total: number) => void;
}

export function StarReward({
  answerId,
  sessionId,
  sessionStartedAt,
  questionIndex,
  totalQuestions,
  onTotalChange,
}: StarRewardProps) {
  const [reward, setReward] = useState<{ before: number; after: number } | null>(null);
  const [count, setCount] = useState(0);
  const [visible, setVisible] = useState(false);
  const [celebrate, setCelebrate] = useState(false);
  const beforePercent = Math.round(Math.max(0, questionIndex - 1) / totalQuestions * 100);
  const afterPercent = Math.round(questionIndex / totalQuestions * 100);

  useEffect(() => {
    let countTimer: number | undefined;
    let celebrateTimer: number | undefined;
    let hideTimer: number | undefined;
    const startTimer = window.setTimeout(() => {
      const claimed = claimCorrectAnswerReward(
        { sessionId, startedAt: sessionStartedAt },
        answerId,
      );
      onTotalChange(claimed.after);
      if (!claimed.awarded) return;

      setReward({ before: claimed.before, after: claimed.after });
      setCount(claimed.before);
      setVisible(true);
      countTimer = window.setTimeout(() => {
        setCount(claimed.after);
        setCelebrate(true);
      }, 1550);
      celebrateTimer = window.setTimeout(() => setCelebrate(false), 2750);
      hideTimer = window.setTimeout(() => setVisible(false), 3600);
    }, 0);

    return () => {
      window.clearTimeout(startTimer);
      if (countTimer) window.clearTimeout(countTimer);
      if (celebrateTimer) window.clearTimeout(celebrateTimer);
      if (hideTimer) window.clearTimeout(hideTimer);
    };
  }, [answerId, onTotalChange, sessionId, sessionStartedAt]);

  if (!visible || !reward) return null;

  const gaugeStyle = {
    "--gauge-before": `${beforePercent}%`,
    "--gauge-after": `${afterPercent}%`,
    "--ring-before": `${beforePercent * 3.6}deg`,
    "--ring-after": `${afterPercent * 3.6}deg`,
  } as RewardGaugeStyle;

  return (
    <div
      className={`star-reward-layer ${celebrate ? "is-celebrating" : ""}`}
      style={gaugeStyle}
      aria-live="polite"
      aria-label={`별 ${reward.after}개 획득, 학습 진행률 ${afterPercent}%`}
    >
      <div className="star-charge-orbit" aria-hidden><i /><i /><i /></div>
      <div className="star-charge-ring" aria-hidden><div className="star-charge-core" /></div>
      <div className="star-reward-badge">
        <span className="star-reward-star">★</span>
        <strong>{count}</strong>
        <small>STARS</small>
      </div>
      <div className="star-charge-meter" aria-hidden>
        <span />
        <div><b>LEARNING POWER</b><em>{afterPercent}%</em></div>
      </div>
      <div className="star-reward-praise">
        <strong>{afterPercent}%까지 충전!</strong>
        <span>정답을 맞혀 별이 하나 늘었어요</span>
      </div>
    </div>
  );
}
