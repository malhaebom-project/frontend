"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, type CSSProperties } from "react";
import { Buddy, Brand } from "../components";
import { api, errorMessage, isDemoMode } from "@/lib/api/client";
import { prepareDemoRetry } from "@/lib/api/demo";
import { learningState, saveSessionValue } from "@/lib/api/session";
import type { AnswerFeedback } from "@/lib/api/types";
import { useHydrated } from "@/lib/use-hydrated";
import {
  playKoreanFeedbackSpeech,
  stopCharacterSpeech,
  type CharacterVisemeCue,
} from "@/lib/character-speech";

export default function FeedbackPage() {
  const router=useRouter(); const hydrated=useHydrated(); const feedback:AnswerFeedback|null=hydrated?learningState.feedback():null; const [loading,setLoading]=useState(false); const [error,setError]=useState("");
  const [explanation,setExplanation]=useState<{text:string;url:string|null;visemes?:CharacterVisemeCue[]}|null>(null); const [toolLoading,setToolLoading]=useState(false);
  useEffect(()=>{if(hydrated&&!feedback)router.replace("/quiz");},[router,hydrated,feedback]);
  useEffect(()=>()=>stopCharacterSpeech(),[]);
  if(!feedback)return null;
  const correct=feedback.result==="CORRECT"; const answerId=feedback.answerId; const canRetry=feedback.canRetry; const remainingAttempts=feedback.remainingAttempts; const question=learningState.question(); const session=learningState.session(); const isLast=question&&question.questionIndex>=question.totalQuestionCount; const starsBefore=Math.max(0,(question?.questionIndex??1)-1); const starTotal=starsBefore+(correct?1:0);
  async function next(){
    if(!session)return;stopCharacterSpeech();setLoading(true);setError("");
    try {
      if(canRetry&&question)await api.skipRetry(session.sessionId,question.sessionQuestionId);
      if(isLast){const result=await api.completeSession(session.sessionId);saveSessionValue("result",result);router.push("/results");}else router.push("/quiz");
    }
    catch(e){setError(errorMessage(e));setLoading(false);}
  }
  const feedbackTtsUrl=feedback.feedbackTtsUrl;
  const feedbackText=feedback.feedbackText;
  const feedbackTtsVisemes=feedback.feedbackTtsVisemes;
  function replay(){playKoreanFeedbackSpeech({fallbackUrl:feedbackTtsUrl,text:feedbackText,fallbackVisemes:feedbackTtsVisemes}).catch(()=>setError("피드백 음성을 재생하지 못했어요."));}
  function retry(){stopCharacterSpeech();if(isDemoMode())prepareDemoRetry();router.push("/quiz");}
  async function requestExplanation(){
    if(!session||!question)return;setToolLoading(true);setError("");
    try {const data=await api.explanation(session.sessionId,question.questionId,answerId);setExplanation({text:data.explanationText,url:data.explanationTtsUrl,visemes:data.explanationTtsVisemes});await playKoreanFeedbackSpeech({fallbackUrl:data.explanationTtsUrl,text:data.explanationText,fallbackVisemes:data.explanationTtsVisemes});}
    catch(e){setError(errorMessage(e));}finally{setToolLoading(false);}
  }
  return <main className="page-shell">{correct&&question&&<StarReward answerId={answerId} before={starsBefore} after={starTotal} questionIndex={question.questionIndex} totalQuestions={question.totalQuestionCount}/>}<div className="container"><header className="topbar"><Brand/><span className={`pill ${correct?"bg-(--warn-bg) text-(--star-text)":"bg-(--accent-bg-selected) text-(--accent-dark)"}`}>{correct?`★ ${starTotal}개`:"한 번 더 도전!"}</span></header>
    <section className="mx-auto grid max-w-5xl items-center gap-8 py-10 lg:grid-cols-[.7fr_1.3fr]"><div className="relative text-center"><Buddy className="mx-auto" motion={correct?"correct":"feedback"}/><div className="mt-3"><span className={`rounded-full px-5 py-2 font-black ${correct?"bg-(--success-bg) text-(--success-text)":"bg-(--warn-bg) text-(--star-text)"}`}>정확도 {feedback.score}%</span></div></div>
      <div><p className="eyebrow">{correct?"Amazing work!":"Keep going!"}</p><h1 className="title mt-2">{correct?"Great job! 🎉":"좋은 시도예요!"}</h1><p className="subtitle mt-3">{feedback.feedbackText}</p>
        {error&&<div className="mt-4 rounded-2xl bg-(--warn-bg) p-4 font-bold text-(--warn-text)">{error}</div>}
        <div className="card mt-7 p-7"><p className="text-sm font-extrabold text-(--muted-2)">내가 말한 답</p><p className="mt-2 text-2xl font-black">{feedback.answerText||"인식된 답변이 없어요."}</p>{!correct&&<div className="mt-5 rounded-2xl bg-(--success-bg) p-4"><span className="text-xs font-extrabold text-(--success-text)">더 자연스러운 표현</span><p className="mb-0 mt-1 text-2xl font-black">{feedback.modelAnswer}</p></div>}<div className="feedback-tools mt-5"><button onClick={replay} className="btn btn-secondary">🔊 피드백 듣기</button><button onClick={requestExplanation} disabled={toolLoading} className="btn btn-ghost disabled:opacity-50">{toolLoading?"해설 준비 중…":"💡 왜 그런가요?"}</button></div></div>
        {explanation&&<div className="learning-extra mt-5"><span className="learning-extra-icon">💡</span><div><strong>봄이의 쉬운 해설</strong><p>{explanation.text}</p><button onClick={()=>playKoreanFeedbackSpeech({fallbackUrl:explanation.url,text:explanation.text,fallbackVisemes:explanation.visemes}).catch(()=>setError("해설 음성을 재생하지 못했어요."))} className="text-sm font-black text-(--blue)">다시 듣기 ↗</button></div></div>}
        <div className="mt-6 flex flex-wrap gap-3">{canRetry&&<button onClick={retry} className="btn btn-secondary btn-large">다시 말하기 · {remainingAttempts}회</button>}<button onClick={next} disabled={loading} className="btn btn-primary btn-large flex-1">{loading?"처리 중…":isLast?"학습 결과 보기":"다음 문제 →"}</button></div>
      </div>
    </section>
  </div></main>;
}

