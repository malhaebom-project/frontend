"use client";

import { useRouter } from "next/navigation";
import { api, getGuardian, isAuthenticated } from "@/lib/api/client";
import { learningState } from "@/lib/api/session";
import { useHydrated } from "@/lib/use-hydrated";

export function AuthButton() {
  const router=useRouter(); const hydrated=useHydrated(); const loggedIn=hydrated&&isAuthenticated(); const name=hydrated?(getGuardian()?.name??""):"";
  if(!loggedIn) return <button onClick={()=>router.push("/login")} className="btn btn-ghost">보호자 로그인 <span aria-hidden>↗</span></button>;
  return <button className="btn btn-ghost" onClick={async()=>{try{await api.logout();}finally{router.replace("/");}}}>{name&&<span className="auth-button-name" title={name}>{name} · </span>}로그아웃</button>;
}

export function CurrentProfileBadge() {
  const hydrated=useHydrated(); const child=hydrated?learningState.child():null;
  const label=child?`${child.nickname} · 초등 ${child.grade}학년`:"프로필 선택";
  return <span className="pill"><span className="soft-yellow" style={{display:"grid",placeItems:"center",width:30,height:30,borderRadius:10}} aria-hidden>🐰</span>{label}</span>;
}
