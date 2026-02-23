"use client";

import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") ?? "/app";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "error" | "success"; text: string } | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      setMessage({ type: "error", text: error.message });
      return;
    }
    router.push(redirect);
    router.refresh();
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--cream)] px-7 py-12 [background:radial-gradient(ellipse_60%_50%_at_20%_20%,var(--blue-glow),transparent),radial-gradient(ellipse_50%_40%_at_80%_70%,var(--teal-glow),transparent),var(--cream)]">
      <div className="w-full max-w-[460px] rounded-[var(--r-xl)] border border-[var(--border)] bg-white p-11 shadow-[0_12px_40px_rgba(0,0,0,.08)]">
        <div className="mb-7 flex items-center gap-2.5 font-[family-name:var(--font-fraunces)] text-[30px] font-extrabold text-[var(--ink)]">
          <span className="h-3 w-3 rounded-full bg-[var(--blue)]" />
          Pulse
        </div>
        <h1 className="font-[family-name:var(--font-fraunces)] text-[20px] font-bold text-[var(--ink)]">
          Welcome back
        </h1>
        <p className="mt-1 mb-6 text-[13px] text-[var(--ink-muted)]">
          Sign in with your email and password to access your dashboard.
        </p>
        <form onSubmit={handleSubmit} className="grid gap-4">
          <div>
            <label htmlFor="email" className="mb-1.5 block text-xs font-semibold text-[var(--ink-soft)]">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="you@example.com"
              className="w-full rounded-[var(--r)] border-[1.5px] border-[var(--border)] px-3.5 py-2.5 text-sm focus:border-[var(--blue)] focus:outline-none"
            />
          </div>
          <div>
            <label htmlFor="password" className="mb-1.5 block text-xs font-semibold text-[var(--ink-soft)]">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="••••••••"
              className="w-full rounded-[var(--r)] border-[1.5px] border-[var(--border)] px-3.5 py-2.5 text-sm focus:border-[var(--blue)] focus:outline-none"
            />
          </div>
          {message && (
            <p className={`text-sm ${message.type === "error" ? "text-[var(--coral)]" : "text-[var(--teal)]"}`}>
              {message.text}
            </p>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-[var(--r)] bg-[var(--blue)] py-3 text-[14px] font-bold text-white transition-colors hover:bg-[var(--blue-dark)] disabled:cursor-not-allowed disabled:opacity-40"
          >
            {loading ? "Signing in…" : "Continue"}
          </button>
        </form>
        <p className="mt-6 text-center text-sm text-[var(--ink-soft)]">
          Don&apos;t have an account?{" "}
          <Link href="/signup" className="font-semibold text-[var(--blue)] hover:underline">
            Sign up
          </Link>
        </p>
        <p className="mt-3 text-center">
          <Link href="/" className="text-sm text-[var(--ink-muted)] hover:underline">
            ← Back to home
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-[var(--cream)] [background:radial-gradient(ellipse_60%_50%_at_20%_20%,var(--blue-glow),transparent),radial-gradient(ellipse_50%_40%_at_80%_70%,var(--teal-glow),transparent),var(--cream)]">
        <div className="w-full max-w-[460px] rounded-[var(--r-xl)] border border-[var(--border)] bg-white p-11 shadow-[0_12px_40px_rgba(0,0,0,.08)]">
          <p className="text-center text-[var(--ink-muted)]">Loading…</p>
        </div>
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}
