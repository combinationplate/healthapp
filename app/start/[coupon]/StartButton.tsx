"use client";

import { useState } from "react";

const inputStyle: React.CSSProperties = {
  width: "100%",
  boxSizing: "border-box",
  padding: "12px 14px",
  borderRadius: 10,
  border: "1.5px solid rgba(11,18,34,0.12)",
  fontSize: 15,
  fontFamily: "'DM Sans', system-ui, sans-serif",
  color: "#0b1222",
  outline: "none",
};

export default function StartButton({
  coupon,
  label,
  collectName = false,
  initialFirst = "",
  initialLast = "",
}: {
  coupon: string;
  label: string;
  collectName?: boolean;
  initialFirst?: string;
  initialLast?: string;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [first, setFirst] = useState(initialFirst);
  const [last, setLast] = useState(initialLast);

  async function start() {
    if (loading) return;
    if (collectName && (!first.trim() || !last.trim())) {
      setError("Please enter your first and last name — it's what appears on your certificate.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/ce/redeem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          coupon,
          firstName: collectName ? first.trim() : undefined,
          lastName: collectName ? last.trim() : undefined,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as { redirect?: string; error?: string };
      if (res.ok && data.redirect) {
        window.location.href = data.redirect;
        return; // keep the spinner while the browser navigates
      }
      setError(data.error ?? "Something went wrong. Please try again.");
      setLoading(false);
    } catch {
      setError("Something went wrong. Please check your connection and try again.");
      setLoading(false);
    }
  }

  return (
    <div>
      {collectName && (
        <div style={{ marginBottom: 18, textAlign: "left" }}>
          <p style={{ fontSize: 13, fontWeight: 700, color: "#0b1222", margin: "0 0 8px" }}>
            Your certificate will be issued to:
          </p>
          <div style={{ display: "flex", gap: 10 }}>
            <input
              style={inputStyle}
              type="text"
              placeholder="First name"
              autoComplete="given-name"
              value={first}
              onChange={(e) => setFirst(e.target.value)}
            />
            <input
              style={inputStyle}
              type="text"
              placeholder="Last name"
              autoComplete="family-name"
              value={last}
              onChange={(e) => setLast(e.target.value)}
            />
          </div>
          <p style={{ fontSize: 12, color: "#8a91a0", margin: "8px 0 0", lineHeight: 1.5 }}>
            Use the name on your professional license — you can correct it here if needed.
          </p>
        </div>
      )}
      <button
        onClick={start}
        disabled={loading}
        style={{
          display: "inline-block",
          width: "100%",
          padding: "16px 24px",
          borderRadius: 12,
          border: "none",
          background: loading ? "#7d97f8" : "#2455ff",
          color: "#ffffff",
          fontSize: 17,
          fontWeight: 700,
          fontFamily: "'DM Sans', system-ui, sans-serif",
          cursor: loading ? "wait" : "pointer",
          transition: "background 150ms ease",
        }}
      >
        {loading ? "Setting up your course…" : label}
      </button>
      {error && (
        <p style={{ color: "#c0392b", fontSize: 14, marginTop: 12, marginBottom: 0 }}>{error}</p>
      )}
    </div>
  );
}
