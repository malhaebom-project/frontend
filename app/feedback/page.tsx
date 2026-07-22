import Link from "next/link";

export default function FeedbackPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-emerald-50 px-6 py-10">
      <section className="w-full max-w-3xl rounded-3xl bg-white p-8 text-center shadow-md sm:p-12">
        <div className="mx-auto flex h-28 w-28 items-center justify-center rounded-full bg-emerald-100 text-6xl" aria-hidden="true">
          ⭐
        </div>
        <p className="mt-6 text-xl font-bold text-emerald-700">참 잘했어요!</p>
        <h1 className="mt-2 text-4xl font-bold text-slate-800">It is an apple.</h1>
        <p className="mt-4 text-lg text-slate-600">“apple”의 소리를 또박또박 잘 말했어요.</p>

        <div className="mt-8 rounded-2xl bg-sky-50 p-5 text-left">
          <p className="font-bold text-slate-800">한 번 더 들어볼까요?</p>
          <p className="mt-2 text-lg text-slate-600">🔊 It is an ap-ple.</p>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          <Link href="/quiz" className="rounded-2xl border-2 border-blue-600 px-6 py-4 text-lg font-bold text-blue-700 hover:bg-blue-50">
            다시 말하기
          </Link>
          <Link href="/results" className="rounded-2xl bg-blue-600 px-6 py-4 text-lg font-bold text-white shadow-md hover:bg-blue-700">
            다음으로 →
          </Link>
        </div>
      </section>
    </main>
  );
}
