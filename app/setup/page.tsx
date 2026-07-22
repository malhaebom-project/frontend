import Link from "next/link";

const topics = [
  { emoji: "🍎", name: "음식", detail: "좋아하는 음식을 말해요" },
  { emoji: "🐶", name: "동물", detail: "귀여운 동물을 소개해요" },
  { emoji: "🏫", name: "학교", detail: "학교에서 쓰는 말을 배워요" },
];

export default function SetupPage() {
  return (
    <main className="min-h-screen bg-amber-50 px-6 py-10">
      <section className="mx-auto max-w-5xl">
        <div className="flex items-center justify-between gap-4">
          <Link className="rounded-xl p-3 font-semibold text-slate-600 hover:bg-white" href="/profiles">
            ← 프로필
          </Link>
          <span className="rounded-full bg-white px-4 py-2 font-bold text-slate-700 shadow-sm">
            🌱 봄이
          </span>
        </div>

        <div className="mt-12 text-center">
          <p className="font-bold text-blue-700">학습 설정</p>
          <h1 className="mt-2 text-4xl font-bold text-slate-800">오늘은 무엇을 말해볼까요?</h1>
          <p className="mt-3 text-lg text-slate-600">관심 있는 주제를 하나 골라 주세요.</p>
        </div>

        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {topics.map((topic, index) => (
            <Link
              key={topic.name}
              href="/quiz"
              className={`flex min-h-64 flex-col items-center justify-center rounded-3xl border-4 bg-white p-7 text-center shadow-md transition hover:-translate-y-1 focus-visible:outline-4 focus-visible:outline-offset-4 focus-visible:outline-blue-600 ${index === 0 ? "border-blue-500" : "border-transparent"}`}
            >
              <span className="text-7xl" aria-hidden="true">{topic.emoji}</span>
              <span className="mt-5 text-2xl font-bold text-slate-800">{topic.name}</span>
              <span className="mt-2 text-slate-600">{topic.detail}</span>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
