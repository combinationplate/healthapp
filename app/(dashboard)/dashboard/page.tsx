"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";

type Role = "manager" | "rep" | "professional";

const ROLE_LABELS: Record<Role, string> = {
  manager: "Manager",
  rep: "Sales Rep",
  professional: "Healthcare Pro",
};

// Placeholder dashboards matching the app HTML structure
function ManagerDashboard() {
  return (
    <>
      <h1 className="font-serif text-2xl font-extrabold">Team Dashboard</h1>
      <p className="dash-sub text-[13px] text-ink-muted">
        Texas Region · 8 representatives
      </p>
      <div className="stat-row mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {[
          { label: "Team Points", val: "847", note: "↑ 23%", noteClass: "text-green" },
          { label: "Touchpoints", val: "142", note: "This week", noteClass: "text-blue" },
          { label: "CEs Distributed", val: "38", note: "This month", noteClass: "text-green" },
          { label: "Credits Used", val: "58", note: "142 left", noteClass: "text-blue" },
          { label: "Events", val: "6", note: "Next 30 days", noteClass: "text-blue" },
          { label: "Professionals", val: "267", note: "18 need attn", noteClass: "text-coral" },
        ].map((s) => (
          <div
            key={s.label}
            className="rounded-[var(--r-lg)] border border-[var(--border)] bg-white p-5 transition-shadow hover:shadow-[0_2px_8px_rgba(0,0,0,.06)]"
          >
            <div className="text-[10px] font-semibold uppercase tracking-wider text-ink-muted">
              {s.label}
            </div>
            <div className="font-serif text-[28px] font-extrabold">{s.val}</div>
            <div className={`text-[11px] font-medium ${s.noteClass}`}>
              {s.note}
            </div>
          </div>
        ))}
      </div>
      <div className="mt-6 rounded-[var(--r-xl)] border border-[var(--border)] bg-white p-6">
        <h2 className="font-serif text-[16px] font-bold">Team Leaderboard</h2>
        <div className="mt-4 space-y-0 border-b border-[var(--border)] [&>*]:border-b [&>*]:border-[var(--border)] [&>*]:py-2.5 [&>*]:last:border-0">
          {[
            { rank: 1, name: "Marcus Johnson", meta: "Houston · 45 pros · 12 CEs · 3 events", pts: "248 pts", gold: true },
            { rank: 2, name: "Jessica Chen", meta: "Dallas · 38 pros · 9 CEs · 2 events", pts: "215 pts", gold: false },
            { rank: 3, name: "David Rodriguez", meta: "Austin · 42 pros · 8 CEs", pts: "187 pts", gold: false },
          ].map((r) => (
            <div key={r.rank} className="grid grid-cols-[40px_1fr_auto] items-center gap-3">
              <span
                className={`text-center font-serif text-lg font-extrabold ${
                  r.gold ? "text-amber-400" : "text-ink-muted"
                }`}
              >
                {r.rank}
              </span>
              <div>
                <div className="text-[13px] font-bold">{r.name}</div>
                <div className="text-[10px] text-ink-muted">{r.meta}</div>
              </div>
              <span className="rounded-[20px] bg-[var(--blue-glow)] px-3 py-1 text-[11px] font-bold text-blue">
                {r.pts}
              </span>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

function RepDashboard() {
  return (
    <>
      <h1 className="font-serif text-2xl font-extrabold">Your Dashboard</h1>
      <p className="text-[13px] text-ink-muted">Houston Territory, Texas</p>
      <div className="stat-row mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {[
          { label: "Points", val: "248", note: "#1 on team", noteClass: "text-green" },
          { label: "Touchpoints", val: "24", note: "+6 this week", noteClass: "text-green" },
          { label: "CEs Sent", val: "12", note: "This month", noteClass: "text-blue" },
          { label: "Credits", val: "42", note: "Of 100", noteClass: "text-blue" },
          { label: "Events", val: "2", note: "Upcoming", noteClass: "text-blue" },
          { label: "Requests", val: "3", note: "Pending", noteClass: "text-coral" },
        ].map((s) => (
          <div
            key={s.label}
            className="rounded-[var(--r-lg)] border border-[var(--border)] bg-white p-5"
          >
            <div className="text-[10px] font-semibold uppercase tracking-wider text-ink-muted">
              {s.label}
            </div>
            <div className="font-serif text-[28px] font-extrabold">{s.val}</div>
            <div className={`text-[11px] font-medium ${s.noteClass}`}>
              {s.note}
            </div>
          </div>
        ))}
      </div>
      <div className="mt-6 rounded-[var(--r-xl)] border border-[var(--border)] bg-white p-6">
        <h2 className="font-serif text-[16px] font-bold">
          Professionals Seeking Resources
        </h2>
        <p className="mt-2 text-[12px] text-ink-soft">
          Sample cards from your app prototype — wire in Supabase data next.
        </p>
      </div>
    </>
  );
}

function ProDashboard() {
  return (
    <>
      <h1 className="font-serif text-2xl font-extrabold">Welcome, Jennifer</h1>
      <p className="text-[13px] text-ink-muted">
        RN · St. Luke&apos;s Hospital · Houston, TX ·{" "}
        <span className="inline-flex rounded-[20px] bg-[var(--teal-glow)] px-3 py-0.5 text-[10px] font-bold text-teal align-middle">
          Texas License
        </span>
      </p>
      <div className="stat-row mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {[
          { label: "Courses", val: "4", note: "Available", noteClass: "text-green" },
          { label: "Requests", val: "1", note: "Pending", noteClass: "text-coral" },
          { label: "Reps", val: "2", note: "Connected", noteClass: "text-blue" },
          { label: "CE Hours", val: "12", note: "This year", noteClass: "text-green" },
          { label: "Events", val: "2", note: "Near you", noteClass: "text-blue" },
          { label: "Jobs", val: "3", note: "New", noteClass: "text-green" },
        ].map((s) => (
          <div
            key={s.label}
            className="rounded-[var(--r-lg)] border border-[var(--border)] bg-white p-5"
          >
            <div className="text-[10px] font-semibold uppercase tracking-wider text-ink-muted">
              {s.label}
            </div>
            <div className="font-serif text-[28px] font-extrabold">{s.val}</div>
            <div className={`text-[11px] font-medium ${s.noteClass}`}>
              {s.note}
            </div>
          </div>
        ))}
      </div>
      <div className="mt-6 rounded-[var(--r-xl)] border border-[var(--border)] bg-white p-6">
        <h2 className="font-serif text-[16px] font-bold">
          Available CE Courses
        </h2>
        <p className="mt-2 text-[12px] text-ink-soft">
          Courses for <strong className="text-blue">Nursing</strong> in{" "}
          <strong className="text-blue">Texas</strong> — connect Supabase for
          real data.
        </p>
      </div>
    </>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const [role, setRole] = useState<Role | null>(null);

  useEffect(() => {
    const r = sessionStorage.getItem("pulse_role") as Role | null;
    if (r && ["manager", "rep", "professional"].includes(r)) {
      setRole(r);
    } else {
      router.replace("/login");
    }
  }, [router]);

  function handleLogout() {
    sessionStorage.removeItem("pulse_role");
    router.push("/login");
  }

  if (role === null) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-cream">
        <p className="text-ink-muted">Loading…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream">
      <header className="sticky top-0 z-[100] border-b border-[var(--border)] bg-white">
        <div className="mx-auto flex max-w-[1320px] items-center justify-between px-6 py-3">
          <Link
            href="/"
            className="flex items-center gap-2 font-serif text-[22px] font-extrabold text-ink"
          >
            <span className="h-2 w-2 rounded-full bg-blue" />
            Pulse
          </Link>
          <div className="flex items-center gap-3">
            <span className="rounded-[20px] bg-cream px-3 py-1 text-[11px] font-semibold text-ink-soft">
              {ROLE_LABELS[role]}
            </span>
            {role !== "professional" && (
              <span className="rounded-[20px] bg-[rgba(22,163,74,.08)] px-3 py-1 text-[11px] font-bold text-green">
                {role === "manager" ? "142" : "42"} credits
              </span>
            )}
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--blue-glow)] text-[12px] font-bold text-blue">
              {role === "manager" ? "SM" : role === "rep" ? "MJ" : "JL"}
            </span>
            <span className="text-[13px] font-semibold">
              {role === "manager"
                ? "Sarah Martinez"
                : role === "rep"
                  ? "Marcus Johnson"
                  : "Jennifer Lopez"}
            </span>
            <button
              type="button"
              onClick={handleLogout}
              className="rounded-[var(--r)] border border-[var(--border)] px-3 py-1.5 text-[12px] font-medium text-ink-soft"
            >
              Log out
            </button>
          </div>
        </div>
      </header>
      <div className="mx-auto max-w-[1320px] px-6 py-7 pb-20">
        {role === "manager" && <ManagerDashboard />}
        {role === "rep" && <RepDashboard />}
        {role === "professional" && <ProDashboard />}
      </div>
    </div>
  );
}
