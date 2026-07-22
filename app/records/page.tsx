import Link from "next/link";

const records = [
  { date: "오늘", topic: "음식", score: "4 / 5", time: "8분" },
  { date: "7월 20일", topic: "동물", score: "5 / 5", time: "10분" },
  { date: "7월 18일", topic: "학교", score: "3 / 5", time: "7분" },
];

export default function RecordsPage() {
  return (
    <main className="min-h-screen bg-slate-50 px-6 py-10">
      <section className="mx-auto max-w-5xl">
        <Link className="rounded-xl p-3 font-semibold text-slate-600 hover:bg-white" href="/">
          ← 시작 화면
        </Link>
        <div className="mt-10">
          <p className="font-bold text-blue-700">보호자 화면</p>
          <h1 className="mt-2 text-4xl font-bold text-slate-800">봄이의 학습 기록</h1>
          <p className="mt-3 text-lg text-slate-600">최근 영어 말하기 활동을 확인해 보세요.</p>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          <div className="rounded-3xl bg-blue-600 p-6 text-white shadow-sm">
            <p className="text-sm font-bold">이번 주 학습</p>
            <p className="mt-2 text-4xl font-bold">3일</p>
          </div>
          <div className="rounded-3xl bg-white p-6 shadow-sm">
            <p className="text-sm font-bold text-slate-500">말한 문장</p>
            <p className="mt-2 text-4xl font-bold text-slate-800">15개</p>
          </div>
          <div className="rounded-3xl bg-white p-6 shadow-sm">
            <p className="text-sm font-bold text-slate-500">평균 정확도</p>
            <p className="mt-2 text-4xl font-bold text-slate-800">80%</p>
          </div>
        </div>

        <div className="mt-8 overflow-hidden rounded-3xl bg-white shadow-sm">
          <div className="border-b border-slate-200 px-6 py-5">
            <h2 className="text-xl font-bold text-slate-800">최근 학습</h2>
          </div>
          <ul className="divide-y divide-slate-200">
            {records.map((record) => (
              <li key={record.date} className="grid grid-cols-2 gap-3 px-6 py-5 sm:grid-cols-4">
                <span className="font-bold text-slate-800">{record.date}</span>
                <span className="text-slate-600">{record.topic}</span>
                <span className="text-slate-600">정확도 {record.score}</span>
                <span className="text-right text-slate-500">{record.time}</span>
              </li>
            ))}
          </ul>
        </div>
        <p className="mt-4 text-sm text-slate-500">현재 기록은 화면 구성을 확인하기 위한 예시 데이터입니다.</p>
      </section>
    </main>
  );
}
