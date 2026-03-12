"use client";

import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, Suspense } from "react";

const US_STATES = ["AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN","IA","KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ","NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT","VT","VA","WA","WV","WI","WY","DC"];

export default function SignupPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[var(--cream)]">
          <p className="text-sm text-[var(--ink-muted)]">Loading…</p>
        </div>
      }
    >
      <SignupForm />
    </Suspense>
  );
}

function SignupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const typeParam = searchParams.get("type") ?? "hcp";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState<"manager" | "rep" | "professional">(
    typeParam === "sales" ? "rep" : typeParam === "manager" ? "manager" : "professional"
  );
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [discipline, setDiscipline] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "error" | "success"; text: string } | null>(null);

  const isSales = role === "rep";
  const isManager = role === "manager";
  const isPro = role === "professional";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    const supabase = createClient();
    const accountType = role === "rep" ? "sales" : role === "manager" ? "manager" : "hcp";

    const metadata: Record<string, string> = {
      full_name: fullName,
      account_type: accountType,
      role,
    };
    if (isPro) {
      if (city.trim()) metadata.city = city.trim().replace(/\b\w/g, c => c.toUpperCase());
      if (state) metadata.state = state;
      if (discipline) metadata.discipline = discipline;
    }

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: metadata,
        emailRedirectTo: `${typeof window !== "undefined" ? window.location.origin : ""}/auth/callback?next=/app`,
      },
    });
    setLoading(false);
    if (error) {
      setMessage({ type: "error", text: error.message });
      return;
    }
    setMessage({
      type: "success",
      text: "Check your email for the confirmation link to complete sign up.",
    });
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--cream)] px-7 py-12">
      <div className="w-full max-w-[400px] rounded-[var(--r-xl)] border border-[var(--border)] bg-white p-10 shadow-lg">
        <div className="mb-6 flex items-center gap-2 font-[family-name:var(--font-fraunces)] text-2xl font-extrabold text-[var(--ink)]">
          <svg width={32} height={22} viewBox="0 0 36 24"><path className="heartbeat-path" d="M0 12 L8 12 L11 4 L15 20 L19 8 L22 14 L25 12 L36 12" fill="none" stroke="#2455FF" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"/></svg>
          {isManager ? "Manager Sign Up" : isSales ? "Request a Demo" : "Create Free Account"}
        </div>
        <p className="mb-4 text-sm text-[var(--ink-muted)]">
          {isManager
            ? "Lead your team with visibility and tools."
            : isSales
            ? "See how Pulse helps your sales team win more referrals."
            : "Get free CE courses, event invites, and local rep connections."}
        </p>
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

          {isPro && (
            <>
              <div>
                <label htmlFor="discipline" className="mb-1.5 block text-xs font-semibold text-[var(--ink-soft)]">Discipline</label>
                <select
                  id="discipline"
                  value={discipline}
                  onChange={(e) => setDiscipline(e.target.value)}
                  required
                  className="w-full rounded-[var(--r)] border-[1.5px] border-[var(--border)] px-3.5 py-2.5 text-sm focus:border-[var(--blue)] focus:outline-none"
                >
                  <option value="">Select…</option>
                  <option value="Nursing">Nursing</option>
                  <option value="Social Work">Social Work</option>
                  <option value="Case Mgmt">Case Management</option>
                  <option value="PT">Physical Therapy</option>
                  <option value="OT">Occupational Therapy</option>
                  <option value="SLP">Speech-Language Pathology</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="city" className="mb-1.5 block text-xs font-semibold text-[var(--ink-soft)]">City</label>
                  <input
                    id="city"
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    required
                    placeholder="Houston"
                    className="w-full rounded-[var(--r)] border-[1.5px] border-[var(--border)] px-3.5 py-2.5 text-sm focus:border-[var(--blue)] focus:outline-none"
                  />
                </div>
                <div>
                  <label htmlFor="state" className="mb-1.5 block text-xs font-semibold text-[var(--ink-soft)]">State</label>
                  <select
                    id="state"
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    required
                    className="w-full rounded-[var(--r)] border-[1.5px] border-[var(--border)] px-3.5 py-2.5 text-sm focus:border-[var(--blue)] focus:outline-none"
                  >
                    <option value="">Select…</option>
                    {US_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>
            </>
          )}

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
            {loading ? "Creating account…" : isManager ? "Create Account" : isSales ? "Request Demo" : "Create Free Account"}
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