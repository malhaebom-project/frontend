"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { Brand, Buddy, type BuddyMotion } from "../components";
import { api, demoLoginEnabled, errorMessage, loginAsDemo } from "@/lib/api/client";

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(""); setLoading(true);
    const form = new FormData(event.currentTarget);
    try {
      await api.login({ email: String(form.get("email")), password: String(form.get("password")) });
      router.replace("/profiles");
    } catch (e) { setError(errorMessage(e)); } finally { setLoading(false); }
  }
  return <AuthLayout title="다시 만나서 반가워요!" subtitle="보호자 계정으로 로그인해 주세요.">
    <form onSubmit={submit} className="mt-7 space-y-4">
      <Field label="이메일" name="email" type="email" placeholder="parent@example.com"/>
      <Field label="비밀번호" name="password" type="password" placeholder="비밀번호를 입력해 주세요"/>
      {error && <ErrorBox>{error}</ErrorBox>}
      <button disabled={loading} className="btn btn-primary btn-large w-full disabled:opacity-60">{loading ? "로그인 중…" : "로그인"}</button>
    </form>
    {demoLoginEnabled && <>
      <div className="my-6 flex items-center gap-3 text-xs font-bold text-[#9aa7bb]"><span className="h-px flex-1 bg-[#dce7f7]"/><span>또는</span><span className="h-px flex-1 bg-[#dce7f7]"/></div>
      <button type="button" onClick={()=>{loginAsDemo();router.replace("/");}} className="btn btn-secondary btn-large w-full">🧪 체험용 로그인</button>
      <p className="mt-3 text-center text-xs leading-5 text-[#71809d]">백엔드 없이 프로필 선택부터 학습 결과와<br/>보호자 기록까지 전체 화면을 체험할 수 있어요.</p>
    </>}
    <p className="mt-6 text-center text-sm text-[#71809d]">처음 오셨나요? <Link href="/signup" className="font-extrabold text-[#4f7df3]">회원가입</Link></p>
  </AuthLayout>;
}

export function AuthLayout({title,subtitle,children,characterMotion="idle"}:{title:string;subtitle:string;children:React.ReactNode;characterMotion?:BuddyMotion}) {
  return <main className="page-shell"><div className="container"><header className="topbar"><Brand/><Link href="/" className="btn btn-ghost">홈으로</Link></header><section className="mx-auto grid max-w-4xl items-center gap-8 py-10 lg:grid-cols-[.8fr_1.2fr]"><div className="hidden text-center lg:block"><Buddy className="float mx-auto" motion={characterMotion}/><p className="mt-3 font-black text-[#4f7df3]">안전한 영어 학습을 시작해요</p></div><div className="card p-7 md:p-10"><p className="eyebrow">Guardian account</p><h1 className="title mt-2">{title}</h1><p className="subtitle mt-2">{subtitle}</p>{children}</div></section></div></main>;
}
export function Field({label,name,type="text",placeholder}:{label:string;name:string;type?:string;placeholder:string}) {
  return <label className="block"><span className="mb-2 block text-sm font-extrabold">{label}</span><input required name={name} type={type} placeholder={placeholder} className="h-14 w-full rounded-2xl border border-[#dce7f7] bg-[#f8faff] px-4 outline-none transition focus:border-[#4f7df3] focus:ring-4 focus:ring-[#dce8ff]"/></label>;
}
export function ErrorBox({children}:{children:React.ReactNode}) {
  return <div role="alert" className="rounded-2xl bg-[#fff6d7] px-4 py-3 text-sm font-bold text-[#7f640d]">⚠ {children}</div>;
}
