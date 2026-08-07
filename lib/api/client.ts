import type {
  AdminQuestion, AdminQuestionInput, AnswerFeedback, AuthTokens, Child, Difficulty, Guardian, LearningHistory,
  LearningSession, LearningTopic, Question, QuestionType, QuestionTypeOption,
  PageData, SessionResult, SpeechAnswer, Statistics, VisemeCue, WrongAnswer,
} from "./types";
import { demoRequest } from "./demo";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "/api/v1";
const ACCESS_KEY = "malhaebom.accessToken";
const REFRESH_KEY = "malhaebom.refreshToken";
const GUARDIAN_KEY = "malhaebom.guardian";
const DEMO_KEY = "malhaebom.demoMode";
const LOCAL_CHILDREN_PREFIX = "malhaebom.localChildren";

export const demoLoginEnabled =
  process.env.NODE_ENV === "development" ||
  process.env.NEXT_PUBLIC_ENABLE_DEMO_LOGIN === "true";

export class ApiError extends Error {
  constructor(message: string, public status = 0, public code = "NETWORK_ERROR") { super(message); }
}

function readStorage(key: string) {
  if (typeof window === "undefined") return null;
  const persisted = window.localStorage.getItem(key);
  if (persisted !== null) return persisted;

  // 기존 버전에서 sessionStorage에 저장된 로그인도 한 번만 자동 이전합니다.
  const legacy = window.sessionStorage.getItem(key);
  if (legacy !== null) {
    window.localStorage.setItem(key, legacy);
    window.sessionStorage.removeItem(key);
  }
  return legacy;
}

function writeStorage(key: string, value: string) {
  window.localStorage.setItem(key, value);
}

function localChildrenKey() {
  const token = readStorage(ACCESS_KEY);
  if (!token) return `${LOCAL_CHILDREN_PREFIX}.anonymous`;
  try {
    const encoded = token.split(".")[1];
    if (!encoded) throw new Error("JWT payload is missing");
    const padded = encoded.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(encoded.length / 4) * 4, "=");
    const payload = JSON.parse(window.atob(padded)) as { userId?: number | string; sub?: string };
    return `${LOCAL_CHILDREN_PREFIX}.${payload.userId ?? payload.sub ?? token.slice(-16)}`;
  } catch {
    return `${LOCAL_CHILDREN_PREFIX}.${token.slice(-16)}`;
  }
}

function readLocalChildren(): Child[] {
  try {
    const raw = window.localStorage.getItem(localChildrenKey());
    return raw ? JSON.parse(raw) as Child[] : [];
  } catch {
    return [];
  }
}

function writeLocalChildren(children: Child[]) {
  window.localStorage.setItem(localChildrenKey(), JSON.stringify(children));
}

function localChild(id: number) {
  const child = readLocalChildren().find(item => item.childId === id);
  if (!child) throw new ApiError("어린이 프로필을 찾을 수 없습니다.", 404, "CHILD_PROFILE_NOT_FOUND");
  return child;
}

async function withLocalChildFallback<T>(requestRemote: () => Promise<T>, requestLocal: () => T): Promise<T> {
  try {
    return await requestRemote();
  } catch (error) {
    if (error instanceof ApiError && error.status === 404 && error.code === "UNKNOWN_ERROR") return requestLocal();
    throw error;
  }
}

async function request<T>(path: string, init: RequestInit = {}, retry = true): Promise<T> {
  if (isDemoMode() && !path.startsWith("/auth/")) return demoRequest<T>(path, init);
  const token = readStorage(ACCESS_KEY);
  const isForm = init.body instanceof FormData;
  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    credentials: "include",
    cache: "no-store",
    headers: {
      ...(isForm ? {} : { "Content-Type": "application/json" }),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init.headers,
    },
  }).catch(() => { throw new ApiError("서버에 연결할 수 없습니다. API 주소와 백엔드 실행 상태를 확인해 주세요."); });

  if (response.status === 401 && retry && !path.startsWith("/auth/")) {
    const refreshed = await reissue().catch(() => false);
    if (refreshed) return request<T>(path, init, false);
  }

  const body = await response.json().catch(() => null);
  if (!response.ok || !body?.success) {
    throw new ApiError(body?.message ?? "요청을 처리하지 못했습니다.", response.status, body?.errorCode ?? "UNKNOWN_ERROR");
  }
  return body.data as T;
}

