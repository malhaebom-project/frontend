export type ApiSuccess<T> = { success: true; data: T; message: string | null };
export type ApiFailure = { success: false; data: null; message: string; errorCode: string };
export type ApiResponse<T> = ApiSuccess<T> | ApiFailure;

export type Role = "GUARDIAN";
export type ChildLevel = "BEGINNER" | "ELEMENTARY" | "INTERMEDIATE";
export type Difficulty = "EASY" | "NORMAL" | "HARD";
export type QuestionType = "SHORT_ANSWER" | "PICTURE_DESCRIPTION" | "OPEN_SPEAKING";
export type SessionStatus = "IN_PROGRESS" | "COMPLETED" | "CANCELED";
export type AnswerResult = "CORRECT" | "PARTIALLY_CORRECT" | "INCORRECT" | "UNRECOGNIZED";

export interface VisemeCue {
  offsetMs: number;
  visemeId: number;
}

export interface Guardian { guardianId: number; email: string; name: string; role: Role }
export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  tokenType?: "Bearer";
  expiresInSeconds?: number;
  expiresIn?: number;
  guardian?: Guardian;
}
export interface Child {
  childId: number; nickname: string; age: number; grade: number; level: ChildLevel;
  totalStudyCount?: number; totalCorrectRate?: number;
}
export interface LearningTopic { topicId: number; name: string; code: string }
export interface QuestionTypeOption { code: QuestionType; name: string }
export interface LearningSession {
  sessionId: number; childId?: number; topicId?: number; difficulty?: Difficulty;
  questionCount: number; currentQuestionIndex: number; correctCount?: number;
  status: SessionStatus; startedAt: string;
}
export interface Question {
  questionId: number; sessionQuestionId: number; questionIndex: number; totalQuestionCount: number; type: QuestionType;
  questionText: string; questionTextKo: string; imageUrl: string | null; hintText: string | null; ttsUrl: string | null;
  ttsVisemes?: VisemeCue[];
}
export interface SpeechAnswer { speechAnswerId: number; transcript: string; confidence: number; audioUrl: string | null }
export interface AnswerFeedback {
  answerId: number; sessionQuestionId: number; answerText: string; attemptNo: number; result: AnswerResult; score: number;
  matchedKeywords?: string[]; missingKeywords?: string[]; modelAnswer: string;
  feedbackText: string; feedbackTtsUrl: string | null; canRetry: boolean; remainingAttempts: number;
  feedbackTtsVisemes?: VisemeCue[];
}
export interface SessionResult {
  sessionId: number; questionCount: number; correctCount: number; correctRate: number;
  studySeconds: number; completedAt: string;
}
export interface LearningHistory {
  content: HistoryItem[]; page: number; size: number; totalElements: number; totalPages: number;
}
export interface HistoryItem {
  sessionId: number; topicName: string; difficulty: Difficulty; questionCount: number;
  correctCount: number; correctRate: number; studySeconds: number; completedAt: string;
}
export interface Statistics {
  totalSessionCount: number; totalStudySeconds: number; averageCorrectRate: number;
  consecutiveStudyDays: number; topicStatistics: { topicName: string; questionCount: number; correctRate: number }[];
}
export interface WrongAnswer {
  answerId: number; questionId: number; questionText: string; imageUrl: string | null;
  answerText: string; modelAnswer: string; feedbackText: string; answeredAt: string;
}
export interface AdminQuestionInput {
  topicId: number; type: QuestionType; difficulty: Difficulty; gradeMin: number; gradeMax: number;
  questionText: string; questionTextKo: string; imageUrl: string | null; modelAnswer: string;
  acceptedAnswers: string[]; requiredKeywords: string[]; hintText: string | null; enabled: boolean;
}
export interface AdminQuestion extends AdminQuestionInput { questionId: number }
export interface PageData<T> {
  content: T[]; page: number; size: number; totalElements: number; totalPages: number;
}
