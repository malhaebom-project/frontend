import Link from "next/link";

export default function ProfilesPage() {
  return (
    <main className="min-h-screen bg-sky-50 px-6 py-10">
      <section className="mx-auto flex min-h-[80vh] max-w-4xl flex-col items-center justify-center">
        <h1 className="text-center text-4xl font-bold text-slate-800">
          누가 학습할까요?
        </h1>
        <p className="mt-3 text-center text-lg text-slate-600">
          학습할 어린이의 프로필을 골라 주세요.
        </p>

        <div className="mt-10 grid w-full max-w-2xl gap-5 sm:grid-cols-2">
          <Link
            href="/setup"
            className="flex min-h-56 flex-col items-center justify-center rounded-3xl border-2 border-transparent bg-white p-8 text-center shadow-md transition hover:-translate-y-1 hover:border-blue-500 focus-visible:outline-4 focus-visible:outline-offset-4 focus-visible:outline-blue-600"
          >
            <span
              aria-hidden="true"
              className="flex h-24 w-24 items-center justify-center rounded-full bg-yellow-200 text-5xl"
            >
              🌱
            </span>
            <span className="mt-5 text-2xl font-bold text-slate-800">봄이</span>
            <span className="mt-2 text-base text-slate-600">
              영어 말하기를 시작해요
            </span>
          </Link>

          <button
            type="button"
            className="flex min-h-56 flex-col items-center justify-center rounded-3xl border-2 border-dashed border-slate-300 bg-white/60 p-8 text-center text-slate-500"
            aria-label="새 프로필 추가 기능은 준비 중입니다"
          >
            <span
              aria-hidden="true"
              className="flex h-24 w-24 items-center justify-center rounded-full bg-slate-200 text-5xl font-bold"
            >
              +
            </span>
            <span className="mt-5 text-2xl font-bold">새 프로필</span>
            <span className="mt-2 text-base">준비 중이에요</span>
          </button>
        </div>

        <Link
          href="/"
          className="mt-8 rounded-xl px-5 py-3 font-semibold text-slate-600 transition hover:bg-white hover:text-slate-900 focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
        >
          ← 시작 화면으로
        </Link>
      </section>
    </main>
  );
}
