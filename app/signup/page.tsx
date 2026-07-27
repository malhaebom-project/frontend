"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { api, errorMessage } from "@/lib/api/client";
import { AuthLayout, ErrorBox, Field } from "../login/page";

export default function SignupPage() {
  const router = useRouter();
  const [error,setError] = useState(""); const [loading,setLoading] = useState(false);
  async function submit(event:FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(""); setLoading(true);
    const form = new FormData(event.currentTarget);
    try {
      const email=String(form.get("email")), password=String(form.get("password"));
      await api.signup({email,password,name:String(form.get("name"))});
      await api.login({email,password}); router.replace("/profiles");
    } catch(e) { setError(errorMessage(e)); } finally { setLoading(false); }
  }
  return <AuthLayout title="말해봄을 시작해요" subtitle="아이의 학습 기록을 관리할 보호자 계정을 만들어 주세요.">
    <form onSubmit={submit} className="mt-7 space-y-4">
      <Field label="보호자 이름" name="name" placeholder="홍길동"/>
      <Field label="이메일" name="email" type="email" placeholder="parent@example.com"/>
      <Field label="비밀번호" name="password" type="password" placeholder="8자 이상 입력해 주세요"/>
      {error&&<ErrorBox>{error}</ErrorBox>}
      <button disabled={loading} className="btn btn-primary btn-large w-full disabled:opacity-60">{loading?"계정 만드는 중…":"회원가입"}</button>
    </form>
    <p className="mt-6 text-center text-sm text-[#71809d]">이미 계정이 있나요? <Link href="/login" className="font-extrabold text-[#4f7df3]">로그인</Link></p>
  </AuthLayout>;
}
