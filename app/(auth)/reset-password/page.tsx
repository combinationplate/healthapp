"use client";

export const dynamic = "force-dynamic";

import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function ResetPasswordPage() {
  const supabase = createClient();
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [validSession, setValidSession] = useState(false);

  useEffect(() => {
    // Check if there's already a session (PKCE may have exchanged before listener mounted)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setValidSession(true);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" || (event === "SIGNED_IN" && session)) {
        setValidSession(true);
      }
    });

    return () => subscription.unsubscribe();
  }, [supabase]);

  async function handleReset() {
    setError("");
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords don't match.");
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) {
      setError(error.message);
    } else {
      setSuccess(true);
      setTimeout(() => router.push("/login"), 2500);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--cream)] px-7 py-12 [background:radial-gradient(ellipse_60%_50%_at_20%_20%,var(--blue-glow),transparent),radial-gradient(ellipse_50%_40%_at_80%_70%,var(--teal-glow),transparent),var(--cream)]">
      <div className="w-full max-w-[460px] rounded-[var(--r-xl)] border border-[var(--border)] bg-white p-11 shadow-[0_12px_40px_rgba(0,0,0,.08)]">
        <div className="mb-7 flex items-center gap-2.5 font-[family-name:var(--font-fraunces)] text-[30px] font-extrabold text-[var(--ink)]">
          <span className="h-3 w-3 rounded-full bg-[var(--blue)]" />
          Pulse
        </div>
        <h1 className="font-[family-name:var(--font-fraunces)] text-[20px] font-bold text-[var(--ink)]">
          Set a new password
        </h1>
        <p className="mt-1 mb-6 text-[13px] text-[var(--ink-muted)]">
          Choose something you&apos;ll remember.
        </p>

        {!validSession ? (
          <p className="text-sm text-[var(--ink-muted)]">Verifying reset link…</p>
        ) : success ? (
          <p className="text-sm text-[var(--teal)]">
            Password updated! Redirecting to login…
          </p>
        ) : (
          <div className="grid gap-4">
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-[var(--ink-soft)]">
                New password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-[var(--r)] border-[1.5px] border-[var(--border)] px-3.5 py-2.5 text-sm focus:border-[var(--blue)] focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-[var(--ink-soft)]">
                Confirm new password
              </label>
              <input
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-[var(--r)] border-[1.5px] border-[var(--border)] px-3.5 py-2.5 text-sm focus:border-[var(--blue)] focus:outline-none"
              />
            </div>
            {error && (
              <p className="text-sm text-[var(--coral)]">{error}</p>
            )}
            <button
              onClick={handleReset}
              disabled={loading}
              className="w-full rounded-[var(--r)] bg-[var(--blue)] py-3 text-[14px] font-bold text-white transition-colors hover:bg-[var(--blue-dark)] disabled:cursor-not-allowed disabled:opacity-40"
            >
              {loading ? "Updating…" : "Update password"}
            </button>
          </div>
        )}

        <p className="mt-6 text-center">
          <Link href="/login" className="text-sm text-[var(--ink-muted)] hover:underline">
            ← Back to login
          </Link>
        </p>
      </div>
    </div>
  );
}