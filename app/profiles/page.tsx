"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { BackLink, Brand } from "../components";
import { api, errorMessage, isAuthenticated } from "@/lib/api/client";
import { learningState, removeSessionValue, saveSessionValue } from "@/lib/api/session";
import type { Child, ChildLevel } from "@/lib/api/types";

const avatars=["🐰","🦊","🐻","🐼"]; const tones=["soft-yellow","soft-coral","soft-mint","soft-blue"];

export default function ProfilesPage() {
  const router=useRouter(); const [children,setChildren]=useState<Child[]>([]); const [loading,setLoading]=useState(true);
  const [error,setError]=useState(""); const [adding,setAdding]=useState(false);
  const [deleteTarget,setDeleteTarget]=useState<Child|null>(null); const [deleting,setDeleting]=useState(false); const [deleteError,setDeleteError]=useState("");
  useEffect(()=>{
    if(!isAuthenticated()){router.replace("/login");return;}
    api.children().then(setChildren).catch(e=>setError(errorMessage(e))).finally(()=>setLoading(false));
  },[router]);
  function select(child:Child){saveSessionValue("child",child);router.push("/setup");}
  async function create(event:FormEvent<HTMLFormElement>) {
    event.preventDefault(); const form=new FormData(event.currentTarget); setError("");
    try {
      const child=await api.createChild({nickname:String(form.get("nickname")),age:Number(form.get("age")),grade:Number(form.get("grade")),level:String(form.get("level")) as ChildLevel});
      setChildren(prev=>[...prev,child]);setAdding(false);
    } catch(e){setError(errorMessage(e));}
  }
  function askToDelete(child:Child){setDeleteError("");setDeleteTarget(child);}
  function closeDelete(){if(!deleting){setDeleteTarget(null);setDeleteError("");}}
  async function deleteProfile(){
    if(!deleteTarget)return;
    setDeleting(true);setDeleteError("");
    try {
      await api.deleteChild(deleteTarget.childId);
      setChildren(prev=>prev.filter(child=>child.childId!==deleteTarget.childId));
      if(learningState.child()?.childId===deleteTarget.childId)removeSessionValue("child");
      setDeleteTarget(null);
    } catch(e){setDeleteError(errorMessage(e));}
    finally{setDeleting(false);}
  }
  return <main className="page-shell"><div className="container">
    <header className="topbar"><Brand/><BackLink href="/">돌아가기</BackLink></header>
    <section className="mx-auto max-w-5xl py-14 text-center">
      <p className="eyebrow">Choose your player</p><h1 className="title mt-3">누가 학습할까요?</h1><p className="subtitle mt-3">내 프로필을 선택해 주세요.</p>
      {error&&<div role="alert" className="mx-auto mt-6 max-w-xl rounded-2xl bg-[#fff6d7] p-4 font-bold text-[#7f640d]">{error}</div>}
      {loading?<div className="py-24 text-[#71809d]">프로필을 불러오고 있어요…</div>:<div className="mt-12 grid gap-5 md:grid-cols-4">
        {children.map((child,index)=><article key={child.childId} className="card group relative min-h-[310px] transition hover:-translate-y-2 hover:border-[#4f7df3]">
          <button type="button" onClick={()=>select(child)} aria-label={`${child.nickname} 프로필 선택`} className="flex min-h-[306px] w-full cursor-pointer flex-col items-center justify-center rounded-[18px] bg-transparent p-6 outline-none focus-visible:ring-4 focus-visible:ring-[#1cb0f6]/25">
            <span className={`grid h-28 w-28 place-items-center rounded-[35px] ${tones[index%tones.length]} text-6xl transition group-hover:scale-105`} aria-hidden>{avatars[index%avatars.length]}</span>
            <strong className="mt-5 text-2xl">{child.nickname}</strong><span className="mt-1 text-[#71809d]">초등 {child.grade}학년 · {levelLabel(child.level)}</span>
            {child.totalCorrectRate!=null&&<span className="mt-4 rounded-full bg-[#e4f8f0] px-3 py-1.5 text-sm font-extrabold text-[#2b9e75]">정답률 {child.totalCorrectRate}%</span>}
          </button>
          <button type="button" onClick={()=>askToDelete(child)} aria-label={`${child.nickname} 프로필 삭제`} title="프로필 삭제" className="absolute right-3 top-3 z-10 grid h-8 w-8 cursor-pointer place-items-center rounded-full border-2 border-[#e5e5e5] bg-white text-xl font-black leading-none text-[#999] shadow-sm transition hover:border-[#ffb2b2] hover:bg-[#fff2f2] hover:text-[#e54848] focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-[#ffb2b2]">×</button>
        </article>)}
        <button onClick={()=>setAdding(true)} className="group flex min-h-[310px] cursor-pointer flex-col items-center justify-center rounded-[28px] border-2 border-dashed border-[#cbd8eb] bg-white/55 p-6 text-[#71809d] transition hover:-translate-y-1 hover:border-[#4f7df3]"><span className="grid h-28 w-28 place-items-center rounded-[35px] bg-[#eef3fa] text-4xl">+</span><strong className="mt-5 text-xl">프로필 추가</strong></button>
      </div>}
      {!loading&&!children.length&&<p className="mt-6 text-[#71809d]">첫 어린이 프로필을 만들어 주세요.</p>}
    </section>
    {adding&&<div className="fixed inset-0 z-50 grid place-items-center bg-[#263552]/35 p-5" onMouseDown={()=>setAdding(false)}><form onSubmit={create} onMouseDown={e=>e.stopPropagation()} className="card w-full max-w-md p-7 text-left"><h2 className="m-0 text-2xl font-black">프로필 추가</h2><p className="mt-2 text-sm text-[#71809d]">아이에게 맞는 학습 단계를 설정해요.</p>
      <div className="mt-6 space-y-4"><Input name="nickname" label="별명" placeholder="영어왕민수"/><div className="grid grid-cols-2 gap-3"><Input name="age" label="나이" type="number" placeholder="10"/><Input name="grade" label="학년" type="number" placeholder="3"/></div>
      <label className="block text-sm font-extrabold">영어 단계<select name="level" className="mt-2 h-12 w-full rounded-xl border border-[#dce7f7] bg-white px-3"><option value="BEGINNER">입문</option><option value="ELEMENTARY">초급</option><option value="INTERMEDIATE">중급</option></select></label></div>
      <div className="mt-6 flex gap-3"><button type="button" onClick={()=>setAdding(false)} className="btn btn-secondary flex-1">취소</button><button className="btn btn-primary flex-1">추가하기</button></div>
    </form></div>}
    {deleteTarget&&<div className="fixed inset-0 z-50 grid place-items-center bg-[#263552]/35 p-5" onMouseDown={closeDelete} role="presentation"><section role="dialog" aria-modal="true" aria-labelledby="delete-profile-title" onMouseDown={event=>event.stopPropagation()} className="card w-full max-w-md p-7 text-left">
      <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-[#fff2f2] text-3xl" aria-hidden>🗑️</div>
      <h2 id="delete-profile-title" className="mt-5 text-center text-2xl font-black">{deleteTarget.nickname} 프로필을 삭제할까요?</h2>
      <p className="mt-3 text-balance text-center font-semibold leading-7 text-[#71809d]">프로필과 연결된 학습 기록을 다시 확인하기 어려울 수 있어요. 삭제 후에는 되돌릴 수 없습니다.</p>
      {deleteError&&<div role="alert" className="mt-5 rounded-2xl bg-[#fff6d7] p-4 text-sm font-bold text-[#7f640d]">{deleteError}</div>}
      <div className="mt-6 flex gap-3"><button type="button" autoFocus disabled={deleting} onClick={closeDelete} className="btn btn-secondary flex-1 disabled:cursor-not-allowed disabled:opacity-60">취소</button><button type="button" disabled={deleting} onClick={deleteProfile} className="btn flex-1 border-[#e54848] bg-[#ef5555] text-white shadow-[0_5px_0_#bf3434] hover:bg-[#f46363] disabled:cursor-not-allowed disabled:opacity-60">{deleting?"삭제 중…":"삭제하기"}</button></div>
    </section></div>}
  </div></main>;
}
function Input({name,label,type="text",placeholder}:{name:string;label:string;type?:string;placeholder:string}){return <label className="block text-sm font-extrabold">{label}<input required min={type==="number"?1:undefined} max={name==="grade"?6:undefined} name={name} type={type} placeholder={placeholder} className="mt-2 h-12 w-full rounded-xl border border-[#dce7f7] px-3 outline-none focus:border-[#4f7df3]"/></label>}
function levelLabel(level:ChildLevel){return {BEGINNER:"입문",ELEMENTARY:"초급",INTERMEDIATE:"중급"}[level]}
