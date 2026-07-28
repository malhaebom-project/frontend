import type {
  AdminQuestion, AnswerFeedback, Child, LearningHistory, LearningSession,
  LearningTopic, PageData, Question, QuestionTypeOption, SessionResult,
  SpeechAnswer, Statistics, WrongAnswer,
} from "./types";

const STATE_KEY = "malhaebom.demoApiState";
const today = new Date().toISOString();

interface DemoState {
  children: Child[];
  session: LearningSession | null;
  currentQuestion: number;
  correctCount: number;
  answers: AnswerFeedback[];
  retrying: boolean;
}

const questions: Question[] = [
  { sessionQuestionId:1501,questionId:501,questionIndex:1,totalQuestionCount:5,type:"PICTURE_DESCRIPTION",questionText:"What is this?",questionTextKo:"이것은 무엇일까요?",imageUrl:null,hintText:"It is an ____.",ttsUrl:null },
  { sessionQuestionId:1502,questionId:502,questionIndex:2,totalQuestionCount:5,type:"SHORT_ANSWER",questionText:"What color is the apple?",questionTextKo:"사과는 무슨 색일까요?",imageUrl:null,hintText:"It is ____.",ttsUrl:null },
  { sessionQuestionId:1503,questionId:503,questionIndex:3,totalQuestionCount:5,type:"OPEN_SPEAKING",questionText:"What fruit do you like?",questionTextKo:"어떤 과일을 좋아하나요?",imageUrl:null,hintText:"I like ____.",ttsUrl:null },
  { sessionQuestionId:1504,questionId:504,questionIndex:4,totalQuestionCount:5,type:"PICTURE_DESCRIPTION",questionText:"Is the apple delicious?",questionTextKo:"사과가 맛있어 보이나요?",imageUrl:null,hintText:"Yes, it is ____.",ttsUrl:null },
  { sessionQuestionId:1505,questionId:505,questionIndex:5,totalQuestionCount:5,type:"OPEN_SPEAKING",questionText:"When do you eat apples?",questionTextKo:"언제 사과를 먹나요?",imageUrl:null,hintText:"I eat apples at ____.",ttsUrl:null },
];

const defaultState: DemoState = {
  children: [
    { childId:1,nickname:"서아",age:9,grade:2,level:"BEGINNER",totalStudyCount:8,totalCorrectRate:84 },
    { childId:2,nickname:"민준",age:11,grade:4,level:"ELEMENTARY",totalStudyCount:5,totalCorrectRate:76 },
  ],
  session:null,currentQuestion:0,correctCount:0,answers:[],retrying:false,
};

function readState(): DemoState {
  const raw=sessionStorage.getItem(STATE_KEY);
  if(!raw){writeState(defaultState);return structuredClone(defaultState);}
  try{return JSON.parse(raw);}catch{return structuredClone(defaultState);}
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

  if(path==="/learning-topics")return [
    {topicId:1,name:"동물",code:"ANIMAL"},{topicId:2,name:"음식",code:"FOOD"},{topicId:3,name:"일상생활",code:"DAILY_LIFE"},
  ] satisfies LearningTopic[] as T;
  if(path==="/question-types")return [
    {code:"SHORT_ANSWER",name:"단어 말하기"},{code:"PICTURE_DESCRIPTION",name:"그림 보고 말하기"},{code:"OPEN_SPEAKING",name:"말로 설명하기"},
  ] satisfies QuestionTypeOption[] as T;

  if(path==="/learning-sessions"&&method==="POST"){
    const input=jsonBody(init);state.currentQuestion=0;state.correctCount=0;state.answers=[];state.retrying=false;
    state.session={sessionId:100,childId:input.childId,topicId:input.topicId,difficulty:input.difficulty,questionCount:input.questionCount,currentQuestionIndex:0,status:"IN_PROGRESS",startedAt:today};
    writeState(state);return state.session as T;
  }
  const nextMatch=path.match(/^\/learning-sessions\/(\d+)\/questions\/next$/);
  if(nextMatch){
    const base=questions[state.currentQuestion%questions.length];
    return {...base,questionIndex:state.currentQuestion+1,totalQuestionCount:state.session?.questionCount??5} as T;
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
    const transcripts=["It is an apple.","It is red.","I like strawberries.","Yes, it is delicious.","I eat apples at breakfast."];
    return {speechAnswerId:1001+state.currentQuestion,transcript:transcripts[state.currentQuestion%transcripts.length],confidence:.96,audioUrl:null} satisfies SpeechAnswer as T;
  }
  const answerMatch=path.match(/^\/learning-sessions\/\d+\/questions\/(\d+)\/answers$/);
  if(answerMatch&&method==="POST"){
    const input=jsonBody(init);const index=state.currentQuestion;const isRetryExample=index===1&&!state.retrying;
    const feedback:AnswerFeedback={
      answerId:2001+index,sessionQuestionId:Number(answerMatch[1]),answerText:input.answerText,
      result:isRetryExample?"PARTIALLY_CORRECT":"CORRECT",score:isRetryExample?78:96,
      matchedKeywords:isRetryExample?["red"]:["apple"],missingKeywords:isRetryExample?["a"]:[],
      modelAnswer:isRetryExample?"It is a red apple.":input.answerText,
      feedbackText:isRetryExample?"아주 좋아요! 'a red apple'이라고 말하면 더 자연스러워요.":"정확하고 또박또박 잘 말했어요!",
      feedbackTtsUrl:null,canRetry:isRetryExample,remainingAttempts:isRetryExample?1:undefined,
    };
    state.answers.push(feedback);if(!isRetryExample)state.correctCount+=1;state.currentQuestion+=1;state.retrying=false;
    if(state.session)state.session.currentQuestionIndex=state.currentQuestion;writeState(state);return feedback as T;
  }
  if(/\/hint$/.test(path))return {hintText:questions[state.currentQuestion%questions.length].hintText,hintTtsUrl:null} as T;
  if(/\/explanation$/.test(path))return {explanationText:"문장의 핵심 단어와 어순을 함께 살펴보면 더 자연스럽게 말할 수 있어요.",explanationTtsUrl:null} as T;
  if(/\/follow-up$/.test(path))return {followUpQuestionId:7001,questionText:"Do you like apples?",questionTextKo:"사과를 좋아하나요?",ttsUrl:null,followUpsRemaining:1} as T;

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
  state.currentQuestion=Math.max(0,state.currentQuestion-1);
  state.retrying=true;
  if(state.session)state.session.currentQuestionIndex=state.currentQuestion;
  writeState(state);
}

function demoHistory(){
  return [
    {sessionId:100,topicName:"음식",difficulty:"EASY" as const,questionCount:5,correctCount:4,correctRate:80,studySeconds:320,completedAt:today},
    {sessionId:99,topicName:"동물",difficulty:"EASY" as const,questionCount:5,correctCount:5,correctRate:100,studySeconds:410,completedAt:"2026-07-24T10:20:00"},
    {sessionId:98,topicName:"일상생활",difficulty:"NORMAL" as const,questionCount:10,correctCount:7,correctRate:70,studySeconds:760,completedAt:"2026-07-21T15:10:00"},
  ];
}
