"use client";

import Link from "next/link";
import { FormEvent, useEffect, useRef, useState } from "react";
import { Brand, MiniProfile } from "../components";
import { api, errorMessage, isAuthenticated, isDemoMode } from "@/lib/api/client";
import { demoRecordsPreview } from "@/lib/api/demo";
import { learningState, saveSessionValue } from "@/lib/api/session";
import type { Child, Difficulty, LearningHistory, Statistics, WrongAnswer } from "@/lib/api/types";

export default function RecordsPage() {
  const [initialChild]=useState<Child|null>(()=>learningState.child()); const [children,setChildren]=useState<Child[]>([]); const [child,setChild]=useState<Child|null>(initialChild); const [history,setHistory]=useState<LearningHistory|null>(null); const [stats,setStats]=useState<Statistics|null>(null); const [wrong,setWrong]=useState<WrongAnswer[]>([]); const [preview,setPreview]=useState(false); const [error,setError]=useState(""); const [loading,setLoading]=useState(true); const [apiReady,setApiReady]=useState(false); const [page,setPage]=useState(0); const [startDate,setStartDate]=useState(""); const [endDate,setEndDate]=useState(""); const [appliedStartDate,setAppliedStartDate]=useState(""); const [appliedEndDate,setAppliedEndDate]=useState(""); const requestGeneration=useRef(0);
  useEffect(()=>{
    let active=true;let waitForApi=false;
    async function prepareRecords(){
      try {
        if(!isAuthenticated()){
          const data=await demoRecordsPreview(initialChild?.childId);
          if(!active)return;
          if(!data.child){setError("표시할 체험용 학습 기록이 없습니다.");return;}
          saveSessionValue("child",data.child);setChildren([data.child]);setChild(data.child);setHistory(data.history);setStats(data.statistics);setWrong(data.wrongAnswers);setPreview(true);
          return;
        }
        const profiles=await api.children();
        if(!active)return;
        const selectedChild=profiles.find(item=>item.childId===initialChild?.childId)??profiles[0]??null;
        setChildren(profiles);setPreview(isDemoMode());setChild(selectedChild);
        if(selectedChild){waitForApi=true;saveSessionValue("child",selectedChild);setApiReady(true);return;}
        setError("학습 기록을 확인할 어린이 프로필이 없습니다.");
      } catch(e){if(active)setError(errorMessage(e));}
      finally{if(active&&!waitForApi)setLoading(false);}
    }
    void prepareRecords();
    return()=>{active=false;};
  },[initialChild]);
  useEffect(()=>{
    if(!apiReady||!child)return;
    const generation=++requestGeneration.current;let active=true;
    Promise.all([
      api.history(child.childId,{page,size:10,startDate:appliedStartDate||undefined,endDate:appliedEndDate||undefined}),
      api.statistics(child.childId),
      api.wrongAnswers(child.childId),
    ]).then(([nextHistory,nextStats,nextWrong])=>{if(active&&generation===requestGeneration.current){setHistory(nextHistory);setStats(nextStats);setWrong(nextWrong);}}).catch(e=>{if(active&&generation===requestGeneration.current)setError(errorMessage(e));}).finally(()=>{if(active&&generation===requestGeneration.current)setLoading(false);});
    return()=>{active=false;};
  },[apiReady,child,page,appliedStartDate,appliedEndDate]);
  function selectChild(childId:number){const selected=children.find(item=>item.childId===childId);if(!selected||selected.childId===child?.childId)return;setLoading(true);setError("");saveSessionValue("child",selected);setChild(selected);setPage(0);setHistory(null);}
  function filterHistory(event:FormEvent<HTMLFormElement>){event.preventDefault();if(startDate&&endDate&&startDate>endDate){setError("시작일은 종료일보다 늦을 수 없습니다.");return;}setLoading(true);setError("");setPage(0);setAppliedStartDate(startDate);setAppliedEndDate(endDate);}
  function resetHistoryFilter(){setLoading(true);setError("");setStartDate("");setEndDate("");setPage(0);setAppliedStartDate("");setAppliedEndDate("");}
  function changePage(nextPage:number){setLoading(true);setError("");setPage(nextPage);}
  return <main className="min-h-screen bg-(--app-bg)"><div className="border-b border-(--app-bg-border) bg-white"><header className="topbar container"><Brand/><div className="flex items-center gap-3"><MiniProfile/><Link href="/" className="btn btn-ghost">아이 화면으로</Link></div></header></div>
    <div className="container py-12"><div className="flex flex-wrap items-end justify-between gap-5"><div><p className="eyebrow">Parent dashboard</p><h1 className="title mt-2">학습 기록</h1><p className="subtitle mb-0 mt-2">{child?.nickname??"아이"}의 영어 자신감이 얼마나 자랐는지 확인해 보세요.</p></div><div className="flex flex-wrap items-center gap-3"><span className="pill">{preview?"체험용 샘플 기록":"백엔드 연동 기록"}</span>{children.length>0&&<label className="flex h-12 items-center gap-2 rounded-xl border border-(--accent-border) bg-white px-3 text-sm font-extrabold text-(--muted-2)">아이 선택<select aria-label="학습 기록을 확인할 어린이 선택" value={child?.childId??""} disabled={loading} onChange={event=>selectChild(Number(event.target.value))} className="bg-transparent font-black text-(--navy) outline-none disabled:cursor-wait">{children.map(profile=><option key={profile.childId} value={profile.childId}>{profile.nickname}</option>)}</select></label>}<Link href="/profiles" className="btn btn-ghost">프로필 관리</Link></div></div>
      {error&&<div role="alert" className="mt-6 rounded-2xl bg-(--warn-bg) p-4 font-bold text-(--warn-text)">{error}</div>}{!loading&&!child?<section className="card mt-8 p-10 text-center shadow-sm"><span className="text-5xl" aria-hidden="true">🌱</span><h2 className="mt-4 text-2xl font-black">먼저 어린이 프로필을 만들어 주세요</h2><p className="mt-2 font-semibold text-(--muted-2)">프로필을 만든 뒤 학습을 완료하면 기록과 통계가 이곳에 쌓여요.</p><Link href="/profiles" className="btn btn-primary mt-6">프로필 만들기</Link></section>:loading?<div>
      <p role="status" className="sr-only">학습 기록을 불러오고 있어요…</p>
      <div aria-hidden="true"><section className="mt-8 grid gap-4 md:grid-cols-4">{Array.from({length:4}).map((_,i)=><div key={i} className="card flex items-center gap-4 p-5 shadow-sm"><div className="skeleton h-12 w-12 shrink-0 rounded-2xl"/><div className="flex-1 space-y-2"><div className="skeleton h-6 w-16"/><div className="skeleton h-3 w-20"/></div></div>)}</section>
      <section className="mt-6 grid gap-6 lg:grid-cols-[1.35fr_.65fr]">
        <div className="card space-y-4 p-7 shadow-sm"><div className="skeleton h-4 w-24"/><div className="skeleton h-6 w-32"/><div className="skeleton h-3 w-full"/><div className="skeleton h-3 w-full"/><div className="skeleton h-3 w-2/3"/></div>
        <div className="card space-y-4 p-7 shadow-sm"><div className="skeleton h-4 w-24"/><div className="skeleton h-6 w-32"/><div className="skeleton h-16 w-full"/></div>
      </section>
      <section className="card mt-6 space-y-4 overflow-hidden p-7 shadow-sm"><div className="skeleton h-4 w-20"/><div className="skeleton h-14 w-full"/><div className="skeleton h-14 w-full"/><div className="skeleton h-14 w-full"/></section></div>
    </div>:<>
      {stats&&<ParentGuide childName={child?.nickname??"아이"} totalSessionCount={stats.totalSessionCount} correctRate={stats.averageCorrectRate}/>}
      <section className="mt-8 grid gap-4 md:grid-cols-4">{[["📅",`${stats?.totalSessionCount??0}회`,"총 학습 횟수","soft-blue"],["◎",`${stats?.averageCorrectRate??0}%`,"평균 정답률","soft-mint"],["🔥",`${stats?.consecutiveStudyDays??0}일`,"연속 학습","soft-coral"],["⏱",`${Math.round((stats?.totalStudySeconds??0)/60)}분`,"총 학습 시간","soft-yellow"]].map(([icon,value,label,tone])=><div key={label} className="card flex items-center gap-4 p-5 shadow-sm"><span className={`stat-icon ${tone}`} aria-hidden="true">{icon}</span><div><strong className="text-2xl">{value}</strong><p className="m-0 mt-1 text-xs font-bold text-(--muted-2)">{label}</p></div></div>)}</section>
      <section className="mt-6 grid gap-6 lg:grid-cols-[1.35fr_.65fr]"><div className="card p-7 shadow-sm"><p className="m-0 text-sm font-extrabold text-(--muted-2)">주제별 학습</p><h2 className="mb-6 mt-1 text-xl font-black">정답률</h2><div className="space-y-5">{stats?.topicStatistics.map(topic=><div key={topic.topicName}><div className="mb-2 flex justify-between text-sm font-extrabold"><span>{topic.topicName} · {topic.questionCount}문제</span><span>{topic.correctRate}%</span></div><div className="progress"><span style={{width:`${topic.correctRate}%`}}/></div></div>)}{!stats?.topicStatistics.length&&<p className="text-(--muted-2)">아직 주제별 통계가 없어요.</p>}</div></div>
        <div className="card p-7 shadow-sm"><p className="m-0 text-sm font-extrabold text-(--muted-2)">다시 연습할 표현</p><h2 className="mb-5 mt-1 text-xl font-black">최근 오답</h2>{wrong.length?<div className="space-y-3">{wrong.slice(0,3).map(item=><div key={item.answerId} className="rounded-2xl bg-[#fff8df] p-4"><p className="m-0 text-sm font-bold text-(--muted-2)">{item.questionText}</p><p className="mb-1 mt-2 text-sm line-through decoration-[#e56f60]">{item.answerText||"인식된 답변 없음"}</p><p className="m-0 font-black text-(--navy)">{item.modelAnswer}</p></div>)}</div>:<p className="rounded-2xl bg-(--success-bg) p-5 font-bold text-(--success-text)">아직 저장된 오답이 없어요!</p>}</div>
      </section>
      <section className="card mt-6 overflow-hidden shadow-sm"><div className="flex flex-wrap items-end justify-between gap-4 border-b border-(--line-soft) px-7 py-6"><div><p className="m-0 text-sm font-extrabold text-(--muted-2)">완료한 학습만 표시돼요</p><h2 className="mb-0 mt-1 text-xl font-black">최근 학습</h2></div>{!preview&&<form onSubmit={filterHistory} className="flex flex-wrap items-end gap-2"><label className="text-xs font-extrabold text-(--muted-2)">시작일<input type="date" value={startDate} max={endDate||undefined} onChange={event=>setStartDate(event.target.value)} className="mt-1 block h-10 rounded-xl border border-(--accent-border) bg-white px-3 text-sm text-(--navy)"/></label><label className="text-xs font-extrabold text-(--muted-2)">종료일<input type="date" value={endDate} min={startDate||undefined} onChange={event=>setEndDate(event.target.value)} className="mt-1 block h-10 rounded-xl border border-(--accent-border) bg-white px-3 text-sm text-(--navy)"/></label><button type="submit" className="btn btn-secondary h-10 px-4 py-0">조회</button>{(appliedStartDate||appliedEndDate)&&<button type="button" onClick={resetHistoryFilter} className="btn btn-ghost h-10 px-3 py-0">전체</button>}</form>}</div><div className="divide-y divide-(--line-soft)">{history?.content.map(item=><div key={item.sessionId} className="grid items-center gap-4 px-7 py-5 sm:grid-cols-[1fr_1fr_1.3fr_auto]"><div><strong className="block">{formatCompletedDate(item.completedAt)}</strong><span className="text-sm text-(--muted-2)">{Math.round(item.studySeconds/60)}분 학습</span></div><span className="font-bold">{item.topicName} · {difficultyLabel(item.difficulty)}</span><div><div className="mb-2 flex justify-between text-xs font-extrabold"><span>{item.correctCount}/{item.questionCount} 정답</span><span>{item.correctRate}%</span></div><div className="progress h-2"><span style={{width:`${item.correctRate}%`}}/></div></div><span className="pill">{item.questionCount}문제</span></div>)}{!history?.content.length&&<p className="p-10 text-center text-(--muted-2)">{appliedStartDate||appliedEndDate?"선택한 기간에 완료한 학습이 없어요.":"완료한 학습이 아직 없어요."}</p>}</div>{!preview&&history&&history.totalPages>1&&<div className="flex items-center justify-center gap-3 border-t border-(--line-soft) px-7 py-5"><button type="button" disabled={page===0||loading} onClick={()=>changePage(Math.max(0,page-1))} className="btn btn-ghost disabled:opacity-40">← 이전</button><span className="text-sm font-extrabold text-(--muted-2)">{history.page+1} / {history.totalPages} 페이지 · 총 {history.totalElements}회</span><button type="button" disabled={page>=history.totalPages-1||loading} onClick={()=>changePage(page+1)} className="btn btn-ghost disabled:opacity-40">다음 →</button></div>}</section></>}
    </div>
  </main>;
}

