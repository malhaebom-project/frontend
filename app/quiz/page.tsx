"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Buddy } from "../components";
import { api, ApiError, errorMessage } from "@/lib/api/client";
import { learningState, saveSessionValue } from "@/lib/api/session";
import type { Question, SpeechAnswer } from "@/lib/api/types";
import { playCharacterSpeech, playHintSpeech, stopCharacterSpeech } from "@/lib/character-speech";

type Status="loading"|"idle"|"recording"|"processing"|"review"|"error";

export default function QuizPage() {
  const router=useRouter(); const [question,setQuestion]=useState<Question|null>(null); const [status,setStatus]=useState<Status>("loading");
  const [message,setMessage]=useState("문제를 준비하고 있어요."); const [hint,setHint]=useState(""); const recorder=useRef<MediaRecorder|null>(null); const chunks=useRef<Blob[]>([]);
  const [hintSpeaking,setHintSpeaking]=useState(false);
  const [draft,setDraft]=useState<SpeechAnswer|null>(null);
  const [session] = useState(() => learningState.session());
  useEffect(()=>{
    if(!session){router.replace("/setup");return;}
    api.nextQuestion(session.sessionId).then(data=>{setQuestion(data);saveSessionValue("question",data);setStatus("idle");setMessage("버튼을 누르고 영어로 말해보세요.");}).catch(e=>{setStatus("error");setMessage(errorMessage(e));});
  },[router,session]);
  useEffect(()=>()=>stopCharacterSpeech(),[]);

  async function startRecording(){
    if(!question||!session)return;
    if(!navigator.mediaDevices?.getUserMedia){setStatus("error");setMessage("이 브라우저에서는 마이크 녹음을 지원하지 않아요.");return;}
    try {
      const stream=await navigator.mediaDevices.getUserMedia({audio:true});
      const mediaRecorder=new MediaRecorder(stream);recorder.current=mediaRecorder;chunks.current=[];
      mediaRecorder.ondataavailable=e=>{if(e.data.size)chunks.current.push(e.data);};
      mediaRecorder.onstop=()=>{stream.getTracks().forEach(track=>track.stop());void processSpeech(new Blob(chunks.current,{type:mediaRecorder.mimeType||"audio/webm"}));};
      mediaRecorder.start();setStatus("recording");setMessage("지금 말하고 있어요!");
    } catch {setStatus("error");setMessage("마이크 권한이 필요해요. 브라우저 설정에서 허용해 주세요.");}
  }
  function stopRecording(){recorder.current?.stop();setStatus("processing");setMessage("답변을 확인하고 있어요.");}
  async function processSpeech(audio:Blob){
    if(!question||!session)return;
    try {
      const speech=await api.uploadSpeech(session.sessionId,question.sessionQuestionId,audio);
      if(!speech.transcript.trim())throw new ApiError("잘 들리지 않았어요. 천천히 다시 말해볼까요?",422,"SPEECH_NOT_RECOGNIZED");
      setDraft(speech);setStatus("review");setMessage("이렇게 들렸어요. 문장을 확인해 주세요.");
    } catch(e){setStatus("error");setMessage(errorMessage(e));}
  }
  async function submitDraft(){
    if(!question||!session||!draft)return;
    setStatus("processing");setMessage("답변을 채점하고 있어요.");
    try {
      const feedback=await api.submitAnswer(session.sessionId,question.sessionQuestionId,draft.speechAnswerId,draft.transcript);
      saveSessionValue("feedback",feedback);router.push("/feedback");
    } catch(e){setStatus("error");setMessage(errorMessage(e));}
  }
  function recordAgain(){setDraft(null);setStatus("idle");setMessage("좋아요! 버튼을 누르고 다시 말해보세요.");}
  async function requestHint(){
    if(!session||!question)return;
    setHintSpeaking(true);
    try {
      const data=await api.hint(session.sessionId,question.questionId);
      setHint(data.hintText);
      playHintSpeech({
        text:data.hintText,
        url:data.hintTtsUrl,
        visemes:data.hintTtsVisemes,
        onEnd:()=>setHintSpeaking(false),
      }).catch(()=>{
        setHintSpeaking(false);
        setMessage("힌트 음성을 재생하지 못했어요.");
      });
    } catch(e) {
      setHintSpeaking(false);
      setMessage(errorMessage(e));
    }
  }
  function replay(){if(question)playCharacterSpeech({url:question.ttsUrl,text:question.questionText,lang:"en-US",visemes:question.ttsVisemes}).catch(()=>setMessage("음성을 재생하지 못했어요."));}
  const progress=question?Math.round(question.questionIndex/question.totalQuestionCount*100):0;
  return <main className="page-shell"><div className="container">
    <header className="flex min-h-[88px] items-center gap-5"><Link onClick={stopCharacterSpeech} href="/setup" className="btn btn-ghost">✕ 나가기</Link><div className="flex-1"><div className="mb-2 flex justify-between text-sm font-extrabold"><span>문제 {question?.questionIndex??"-"} / {question?.totalQuestionCount??"-"}</span><span className="text-(--accent)">{progress}%</span></div><div className="progress"><span style={{width:`${progress}%`}}/></div></div><span className="pill bg-(--warn-bg) text-(--star-text)">★ {Math.max(0,(question?.questionIndex??1)-1)}</span></header>
    <section className="grid items-center gap-8 py-4 lg:grid-cols-[.75fr_1.25fr]"><div className="flex flex-col items-center"><div className="quiz-character-scene"><div className="quiz-character-scene-tint" aria-hidden="true"/><Buddy motion={status==="recording"?"listening":status==="processing"||hintSpeaking?"thinking":"idle"}/></div><div className="speech mt-5 w-full max-w-[410px] text-center"><p className="mb-2 text-sm font-extrabold text-(--accent)">{question?.questionTextKo??"문제를 불러오는 중"}</p><h1 className="speech-en">{question?.questionText??"…"}</h1><button type="button" onClick={replay} disabled={!question} className="btn btn-ghost mt-4 text-sm disabled:opacity-40">🔊 다시 듣기</button></div></div>
      <div className="card relative overflow-hidden p-6 md:p-9"><span className="absolute right-5 top-5 z-10 pill">{question?.type==="PICTURE_DESCRIPTION"?"그림 보고 말하기":"영어로 말하기"}</span><div className="grid min-h-[330px] place-items-center rounded-[28px] bg-gradient-to-br from-[#fffdf5] to-[#fff1e5] p-4 md:p-6">{question?.imageUrl?<div role="img" aria-label={question.questionTextKo} className="aspect-[4/3] w-full max-w-[640px] overflow-hidden rounded-[28px] border-4 border-white bg-contain bg-center bg-no-repeat shadow-[0_10px_30px_rgba(75,75,75,.14)] ring-2 ring-[#eadfce]" style={{backgroundImage:`url("${question.imageUrl.replaceAll('"','%22')}")`}}/>:<span className="text-[110px]" aria-hidden>💬</span>}</div></div>
    </section>
    <section className="mx-auto max-w-3xl pb-12 pt-4 text-center"><h2 className={`text-2xl font-black ${status==="recording"?"text-[#e56f60]":""}`}>{message}</h2>{hint&&<p className="mx-auto mt-3 max-w-xl rounded-2xl bg-(--warn-bg) p-3 font-bold text-(--warn-text)">💡 {hint}</p>}{status==="recording"&&<Waveform/>}{(status==="processing"||status==="loading")&&<Dots/>}
      {draft?<div className="answer-review mx-auto mt-6 max-w-2xl text-left"><div className="answer-review-label"><span>음성 인식 결과</span><span>{Math.round(draft.confidence*100)}%</span></div><p>{draft.transcript}</p><div className="mt-5 grid gap-3 sm:grid-cols-2"><button type="button" onClick={recordAgain} disabled={status==="processing"} className="btn btn-secondary btn-large">🎙 다시 말하기</button><button type="button" onClick={submitDraft} disabled={status==="processing"} className="btn btn-primary btn-large">이 답변 제출하기</button></div></div>:<>
        <button type="button" onClick={status==="recording"?stopRecording:startRecording} disabled={status==="processing"||status==="loading"} aria-label={status==="recording"?"녹음 중지":status==="processing"||status==="loading"?"답변 처리 중":"녹음 시작"} className={`record-button relative mx-auto mt-5 grid h-32 w-32 place-items-center rounded-full border-[9px] border-white text-white transition hover:scale-105 disabled:cursor-wait disabled:bg-[#b9c6dc] ${status==="recording"?"is-recording bg-[#ff8f80] ring-[14px] ring-[#ffe5e1]":"bg-(--green) ring-[14px] ring-(--green-soft)"}`}><span className="text-4xl" aria-hidden="true">{status==="recording"?"■":status==="processing"||status==="loading"?"…":"🎙"}</span></button>
        <p className="mt-5 text-sm font-extrabold text-(--muted-2)">{status==="recording"?"말하기 완료 · 녹음 중":"눌러서 말하기"}</p>
      </>}
      <div className="mt-6 flex justify-center gap-3"><button onClick={requestHint} disabled={!question||status==="processing"||status==="recording"||hintSpeaking} className="btn btn-ghost disabled:opacity-40">💡 힌트</button></div>
    </section>
  </div></main>;
}
function Waveform(){return <div className="my-5 flex h-9 items-center justify-center gap-1.5">{[14,25,34,21,30,18,36,25,15].map((h,i)=><span key={i} className="w-1.5 animate-pulse rounded-full bg-[#ff9a8b]" style={{height:h,animationDelay:`${i*70}ms`}}/>)}</div>}
function Dots(){return <div className="my-5 flex justify-center gap-2"><i className="h-3 w-3 animate-bounce rounded-full bg-(--accent)"/><i className="h-3 w-3 animate-bounce rounded-full bg-[#7ed9b5] [animation-delay:120ms]"/><i className="h-3 w-3 animate-bounce rounded-full bg-[#ffd96a] [animation-delay:240ms]"/></div>}
