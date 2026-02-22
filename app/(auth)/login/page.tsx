"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useState } from "react";

const ROLES = [
  {
    id: "manager",
    title: "Team Manager",
    desc: "Performance, territories, credits, team oversight",
  },
  {
    id: "rep",
    title: "Sales Representative",
    desc: "Distribute CEs, manage events, QR tools, grow your network",
  },
  {
    id: "professional",
    title: "Healthcare Professional",
    desc: "Free CEs, events, career opportunities, local reps",
  },
] as const;

type RoleId = (typeof ROLES)[number]["id"];

export default function LoginPage() {
  const router = useRouter();
  const [selectedRole, setSelectedRole] = useState<RoleId | null>(null);

  async function handleContinue() {
    if (!selectedRole) return;
    // For now: store role in sessionStorage and go to dashboard.
    // Later: sign in with Supabase and read role from profile.
    if (typeof window !== "undefined") {
      sessionStorage.setItem("pulse_role", selectedRole);
    }
    router.push("/dashboard");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-cream [background:radial-gradient(ellipse_60%_50%_at_20%_20%,var(--blue-glow),transparent),radial-gradient(ellipse_50%_40%_at_80%_70%,var(--teal-glow),transparent),var(--cream)]">
      <div className="w-full max-w-[460px] rounded-[var(--r-xl)] border border-[var(--border)] bg-white p-11 shadow-[0_12px_40px_rgba(0,0,0,.08)]">
        <div className="mb-7 flex items-center gap-2.5 font-serif text-[30px] font-extrabold">
          <span className="h-3 w-3 rounded-full bg-blue" />
          Pulse
        </div>
        <h1 className="font-serif text-[20px] font-bold">Welcome back</h1>
        <p className="mt-1 mb-6 text-[13px] text-ink-muted">
          Select your role to continue
        </p>
        <div className="mb-5 grid gap-2">
          {ROLES.map((r) => (
            <button
              key={r.id}
              type="button"
              onClick={() => setSelectedRole(r.id)}
              className={`rounded-[var(--r-lg)] border-2 px-[18px] py-3.5 text-left transition-colors ${
                selectedRole === r.id
                  ? "border-blue bg-[var(--blue-glow)]"
                  : "border-transparent bg-cream hover:bg-sage"
              }`}
            >
              <h3 className="text-[13px] font-bold">{r.title}</h3>
              <p className="text-[11px] text-ink-muted">{r.desc}</p>
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={handleContinue}
          disabled={!selectedRole}
          className="w-full rounded-[var(--r)] bg-blue py-3 text-[14px] font-bold text-white disabled:cursor-not-allowed disabled:opacity-40"
        >
          Continue
        </button>
        <p className="mt-6 text-center text-sm text-ink-muted">
          <Link href="/" className="underline hover:text-ink">
            ← Back to home
          </Link>
        </p>
      </div>
    </div>
  );
}