function ParentGuide({childName,totalSessionCount,correctRate}:{childName:string;totalSessionCount:number;correctRate:number}) {
  const guide=totalSessionCount===0
    ? {icon:"🌱",eyebrow:"첫 학습 안내",title:"첫 학습을 함께 시작해 보세요!",message:`${childName}가 부담 없이 첫 문장을 말할 수 있도록 옆에서 응원해 주세요. 짧게 한 문제부터 시작해도 충분해요.`,theme:"border-[#cfe4ff] from-[#f2f8ff] to-[#f6fffb] shadow-[0_6px_0_#dceaf7]",accent:"text-[#3b78b8]"}
    : correctRate<80
      ? {icon:"💪",eyebrow:"도전 과정 응원",title:"노력한 과정을 응원해 주세요!",message:`${childName}가 틀릴 걱정 없이 영어로 말해본 용기가 가장 큰 성장이에요. “끝까지 도전해서 멋져!”라고 말해 주세요.`,theme:"border-[#f4df9a] from-[#fffbea] to-[#fff5e9] shadow-[0_6px_0_#f2e7bd]",accent:"text-[#9a6a13]"}
      : {icon:"👏",eyebrow:"오늘의 보호자 칭찬 팁",title:"아이에게 칭찬해 주세요!",message:`${childName}의 영어 자신감이 쑥쑥 자라고 있어요. “오늘도 끝까지 해낸 게 대단해!”라고 말해 주세요.`,theme:"border-[#cdeebc] from-[#f4ffec] to-[#fffbe8] shadow-[0_6px_0_#d9edc9]",accent:"text-(--green-dark)"};
  return <section className={`mt-8 flex flex-col gap-5 rounded-[28px] border-2 bg-gradient-to-r p-6 sm:flex-row sm:items-center ${guide.theme}`}>
    <span className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-white text-4xl shadow-sm" aria-hidden="true">{guide.icon}</span>
    <div><p className={`m-0 text-sm font-extrabold uppercase tracking-[.08em] ${guide.accent}`}>{guide.eyebrow}</p><h2 className="mb-2 mt-1 text-2xl font-black">{guide.title}</h2><p className="m-0 font-semibold leading-7 text-(--muted-2)">{guide.message}</p></div>
  </section>;
}

function difficultyLabel(difficulty:Difficulty){return {EASY:"초급",NORMAL:"중급",HARD:"고급"}[difficulty];}
function formatCompletedDate(value:string){return new Intl.DateTimeFormat("ko-KR",{timeZone:"Asia/Seoul",year:"numeric",month:"long",day:"numeric"}).format(new Date(value));}
