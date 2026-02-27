"use client";

import { StatCard, StatsGrid, PageShell, SectionCard } from "./DashboardShell";

type Props = { userName: string };

export function ManagerDashboard({ userName }: Props) {
  const reps: { name: string; cesThisMonth: number; professionalsInNetwork: number; lastActivity: string; redemptionRate: string }[] = [];

  return (
    <PageShell>
      <div className="space-y-6 pb-20 pt-6">
        <div>
          <h1 className="font-[family-name:var(--font-fraunces)] text-2xl font-extrabold text-[var(--ink)]">Team Dashboard</h1>
          <p className="mt-1 text-[13px] text-[var(--ink-muted)]">Overview of your team</p>
        </div>

        <StatsGrid>
          <StatCard label="Touchpoints" value="—" note="This week" noteClass="text-[var(--blue)]" />
          <StatCard label="CEs Distributed" value="—" note="This month" noteClass="text-[var(--green)]" />
          <StatCard label="Credits Used" value="—" note="Available" noteClass="text-[var(--blue)]" />
          <StatCard label="Professionals" value="—" note="In network" noteClass="text-[var(--green)]" />
        </StatsGrid>

        <SectionCard>
        <div className="border-b border-[var(--border)] pb-3 mb-4">
          <h2 className="font-[family-name:var(--font-fraunces)] text-base font-bold text-[var(--ink)]">Rep performance</h2>
          <p className="mt-1 text-[11px] text-[var(--ink-muted)]">CEs sent, network size, last activity, and redemption rate per rep</p>
        </div>
        {reps.length === 0 ? (
          <div className="py-8 text-center">
            <p className="text-sm text-[var(--ink-muted)]">No rep data yet.</p>
            <p className="mt-1 text-[13px] text-[var(--ink-soft)]">When your team uses Pulse, metrics will appear here.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-[var(--border)]">
                  <th className="pb-3 pr-4 font-semibold text-[var(--ink-muted)]">Rep</th>
                  <th className="pb-3 pr-4 font-semibold text-[var(--ink-muted)]">CEs this month</th>
                  <th className="pb-3 pr-4 font-semibold text-[var(--ink-muted)]">Professionals in network</th>
                  <th className="pb-3 pr-4 font-semibold text-[var(--ink-muted)]">Last activity</th>
                  <th className="pb-3 font-semibold text-[var(--ink-muted)]">Redemption rate</th>
                </tr>
              </thead>
              <tbody>
                {reps.map((r, i) => (
                  <tr key={i} className="border-b border-[var(--border)] last:border-0">
                    <td className="py-3 pr-4 font-medium text-[var(--ink)]">{r.name}</td>
                    <td className="py-3 pr-4 text-[var(--ink-muted)]">{r.cesThisMonth}</td>
                    <td className="py-3 pr-4 text-[var(--ink-muted)]">{r.professionalsInNetwork}</td>
                    <td className="py-3 pr-4 text-[var(--ink-muted)]">{r.lastActivity}</td>
                    <td className="py-3 text-[var(--green)]">{r.redemptionRate}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        </SectionCard>

        <SectionCard>
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--border)] pb-3 mb-4">
          <h2 className="font-[family-name:var(--font-fraunces)] text-base font-bold text-[var(--ink)]">Credit usage</h2>
          <button type="button" className="rounded-lg bg-[var(--blue)] px-4 py-2 text-sm font-semibold text-white hover:bg-[var(--blue-dark)]" onClick={() => alert("Purchase credits")}>Purchase credits</button>
        </div>
        <div className="py-8 text-center">
          <p className="text-sm text-[var(--ink-muted)]">Credit usage will appear here when your team sends CEs.</p>
        </div>
        </SectionCard>
      </div>
    </PageShell>
  );
}