type RewardGaugeStyle=CSSProperties&{"--gauge-before":string;"--gauge-after":string;"--ring-before":string;"--ring-after":string};

function StarReward({answerId,before,after,questionIndex,totalQuestions}:{answerId:number;before:number;after:number;questionIndex:number;totalQuestions:number}) {
  const [visible,setVisible]=useState(true); const [count,setCount]=useState(before); const [celebrate,setCelebrate]=useState(false);
  const beforePercent=Math.round(Math.max(0,questionIndex-1)/totalQuestions*100); const afterPercent=Math.round(questionIndex/totalQuestions*100);
  const gaugeStyle={"--gauge-before":`${beforePercent}%`,"--gauge-after":`${afterPercent}%`,"--ring-before":`${beforePercent*3.6}deg`,"--ring-after":`${afterPercent*3.6}deg`} as RewardGaugeStyle;
  useEffect(()=>{
    const key=`malhaebom.reward.v5.${answerId}`;
    if(sessionStorage.getItem(key)){const duplicateTimer=window.setTimeout(()=>setVisible(false),0);return()=>window.clearTimeout(duplicateTimer);}
    const countTimer=window.setTimeout(()=>{setCount(after);setCelebrate(true);},1550);
    const celebrateTimer=window.setTimeout(()=>setCelebrate(false),2750);
    const hideTimer=window.setTimeout(()=>{sessionStorage.setItem(key,"shown");setVisible(false);},3600);
    return()=>{window.clearTimeout(countTimer);window.clearTimeout(celebrateTimer);window.clearTimeout(hideTimer);};
  },[answerId,after]);
  if(!visible)return null;
  return <div className={`star-reward-layer ${celebrate?"is-celebrating":""}`} style={gaugeStyle} aria-live="polite" aria-label={`별 ${after}개 획득, 학습 진행률 ${afterPercent}%`}>
    <div className="star-charge-orbit" aria-hidden><i/><i/><i/></div>
    <div className="star-charge-ring" aria-hidden><div className="star-charge-core"/></div>
    <div className="star-reward-badge"><span className="star-reward-star">★</span><strong>{count}</strong><small>STARS</small></div>
    <div className="star-charge-meter" aria-hidden><span/><div><b>LEARNING POWER</b><em>{afterPercent}%</em></div></div>
    <div className="star-reward-praise"><strong>{afterPercent}%까지 충전!</strong><span>정답을 맞혀 별이 하나 늘었어요</span></div>
  </div>;
}
