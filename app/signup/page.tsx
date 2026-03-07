"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter, useSearchParams } from "next/navigation";

export default function SignupPage() {
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const inviteToken = searchParams.get("invite");

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const supabase = createClient();
    const { error: signupError } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        data: {
          full_name: form.name,
          role: "rep",
          invite_token: inviteToken ?? undefined,
        },
      },
    });

    setSaving(false);
    if (signupError) {
      setError(signupError.message);
      return;
    }

    router.push("/signup/confirm");
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#F8FAFC" }}>
      <div style={{ width: "92%", maxWidth: "440px", background: "white", borderRadius: "16px", padding: "40px", border: "1px solid #E2E8F0", boxShadow: "0 4px 24px rgba(0,0,0,0.08)" }}>
        <div style={{ marginBottom: "32px" }}>
          <div style={{ fontSize: "28px", fontWeight: 800, marginBottom: "8px" }}>Join Pulse</div>
          {inviteToken ? (
            <p style={{ fontSize: "14px", color: "#64748B" }}>You've been invited to join a team on Pulse.</p>
          ) : (
            <p style={{ fontSize: "14px", color: "#64748B" }}>Create your account to get started.</p>
          )}
        </div>
        <form onSubmit={handleSignup} style={{ display: "grid", gap: "16px" }}>
          <div>
            <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#64748B", marginBottom: "6px" }}>Full Name</label>
            <input
              type="text"
              required
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="John Smith"
              style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid #E2E8F0", fontSize: "14px", boxSizing: "border-box" }}
            />
          </div>
          <div>
            <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#64748B", marginBottom: "6px" }}>Email</label>
            <input
              type="email"
              required
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              placeholder="john@yourhospice.com"
              style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid #E2E8F0", fontSize: "14px", boxSizing: "border-box" }}
            />
          </div>
          <div>
            <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#64748B", marginBottom: "6px" }}>Password</label>
            <input
              type="password"
              required
              value={form.password}
              onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
              placeholder="Min 8 characters"
              style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid #E2E8F0", fontSize: "14px", boxSizing: "border-box" }}
            />
          </div>
          {error && <p style={{ fontSize: "13px", color: "#EF4444" }}>{error}</p>}
          <button
            type="submit"
            disabled={saving}
            style={{ padding: "12px", borderRadius: "8px", border: "none", background: "#2D5BFF", color: "white", fontSize: "15px", fontWeight: 600, cursor: "pointer", opacity: saving ? 0.6 : 1 }}
          >
            {saving ? "Creating account…" : "Create Account"}
          </button>
        </form>
      </div>
    </div>
  );
}
