import Link from "next/link";
import { Buddy, Topbar } from "./components";

export default function HomePage() {
  return (
    <main className="page-shell grid-dots">
      <div className="container">
        <Topbar />
        <section className="grid min-h-[calc(100svh-88px)] items-center gap-10 pb-20 lg:grid-cols-[1.05fr_.95fr]">
          <div className="relative z-10">
            <span className="pill mb-7 text-[#3f68d9]">✦ 매일 10분, 즐거운 영어 습관</span>
            <h1 className="display">AI 친구와<br/><span className="text-[#4f7df3]">영어로 말해봐요!</span></h1>
            <p className="subtitle mt-6 max-w-xl">듣고, 말하고, 칭찬받으며 영어 자신감이 쑥쑥.<br className="hidden sm:block"/> 봄이가 아이의 첫 영어 대화를 함께해요.</p>
            <div className="mt-9 flex flex-wrap gap-3">
              <Link href="/profiles" className="btn btn-primary btn-large">학습 시작하기 <span aria-hidden>→</span></Link>
              <Link href="/records" className="btn btn-secondary btn-large">보호자 메뉴</Link>
            </div>
            <div className="mt-9 flex flex-wrap gap-5 text-sm font-bold text-[#71809d]">
              <span>✓ 아이 맞춤 질문</span><span>✓ 따뜻한 AI 피드백</span><span>✓ 학습 기록 제공</span>
            </div>
          </div>
          <div className="relative mx-auto grid min-h-[520px] w-full max-w-[540px] place-items-center">
            <div className="absolute inset-12 rounded-[56px] bg-white/80 shadow-[0_30px_80px_rgba(56,88,145,.14)] rotate-3" />
            <div className="absolute left-5 top-20 rounded-2xl bg-white p-4 text-2xl shadow-xl -rotate-6" aria-hidden>ABC</div>
            <div className="absolute right-2 top-8 rounded-full bg-[#fff6d7] p-5 text-3xl shadow-lg" aria-hidden>☀</div>
            <div className="absolute bottom-16 left-2 rounded-full bg-[#e4f8f0] p-4 text-3xl shadow-lg" aria-hidden>♪</div>
            <div className="relative text-center">
              <Buddy className="float scale-125" />
              <div className="speech mt-8 min-w-[300px]">
                <p className="mb-1 text-sm font-extrabold text-[#4f7df3]">Hi, 서아!</p>
                <p className="m-0 text-2xl font-black">Ready to speak?</p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
