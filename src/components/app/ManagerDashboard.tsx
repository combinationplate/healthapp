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

  // Billing state
  const [showBilling, setShowBilling] = useState(false);
  const [billingSettings, setBillingSettings] = useState<any>(null);
  const [billingLoading, setBillingLoading] = useState(false);
  const [usage, setUsage] = useState<any>(null);
  const [usageLoading, setUsageLoading] = useState(false);
  const [pastInvoices, setPastInvoices] = useState<any[]>([]);
  const [invoicesLoading, setInvoicesLoading] = useState(false);
  const [setupForm, setSetupForm] = useState<{ billingType: "org" | "rep"; billingEmail: string; orgName: string }>({
    billingType: "org",
    billingEmail: "",
    orgName: "",
  });
  const [setupSaving, setSetupSaving] = useState(false);

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

  // Fetch billing data when billing view is shown
  useEffect(() => {
    if (!showBilling) return;

    setBillingLoading(true);
    fetch("/api/billing/setup", { credentials: "include" })
      .then(r => r.json())
      .then(data => {
        setBillingSettings(data.settings);
        if (data.settings?.billing_email) {
          setSetupForm(f => ({ ...f, billingEmail: data.settings.billing_email }));
        }
        if (data.orgName) {
          setSetupForm(f => ({ ...f, orgName: data.orgName }));
        }
        setBillingLoading(false);
      });

    setUsageLoading(true);
    fetch("/api/billing/current-usage", { credentials: "include" })
      .then(r => r.json())
      .then(data => { setUsage(data); setUsageLoading(false); });

    setInvoicesLoading(true);
    fetch("/api/billing/invoices", { credentials: "include" })
      .then(r => r.json())
      .then(data => { setPastInvoices(data.invoices ?? []); setInvoicesLoading(false); });
  }, [showBilling]);

  async function handleGenerateInvite() {
    setInviteLoading(true);
    const res = await fetch("/api/manager/invite", { method: "POST", credentials: "include" });
    const data = await res.json();
    setInviteLoading(false);
    if (data.url) setInviteUrl(data.url);
  }

  async function handleBillingSetup(e: React.FormEvent) {
    e.preventDefault();
    setSetupSaving(true);
    const res = await fetch("/api/billing/setup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(setupForm),
    });
    const data = await res.json();
    setSetupSaving(false);
    if (res.ok) {
      setBillingSettings(data);
      // Refresh billing data
      setShowBilling(false);
      setTimeout(() => setShowBilling(true), 100);
    }
  }

  return (
    <PageShell>
      <div style={{ display: "flex", flexDirection: "column", gap: "24px", paddingBottom: "80px", paddingTop: "24px" }}>

        {/* ── Page header ── */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "12px" }}>
          <div>
            <h1 style={{ fontFamily: "'Fraunces', Georgia, serif", fontSize: "26px", fontWeight: 800, color: "#0b1222", letterSpacing: "-0.01em", margin: 0 }}>
              Team Dashboard
            </h1>
            <p style={{ marginTop: "4px", fontSize: "13px", color: "#7a8ba8" }}>
              Overview of your team&apos;s performance
            </p>
          </div>

          {/* View toggle */}
          <div style={{ display: "flex", gap: "8px" }}>
            <button
              type="button"
              onClick={() => setShowBilling(false)}
              style={{
                padding: "8px 20px", borderRadius: "10px", fontSize: "13px", fontWeight: 600,
                border: !showBilling ? "1.5px solid #2455ff" : "1px solid rgba(11,18,34,0.08)",
                background: !showBilling ? "rgba(36,85,255,0.06)" : "white",
                color: !showBilling ? "#2455ff" : "#3b4963",
                cursor: "pointer", fontFamily: "'DM Sans', system-ui, sans-serif",
              }}
            >Team Performance</button>
            <button
              type="button"
              onClick={() => setShowBilling(true)}
              style={{
                padding: "8px 20px", borderRadius: "10px", fontSize: "13px", fontWeight: 600,
                border: showBilling ? "1.5px solid #2455ff" : "1px solid rgba(11,18,34,0.08)",
                background: showBilling ? "rgba(36,85,255,0.06)" : "white",
                color: showBilling ? "#2455ff" : "#3b4963",
                cursor: "pointer", fontFamily: "'DM Sans', system-ui, sans-serif",
              }}
            >Billing</button>
          </div>
        </div>

        {/* ── Team Performance View ── */}
        {!showBilling && (
          <>
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
          </>
        )}

        {/* ── BILLING VIEW ── */}
        {showBilling && (
          <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>

            {/* Current Period Summary */}
            <div style={{
              borderRadius: "16px", border: "1px solid rgba(11,18,34,0.08)",
              background: "white", padding: "28px", boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "20px" }}>
                <div>
                  <h3 style={{ fontFamily: "'Fraunces', Georgia, serif", fontSize: "18px", fontWeight: 800, color: "#0b1222", margin: 0 }}>
                    {usage
                      ? new Date(usage.periodStart).toLocaleDateString("en-US", { month: "long", year: "numeric" })
                      : "Current Period"}
                  </h3>
                  <p style={{ fontSize: "12px", color: "#7a8ba8", marginTop: "4px" }}>
                    {usage ? `${usage.periodStart} — ${usage.periodEnd}` : "Loading…"}
                  </p>
                </div>
                <span style={{
                  background: "rgba(36,85,255,0.08)", color: "#2455ff",
                  padding: "6px 14px", borderRadius: "8px",
                  fontSize: "12px", fontWeight: 700,
                }}>🚀 Early Access</span>
              </div>

              {usageLoading ? (
                <p style={{ color: "#7a8ba8", fontSize: "14px" }}>Loading usage…</p>
              ) : usage ? (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
                  <div style={{ background: "#f6f5f0", borderRadius: "12px", padding: "20px", textAlign: "center" }}>
                    <div style={{ fontFamily: "'Fraunces', Georgia, serif", fontSize: "36px", fontWeight: 900, color: "#0b1222" }}>
                      {usage.ceCount}
                    </div>
                    <div style={{ fontSize: "13px", color: "#7a8ba8", marginTop: "4px" }}>CEs redeemed</div>
                  </div>
                  <div style={{ background: "#f6f5f0", borderRadius: "12px", padding: "20px", textAlign: "center" }}>
                    <div style={{ fontFamily: "'Fraunces', Georgia, serif", fontSize: "36px", fontWeight: 900, color: "#0b1222" }}>
                      ${(usage.totalCents / 100).toFixed(2)}
                    </div>
                    <div style={{ fontSize: "13px", color: "#7a8ba8", marginTop: "4px" }}>Estimated cost</div>
                  </div>
                </div>
              ) : null}

              <div style={{
                marginTop: "16px", padding: "12px 16px", borderRadius: "10px",
                background: "rgba(36,85,255,0.04)", border: "1px solid rgba(36,85,255,0.08)",
                fontSize: "13px", color: "#3b4963",
              }}>
                🚀 <strong>Early access:</strong> No charges during launch period. Usage is tracked so you can see the value Pulse provides.
              </div>
            </div>

            {/* Usage Breakdown */}
            {usage && usage.lineItems.length > 0 && (
              <div style={{
                borderRadius: "16px", border: "1px solid rgba(11,18,34,0.08)",
                background: "white", padding: "24px", boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
              }}>
                <h3 style={{ fontFamily: "'Fraunces', Georgia, serif", fontSize: "16px", fontWeight: 800, color: "#0b1222", margin: "0 0 16px" }}>
                  Usage Breakdown
                </h3>
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                    <thead>
                      <tr style={{ borderBottom: "2px solid rgba(11,18,34,0.08)" }}>
                        {["Date", "Rep", "Professional", "Course", "Hours", "Cost"].map(h => (
                          <th key={h} style={{
                            textAlign: "left", padding: "8px 12px", fontSize: "11px",
                            fontWeight: 700, color: "#7a8ba8", textTransform: "uppercase",
                            letterSpacing: "0.04em", whiteSpace: "nowrap",
                          }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {usage.lineItems.map((li: any) => (
                        <tr key={li.id} style={{ borderBottom: "1px solid rgba(11,18,34,0.04)" }}>
                          <td style={{ padding: "10px 12px", color: "#7a8ba8", whiteSpace: "nowrap" }}>
                            {new Date(li.redeemedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                          </td>
                          <td style={{ padding: "10px 12px", fontWeight: 600, color: "#0b1222" }}>{li.repName}</td>
                          <td style={{ padding: "10px 12px", color: "#3b4963" }}>{li.professionalName}</td>
                          <td style={{ padding: "10px 12px", color: "#3b4963", maxWidth: "200px" }}>
                            <div style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{li.courseName}</div>
                          </td>
                          <td style={{ padding: "10px 12px", color: "#7a8ba8", textAlign: "center" }}>{li.courseHours}</td>
                          <td style={{ padding: "10px 12px", fontWeight: 600, color: "#0b1222" }}>${(li.priceCents / 100).toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Past Invoices */}
            <div style={{
              borderRadius: "16px", border: "1px solid rgba(11,18,34,0.08)",
              background: "white", padding: "24px", boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
            }}>
              <h3 style={{ fontFamily: "'Fraunces', Georgia, serif", fontSize: "16px", fontWeight: 800, color: "#0b1222", margin: "0 0 16px" }}>
                Past Invoices
              </h3>
              {invoicesLoading ? (
                <p style={{ color: "#7a8ba8", fontSize: "14px" }}>Loading…</p>
              ) : pastInvoices.length === 0 ? (
                <p style={{ color: "#7a8ba8", fontSize: "14px", textAlign: "center", padding: "24px 0" }}>
                  No invoices yet. Usage is tracked during early access — invoices will appear here once billing is active.
                </p>
              ) : (
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                    <thead>
                      <tr style={{ borderBottom: "2px solid rgba(11,18,34,0.08)" }}>
                        {["Period", "CEs", "Amount", "Status", ""].map(h => (
                          <th key={h} style={{
                            textAlign: "left", padding: "8px 12px", fontSize: "11px",
                            fontWeight: 700, color: "#7a8ba8", textTransform: "uppercase",
                            letterSpacing: "0.04em",
                          }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {pastInvoices.map((inv: any) => (
                        <tr key={inv.id} style={{ borderBottom: "1px solid rgba(11,18,34,0.04)" }}>
                          <td style={{ padding: "10px 12px", fontWeight: 600, color: "#0b1222" }}>
                            {new Date(inv.period_start).toLocaleDateString("en-US", { month: "long", year: "numeric" })}
                          </td>
                          <td style={{ padding: "10px 12px", color: "#3b4963" }}>{inv.ce_count}</td>
                          <td style={{ padding: "10px 12px", fontWeight: 600, color: "#0b1222" }}>
                            ${(inv.total_cents / 100).toFixed(2)}
                          </td>
                          <td style={{ padding: "10px 12px" }}>
                            <span style={{
                              display: "inline-flex", alignItems: "center", padding: "3px 10px",
                              borderRadius: "999px", fontSize: "11px", fontWeight: 700,
                              background: inv.status === "paid"
                                ? "rgba(13,148,136,0.10)"
                                : inv.status === "overdue"
                                  ? "rgba(232,96,76,0.10)"
                                  : "#f6f5f0",
                              color: inv.status === "paid"
                                ? "#0d9488"
                                : inv.status === "overdue"
                                  ? "#e8604c"
                                  : "#7a8ba8",
                            }}>
                              {inv.status === "paid"
                                ? "✓ Paid"
                                : inv.status === "overdue"
                                  ? "Overdue"
                                  : inv.status.charAt(0).toUpperCase() + inv.status.slice(1)}
                            </span>
                          </td>
                          <td style={{ padding: "10px 12px" }}>
                            {inv.stripe_hosted_url && (
                              <a
                                href={inv.stripe_hosted_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{ fontSize: "12px", color: "#2455ff", fontWeight: 600, textDecoration: "none" }}
                              >
                                View Invoice →
                              </a>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Billing Settings */}
            <div style={{
              borderRadius: "16px", border: "1px solid rgba(11,18,34,0.08)",
              background: "white", padding: "24px", boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
            }}>
              <h3 style={{ fontFamily: "'Fraunces', Georgia, serif", fontSize: "16px", fontWeight: 800, color: "#0b1222", margin: "0 0 16px" }}>
                Billing Settings
              </h3>
              {billingLoading ? (
                <p style={{ color: "#7a8ba8", fontSize: "14px" }}>Loading…</p>
              ) : (
                <form onSubmit={handleBillingSetup} style={{ display: "grid", gap: "16px", maxWidth: "480px" }}>
                  {/* Billing type */}
                  <div>
                    <label style={{ display: "block", fontSize: "11px", fontWeight: 600, color: "#7a8ba8", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                      Bill to
                    </label>
                    <div style={{ display: "flex", gap: "8px" }}>
                      {(["org", "rep"] as const).map(t => (
                        <button
                          key={t}
                          type="button"
                          onClick={() => setSetupForm(f => ({ ...f, billingType: t }))}
                          style={{
                            flex: 1, padding: "10px", borderRadius: "10px", fontSize: "13px", fontWeight: 600,
                            border: setupForm.billingType === t ? "1.5px solid #2455ff" : "1px solid rgba(11,18,34,0.08)",
                            background: setupForm.billingType === t ? "rgba(36,85,255,0.04)" : "white",
                            color: setupForm.billingType === t ? "#2455ff" : "#3b4963",
                            cursor: "pointer", fontFamily: "'DM Sans', system-ui, sans-serif",
                          }}
                        >
                          {t === "org" ? "My Company" : "Me Individually"}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Company name (if org billing) */}
                  {setupForm.billingType === "org" && (
                    <div>
                      <label style={{ display: "block", fontSize: "11px", fontWeight: 600, color: "#7a8ba8", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                        Company Name
                      </label>
                      <input
                        type="text"
                        required
                        value={setupForm.orgName}
                        onChange={e => setSetupForm(f => ({ ...f, orgName: e.target.value }))}
                        placeholder="Harmony Hospice"
                        style={{
                          width: "100%", padding: "10px 14px", borderRadius: "10px",
                          border: "1px solid rgba(11,18,34,0.08)", fontSize: "14px",
                          fontFamily: "'DM Sans', system-ui, sans-serif", boxSizing: "border-box",
                        }}
                      />
                    </div>
                  )}

                  {/* Billing email */}
                  <div>
                    <label style={{ display: "block", fontSize: "11px", fontWeight: 600, color: "#7a8ba8", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                      Billing Email
                    </label>
                    <input
                      type="email"
                      required
                      value={setupForm.billingEmail}
                      onChange={e => setSetupForm(f => ({ ...f, billingEmail: e.target.value }))}
                      placeholder="accounting@company.com"
                      style={{
                        width: "100%", padding: "10px 14px", borderRadius: "10px",
                        border: "1px solid rgba(11,18,34,0.08)", fontSize: "14px",
                        fontFamily: "'DM Sans', system-ui, sans-serif", boxSizing: "border-box",
                      }}
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={setupSaving}
                    style={{
                      padding: "12px", borderRadius: "10px", border: "none",
                      background: "#2455ff", color: "white", fontSize: "14px", fontWeight: 700,
                      cursor: setupSaving ? "not-allowed" : "pointer",
                      opacity: setupSaving ? 0.6 : 1,
                      boxShadow: "0 2px 10px rgba(36,85,255,0.18)",
                      fontFamily: "'DM Sans', system-ui, sans-serif",
                    }}
                  >
                    {setupSaving ? "Saving…" : billingSettings ? "Update Billing" : "Set Up Billing"}
                  </button>

                  {billingSettings && (
                    <div style={{ fontSize: "12px", color: "#7a8ba8", marginTop: "4px" }}>
                      Current: {billingSettings.billing_type === "org" ? "Company billing" : "Individual billing"} · {billingSettings.billing_email}
                    </div>
                  )}
                </form>
              )}
            </div>

          </div>
        )}

      </div>
    </PageShell>
  );
}
