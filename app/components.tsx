import Link from "next/link";
import { AuthButton, CurrentProfileBadge } from "./auth-button";
import { TeacherBuddy } from "@/components/character/TeacherBuddy";

export function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <Link href="/" className="brand" aria-label="말해봄 홈">
      <span className="brand-mark" aria-hidden="true">봄</span>
      {!compact && <span>말해봄</span>}
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
