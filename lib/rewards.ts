import type { LearningSession } from "./api/types";

type RewardSession = Pick<LearningSession, "sessionId" | "startedAt">;

interface RewardLedger {
  total: number;
  answerIds: number[];
}

function storageKey(session: RewardSession) {
  return `malhaebom.reward.session.${session.sessionId}.${encodeURIComponent(session.startedAt)}`;
}

function readLedger(session: RewardSession): RewardLedger {
  if (typeof window === "undefined") return { total: 0, answerIds: [] };
  const raw = sessionStorage.getItem(storageKey(session));
  if (!raw) return { total: 0, answerIds: [] };

  try {
    const parsed = JSON.parse(raw) as Partial<RewardLedger>;
    return {
      total: Number.isFinite(parsed.total) ? Math.max(0, Number(parsed.total)) : 0,
      answerIds: Array.isArray(parsed.answerIds)
        ? parsed.answerIds.filter((value): value is number => Number.isFinite(value))
        : [],
    };
  } catch {
    return { total: 0, answerIds: [] };
  }
}

export function resetRewardLedger(session: RewardSession) {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(storageKey(session));
}

export function getRewardTotal(session: RewardSession) {
  return readLedger(session).total;
}

export function claimCorrectAnswerReward(session: RewardSession, answerId: number) {
  const ledger = readLedger(session);
  if (ledger.answerIds.includes(answerId)) {
    return { awarded: false, before: ledger.total, after: ledger.total };
  }

  const before = ledger.total;
  const next: RewardLedger = {
    total: before + 1,
    answerIds: [...ledger.answerIds, answerId],
  };
  sessionStorage.setItem(storageKey(session), JSON.stringify(next));
  return { awarded: true, before, after: next.total };
}
