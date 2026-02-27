"use client";

import Link from "next/link";

type Props = {
  displayName: string;
  roleLabel: string | null;
  onSwitchRole: () => void;
};

export function AppHeader({ displayName, roleLabel, onSwitchRole }: Props) {
  return (
    <header className="sticky top-0 z-50 border-b border-[var(--border)] bg-white">
      <div className="mx-auto flex h-14 max-w-[1200px] items-center justify-between px-8">
        <Link href="/app" className="flex items-center gap-2 font-[family-name:var(--font-fraunces)] text-xl font-extrabold text-[var(--ink)]">
          <svg width={28} height={18} viewBox="0 0 36 24"><path d="M0 12 L8 12 L11 4 L15 20 L19 8 L22 14 L25 12 L36 12" fill="none" stroke="#2455FF" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"/></svg>
          Pulse
        </Link>
        <nav className="flex items-center gap-3">
          {displayName && <span className="text-sm font-medium text-[var(--ink)] hidden sm:inline">{displayName}</span>}
          <button type="button" onClick={onSwitchRole} className="text-sm text-[var(--ink-muted)] hover:text-[var(--ink-soft)] underline">
            Switch role
          </button>
          {roleLabel && (
            <span className="rounded-lg bg-[var(--blue-glow)] px-3 py-1.5 text-xs font-semibold text-[var(--blue)]">
              {roleLabel}
            </span>
          )}
          <form action="/auth/signout" method="POST">
            <button type="submit" className="rounded-lg border border-[var(--border)] bg-transparent px-4 py-2 text-sm font-semibold text-[var(--ink-soft)] hover:border-[var(--coral)] hover:text-[var(--coral)]">
              Sign out
            </button>
          </form>
        </nav>
      </div>
    </header>
  );
}
