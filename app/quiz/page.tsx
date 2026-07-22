import Link from "next/link";

export default function QuizPage() {
  return (
    <main className="min-h-screen bg-sky-50 px-6 py-8">
      <section className="mx-auto max-w-4xl">
        <div className="flex items-center gap-4">
          <Link className="rounded-xl p-3 font-semibold text-slate-600 hover:bg-white" href="/setup">
            ← 나가기
          </Link>
          <div className="h-4 flex-1 overflow-hidden rounded-full bg-white" aria-label="5문제 중 1번째">
            <div className="h-full w-1/5 rounded-full bg-blue-600" />
          </div>
          <span className="font-bold text-slate-600">1 / 5</span>
        </div>

        <div className="mt-10 rounded-3xl bg-white p-7 text-center shadow-md sm:p-12">
          <div className="text-8xl" aria-hidden="true">🍎</div>
          <p className="mt-7 text-lg font-bold text-blue-700">그림을 보고 말해보세요</p>
          <h1 className="mt-2 text-4xl font-bold text-slate-800">이것은 무엇인가요?</h1>
          <p className="mt-4 text-xl text-slate-600">What is this?</p>

          <Link
            href="/feedback"
            className="mx-auto mt-10 flex min-h-24 max-w-md items-center justify-center gap-3 rounded-3xl bg-blue-600 px-8 py-5 text-2xl font-bold text-white shadow-md transition hover:bg-blue-700 focus-visible:outline-4 focus-visible:outline-offset-4 focus-visible:outline-blue-700"
          >
            <span aria-hidden="true">🎤</span>
            눌러서 말하기
          </Link>
          <p className="mt-4 text-sm text-slate-500">마이크 기능을 연결하기 전의 화면 예시예요.</p>
        </div>
      </section>
    </main>
  );
}
