import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?redirect=/app");
  }

  return (
    <div className="min-h-screen bg-[var(--cream)]">
      <header className="sticky top-0 z-50 border-b border-[var(--border)] bg-white/92 backdrop-blur-[16px]">
        <div className="mx-auto flex h-14 max-w-[1200px] items-center justify-between px-7">
          <Link href="/app" className="flex items-center gap-2 font-[family-name:var(--font-fraunces)] text-xl font-extrabold text-[var(--ink)]">
            <svg width={28} height={18} viewBox="0 0 36 24"><path d="M0 12 L8 12 L11 4 L15 20 L19 8 L22 14 L25 12 L36 12" fill="none" stroke="#2455FF" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"/></svg>
            Pulse
          </Link>
          <nav className="flex items-center gap-4">
            <Link href="/app" className="text-sm font-medium text-[var(--ink-soft)] hover:text-[var(--ink)]">Dashboard</Link>
            <span className="text-sm text-[var(--ink-muted)]">{user.email}</span>
            <form action="/auth/signout" method="POST">
              <button type="submit" className="rounded-[var(--r)] border border-[var(--border)] bg-transparent px-4 py-2 text-sm font-semibold text-[var(--ink-soft)] hover:border-[var(--coral)] hover:text-[var(--coral)]">
                Sign out
              </button>
            </form>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-[1320px] px-6 py-8">{children}</main>
    </div>
  );
}
