import Link from "next/link";
import { AuthButton, CurrentProfileBadge } from "./auth-button";
import { TeacherBuddy } from "@/components/character/TeacherBuddy";

export function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <Link href="/" className="brand" aria-label="말해봄 홈">
      <svg className="brand-mark" viewBox="0 0 48 48" aria-hidden="true">
        <defs>
          <linearGradient id="malhaebom-mark" x1="9" y1="5" x2="40" y2="44" gradientUnits="userSpaceOnUse">
            <stop stopColor="#72dd21" />
            <stop offset="1" stopColor="#45b900" />
          </linearGradient>
        </defs>
        <rect x="2" y="2" width="44" height="44" rx="15" fill="url(#malhaebom-mark)" />
        <path d="M14.5 13.5h19a4 4 0 0 1 4 4v9a4 4 0 0 1-4 4h-7.8l-6.9 5.6v-5.6h-4.3a4 4 0 0 1-4-4v-9a4 4 0 0 1 4-4Z" fill="#fff" />
        <circle cx="18" cy="22" r="2" fill="#54c90a" />
        <circle cx="24" cy="22" r="2" fill="#54c90a" />
        <circle cx="30" cy="22" r="2" fill="#54c90a" />
        <circle cx="37.5" cy="10.5" r="2.5" fill="#d9ff9b" />
      </svg>
      {!compact && <span className="brand-wordmark"><span>말해</span><strong>봄</strong></span>}
    </Link>
  );
}

export type BuddyMotion = "idle" | "welcome" | "listening" | "speaking" | "thinking" | "correct" | "feedback";

export function Buddy({
  className = "",
  motion = "idle",
}: {
  className?: string;
  motion?: BuddyMotion;
}) {
  return (
    <div
      className={`buddy buddy-teacher-character ${className}`}
      data-motion={motion}
    >
      <TeacherBuddy motion={motion} />
    </div>
  );
}

export function Topbar({ parent = true }: { parent?: boolean }) {
  return (
    <header className="topbar">
      <Brand />
      {parent && <AuthButton />}
    </header>
  );
}

export function BackLink({ href, children }: { href: string; children: React.ReactNode }) {
  return <Link href={href} className="btn btn-ghost"><span aria-hidden>←</span>{children}</Link>;
}

export function MiniProfile() {
  return <CurrentProfileBadge />;
}
