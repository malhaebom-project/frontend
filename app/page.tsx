import Link from "next/link";
import { Buddy, Topbar } from "./components";
import { HomeGreetingBubble } from "./home-greeting-bubble";

export default function HomePage() {
  return (
    <main className="page-shell">
      <div className="container">
        <Topbar />
        <section className="home-hero grid items-center gap-12 pb-16 lg:grid-cols-[1.02fr_.98fr]">
          <div className="relative z-10">
            <span className="pill home-kicker mb-7">★ 매일 10분, 영어 자신감 한 칸</span>
            <h1 className="display">말할수록 자라는<br/><span className="home-accent">나의 영어 자신감</span></h1>
            <p className="subtitle mt-6 max-w-xl">봄이의 질문을 듣고 영어로 대답해 보세요.<br className="hidden sm:block"/> 아이의 속도에 맞춘 칭찬과 피드백이 매일 이어져요.</p>
            <div className="mt-9 flex flex-wrap gap-3">
              <Link href="/profiles" className="btn btn-primary btn-large">무료로 학습 시작하기</Link>
              <Link href="/records" className="btn btn-secondary btn-large">학습 기록 보기</Link>
            </div>
            <div className="home-proof">
              <span>✓ 아이 맞춤 문제</span><span>✓ 따뜻한 AI 피드백</span><span>✓ 성장 기록</span>
            </div>
          </div>
          <div className="hero-stage mx-auto grid w-full max-w-[560px] place-items-center">
            <div className="hero-card" aria-hidden />
            <div className="hero-sticker hero-sticker-one" aria-hidden>ABC</div>
            <div className="hero-sticker hero-sticker-two" aria-hidden>★ +1</div>
            <div className="hero-sticker hero-sticker-three" aria-hidden>🔊</div>
            <div className="hero-character">
              <Buddy className="float" />
              <HomeGreetingBubble />
            </div>
          </div>
        </section>
      </div>
      <section className="home-section">
        <div className="container">
          <div className="home-section-title">
            <p className="eyebrow">How it works</p>
            <h2 className="title mt-3">듣고, 말하고, 바로 성장해요</h2>
            <p className="subtitle mt-4">복잡한 공부 대신 짧고 즐거운 말하기 루틴을 만들어요.</p>
          </div>
          <div className="home-steps">
            <article className="card home-step"><span className="home-step-number">1</span><h3>봄이의 질문 듣기</h3><p>아이의 학년과 수준에 맞는 문제를 또렷한 음성으로 들어요.</p></article>
            <article className="card home-step"><span className="home-step-number">2</span><h3>버튼 누르고 말하기</h3><p>틀릴 걱정 없이 마이크를 누르고 영어로 편하게 대답해요.</p></article>
            <article className="card home-step"><span className="home-step-number">3</span><h3>칭찬과 별 받기</h3><p>바로 도착한 친절한 피드백을 듣고 작은 성취를 쌓아요.</p></article>
          </div>
        </div>
      </section>
    </main>
  );
}
