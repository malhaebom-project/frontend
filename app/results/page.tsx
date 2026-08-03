"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Buddy, Brand } from "../components";
import { learningState } from "@/lib/api/session";
import type { SessionResult } from "@/lib/api/types";
import { useHydrated } from "@/lib/use-hydrated";

export default function ResultsPage() {
  const router=useRouter(); const hydrated=useHydrated(); const result:SessionResult|null=hydrated?learningState.result():null;
  useEffect(()=>{if(hydrated&&!result)router.replace("/profiles");},[router,hydrated,result]);
  if(!result)return null;
  const stats=[{icon:"✓",value:`${result.correctCount} / ${result.questionCount}`,label:"정답 수",tone:"soft-mint",color:"#2b9e75"},{icon:"↗",value:`${result.correctRate}%`,label:"정답률",tone:"soft-blue",color:"#4f7df3"},{icon:"◷",value:`${Math.max(1,Math.round(result.studySeconds/60))}분`,label:"학습 시간",tone:"soft-yellow",color:"#a57900"}];
  return <main className="page-shell"><div className="container"><header className="topbar"><Brand/><span className="pill">학습 완료</span></header><section className="mx-auto max-w-4xl pb-16 pt-7 text-center">
    <Buddy className="float mx-auto"/><p className="eyebrow mt-1">Mission complete!</p><h1 className="title mt-3">오늘 학습을 완료했어요!</h1><p className="subtitle mt-3">끝까지 집중한 모습이 정말 멋져요.</p>
    <div className="mt-9 grid gap-4 sm:grid-cols-3">{stats.map(stat=><div key={stat.label} className="card flex items-center gap-4 p-6 text-left"><span className={`stat-icon ${stat.tone}`} style={{color:stat.color}}>{stat.icon}</span><div><strong className="block text-3xl">{stat.value}</strong><span className="text-sm font-bold text-[#71809d]">{stat.label}</span></div></div>)}</div>
    <div className="mt-7 flex flex-wrap justify-center gap-3"><Link href="/setup" className="btn btn-primary btn-large">다시 학습하기</Link><Link href="/records" className="btn btn-secondary btn-large">학습 기록 보기</Link><Link href="/" className="btn btn-ghost btn-large">홈으로</Link></div>
  </section></div></main>;
}
