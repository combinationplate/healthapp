"use client";

import React, { useState, useEffect } from "react";

export function RSVPClientButtons({
  eventId,
  email,
  initialAction,
  hasExternalUrl,
}: {
  eventId: string;
  email: string;
  initialAction: string | null;
  hasExternalUrl: boolean;
}) {
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (initialAction === "decline" && email) {
      handleRsvp("declined");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleRsvp(rsvpStatus: "going" | "declined" | "maybe") {
    setLoading(true);
    const res = await fetch("/api/events/rsvp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ eventId, status: rsvpStatus, email }),
    });
    setLoading(false);
    if (res.ok) setStatus(rsvpStatus);
  }

  if (status) {
    const msgs: Record<string, { emoji: string; text: string }> = {
      going: { emoji: "🎉", text: "You're confirmed! See you there." },
      declined: { emoji: "👋", text: "Thanks for letting us know." },
      maybe: { emoji: "🤔", text: "We'll keep you posted." },
    };
    const m = msgs[status] ?? msgs.going;
    return (
      <div style={{ textAlign: "center", padding: "20px 0" }}>
        <div style={{ fontSize: "32px", marginBottom: "8px" }}>{m.emoji}</div>
        <p style={{ fontWeight: 600, color: "#0b1222" }}>{m.text}</p>
      </div>
    );
  }

  if (hasExternalUrl) {
    return (
      <div>
        <p style={{
          fontSize: "13px", color: "#7a8ba8", textAlign: "center",
          marginBottom: "12px",
        }}>
          Planning to attend? Let us know:
        </p>
        <div style={{ display: "flex", gap: "8px", justifyContent: "center" }}>
          {(["going", "maybe", "declined"] as const).map((s) => {
            const labels: Record<string, string> = {
              going: "Going", maybe: "Maybe", declined: "Can't",
            };
            return (
              <button
                key={s}
                onClick={() => handleRsvp(s)}
                disabled={loading}
                style={{
                  padding: "8px 18px", borderRadius: "8px", fontSize: "13px",
                  fontWeight: 600, cursor: loading ? "not-allowed" : "pointer",
                  border: "1px solid rgba(11,18,34,0.08)", background: "white",
                  color: s === "going" ? "#0d9488"
                    : s === "declined" ? "#7a8ba8" : "#3b4963",
                  fontFamily: "'DM Sans',system-ui,sans-serif",
                }}
              >
                {labels[s]}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
      <button
        onClick={() => handleRsvp("going")}
        disabled={loading}
        style={{
          width: "100%", padding: "14px", borderRadius: "10px",
          border: "none", background: "#2455ff", color: "white",
          fontSize: "15px", fontWeight: 700,
          cursor: loading ? "not-allowed" : "pointer",
          opacity: loading ? 0.6 : 1,
          boxShadow: "0 2px 10px rgba(36,85,255,0.18)",
          fontFamily: "'DM Sans',system-ui,sans-serif",
        }}
      >
        {loading ? "…" : "✓ I'll Be There"}
      </button>
      <div style={{ display: "flex", gap: "10px" }}>
        <button
          onClick={() => handleRsvp("maybe")}
          disabled={loading}
          style={{
            flex: 1, padding: "12px", borderRadius: "10px",
            border: "1px solid rgba(11,18,34,0.08)", background: "white",
            color: "#3b4963", fontSize: "14px", fontWeight: 600,
            cursor: "pointer", fontFamily: "'DM Sans',system-ui,sans-serif",
          }}
        >Maybe</button>
        <button
          onClick={() => handleRsvp("declined")}
          disabled={loading}
          style={{
            flex: 1, padding: "12px", borderRadius: "10px",
            border: "1px solid rgba(11,18,34,0.08)", background: "white",
            color: "#7a8ba8", fontSize: "14px", fontWeight: 600,
            cursor: "pointer", fontFamily: "'DM Sans',system-ui,sans-serif",
          }}
        >Can't Make It</button>
      </div>
    </div>
  );
}
