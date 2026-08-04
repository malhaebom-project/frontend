import type { AnswerFeedback, Child, LearningSession, Question, SessionResult } from "./types";

const keys = {
  child: "malhaebom.selectedChild",
  session: "malhaebom.learningSession",
  question: "malhaebom.currentQuestion",
  feedback: "malhaebom.feedback",
  result: "malhaebom.sessionResult",
};

export function saveSessionValue<T>(key: keyof typeof keys, value: T) {
  sessionStorage.setItem(keys[key], JSON.stringify(value));
}
export function removeSessionValue(key: keyof typeof keys) {
  sessionStorage.removeItem(keys[key]);
}
export function readSessionValue<T>(key: keyof typeof keys): T | null {
  if (typeof window === "undefined") return null;
  const raw = sessionStorage.getItem(keys[key]);
  try { return raw ? JSON.parse(raw) : null; } catch { return null; }
}
export const learningState = {
  child: () => readSessionValue<Child>("child"),
  session: () => readSessionValue<LearningSession>("session"),
  question: () => readSessionValue<Question>("question"),
  feedback: () => readSessionValue<AnswerFeedback>("feedback"),
  result: () => readSessionValue<SessionResult>("result"),
};
