"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { BackLink, Brand, MiniProfile } from "../components";
import { api, errorMessage } from "@/lib/api/client";
import { learningState, saveSessionValue } from "@/lib/api/session";
import type { Difficulty, LearningTopic, QuestionType } from "@/lib/api/types";

const topicArt:Record<string,[string,string]>= {ANIMAL:["🦁","soft-yellow"],FOOD:["🍎","soft-coral"],DAILY_LIFE:["🏡","soft-mint"]};

export default function SetupPage() {
  const router=useRouter(); const [topics,setTopics]=useState<LearningTopic[]>([]); const [topicId,setTopicId]=useState<number>();
  const [difficulty,setDifficulty]=useState<Difficulty>("EASY"); const [count,setCount]=useState(5); const [types,setTypes]=useState<QuestionType[]>([]);
  const [availableTypes,setAvailableTypes]=useState<{code:QuestionType;name:string}[]>([]); const [error,setError]=useState(""); const [loading,setLoading]=useState(false);
  const [child] = useState(() => learningState.child());
  useEffect(()=>{
    if(!child){router.replace("/profiles");return;}
    Promise.all([api.topics(),api.questionTypes()]).then(([topicData,typeData])=>{setTopics(topicData);setTopicId(topicData[0]?.topicId);setAvailableTypes(typeData);setTypes(typeData.map(v=>v.code));}).catch(e=>setError(errorMessage(e)));
  },[router,child]);
  async function start(){
    if(!child||!topicId||!types.length)return; setLoading(true);setError("");
    try {const session=await api.createSession({childId:child.childId,topicId,difficulty,questionTypes:types,questionCount:count});saveSessionValue("session",session);router.push("/quiz");}
    catch(e){setError(errorMessage(e));setLoading(false);}
  }
  return <main className="page-shell"><div className="container">
    <header className="topbar"><Brand/><div className="flex items-center gap-2"><BackLink href="/profiles">프로필</BackLink><MiniProfile/></div></header>
    <section className="mx-auto max-w-5xl py-10 text-center"><p className="eyebrow">Today&apos;s adventure</p><h1 className="title mt-3">오늘 무엇을 배워볼까요?</h1><p className="subtitle mt-3">게임을 고르듯 즐겁게 선택해 보세요.</p>
      {error&&<div role="alert" className="mt-5 rounded-2xl bg-(--warn-bg) p-4 font-bold text-(--warn-text)">{error}</div>}
      <div className="mt-10 grid gap-5 md:grid-cols-3">{topics.map(item=>{const [emoji,tone]=topicArt[item.code]??["💬","soft-blue"];const selected=topicId===item.topicId;return <button key={item.topicId} type="button" onClick={()=>setTopicId(item.topicId)} aria-pressed={selected} className={`card relative min-h-[210px] cursor-pointer p-6 transition hover:-translate-y-2 ${selected?"border-2 border-(--accent)":""}`}>{selected&&<span className="absolute right-4 top-4 grid h-8 w-8 place-items-center rounded-full bg-(--accent) text-white" aria-hidden="true">✓</span>}<span className={`mx-auto grid h-24 w-24 place-items-center rounded-[30px] ${tone} text-5xl`} aria-hidden="true">{emoji}</span><strong className="mt-4 block text-2xl">{item.name}</strong></button>})}</div>
      <div className="card mt-7 grid gap-6 p-6 text-left md:grid-cols-3 md:p-8"><Choice label="난이도" values={[["EASY","초급"],["NORMAL","중급"],["HARD","고급"]]} selected={difficulty} onSelect={v=>setDifficulty(v as Difficulty)}/><Choice label="문제 수" values={[["5","5문제"],["10","10문제"]]} selected={String(count)} onSelect={v=>setCount(Number(v))}/><fieldset><legend className="mb-3 font-extrabold">문제 유형</legend><div className="space-y-2">{availableTypes.map(type=><label key={type.code} className="flex cursor-pointer items-center gap-2 rounded-xl bg-(--surface-muted) p-3 text-sm font-bold"><input type="checkbox" checked={types.includes(type.code)} onChange={()=>setTypes(prev=>prev.includes(type.code)?prev.filter(v=>v!==type.code):[...prev,type.code])}/>{type.name}</label>)}</div></fieldset></div>
      <button onClick={start} disabled={loading||!topicId||!types.length} className="btn btn-primary btn-large mt-8 min-w-[260px] disabled:opacity-50">{loading?"학습 준비 중…":"학습 시작 →"}</button>
    </section>
  </div></main>;
}
function Choice({label,values,selected,onSelect}:{label:string;values:string[][];selected:string;onSelect:(v:string)=>void}){return <fieldset><legend className="mb-3 font-extrabold">{label}</legend><div className="grid grid-cols-2 gap-2">{values.map(([value,text])=><button type="button" key={value} onClick={()=>onSelect(value)} aria-pressed={selected===value} className={`btn px-3 ${selected===value?"bg-(--accent-bg-selected) text-(--accent-dark) ring-2 ring-(--accent)":"bg-(--surface-muted) text-(--muted-2)"}`}>{selected===value&&<span aria-hidden="true">✓ </span>}{text}</button>)}</div></fieldset>}
