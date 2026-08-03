"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Buddy, Brand } from "../components";
import { api, errorMessage, isDemoMode } from "@/lib/api/client";
import { prepareDemoRetry } from "@/lib/api/demo";
import { learningState, saveSessionValue } from "@/lib/api/session";
import type { AnswerFeedback } from "@/lib/api/types";
import { useHydrated } from "@/lib/use-hydrated";
import { playCharacterSpeech, stopCharacterSpeech } from "@/lib/character-speech";

export default function FeedbackPage() {
  const router=useRouter(); const hydrated=useHydrated(); const feedback:AnswerFeedback|null=hydrated?learningState.feedback():null; const [loading,setLoading]=useState(false); const [error,setError]=useState("");
  useEffect(()=>{if(hydrated&&!feedback)router.replace("/quiz");},[router,hydrated,feedback]);
  useEffect(()=>()=>stopCharacterSpeech(),[]);
  if(!feedback)return null;
  const correct=feedback.result==="CORRECT"; const question=learningState.question(); const session=learningState.session(); const isLast=question&&question.questionIndex>=question.totalQuestionCount;
  async function next(){
    if(!session)return;stopCharacterSpeech();setLoading(true);setError("");
    try {if(isLast){const result=await api.completeSession(session.sessionId);saveSessionValue("result",result);router.push("/results");}else router.push("/quiz");}
    catch(e){setError(errorMessage(e));setLoading(false);}
  }
  const feedbackTtsUrl=feedback.feedbackTtsUrl;
  const feedbackText=feedback.feedbackText;
  function replay(){playCharacterSpeech({url:feedbackTtsUrl,text:feedbackText,lang:"ko-KR"}).catch(()=>setError("피드백 음성을 재생하지 못했어요."));}
  function retry(){stopCharacterSpeech();if(isDemoMode())prepareDemoRetry();router.push("/quiz");}
  return <main className="page-shell"><div className="container"><header className="topbar"><Brand/><span className={`pill ${correct?"bg-[#e4f8f0] text-[#2b9e75]":"bg-[#eaf3ff] text-[#3f68d9]"}`}>{correct?"정답!":"한 번 더 도전!"}</span></header>
    <section className="mx-auto grid max-w-5xl items-center gap-8 py-10 lg:grid-cols-[.7fr_1.3fr]"><div className="relative text-center"><Buddy className="float mx-auto"/><div className="mt-3"><span className={`rounded-full px-5 py-2 font-black ${correct?"bg-[#e4f8f0] text-[#2b9e75]":"bg-[#fff6d7] text-[#9d7600]"}`}>정확도 {feedback.score}%</span></div></div>
      <div><p className="eyebrow">{correct?"Amazing work!":"Keep going!"}</p><h1 className="display mt-2">{correct?"Great job! 🎉":"좋은 시도예요!"}</h1><p className="subtitle mt-3">{feedback.feedbackText}</p>
        {error&&<div className="mt-4 rounded-2xl bg-[#fff6d7] p-4 font-bold text-[#7f640d]">{error}</div>}
        <div className="card mt-7 p-7"><p className="text-sm font-extrabold text-[#71809d]">내가 말한 답</p><p className="mt-2 text-2xl font-black">{feedback.answerText||"인식된 답변이 없어요."}</p>{!correct&&<div className="mt-5 rounded-2xl bg-[#e4f8f0] p-4"><span className="text-xs font-extrabold text-[#2b9e75]">더 자연스러운 표현</span><p className="mb-0 mt-1 text-2xl font-black">{feedback.modelAnswer}</p></div>}<button onClick={replay} className="btn btn-secondary mt-5">🔊 피드백 듣기</button></div>
        <div className="mt-6 flex flex-wrap gap-3">{feedback.canRetry&&feedback.remainingAttempts>0&&<button onClick={retry} className="btn btn-secondary btn-large">다시 말하기 ({feedback.remainingAttempts}회 남음)</button>}<button onClick={next} disabled={loading} className="btn btn-primary btn-large flex-1">{loading?"결과 저장 중…":isLast?"학습 결과 보기":"다음 문제 →"}</button></div>
      </div>
    </section>
  </div></main>;
}
