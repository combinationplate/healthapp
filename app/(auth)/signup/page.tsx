"use client";

import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";

function SignupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const typeParam = searchParams.get("type") ?? "hcp"; // hcp | sales | manager
  const inviteToken = searchParams.get("invite");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [company, setCompany] = useState("");
  const [state, setState] = useState("");
  const [city, setCity] = useState("");
  const [role, setRole] = useState<"manager" | "rep" | "professional">(
    typeParam === "sales" ? "rep" : typeParam === "manager" ? "manager" : "professional"
  );
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "error" | "success"; text: string } | null>(null);

  const isSales = role === "rep" || !!inviteToken;
  const isManager = role === "manager" && !inviteToken;
  const effectiveRole = inviteToken ? "rep" : role;
  const showRepManagerFields = effectiveRole === "rep" || effectiveRole === "manager";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    const supabase = createClient();
    const accountType = effectiveRole === "rep" ? "sales" : effectiveRole === "manager" ? "manager" : "hcp";
    const cityNormalized = typeof city === "string" ? city.trim().replace(/\b\w/g, (c) => c.toUpperCase()) : city;
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          account_type: accountType,
          role: effectiveRole,
          ...(inviteToken ? { invite_token: inviteToken } : {}),
          ...(effectiveRole === "rep" || effectiveRole === "manager" ? { state, city: cityNormalized } : {}),
          ...(effectiveRole === "rep" || effectiveRole === "manager" ? { company_name: company || undefined } : {}),
        },
        emailRedirectTo: `${typeof window !== "undefined" ? window.location.origin : ""}/auth/callback?next=/app`,
      },
    });
    setLoading(false);
    if (error) {
      setMessage({ type: "error", text: error.message });
      return;
    }
    if (data.session) {
      setTimeout(() => router.push("/app"), 100);
    } else {
      setMessage({
        type: "success",
        text: "Check your email for the confirmation link to complete sign up.",
      });
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--cream)] px-7 py-12">
      <div className="w-full max-w-[400px] rounded-[var(--r-xl)] border border-[var(--border)] bg-white p-10 shadow-lg">
        <div className="mb-6 flex items-center gap-2 font-[family-name:var(--font-fraunces)] text-2xl font-extrabold text-[var(--ink)]">
          <svg width={32} height={22} viewBox="0 0 36 24"><path className="heartbeat-path" d="M0 12 L8 12 L11 4 L15 20 L19 8 L22 14 L25 12 L36 12" fill="none" stroke="#2455FF" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"/></svg>
          {inviteToken ? "Join Pulse" : isManager ? "Manager Sign Up" : isSales ? "Request a Demo" : "Create Free Account"}
        </div>
        <p className="mb-4 text-sm text-[var(--ink-muted)]">
          {inviteToken
            ? "You've been invited to join a team on Pulse. Create your account to get started."
            : isManager
            ? "Lead your team with visibility and tools."
            : isSales
            ? "See how Pulse helps your sales team win more referrals."
            : "Get free CE courses, event invites, career opportunities, and local rep connections."}
        </p>
        {!inviteToken && (
        <div className="mb-4">
          <label className="mb-1.5 block text-xs font-semibold text-[var(--ink-soft)]">I am a</label>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as "manager" | "rep" | "professional")}
            className="w-full rounded-[var(--r)] border-[1.5px] border-[var(--border)] px-3.5 py-2.5 text-sm focus:border-[var(--blue)] focus:outline-none"
          >
            <option value="manager">Manager</option>
            <option value="rep">Sales rep</option>
            <option value="professional">Healthcare professional</option>
          </select>
        </div>
        )}
        <form onSubmit={handleSubmit} className="grid gap-4">
          <div>
            <label htmlFor="fullName" className="mb-1.5 block text-xs font-semibold text-[var(--ink-soft)]">Full Name</label>
            <input
              id="fullName"
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              placeholder={isManager ? "Sarah Martinez" : isSales ? "Alex Chen" : "Jennifer Lopez, RN"}
              className="w-full rounded-[var(--r)] border-[1.5px] border-[var(--border)] px-3.5 py-2.5 text-sm focus:border-[var(--blue)] focus:outline-none"
            />
          </div>
          <div>
            <label htmlFor="email" className="mb-1.5 block text-xs font-semibold text-[var(--ink-soft)]">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder={isManager ? "sarah@company.com" : isSales ? "alex@hospice.com" : "jennifer@hospital.com"}
              className="w-full rounded-[var(--r)] border-[1.5px] border-[var(--border)] px-3.5 py-2.5 text-sm focus:border-[var(--blue)] focus:outline-none"
            />
          </div>
          {!inviteToken && (role === "rep" || role === "manager") && (
            <div>
              <label htmlFor="company" className="mb-1.5 block text-xs font-semibold text-[var(--ink-soft)]">Company Name</label>
              <input
                id="company"
                type="text"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                required
                placeholder="e.g. Acme Hospice"
                className="w-full rounded-[var(--r)] border-[1.5px] border-[var(--border)] px-3.5 py-2.5 text-sm focus:border-[var(--blue)] focus:outline-none"
              />
            </div>
          )}
          {showRepManagerFields && (
            <>
              <div>
                <label htmlFor="state" className="mb-1.5 block text-xs font-semibold text-[var(--ink-soft)]">State</label>
                <select
                  id="state"
                  required
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  className="w-full rounded-[var(--r)] border-[1.5px] border-[var(--border)] px-3.5 py-2.5 text-sm focus:border-[var(--blue)] focus:outline-none"
                >
                  <option value="">Select...</option>
                  {["AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "FL", "GA", "HI", "ID", "IL", "IN", "IA", "KS", "KY", "LA", "ME", "MD", "MA", "MI", "MN", "MS", "MO", "MT", "NE", "NV", "NH", "NJ", "NM", "NY", "NC", "ND", "OH", "OK", "OR", "PA", "RI", "SC", "SD", "TN", "TX", "UT", "VT", "VA", "WA", "WV", "WI", "WY", "DC"].map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="city" className="mb-1.5 block text-xs font-semibold text-[var(--ink-soft)]">City</label>
                <input
                  id="city"
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  required
                  placeholder="e.g. Houston"
                  className="w-full rounded-[var(--r)] border-[1.5px] border-[var(--border)] px-3.5 py-2.5 text-sm focus:border-[var(--blue)] focus:outline-none"
                />
              </div>
            </>
          )}
          <div>
            <label htmlFor="password" className="mb-1.5 block text-xs font-semibold text-[var(--ink-soft)]">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
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
            className={`w-full rounded-[var(--r)] py-3.5 text-[15px] font-bold text-white transition-colors disabled:opacity-60 ${
              isManager ? "bg-[var(--coral)] hover:opacity-90" : isSales ? "bg-[var(--blue)] hover:bg-[var(--blue-dark)]" : "bg-[var(--teal)] hover:bg-[var(--teal-dark)]"
            }`}
          >
            {loading ? "Creating account…" : inviteToken ? "Create Account" : isManager ? "Create Account" : isSales ? "Request Demo" : "Create Free Account"}
          </button>
        </form>
        <p className="mt-6 text-center text-sm text-[var(--ink-soft)]">
          Already have an account?{" "}
          <Link href="/login" className="font-semibold text-[var(--blue)] hover:underline">Sign in</Link>
        </p>
        <p className="mt-3 text-center">
          <Link href="/" className="text-sm text-[var(--ink-muted)] hover:underline">← Back to home</Link>
        </p>
      </div>
    </div>
  );
}

export default function SignupPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-[var(--cream)] px-7 py-12">
        <div className="w-full max-w-[400px] rounded-[var(--r-xl)] border border-[var(--border)] bg-white p-10 shadow-lg">
          <p className="text-center text-[var(--ink-muted)]">Loading…</p>
        </div>
      </div>
    }>
      <SignupForm />
    </Suspense>
  );
}
