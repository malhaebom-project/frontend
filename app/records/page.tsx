"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Brand, MiniProfile } from "../components";
import { api, errorMessage } from "@/lib/api/client";
import { learningState } from "@/lib/api/session";
import type { HistoryItem, Statistics, WrongAnswer } from "@/lib/api/types";

export default function RecordsPage() {
  const router=useRouter(); const [child]=useState(()=>learningState.child()); const [history,setHistory]=useState<HistoryItem[]>([]); const [stats,setStats]=useState<Statistics|null>(null); const [wrong,setWrong]=useState<WrongAnswer[]>([]); const [error,setError]=useState(""); const [loading,setLoading]=useState(true);
  useEffect(()=>{if(!child){router.replace("/profiles");return;}Promise.all([api.history(child.childId,"?page=0&size=10"),api.statistics(child.childId),api.wrongAnswers(child.childId)]).then(([h,s,w])=>{setHistory(h.content);setStats(s);setWrong(w);}).catch(e=>setError(errorMessage(e))).finally(()=>setLoading(false));},[router,child]);
  return <main className="min-h-screen bg-(--app-bg)"><div className="border-b border-(--app-bg-border) bg-white"><header className="topbar container"><Brand/><div className="flex items-center gap-3"><MiniProfile/><Link href="/" className="btn btn-ghost">아이 화면으로</Link></div></header></div>
    <div className="container py-12"><div className="flex flex-wrap items-end justify-between gap-5"><div><p className="eyebrow">Parent dashboard</p><h1 className="title mt-2">학습 기록</h1><p className="subtitle mb-0 mt-2">{child?.nickname??"아이"}의 영어 자신감이 얼마나 자랐는지 확인해 보세요.</p></div><span className="pill">최근 기록</span></div>
      {error&&<div role="alert" className="mt-6 rounded-2xl bg-(--warn-bg) p-4 font-bold text-(--warn-text)">{error}</div>}{loading?<div>
      <p role="status" className="sr-only">학습 기록을 불러오고 있어요…</p>
      <div aria-hidden="true"><section className="mt-8 grid gap-4 md:grid-cols-4">{Array.from({length:4}).map((_,i)=><div key={i} className="card flex items-center gap-4 p-5 shadow-sm"><div className="skeleton h-12 w-12 shrink-0 rounded-2xl"/><div className="flex-1 space-y-2"><div className="skeleton h-6 w-16"/><div className="skeleton h-3 w-20"/></div></div>)}</section>
      <section className="mt-6 grid gap-6 lg:grid-cols-[1.35fr_.65fr]">
        <div className="card space-y-4 p-7 shadow-sm"><div className="skeleton h-4 w-24"/><div className="skeleton h-6 w-32"/><div className="skeleton h-3 w-full"/><div className="skeleton h-3 w-full"/><div className="skeleton h-3 w-2/3"/></div>
        <div className="card space-y-4 p-7 shadow-sm"><div className="skeleton h-4 w-24"/><div className="skeleton h-6 w-32"/><div className="skeleton h-16 w-full"/></div>
      </section>
      <section className="card mt-6 space-y-4 overflow-hidden p-7 shadow-sm"><div className="skeleton h-4 w-20"/><div className="skeleton h-14 w-full"/><div className="skeleton h-14 w-full"/><div className="skeleton h-14 w-full"/></section></div>
    </div>:<>
      <section className="mt-8 grid gap-4 md:grid-cols-4">{[["📅",`${stats?.totalSessionCount??0}회`,"총 학습 횟수","soft-blue"],["◎",`${stats?.averageCorrectRate??0}%`,"평균 정답률","soft-mint"],["🔥",`${stats?.consecutiveStudyDays??0}일`,"연속 학습","soft-coral"],["⏱",`${Math.round((stats?.totalStudySeconds??0)/60)}분`,"총 학습 시간","soft-yellow"]].map(([icon,value,label,tone])=><div key={label} className="card flex items-center gap-4 p-5 shadow-sm"><span className={`stat-icon ${tone}`} aria-hidden="true">{icon}</span><div><strong className="text-2xl">{value}</strong><p className="m-0 mt-1 text-xs font-bold text-(--muted-2)">{label}</p></div></div>)}</section>
      <section className="mt-6 grid gap-6 lg:grid-cols-[1.35fr_.65fr]"><div className="card p-7 shadow-sm"><p className="m-0 text-sm font-extrabold text-(--muted-2)">주제별 학습</p><h2 className="mb-6 mt-1 text-xl font-black">정답률</h2><div className="space-y-5">{stats?.topicStatistics.map(topic=><div key={topic.topicName}><div className="mb-2 flex justify-between text-sm font-extrabold"><span>{topic.topicName} · {topic.questionCount}문제</span><span>{topic.correctRate}%</span></div><div className="progress"><span style={{width:`${topic.correctRate}%`}}/></div></div>)}{!stats?.topicStatistics.length&&<p className="text-(--muted-2)">아직 주제별 통계가 없어요.</p>}</div></div>
        <div className="card p-7 shadow-sm"><p className="m-0 text-sm font-extrabold text-(--muted-2)">다시 연습할 표현</p><h2 className="mb-5 mt-1 text-xl font-black">최근 오답</h2>{wrong[0]?<div className="rounded-2xl bg-[#fff8df] p-5"><p className="m-0 text-sm text-(--muted-2)">{wrong[0].questionText}</p><p className="mb-1 mt-3 text-sm line-through">{wrong[0].answerText}</p><p className="m-0 text-lg font-black">{wrong[0].modelAnswer}</p></div>:<p className="rounded-2xl bg-(--success-bg) p-5 font-bold text-(--success-text)">아직 저장된 오답이 없어요!</p>}</div>
      </section>
      <section className="card mt-6 overflow-hidden shadow-sm"><div className="border-b border-(--line-soft) px-7 py-6"><h2 className="m-0 text-xl font-black">최근 학습</h2></div><div className="divide-y divide-(--line-soft)">{history.map(item=><div key={item.sessionId} className="grid items-center gap-4 px-7 py-5 sm:grid-cols-[1fr_1fr_1.3fr_auto]"><div><strong className="block">{new Date(item.completedAt).toLocaleDateString("ko-KR")}</strong><span className="text-sm text-(--muted-2)">{Math.round(item.studySeconds/60)}분 학습</span></div><span className="font-bold">{item.topicName} · {item.difficulty==="EASY"?"초급":item.difficulty==="NORMAL"?"중급":"고급"}</span><div><div className="mb-2 flex justify-between text-xs font-extrabold"><span>{item.correctCount}/{item.questionCount} 정답</span><span>{item.correctRate}%</span></div><div className="progress h-2"><span style={{width:`${item.correctRate}%`}}/></div></div><span className="pill">{item.questionCount}문제</span></div>)}{!history.length&&<p className="p-10 text-center text-(--muted-2)">완료한 학습이 아직 없어요.</p>}</div></section></>}
    </div>
  </main>;
}
