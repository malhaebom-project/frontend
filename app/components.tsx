import Link from "next/link";
import { AuthButton, CurrentProfileBadge } from "./auth-button";

export function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <Link href="/" className="brand" aria-label="말해봄 홈">
      <span className="brand-mark" aria-hidden="true">봄</span>
      {!compact && <span>말해봄</span>}
    </Link>
  );
}

export function Buddy({ className = "" }: { className?: string }) {
  return (
    <div className={`buddy ${className}`} role="img" aria-label="말해봄 AI 친구 봄이">
      <div className="buddy-body">
        <div className="buddy-face">
          <span className="buddy-eyes" />
          <span className="buddy-cheek" />
          <span className="buddy-smile" />
        </div>
      </div>
      <span className="buddy-star" aria-hidden="true">★</span>
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
