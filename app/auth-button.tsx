"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { api, getGuardian, isAuthenticated } from "@/lib/api/client";
import { learningState } from "@/lib/api/session";
import { useHydrated } from "@/lib/use-hydrated";

export function AuthButton() {
  const router=useRouter(); const hydrated=useHydrated(); const [loggingOut,setLoggingOut]=useState(false); const loggedIn=hydrated&&isAuthenticated(); const name=hydrated?(getGuardian()?.name??""):"";
  async function logout(){
    setLoggingOut(true);
    try {await api.logout();}
    catch {/* 백엔드 로그아웃 실패 시에도 api.logout()이 로컬 세션을 정리합니다. */}
    finally {
      setLoggingOut(false);
      router.replace("/");
      router.refresh();
    }
  }
  if(!loggedIn) return <button onClick={()=>router.push("/login")} className="btn btn-ghost">보호자 로그인 <span aria-hidden>↗</span></button>;
  return <button type="button" className="btn btn-ghost disabled:cursor-wait disabled:opacity-60" onClick={logout} disabled={loggingOut}>{name&&<span className="auth-button-name" title={name}>{name} · </span>}{loggingOut?"로그아웃 중…":"로그아웃"}</button>;
}

export function CurrentProfileBadge() {
  const hydrated=useHydrated(); const child=hydrated?learningState.child():null;
  const label=child?`${child.nickname} · 초등 ${child.grade}학년`:"프로필 선택";
  return <span className="pill"><span className="soft-yellow" style={{display:"grid",placeItems:"center",width:30,height:30,borderRadius:10}} aria-hidden>🐰</span>{label}</span>;
}