async function reissue() {
  const response = await fetch(`${API_BASE}/auth/refresh`, {
    method: "POST", credentials: "include",
    headers: { "Content-Type": "application/json" },
  });
  const body = await response.json();
  if (!response.ok || !body.success) { clearAuth(); return false; }
  persistAuth(body.data);
  return true;
}

export function persistAuth(tokens: AuthTokens) {
  writeStorage(ACCESS_KEY, tokens.accessToken);
  if (tokens.refreshToken) writeStorage(REFRESH_KEY, tokens.refreshToken);
  if (tokens.guardian) writeStorage(GUARDIAN_KEY, JSON.stringify(tokens.guardian));
}
export function loginAsDemo() {
  if (!demoLoginEnabled) throw new ApiError("체험용 로그인은 현재 사용할 수 없습니다.", 403, "DEMO_LOGIN_DISABLED");
  persistAuth({
    accessToken: "demo-access-token",
    refreshToken: "demo-refresh-token",
    expiresInSeconds: 86400,
    guardian: {
      guardianId: 0,
      email: "demo@malhaebom.local",
      name: "체험 보호자",
      role: "GUARDIAN",
    },
  });
  writeStorage(DEMO_KEY, "true");
}
export function isDemoMode() {
  return readStorage(DEMO_KEY) === "true";
}
export function clearAuth() {
  if (typeof window === "undefined") return;
  [ACCESS_KEY, REFRESH_KEY, GUARDIAN_KEY, DEMO_KEY].forEach(key => {
    window.localStorage.removeItem(key);
    window.sessionStorage.removeItem(key);
  });
}
export function getGuardian(): Guardian | null {
  const raw = readStorage(GUARDIAN_KEY);
  try { return raw ? JSON.parse(raw) : null; } catch { return null; }
}
export function isAuthenticated() { return Boolean(readStorage(ACCESS_KEY)); }

