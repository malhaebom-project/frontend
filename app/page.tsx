import Link from "next/link";
import { Buddy, Topbar } from "./components";
import { HomeGreetingBubble } from "./home-greeting-bubble";
import { HowItWorks } from "./how-it-works";

export default function HomePage() {
  return (
    <main className="page-shell">
      <div className="container">
        <Topbar />
        <section className="home-hero grid items-center gap-12 pb-16 lg:grid-cols-[1.02fr_.98fr]">
          <div className="home-copy relative z-10">
            <span className="pill home-kicker mb-6">★ 매일 10분, 영어 자신감 한 칸</span>
            <h1 className="display">말할수록 자라는<br/><span className="home-accent">나의 영어 자신감</span></h1>
            <div className="home-brand-signature" aria-label="말해봄">
              <span className="home-brand-signature-mark" aria-hidden="true"><i/><i/><i/></span>
              <strong>MALHAEBOM</strong>
            </div>
            <p className="subtitle mt-5 max-w-xl">봄이 선생님의 질문을 듣고 영어로 대답해 보세요.<br className="hidden sm:block"/> 아이의 속도에 맞춘 칭찬과 피드백이 매일 이어져요.</p>
            <div className="mt-8 flex flex-wrap gap-3">
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
      <HowItWorks />
    </main>
  );
}
