"use client";

import React, { useState, useEffect, useCallback } from "react";
import { createClient } from "../../../lib/supabase/client";
import { StatCard, StatsGrid, PageShell, SectionCard } from "./DashboardShell";

type RepRow = {
  id: string;
  full_name: string | null;
};

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

  const fetchData = useCallback(async () => {
    if (!managerId) return;
    setLoading(true);
    const supabase = createClient();

    // Get manager's org_id
    const { data: managerProfile, error: profileError } = await supabase
      .from("profiles")
      .select("org_id")
      .eq("id", managerId)
      .single();

      console.log("managerId:", managerId);
      console.log("managerProfile:", managerProfile, "error:", profileError);

    if (!managerProfile?.org_id) {
      setLoading(false);
      return;
    }

    const orgId = managerProfile.org_id;

    // Get all reps in the same org
    const { data: repProfiles } = await supabase
      .from("profiles")
      .select("id, full_name")
      .eq("org_id", orgId)
      .eq("role", "rep");

      if (!repProfiles || repProfiles.length === 0) {
        console.log("No reps found for org_id:", orgId);
        setLoading(false);
        return;
      }

    const repIds = repProfiles.map((r: RepRow) => r.id);
    const now = new Date();
    const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

    // Fetch ce_sends, professionals, touchpoints for all reps in parallel
    const [cesResult, profResult, touchResult] = await Promise.all([
      supabase
        .from("ce_sends")
        .select("id, rep_id, created_at, redeemed_at")
        .in("rep_id", repIds),
      supabase
        .from("professionals")
        .select("id, rep_id")
        .in("rep_id", repIds),
      supabase
        .from("touchpoints")
        .select("id, rep_id, created_at")
        .in("rep_id", repIds)
        .order("created_at", { ascending: false }),
    ]);

    const allCeSends = cesResult.data ?? [];
    const allProfessionals = profResult.data ?? [];
    const allTouchpoints = touchResult.data ?? [];

    // Compute top-level stats
    const cesThisMonth = allCeSends.filter(
      (c) => c.created_at >= firstOfMonth
    );
    const redeemed = allCeSends.filter((c) => c.redeemed_at);
    const redemptionRate = allCeSends.length > 0
      ? `${Math.round((redeemed.length / allCeSends.length) * 100)}%`
      : "—";
    const activeRepIds = new Set(
      cesThisMonth.map((c) => c.rep_id)
    );

    setStats({
      totalCesThisMonth: cesThisMonth.length,
      totalProfessionals: allProfessionals.length,
      activeReps: activeRepIds.size,
      redemptionRate,
    });

    // Build per-rep stats
    const repStats: RepStats[] = repProfiles.map((rep: RepRow) => {
      const repCesThisMonth = cesThisMonth.filter(
        (c) => c.rep_id === rep.id
      ).length;
      const repProfessionals = allProfessionals.filter(
        (p) => p.rep_id === rep.id
      ).length;
      const repCesAll = allCeSends.filter((c) => c.rep_id === rep.id);
      const repRedeemed = repCesAll.filter((c) => c.redeemed_at).length;
      const repRedemptionRate = repCesAll.length > 0
        ? `${Math.round((repRedeemed / repCesAll.length) * 100)}%`
        : "—";
      const lastTouch = allTouchpoints.find((t) => t.rep_id === rep.id);
      const lastActivity = lastTouch
        ? new Date(lastTouch.created_at).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          })
        : "No activity";

      return {
        id: rep.id,
        name: rep.full_name ?? "Unknown",
        cesThisMonth: repCesThisMonth,
        professionalsInNetwork: repProfessionals,
        lastActivity,
        redemptionRate: repRedemptionRate,
      };
    });

    // Sort by CEs this month descending
    repStats.sort((a, b) => b.cesThisMonth - a.cesThisMonth);
    setReps(repStats);
    setLoading(false);
  }, [managerId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return (
    <PageShell>
      <div className="space-y-6 pb-20 pt-6">
        <div>
          <h1 className="font-[family-name:var(--font-fraunces)] text-2xl font-extrabold text-[var(--ink)]">Team Dashboard</h1>
          <p className="mt-1 text-[13px] text-[var(--ink-muted)]">Overview of your team</p>
        </div>

        <div className="rounded-xl bg-white border border-[var(--border)] p-4 shadow-[0_1px_3px_rgba(0,0,0,0.08)]">
          <StatsGrid>
            <StatCard label="CEs Distributed" value={loading ? "…" : stats.totalCesThisMonth} note="This month" noteClass="text-[var(--green)]" />
            <StatCard label="Professionals in Network" value={loading ? "…" : stats.totalProfessionals} note="Across all reps" noteClass="text-[var(--blue)]" />
            <StatCard label="Active Reps" value={loading ? "…" : stats.activeReps} note="Sent a CE this month" noteClass="text-[var(--green)]" />
            <StatCard label="Redemption Rate" value={loading ? "…" : stats.redemptionRate} note="All CE sends" noteClass="text-[var(--blue)]" />
          </StatsGrid>
        </div>

        <SectionCard>
          <div className="border-b border-[var(--border)] pb-3 mb-4">
            <h2 className="font-[family-name:var(--font-fraunces)] text-base font-bold text-[var(--ink)]">Rep Performance</h2>
            <p className="mt-1 text-[11px] text-[var(--ink-muted)]">CEs sent, network size, last activity, and redemption rate per rep</p>
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
                    <tr key={r.id} className="border-b border-[var(--border)] last:border-0 even:bg-[#F8FAFC]">
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