export const api = {
  oauthAuthorizeUrl: (provider: string) => `${API_BASE}/auth/oauth/${encodeURIComponent(provider)}/authorize`,
  signup: (input: { email: string; password: string; name: string }) =>
    request<Guardian>("/auth/signup", { method: "POST", body: JSON.stringify(input) }),
  login: async (input: { email: string; password: string }) => {
    const data = await request<AuthTokens>("/auth/login", { method: "POST", body: JSON.stringify(input) });
    persistAuth(data); return data;
  },
  logout: async () => {
    try { if (!isDemoMode()) await request<null>("/auth/logout", { method: "DELETE" }); }
    finally { clearAuth(); }
  },
  children: () => withLocalChildFallback(
    () => request<Child[]>("/children"),
    () => readLocalChildren(),
  ),
  child: (id: number) => withLocalChildFallback(
    () => request<Child>(`/children/${id}`),
    () => localChild(id),
  ),
  createChild: (input: Omit<Child, "childId">) => withLocalChildFallback(
    () => request<Child>("/children", { method: "POST", body: JSON.stringify(input) }),
    () => {
      const child: Child = { ...input, childId: Date.now(), totalStudyCount: 0, totalCorrectRate: 0 };
      writeLocalChildren([...readLocalChildren(), child]);
      return child;
    },
  ),
  updateChild: (id: number, input: Partial<Pick<Child, "nickname" | "age" | "grade" | "level">>) => withLocalChildFallback(
    () => request<Child>(`/children/${id}`, { method: "PATCH", body: JSON.stringify(input) }),
    () => {
      const child = { ...localChild(id), ...input, childId: id };
      writeLocalChildren(readLocalChildren().map(item => item.childId === id ? child : item));
      return child;
    },
  ),
  deleteChild: (id: number) => withLocalChildFallback(
    () => request<null>(`/children/${id}`, { method: "DELETE" }),
    () => {
      localChild(id);
      writeLocalChildren(readLocalChildren().filter(item => item.childId !== id));
      return null;
    },
  ),
  topics: () => request<LearningTopic[]>("/learning-topics"),
  questionTypes: () => request<QuestionTypeOption[]>("/question-types"),
  createSession: (input: { childId: number; topicId: number; difficulty: Difficulty; questionTypes: QuestionType[]; questionCount: number }) =>
    request<LearningSession>("/learning-sessions", { method: "POST", body: JSON.stringify(input) }),
  session: (id: number) => request<LearningSession>(`/learning-sessions/${id}`),
  nextQuestion: (id: number) => request<Question>(`/learning-sessions/${id}/questions/next`),
  completeSession: (id: number) => request<SessionResult>(`/learning-sessions/${id}/complete`, { method: "POST" }),
  uploadSpeech: (sessionId: number, sessionQuestionId: number, audio: Blob) => {
    const form = new FormData(); form.append("audio", audio, "answer.webm");
    return request<SpeechAnswer>(`/learning-sessions/${sessionId}/questions/${sessionQuestionId}/speech`, { method: "POST", body: form });
  },
  submitAnswer: (sessionId: number, sessionQuestionId: number, speechAnswerId: number, answerText: string) =>
    request<AnswerFeedback>(`/learning-sessions/${sessionId}/questions/${sessionQuestionId}/answers`, { method: "POST", body: JSON.stringify({ speechAnswerId, answerText }) }),
  skipRetry: (sessionId: number, sessionQuestionId: number) =>
    request<null>(`/learning-sessions/${sessionId}/questions/${sessionQuestionId}/skip-retry`, { method: "POST" }),
  hint: (sessionId: number, questionId: number) =>
    request<{ hintText: string; hintTtsUrl: string | null; hintTtsVisemes?: VisemeCue[] }>(`/learning-sessions/${sessionId}/questions/${questionId}/hint`, { method: "POST" }),
  explanation: (sessionId: number, questionId: number, answerId: number) =>
    request<{ explanationText: string; explanationTtsUrl: string | null; explanationTtsVisemes?: VisemeCue[] }>(`/learning-sessions/${sessionId}/questions/${questionId}/explanation`, { method: "POST", body: JSON.stringify({ answerId }) }),
  questionTts: (questionId: number) => request<{ questionId: number; text: string; audioUrl: string }>(`/questions/${questionId}/tts`),
  history: (childId: number, query = "") => request<LearningHistory>(`/children/${childId}/learning-history${query}`),
  statistics: (childId: number) => request<Statistics>(`/children/${childId}/statistics`),
  wrongAnswers: (childId: number) => request<WrongAnswer[]>(`/children/${childId}/wrong-answers`),
  adminQuestions: (query = "") => request<PageData<AdminQuestion>>(`/admin/questions${query}`),
  adminQuestion: (id: number) => request<AdminQuestion>(`/admin/questions/${id}`),
  createAdminQuestion: (input: AdminQuestionInput) =>
    request<{ questionId: number }>("/admin/questions", { method: "POST", body: JSON.stringify(input) }),
  updateAdminQuestion: (id: number, input: Partial<AdminQuestionInput>) =>
    request<AdminQuestion>(`/admin/questions/${id}`, { method: "PATCH", body: JSON.stringify(input) }),
  deleteAdminQuestion: (id: number) => request<null>(`/admin/questions/${id}`, { method: "DELETE" }),
  uploadQuestionImage: (image: File) => {
    const form = new FormData(); form.append("image", image);
    return request<{ fileUrl: string }>("/admin/files/images", { method: "POST", body: form });
  },
};

export function errorMessage(error: unknown) {
  return error instanceof ApiError ? error.message : "알 수 없는 오류가 발생했습니다.";
}
