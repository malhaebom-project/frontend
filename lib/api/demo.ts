import type {
  AdminQuestion, AnswerFeedback, Child, LearningHistory, LearningSession,
  LearningTopic, PageData, Question, QuestionType, QuestionTypeOption, SessionResult,
  SpeechAnswer, Statistics, WrongAnswer,
} from "./types";
import { buildApproximateVisemeCues } from "../viseme-timing";
import { DEMO_QUESTION_BANK, demoAssetUrl, type DemoQuestionSeed, type DemoTopicCode } from "./demo-questions";

const STATE_KEY = "malhaebom.demoApiState";
const today = new Date().toISOString();

interface DemoState {
  children: Child[];
  session: LearningSession | null;
  currentQuestion: number;
  correctCount: number;
  answers: AnswerFeedback[];
  retrying: boolean;
  questionTypes: QuestionType[];
}

const TOPIC_ID_TO_CODE: Record<number, DemoTopicCode> = { 1: "ANIMAL", 2: "FOOD", 3: "DAILY_LIFE" };

function questionPool(state: DemoState): DemoQuestionSeed[] {
  const topicCode = TOPIC_ID_TO_CODE[state.session?.topicId ?? 1] ?? "ANIMAL";
  const selectedTypes = state.questionTypes?.length
    ? state.questionTypes
    : ["SHORT_ANSWER", "PICTURE_DESCRIPTION", "OPEN_SPEAKING"] satisfies QuestionType[];
  const buckets = selectedTypes.map(type => (
    DEMO_QUESTION_BANK.filter(seed => seed.topic === topicCode && seed.type === type)
  ));
  const pool = Array.from({ length: Math.max(0, ...buckets.map(bucket => bucket.length)) })
    .flatMap((_, index) => buckets
      .map(bucket => bucket[index])
      .filter((seed): seed is DemoQuestionSeed => Boolean(seed)));
  return pool.length ? pool : DEMO_QUESTION_BANK.filter(seed => seed.topic === topicCode);
}

function activeQuestionSeed(state: DemoState): DemoQuestionSeed {
  const pool = questionPool(state);
  return pool[state.currentQuestion % pool.length];
}

