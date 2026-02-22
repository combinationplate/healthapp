"use client";

import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

export default function LoginPage() {
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
    <div className="flex min-h-screen items-center justify-center bg-[var(--cream)] px-7 py-12">
      <div className="w-full max-w-[400px] rounded-[var(--r-xl)] border border-[var(--border)] bg-white p-10 shadow-lg">
        <div className="mb-6 flex items-center gap-2 font-[family-name:var(--font-fraunces)] text-2xl font-extrabold text-[var(--ink)]">
          <svg width={32} height={22} viewBox="0 0 36 24"><path className="heartbeat-path" d="M0 12 L8 12 L11 4 L15 20 L19 8 L22 14 L25 12 L36 12" fill="none" stroke="#2455FF" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"/></svg>
          Sign in to Pulse
        </div>
        <p className="mb-6 text-sm text-[var(--ink-muted)]">Use your email and password to access your account.</p>
        <form onSubmit={handleSubmit} className="grid gap-4">
          <div>
            <label htmlFor="email" className="mb-1.5 block text-xs font-semibold text-[var(--ink-soft)]">Email</label>
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
            <label htmlFor="password" className="mb-1.5 block text-xs font-semibold text-[var(--ink-soft)]">Password</label>
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
            className="w-full rounded-[var(--r)] bg-[var(--blue)] py-3.5 text-[15px] font-bold text-white transition-colors hover:bg-[var(--blue-dark)] disabled:opacity-60"
          >
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>
        <p className="mt-6 text-center text-sm text-[var(--ink-soft)]">
          Don&apos;t have an account?{" "}
          <Link href="/signup" className="font-semibold text-[var(--blue)] hover:underline">Sign up</Link>
        </p>
        <p className="mt-3 text-center">
          <Link href="/" className="text-sm text-[var(--ink-muted)] hover:underline">← Back to home</Link>
        </p>
      </div>
    </div>
  );
}
