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
      <div className="space-y-6 pb-20 pt-6">
        <div>
          <h1 style={{ fontFamily: "'Fraunces', Georgia, serif", fontSize: '26px', fontWeight: 800, color: '#0b1222', letterSpacing: '-0.01em', margin: 0 }}>Team Dashboard</h1>
          <p style={{ marginTop: '4px', fontSize: '13px', color: '#7a8ba8' }}>Overview of your team</p>
        </div>

        <div style={{ borderRadius: '16px', background: '#ffffff', border: '1px solid rgba(11,18,34,0.08)', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
          <StatsGrid>
            <StatCard label="CEs Distributed" value={loading ? "…" : stats.totalCesThisMonth} note="This month" noteClass="text-[var(--green)]" />
            <StatCard label="Professionals in Network" value={loading ? "…" : stats.totalProfessionals} note="Across all reps" noteClass="text-[var(--blue)]" />
            <StatCard label="Active Reps" value={loading ? "…" : stats.activeReps} note="Sent a CE this month" noteClass="text-[var(--green)]" />
            <StatCard label="Redemption Rate" value={loading ? "…" : stats.redemptionRate} note="All CE sends" noteClass="text-[var(--blue)]" />
          </StatsGrid>
        </div>

        <SectionCard>
          <div className="border-b border-[var(--border)] pb-3 mb-4 flex justify-between items-start">
            <div>
              <h2 style={{ fontFamily: "'Fraunces', Georgia, serif", fontSize: '16px', fontWeight: 800, color: '#0b1222', margin: 0 }}>Rep Performance</h2>
              <p className="mt-1 text-[11px] text-[var(--ink-muted)]">CEs sent, network size, last activity, and redemption rate per rep</p>
            </div>
            <div style={{display:'flex',flexDirection:'column',alignItems:'flex-end',gap:'8px'}}>
              <button
                type="button"
                onClick={handleGenerateInvite}
                disabled={inviteLoading}
                style={{ borderRadius: '10px', background: '#2455ff', padding: '10px 20px', fontSize: '13px', fontWeight: 700, color: 'white', border: 'none', cursor: 'pointer', opacity: inviteLoading ? 0.6 : 1, boxShadow: '0 2px 10px rgba(36,85,255,0.18)', fontFamily: "'DM Sans', system-ui, sans-serif" }}
              >
                {inviteLoading ? "Generating…" : "Invite Rep"}
              </button>
              {inviteUrl && (
                <div style={{display:'flex',gap:'6px',alignItems:'center'}}>
                  <input
                    readOnly
                    value={inviteUrl}
                    style={{fontSize:'11px',padding:'6px 10px',borderRadius:'6px',border:'1px solid var(--border)',width:'220px',background:'#f6f5f0'}}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(inviteUrl);
                      setInviteCopied(true);
                      setTimeout(() => setInviteCopied(false), 2000);
                    }}
                    style={{fontSize:'11px',padding:'6px 10px',borderRadius:'6px',border:'1px solid var(--border)',background:'white',cursor:'pointer',fontWeight:600,whiteSpace:'nowrap'}}
                  >
                    {inviteCopied ? "Copied!" : "Copy"}
                  </button>
                </div>
              )}
            </div>
          </div>
          {loading ? (
            <p className="text-sm text-[var(--ink-muted)] py-4">Loading…</p>
          ) : reps.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-sm text-[var(--ink-muted)]">No rep data yet.</p>
              <p className="mt-1 text-[13px] text-[var(--ink-soft)]">When your team uses Pulse, metrics will appear here.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-[var(--border)]">
                    <th className="pb-3 pr-4 font-semibold text-[var(--ink-muted)] text-[12px]">Rep</th>
                    <th className="pb-3 pr-4 font-semibold text-[var(--ink-muted)] text-[12px]">CEs this month</th>
                    <th className="pb-3 pr-4 font-semibold text-[var(--ink-muted)] text-[12px]">Network size</th>
                    <th className="pb-3 pr-4 font-semibold text-[var(--ink-muted)] text-[12px]">Last activity</th>
                    <th className="pb-3 font-semibold text-[var(--ink-muted)] text-[12px]">Redemption rate</th>
                  </tr>
                </thead>
                <tbody>
                  {reps.map((r) => (
                    <tr key={r.id} className="border-b border-[var(--border)] last:border-0 even:bg-[#f6f5f0]">
                      <td className="py-3 pr-4 font-medium text-[var(--ink)] text-[13px]">{r.name}</td>
                      <td className="py-3 pr-4 text-[var(--ink-muted)] text-[13px]">{r.cesThisMonth}</td>
                      <td className="py-3 pr-4 text-[var(--ink-muted)] text-[13px]">{r.professionalsInNetwork}</td>
                      <td className="py-3 pr-4 text-[var(--ink-muted)] text-[13px]">{r.lastActivity}</td>
                      <td className="py-3 text-[var(--green)] font-semibold text-[13px]">{r.redemptionRate}</td>
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