function normalizeAnswer(text: string) {
  return text.toLowerCase().trim().replace(/[.!?,'"]/g, "").replace(/\s+/g, " ");
}

function demoFeedbackVoice(fileName: string, text: string, durationMs: number) {
  return {
    url: `/audio/demo/feedback/${fileName}.wav`,
    visemes: buildApproximateVisemeCues(text, durationMs),
  };
}

const DEMO_FEEDBACK_CORRECT = "정확하고 또박또박 잘 말했어요!";
const DEMO_EXPLANATION = "문장의 핵심 단어와 어순을 함께 살펴보면 더 자연스럽게 말할 수 있어요.";

const defaultState: DemoState = {
  children: [
    { childId:1,nickname:"서아",age:9,grade:2,level:"BEGINNER",totalStudyCount:8,totalCorrectRate:84 },
    { childId:2,nickname:"민준",age:11,grade:4,level:"ELEMENTARY",totalStudyCount:5,totalCorrectRate:76 },
  ],
  session:null,currentQuestion:0,correctCount:0,answers:[],retrying:false,questionTypes:[],
};

function readState(): DemoState {
  const raw=sessionStorage.getItem(STATE_KEY);
  if(!raw){writeState(defaultState);return structuredClone(defaultState);}
  try {
    const stored=JSON.parse(raw) as Partial<DemoState>;
    return {...structuredClone(defaultState),...stored,questionTypes:Array.isArray(stored.questionTypes)?stored.questionTypes:[]};
  } catch{return structuredClone(defaultState);}
}
function writeState(state:DemoState){sessionStorage.setItem(STATE_KEY,JSON.stringify(state));}
function jsonBody(init:RequestInit){try{return init.body?JSON.parse(String(init.body)):{};}catch{return {};}}
function wait(){return new Promise(resolve=>setTimeout(resolve,350));}

export async function demoRequest<T>(path:string,init:RequestInit):Promise<T>{
  await wait();
  const method=init.method??"GET";const state=readState();

  if(path==="/auth/logout"&&method==="POST")return null as T;
  if(path==="/children"&&method==="GET")return state.children as T;
  if(path==="/children"&&method==="POST"){
    const input=jsonBody(init);const child={...input,childId:Date.now(),totalStudyCount:0,totalCorrectRate:0} as Child;
    state.children.push(child);writeState(state);return child as T;
  }
  const childMatch=path.match(/^\/children\/(\d+)$/);
  if(childMatch&&method==="GET")return (state.children.find(v=>v.childId===Number(childMatch[1]))??state.children[0]) as T;
  if(childMatch&&method==="PATCH"){
    const childId=Number(childMatch[1]);const input=jsonBody(init);const index=state.children.findIndex(child=>child.childId===childId);
    if(index<0)throw new Error("어린이 프로필을 찾을 수 없습니다.");
    state.children[index]={...state.children[index],...input,childId};writeState(state);return state.children[index] as T;
  }
  if(childMatch&&method==="DELETE"){
    const childId=Number(childMatch[1]);
    state.children=state.children.filter(child=>child.childId!==childId);
    if(state.session?.childId===childId){
      state.session=null;state.currentQuestion=0;state.correctCount=0;state.answers=[];state.retrying=false;
    }
    writeState(state);return null as T;
  }

  if(path==="/learning-topics")return [
    {topicId:1,name:"동물",code:"ANIMAL"},{topicId:2,name:"음식",code:"FOOD"},{topicId:3,name:"일상생활",code:"DAILY_LIFE"},
  ] satisfies LearningTopic[] as T;
  if(path==="/question-types")return [
    {code:"SHORT_ANSWER",name:"단어 말하기"},{code:"PICTURE_DESCRIPTION",name:"그림 보고 말하기"},{code:"OPEN_SPEAKING",name:"말로 설명하기"},
  ] satisfies QuestionTypeOption[] as T;

  if(path==="/learning-sessions"&&method==="POST"){
    const input=jsonBody(init);state.currentQuestion=0;state.correctCount=0;state.answers=[];state.retrying=false;
    Object.keys(sessionStorage).filter(key=>key.startsWith("malhaebom.reward.")).forEach(key=>sessionStorage.removeItem(key));
    state.session={sessionId:100,childId:input.childId,topicId:input.topicId,difficulty:input.difficulty,questionCount:input.questionCount,currentQuestionIndex:0,status:"IN_PROGRESS",startedAt:today};
    state.questionTypes=Array.isArray(input.questionTypes)?input.questionTypes:[];
    writeState(state);return state.session as T;
  }
  const nextMatch=path.match(/^\/learning-sessions\/(\d+)\/questions\/next$/);
  if(nextMatch){
    const seed=activeQuestionSeed(state);
    const question:Question={
      questionId:9000+state.currentQuestion,sessionQuestionId:1501+state.currentQuestion,
      questionIndex:state.currentQuestion+1,totalQuestionCount:state.session?.questionCount??5,
      type:seed.type,questionText:seed.questionText,questionTextKo:seed.questionTextKo,
      imageUrl:demoAssetUrl(seed.imageUrl),hintText:seed.hintText,ttsUrl:null,
      ttsVisemes:buildApproximateVisemeCues(seed.questionText),
    };
    return question as T;
  }
  const sessionMatch=path.match(/^\/learning-sessions\/(\d+)$/);
  if(sessionMatch&&state.session)return {...state.session,currentQuestionIndex:state.currentQuestion,correctCount:state.correctCount} as T;
  const completeMatch=path.match(/^\/learning-sessions\/(\d+)\/complete$/);
  if(completeMatch){
    const count=state.session?.questionCount??5;
    const result:SessionResult={sessionId:100,questionCount:count,correctCount:state.correctCount,correctRate:Math.round(state.correctCount/count*100),studySeconds:286,completedAt:new Date().toISOString()};
    if(state.session)state.session.status="COMPLETED";writeState(state);return result as T;
  }

  if(/\/speech$/.test(path)&&method==="POST"){
    const seed=activeQuestionSeed(state);
    return {speechAnswerId:1001+state.currentQuestion,transcript:seed.modelAnswer,confidence:.97,audioUrl:null} satisfies SpeechAnswer as T;
  }
  const answerMatch=path.match(/^\/learning-sessions\/\d+\/questions\/(\d+)\/answers$/);
  if(answerMatch&&method==="POST"){
    const input=jsonBody(init);const index=state.currentQuestion;const seed=activeQuestionSeed(state);
    const submitted=normalizeAnswer(String(input.answerText??""));
    const isMatch=[seed.modelAnswer,...seed.acceptedAnswers].some(candidate=>normalizeAnswer(candidate)===submitted);
    const feedbackText=isMatch?DEMO_FEEDBACK_CORRECT:`아주 좋아요! '${seed.modelAnswer}'라고 말하면 더 자연스러워요.`;
    const feedbackVoice=demoFeedbackVoice("feedback-correct",DEMO_FEEDBACK_CORRECT,2573);
    const feedback:AnswerFeedback={
      answerId:2001+index,sessionQuestionId:Number(answerMatch[1]),answerText:input.answerText,attemptNo:state.retrying?2:1,
      result:isMatch?"CORRECT":"PARTIALLY_CORRECT",score:isMatch?96:78,
      matchedKeywords:isMatch?[seed.modelAnswer]:[],missingKeywords:isMatch?[]:[seed.modelAnswer],
      modelAnswer:seed.modelAnswer,
      feedbackText,
      feedbackTtsUrl:isMatch?feedbackVoice.url:null,feedbackTtsVisemes:isMatch?feedbackVoice.visemes:buildApproximateVisemeCues(feedbackText),canRetry:!isMatch,remainingAttempts:isMatch?0:1,
    };
    state.answers.push(feedback);if(isMatch){state.correctCount+=1;state.currentQuestion+=1;state.retrying=false;}
    if(state.session)state.session.currentQuestionIndex=state.currentQuestion;writeState(state);return feedback as T;
  }
  const skipRetryMatch=path.match(/^\/learning-sessions\/\d+\/questions\/\d+\/skip-retry$/);
  if(skipRetryMatch&&method==="POST"){
    state.currentQuestion+=1;state.retrying=false;
    if(state.session)state.session.currentQuestionIndex=state.currentQuestion;
    writeState(state);return null as T;
  }
  if(/\/hint$/.test(path)){
    const hintText=activeQuestionSeed(state).hintText;
    return {hintText,hintTtsUrl:null,hintTtsVisemes:buildApproximateVisemeCues(hintText)} as T;
  }
  if(/\/explanation$/.test(path)){
    const voice=demoFeedbackVoice("explanation",DEMO_EXPLANATION,5140);
    return {explanationText:DEMO_EXPLANATION,explanationTtsUrl:voice.url,explanationTtsVisemes:voice.visemes} as T;
  }
  if(path.startsWith("/children/")&&path.includes("/learning-history")){
    return {content:demoHistory(),page:0,size:10,totalElements:3,totalPages:1} satisfies LearningHistory as T;
  }
  if(path.endsWith("/statistics"))return {
    totalSessionCount:12,totalStudySeconds:4200,averageCorrectRate:82.5,consecutiveStudyDays:3,
    topicStatistics:[{topicName:"동물",questionCount:20,correctRate:90},{topicName:"음식",questionCount:18,correctRate:83.3},{topicName:"일상생활",questionCount:15,correctRate:73.3}],
  } satisfies Statistics as T;
  if(path.endsWith("/wrong-answers"))return [{
    answerId:2002,questionId:502,questionText:"What color is the apple?",imageUrl:null,answerText:"It is red.",modelAnswer:"It is a red apple.",feedbackText:"관사 a를 함께 사용해 보세요.",answeredAt:today,
  }] satisfies WrongAnswer[] as T;
  if(path.startsWith("/admin/questions"))return {content:[],page:0,size:10,totalElements:0,totalPages:0} satisfies PageData<AdminQuestion> as T;
  if(path==="/admin/files/images")return {fileUrl:"/window.svg"} as T;
  throw new Error(`데모 API에 정의되지 않은 요청입니다: ${method} ${path}`);
}

export function prepareDemoRetry(){
  const state=readState();
  state.retrying=true;
  writeState(state);
}

function demoHistory(){
  return [
    {sessionId:100,topicName:"음식",difficulty:"EASY" as const,questionCount:5,correctCount:4,correctRate:80,studySeconds:320,completedAt:today},
    {sessionId:99,topicName:"동물",difficulty:"EASY" as const,questionCount:5,correctCount:5,correctRate:100,studySeconds:410,completedAt:"2026-07-24T10:20:00"},
    {sessionId:98,topicName:"일상생활",difficulty:"NORMAL" as const,questionCount:10,correctCount:7,correctRate:70,studySeconds:760,completedAt:"2026-07-21T15:10:00"},
  ];
}
