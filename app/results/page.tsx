import Link from "next/link";

export default function ResultsPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-violet-50 px-6 py-10">
      <section className="w-full max-w-3xl text-center">
        <div className="text-8xl" aria-hidden="true">🏆</div>
        <p className="mt-5 text-lg font-bold text-violet-700">오늘의 학습 완료</p>
        <h1 className="mt-2 text-4xl font-bold text-slate-800">봄이, 끝까지 해냈어요!</h1>
        <p className="mt-3 text-lg text-slate-600">음식에 관한 영어 표현을 연습했어요.</p>

        <div className="mt-9 grid gap-4 sm:grid-cols-3">
          {[
            ["5", "말한 문장"],
            ["4", "정확한 발음"],
            ["⭐ 3", "받은 별"],
          ].map(([value, label]) => (
            <div key={label} className="rounded-3xl bg-white p-6 shadow-sm">
              <p className="text-4xl font-bold text-slate-800">{value}</p>
              <p className="mt-2 text-slate-600">{label}</p>
            </div>
          ))}
        </div>

        <div className="mt-9 grid gap-4 sm:grid-cols-2">
          <Link href="/setup" className="rounded-2xl border-2 border-blue-600 px-6 py-4 text-lg font-bold text-blue-700 hover:bg-blue-50">
            다른 주제 배우기
          </Link>
          <Link href="/" className="rounded-2xl bg-blue-600 px-6 py-4 text-lg font-bold text-white shadow-md hover:bg-blue-700">
            시작 화면으로
          </Link>
        </div>
      </section>
    </main>
  );
}
