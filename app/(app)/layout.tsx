import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getProfile } from "@/lib/supabase/getProfile";

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

  const profile = await getProfile(user.id);
  const role = profile?.role ?? null;
  const roleLabel = role === "manager" ? "Manager" : role === "rep" ? "Rep" : role === "professional" ? "Professional" : null;
  const displayName = profile?.full_name?.trim() || user.user_metadata?.full_name || user.email || "";

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <header className="sticky top-0 z-50 border-b border-[var(--border)] bg-white">
        <div className="mx-auto flex h-14 max-w-[1200px] items-center justify-between px-8">
          <Link href="/app" className="flex items-center gap-2 font-[family-name:var(--font-fraunces)] text-xl font-extrabold text-[var(--ink)]">
            <svg width={28} height={18} viewBox="0 0 36 24"><path d="M0 12 L8 12 L11 4 L15 20 L19 8 L22 14 L25 12 L36 12" fill="none" stroke="#2455FF" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"/></svg>
            Pulse
          </Link>
          <nav className="flex items-center gap-3">
            {displayName && <span className="text-sm font-medium text-[var(--ink)] hidden sm:inline">{displayName}</span>}
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
      <main className="mx-auto max-w-[1200px] p-8">{children}</main>
    </div>
  );
}
