import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-sky-50 px-6 py-10">
      <section className="mx-auto flex min-h-[80vh] max-w-4xl flex-col items-center justify-center text-center">
        <div className="mb-6 flex h-32 w-32 items-center justify-center rounded-full bg-yellow-200 text-6xl">
          🌱
        </div>

        <h1 className="text-5xl font-bold text-slate-800">말해봄</h1>

        <p className="mt-4 text-xl text-slate-600">
          AI 친구와 함께 영어로 말해봐요!
        </p>

        <Link
          href="/profiles"
          className="mt-10 rounded-2xl bg-blue-600 px-10 py-4 text-xl font-bold text-white shadow-md transition hover:bg-blue-700 focus-visible:outline-4 focus-visible:outline-offset-4 focus-visible:outline-blue-700"
        >
          학습 시작하기
        </Link>

        <Link
          href="/records"
          className="mt-5 rounded-xl px-5 py-3 font-semibold text-slate-600 transition hover:bg-white hover:text-slate-900 focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
        >
          보호자 학습 기록 보기
        </Link>
      </section>
    </main>
  );
}
