"use client";

import { useState } from "react";

export default function StartButton({ coupon, label }: { coupon: string; label: string }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function start() {
    if (loading) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/ce/redeem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ coupon }),
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
