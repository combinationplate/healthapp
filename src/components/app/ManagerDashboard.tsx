"use client";

import React, { useState, useEffect, useCallback } from "react";
import { StatCard, StatsGrid, PageShell, SectionCard } from "./DashboardShell";

type RepStats = {
  id: string;
  name: string;
  cesThisMonth: number;
  professionalsInNetwork: number;
  lastActivity: string;
  redemptionRate: string;
};

type Props = {
  userName: string;
  managerId?: string;
};

export function ManagerDashboard({ userName, managerId }: Props) {
  const [reps, setReps] = useState<RepStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalCesThisMonth: 0,
    totalProfessionals: 0,
    activeReps: 0,
    redemptionRate: "—",
  });
  const [inviteUrl, setInviteUrl] = useState<string | null>(null);
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteCopied, setInviteCopied] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/manager/stats", { credentials: "include" });
      const data = await res.json();
      if (!res.ok) return;
      if (data.stats) setStats(data.stats);
      if (data.reps) setReps(data.reps);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  async function handleGenerateInvite() {
    setInviteLoading(true);
    const res = await fetch("/api/manager/invite", { method: "POST", credentials: "include" });
    const data = await res.json();
    setInviteLoading(false);
    if (data.url) setInviteUrl(data.url);
  }

  return (
    <PageShell>
      <div style={{ display: "flex", flexDirection: "column", gap: "24px", paddingBottom: "80px", paddingTop: "24px" }}>

        {/* ── Page header ── */}
        <div>
          <h1 style={{ fontFamily: "'Fraunces', Georgia, serif", fontSize: "26px", fontWeight: 800, color: "#0b1222", letterSpacing: "-0.01em", margin: 0 }}>
            Team Dashboard
          </h1>
          <p style={{ marginTop: "4px", fontSize: "13px", color: "#7a8ba8" }}>
            Overview of your team's performance
          </p>
        </div>

        {/* ── Stats ── */}
        <div style={{ borderRadius: "16px", background: "#ffffff", border: "1px solid rgba(11,18,34,0.08)", padding: "20px", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
          <StatsGrid>
            <StatCard label="CEs Distributed" value={loading ? "…" : stats.totalCesThisMonth} note="This month" noteColor="#0d9488" />
            <StatCard label="Professionals" value={loading ? "…" : stats.totalProfessionals} note="Across all reps" noteColor="#2455ff" />
            <StatCard label="Active Reps" value={loading ? "…" : stats.activeReps} note="Sent a CE this month" noteColor="#0d9488" />
            <StatCard label="Redemption Rate" value={loading ? "…" : stats.redemptionRate} note="All CE sends" noteColor="#2455ff" />
          </StatsGrid>
        </div>

        {/* ── Rep Performance ── */}
        <SectionCard>
          {/* Section header with invite button */}
          <div style={{ display: "flex", flexWrap: "wrap", alignItems: "flex-start", justifyContent: "space-between", gap: "16px", borderBottom: "1px solid rgba(11,18,34,0.08)", paddingBottom: "16px", marginBottom: "20px" }}>
            <div>
              <h2 style={{ fontFamily: "'Fraunces', Georgia, serif", fontSize: "16px", fontWeight: 800, color: "#0b1222", margin: 0 }}>
                Rep Performance
              </h2>
              <p style={{ marginTop: "3px", fontSize: "12px", color: "#7a8ba8" }}>
                CEs sent, network size, last activity, and redemption rate
              </p>
            </div>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "8px", flexShrink: 0 }}>
              <button
                type="button"
                onClick={handleGenerateInvite}
                disabled={inviteLoading}
                style={{
                  borderRadius: "10px",
                  background: "#2455ff",
                  padding: "10px 20px",
                  fontSize: "13px",
                  fontWeight: 700,
                  color: "white",
                  border: "none",
                  cursor: inviteLoading ? "not-allowed" : "pointer",
                  opacity: inviteLoading ? 0.6 : 1,
                  boxShadow: "0 2px 10px rgba(36,85,255,0.18)",
                  fontFamily: "'DM Sans', system-ui, sans-serif",
                  transition: "background 0.2s, transform 0.15s",
                }}
              >
                {inviteLoading ? "Generating…" : "+ Invite Rep"}
              </button>
              {inviteUrl && (
                <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                  <input
                    readOnly
                    value={inviteUrl}
                    style={{
                      fontSize: "11px",
                      padding: "8px 12px",
                      borderRadius: "8px",
                      border: "1px solid rgba(11,18,34,0.08)",
                      width: "240px",
                      background: "#f6f5f0",
                      color: "#3b4963",
                      fontFamily: "'DM Sans', system-ui, sans-serif",
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(inviteUrl);
                      setInviteCopied(true);
                      setTimeout(() => setInviteCopied(false), 2000);
                    }}
                    style={{
                      fontSize: "12px",
                      padding: "8px 14px",
                      borderRadius: "8px",
                      border: "1px solid rgba(11,18,34,0.08)",
                      background: "white",
                      cursor: "pointer",
                      fontWeight: 600,
                      whiteSpace: "nowrap",
                      color: inviteCopied ? "#0d9488" : "#3b4963",
                      fontFamily: "'DM Sans', system-ui, sans-serif",
                      transition: "color 0.15s",
                    }}
                  >
                    {inviteCopied ? "✓ Copied" : "Copy"}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Table content */}
          {loading ? (
            <p style={{ fontSize: "14px", color: "#7a8ba8", padding: "16px 0" }}>Loading…</p>
          ) : reps.length === 0 ? (
            <div style={{ padding: "48px 0", textAlign: "center" }}>
              <p style={{ fontSize: "14px", color: "#7a8ba8" }}>No rep data yet.</p>
              <p style={{ marginTop: "4px", fontSize: "13px", color: "#3b4963" }}>When your team uses Pulse, metrics will appear here.</p>
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                <thead>
                  <tr style={{ borderBottom: "2px solid rgba(11,18,34,0.08)" }}>
                    {["Rep", "CEs this month", "Network size", "Last activity", "Redemption rate"].map((h) => (
                      <th
                        key={h}
                        style={{
                          textAlign: "left",
                          padding: "10px 16px 10px 0",
                          fontSize: "11px",
                          fontWeight: 700,
                          color: "#7a8ba8",
                          textTransform: "uppercase",
                          letterSpacing: "0.04em",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {reps.map((r, i) => (
                    <tr
                      key={r.id}
                      style={{
                        borderBottom: i < reps.length - 1 ? "1px solid rgba(11,18,34,0.06)" : "none",
                        background: i % 2 === 1 ? "#fafaf7" : "transparent",
                        transition: "background 0.15s",
                      }}
                    >
                      <td style={{ padding: "14px 16px 14px 0", fontWeight: 600, color: "#0b1222" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                          {/* Avatar */}
                          <div
                            style={{
                              width: "32px",
                              height: "32px",
                              borderRadius: "50%",
                              background: "rgba(36,85,255,0.10)",
                              color: "#2455ff",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontWeight: 700,
                              fontSize: "12px",
                              flexShrink: 0,
                            }}
                          >
                            {r.name.split(/\s+/).map(w => w[0]).slice(0, 2).join("").toUpperCase()}
                          </div>
                          <span>{r.name}</span>
                        </div>
                      </td>
                      <td style={{ padding: "14px 16px 14px 0", color: "#0b1222", fontWeight: 600 }}>
                        {r.cesThisMonth}
                      </td>
                      <td style={{ padding: "14px 16px 14px 0", color: "#7a8ba8" }}>
                        {r.professionalsInNetwork}
                      </td>
                      <td style={{ padding: "14px 16px 14px 0", color: "#7a8ba8" }}>
                        {r.lastActivity}
                      </td>
                      <td style={{ padding: "14px 0", fontWeight: 600, color: "#0d9488" }}>
                        {r.redemptionRate}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </SectionCard>
      </div>
    </PageShell>
  );
}