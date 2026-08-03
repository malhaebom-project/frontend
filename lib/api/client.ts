import type {
  AdminQuestion, AdminQuestionInput, AnswerFeedback, AuthTokens, Child, CreateChildInput,
  CreateLearningSessionInput, ExplanationResponse, FollowUpQuestion, Guardian, HintResponse,
  LearningHistory, LearningHistoryQuery, LearningSession, LearningTopic, LoginInput,
  PageData, Question, QuestionTts, QuestionTypeOption, SessionResult, SignupInput,
  SpeechAnswer, Statistics, UpdateChildInput, WrongAnswer,
} from "./types";
import { demoRequest } from "./demo";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "/api/v1";
const ACCESS_KEY = "malhaebom.accessToken";
const REFRESH_KEY = "malhaebom.refreshToken";
const GUARDIAN_KEY = "malhaebom.guardian";
const DEMO_KEY = "malhaebom.demoMode";

export const demoLoginEnabled =
  process.env.NODE_ENV === "development" ||
  process.env.NEXT_PUBLIC_ENABLE_DEMO_LOGIN === "true";

export class ApiError extends Error {
  constructor(message: string, public status = 0, public code = "NETWORK_ERROR") { super(message); }
}

function readStorage(key: string) {
  return typeof window === "undefined" ? null : window.sessionStorage.getItem(key);
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
  const refreshToken = readStorage(REFRESH_KEY);
  if (!refreshToken) return false;
  const response = await fetch(`${API_BASE}/auth/reissue`, {
    method: "POST", credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refreshToken }),
  });
  const body = await response.json();
  if (!response.ok || !body.success) { clearAuth(); return false; }
  persistAuth(body.data);
  return true;
}

export function persistAuth(tokens: AuthTokens) {
  sessionStorage.setItem(ACCESS_KEY, tokens.accessToken);
  sessionStorage.setItem(REFRESH_KEY, tokens.refreshToken);
  if (tokens.guardian) sessionStorage.setItem(GUARDIAN_KEY, JSON.stringify(tokens.guardian));
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
  sessionStorage.setItem(DEMO_KEY, "true");
}
export function isDemoMode() {
  return readStorage(DEMO_KEY) === "true";
}
export function clearAuth() {
  if (typeof window === "undefined") return;
  [ACCESS_KEY, REFRESH_KEY, GUARDIAN_KEY, DEMO_KEY].forEach(key => sessionStorage.removeItem(key));
}
export function getGuardian(): Guardian | null {
  const raw = readStorage(GUARDIAN_KEY);
  try { return raw ? JSON.parse(raw) : null; } catch { return null; }
}
export function isAuthenticated() { return Boolean(readStorage(ACCESS_KEY)); }

function withQuery(path: string, query: object) {
  const params = new URLSearchParams();
  Object.entries(query).forEach(([key, value]) => {
    if (value !== undefined) params.set(key, String(value));
  });
  const search = params.toString();
  return search ? `${path}?${search}` : path;
}

export const api = {
  signup: (input: SignupInput) =>
    request<Guardian>("/auth/signup", { method: "POST", body: JSON.stringify(input) }),
  login: async (input: LoginInput) => {
    const data = await request<AuthTokens>("/auth/login", { method: "POST", body: JSON.stringify(input) });
    persistAuth(data); return data;
  },
  oauthAuthorizeUrl: (provider: string) =>
    `${API_BASE}/auth/oauth/${encodeURIComponent(provider)}/authorize`,
  logout: async () => { if (!isDemoMode()) await request<null>("/auth/logout", { method: "POST" }); clearAuth(); },
  children: () => request<Child[]>("/children"),
  child: (id: number) => request<Child>(`/children/${id}`),
  createChild: (input: CreateChildInput) => request<Child>("/children", { method: "POST", body: JSON.stringify(input) }),
  updateChild: (id: number, input: UpdateChildInput) =>
    request<Child>(`/children/${id}`, { method: "PATCH", body: JSON.stringify(input) }),
  deleteChild: (id: number) => request<null>(`/children/${id}`, { method: "DELETE" }),
  topics: () => request<LearningTopic[]>("/learning-topics"),
  questionTypes: () => request<QuestionTypeOption[]>("/question-types"),
  createSession: (input: CreateLearningSessionInput) =>
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
  hint: (sessionId: number, questionId: number) =>
    request<HintResponse>(`/learning-sessions/${sessionId}/questions/${questionId}/hint`, { method: "POST" }),
  explanation: (sessionId: number, questionId: number, answerId: number) =>
    request<ExplanationResponse>(`/learning-sessions/${sessionId}/questions/${questionId}/explanation`, { method: "POST", body: JSON.stringify({ answerId }) }),
  followUp: (sessionId: number, sessionQuestionId: number, answerId: number) =>
    request<FollowUpQuestion>(`/learning-sessions/${sessionId}/questions/${sessionQuestionId}/follow-up`, { method: "POST", body: JSON.stringify({ answerId }) }),
  questionTts: (questionId: number) => request<QuestionTts>(`/questions/${questionId}/tts`),
  history: (childId: number, query: LearningHistoryQuery = {}) =>
    request<LearningHistory>(withQuery(`/children/${childId}/learning-history`, query)),
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
