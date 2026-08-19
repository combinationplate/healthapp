"use client";

import React, { useState, useEffect, useCallback } from "react";
import { StatCard, StatsGrid, PageShell, SectionCard } from "./DashboardShell";
import { AccreditationInline } from "@/src/components/AccreditationStrip";

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
  const [inviteError, setInviteError] = useState<string | null>(null);

  // Onboarding checklist state
  const [hasBilling, setHasBilling] = useState<boolean | null>(null);
  const [checklistDismissed, setChecklistDismissed] = useState(false);

  // Billing state
  const [showBilling, setShowBilling] = useState(false);
  const [billingSettings, setBillingSettings] = useState<any>(null);
  const [billingLoading, setBillingLoading] = useState(false);
  const [usage, setUsage] = useState<any>(null);
  const [usageLoading, setUsageLoading] = useState(false);
  const [pastInvoices, setPastInvoices] = useState<any[]>([]);
  const [invoicesLoading, setInvoicesLoading] = useState(false);
  const [setupForm, setSetupForm] = useState<{ billingType: "org" | "reps_pay"; billingEmail: string; orgName: string }>({
    billingType: "org",
    billingEmail: "",
    orgName: "",
  });
  const [setupSaving, setSetupSaving] = useState(false);
  // "org" = company pays · "reps_pay" = reps pay individually · null = not set up
  const [payerMode, setPayerMode] = useState<string | null>(null);

  // "What your reps send" email preview (shown while the team is empty)
  const [emailPreview, setEmailPreview] = useState<{ subject: string; from: string; html: string } | null>(null);
  const [emailPreviewFailed, setEmailPreviewFailed] = useState(false);

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

  // Light billing check — powers the onboarding checklist. Re-runs when the
  // billing view toggles so saving billing settings marks the step done.
  useEffect(() => {
    fetch("/api/billing/setup", { credentials: "include" })
      .then(r => r.json())
      .then(data => {
        setHasBilling(!!data.settings || !!data.hasOrg);
        setPayerMode(data.payerMode ?? null);
        if (data.payerMode === "reps_pay") {
          setSetupForm(f => ({ ...f, billingType: "reps_pay" }));
        }
      })
      .catch(() => setHasBilling(false));
  }, [showBilling]);

  // Load the sample CE email once, only while the team is empty
  useEffect(() => {
    if (loading || reps.length > 0 || emailPreview || emailPreviewFailed) return;
    fetch("/api/ce/preview", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ sample: true }),
    })
      .then(r => (r.ok ? r.json() : Promise.reject()))
      .then(data => {
        if (data?.html) setEmailPreview(data);
        else setEmailPreviewFailed(true);
      })
      .catch(() => setEmailPreviewFailed(true));
  }, [loading, reps.length, emailPreview, emailPreviewFailed]);

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
    setInviteError(null);
    const res = await fetch("/api/manager/invite", { method: "POST", credentials: "include" });
    const data = await res.json();
    setInviteLoading(false);
    if (data.url) {
      setInviteUrl(data.url);
    } else {
      // The invite route needs an org — company setup (Billing tab) creates it.
      setInviteError(
        res.status === 400
          ? "Set up your company first (Billing tab) — then you can invite reps."
          : data.error || "Couldn't generate an invite link. Please try again."
      );
    }
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
      // Refresh billing data (refetches settings + payer mode)
      setShowBilling(false);
      setTimeout(() => setShowBilling(true), 100);
    } else {
      alert(data.error || "Failed to save billing settings");
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

            {/* ── Onboarding checklist — shown for new managers ── */}
            {(() => {
              if (hasBilling === null || loading) return null;
              const checklistSteps = [
                { id: "billing", label: "Set up your company & choose who pays — this unlocks rep invites", done: hasBilling, action: () => setShowBilling(true) },
                { id: "invite", label: "Generate your invite link and send it to your reps", done: reps.length > 0 || inviteUrl !== null, action: handleGenerateInvite },
                { id: "joined", label: "Your first rep joins — their activity shows up below automatically", done: reps.length > 0, action: fetchData },
              ];
              const checklistComplete = checklistSteps.filter(s => s.done).length;
              if (checklistDismissed || checklistComplete >= 3) return null;
              return (
                <div style={{
                  borderRadius: "16px",
                  border: "1px solid rgba(13,148,136,0.15)",
                  background: "linear-gradient(135deg, rgba(13,148,136,0.03), rgba(36,85,255,0.03))",
                  padding: "24px",
                  position: "relative",
                }}>
                  <button
                    type="button"
                    onClick={() => setChecklistDismissed(true)}
                    style={{
                      position: "absolute", top: "12px", right: "12px",
                      background: "none", border: "none", cursor: "pointer",
                      fontSize: "18px", color: "#7a8ba8", lineHeight: 1,
                    }}
                    aria-label="Dismiss"
                  >×</button>

                  <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "6px" }}>
                    <span style={{ fontSize: "24px" }}>👋</span>
                    <h3 style={{
                      fontFamily: "'Fraunces', Georgia, serif",
                      fontSize: "18px", fontWeight: 800, color: "#0b1222", margin: 0,
                    }}>Welcome to Pulse!</h3>
                  </div>
                  <p style={{ fontSize: "13px", color: "#7a8ba8", marginBottom: "20px", marginLeft: "36px" }}>
                    Pulse works through your reps — get them in and this dashboard fills itself. Three steps:
                  </p>

                  <div style={{
                    height: "4px", borderRadius: "2px",
                    background: "rgba(11,18,34,0.06)",
                    marginBottom: "18px", marginLeft: "36px",
                    overflow: "hidden",
                  }}>
                    <div style={{
                      width: `${(checklistComplete / 3) * 100}%`,
                      height: "100%", borderRadius: "2px",
                      background: "linear-gradient(90deg, #2455ff, #0d9488)",
                      transition: "width 0.5s ease",
                    }} />
                  </div>

                  <div style={{ display: "grid", gap: "8px", marginLeft: "36px" }}>
                    {checklistSteps.map((step, i) => (
                      <div
                        key={step.id}
                        onClick={step.done ? undefined : step.action}
                        style={{
                          display: "flex", alignItems: "center", gap: "12px",
                          padding: "12px 14px", borderRadius: "10px",
                          background: step.done ? "rgba(13,148,136,0.04)" : "white",
                          border: `1px solid ${step.done ? "rgba(13,148,136,0.12)" : "rgba(11,18,34,0.08)"}`,
                          cursor: step.done ? "default" : "pointer",
                          transition: "all 0.15s",
                        }}
                      >
                        <div style={{
                          width: "28px", height: "28px", borderRadius: "50%", flexShrink: 0,
                          display: "flex", alignItems: "center", justifyContent: "center",
                          fontSize: "12px", fontWeight: 800,
                          background: step.done ? "#0d9488" : "#0b1222",
                          color: "white",
                        }}>
                          {step.done ? "✓" : i + 1}
                        </div>
                        <span style={{
                          fontSize: "14px", fontWeight: 600, flex: 1,
                          color: step.done ? "#7a8ba8" : "#0b1222",
                          textDecoration: step.done ? "line-through" : "none",
                        }}>
                          {step.label}
                        </span>
                        {!step.done && (
                          <span style={{ color: "#2455ff", fontSize: "16px", fontWeight: 700 }}>→</span>
                        )}
                      </div>
                    ))}
                  </div>

                  <p style={{ fontSize: "12px", color: "#7a8ba8", marginLeft: "36px", marginTop: "14px", marginBottom: 0 }}>
                    Each rep gets a guided first send of their own the moment they join — and their first CE is free.
                  </p>
                </div>
              );
            })()}

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
                  {inviteError && (
                    <p style={{ fontSize: "12px", color: "#e8604c", margin: 0, maxWidth: "260px", textAlign: "right" }}>
                      {inviteError}
                    </p>
                  )}
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
                /* Ghost sample row — shows what the table WILL look like instead of a dead empty state */
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                    <thead>
                      <tr style={{ borderBottom: "2px solid rgba(11,18,34,0.08)" }}>
                        {["Rep", "CEs this month", "Network size", "Last activity", "Redemption rate"].map((h) => (
                          <th
                            key={h}
                            style={{
                              textAlign: "left", padding: "10px 16px 10px 0",
                              fontSize: "11px", fontWeight: 700, color: "#7a8ba8",
                              textTransform: "uppercase", letterSpacing: "0.04em", whiteSpace: "nowrap",
                            }}
                          >{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      <tr style={{ opacity: 0.55 }}>
                        <td style={{ padding: "14px 16px 14px 0", fontWeight: 600, color: "#0b1222" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                            <div style={{
                              width: "32px", height: "32px", borderRadius: "50%",
                              background: "rgba(36,85,255,0.10)", color: "#2455ff",
                              display: "flex", alignItems: "center", justifyContent: "center",
                              fontWeight: 700, fontSize: "12px", flexShrink: 0,
                            }}>SR</div>
                            <span>Sample Rep</span>
                            <span style={{
                              fontSize: "10px", fontWeight: 700, padding: "2px 8px", borderRadius: "999px",
                              background: "rgba(217,119,6,0.10)", color: "#b45309",
                            }}>Sample</span>
                          </div>
                        </td>
                        <td style={{ padding: "14px 16px 14px 0", color: "#0b1222", fontWeight: 600 }}>12</td>
                        <td style={{ padding: "14px 16px 14px 0", color: "#7a8ba8" }}>24</td>
                        <td style={{ padding: "14px 16px 14px 0", color: "#7a8ba8" }}>3 days ago</td>
                        <td style={{ padding: "14px 0", fontWeight: 600, color: "#0d9488" }}>58%</td>
                      </tr>
                    </tbody>
                  </table>
                  <p style={{ fontSize: "12px", color: "#7a8ba8", marginTop: "12px", marginBottom: 0 }}>
                    Sample data — your reps&apos; real numbers appear here automatically as they join and start sending.
                  </p>
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

            {/* ── "What your reps send" — the exact CE email, shown while the team is empty ── */}
            {!loading && reps.length === 0 && emailPreview && (
              <SectionCard>
                <div style={{ borderBottom: "1px solid rgba(11,18,34,0.08)", paddingBottom: "16px", marginBottom: "16px" }}>
                  <h2 style={{ fontFamily: "'Fraunces', Georgia, serif", fontSize: "16px", fontWeight: 800, color: "#0b1222", margin: 0 }}>
                    What your reps will send
                  </h2>
                  <p style={{ marginTop: "3px", fontSize: "12px", color: "#7a8ba8" }}>
                    The exact email a nurse, social worker, or case manager receives — sent under your rep&apos;s name, with your company on it.
                  </p>
                </div>
                <div style={{ fontSize: "12px", color: "#3b4963", marginBottom: "10px", lineHeight: 1.7 }}>
                  <div><span style={{ fontWeight: 700, color: "#7a8ba8" }}>From:</span> {emailPreview.from}</div>
                  <div><span style={{ fontWeight: 700, color: "#7a8ba8" }}>Subject:</span> {emailPreview.subject}</div>
                </div>
                <iframe
                  title="CE email preview"
                  sandbox=""
                  srcDoc={emailPreview.html}
                  style={{
                    width: "100%", height: "420px", border: "1px solid rgba(11,18,34,0.08)",
                    borderRadius: "12px", background: "white",
                  }}
                />
                <p style={{ fontSize: "12px", color: "#7a8ba8", marginTop: "10px", marginBottom: 0 }}>
                  Free, accredited CE — sponsored by your rep. Replies go straight to the rep&apos;s inbox, so every send opens a conversation.
                </p>
              </SectionCard>
            )}

            {/* ── Accreditation trust strip ── */}
            <div style={{ padding: "4px 0 0" }}>
              <AccreditationInline />
            </div>
          </>
        )}

        {/* ── BILLING VIEW ── */}
        {showBilling && (
          <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>

            {/* Reps-pay-individually banner */}
            {payerMode === "reps_pay" && (
              <div style={{
                borderRadius: "12px",
                border: "1px solid rgba(13,148,136,0.2)",
                background: "rgba(13,148,136,0.05)",
                padding: "14px 18px",
                fontSize: "13px",
                color: "#3b4963",
                lineHeight: 1.6,
              }}>
                <strong style={{ color: "#0d9488" }}>Your reps pay individually.</strong>{" "}
                The usage below is shown for team visibility — invoices go to each rep's
                own billing, set up in their dashboard. You are never invoiced.
              </div>
            )}

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
                  No invoices yet. Your first invoice will appear here after the end of the month.
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
                  {/* Who pays? */}
                  <div>
                    <label style={{ display: "block", fontSize: "11px", fontWeight: 600, color: "#7a8ba8", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                      Who pays?
                    </label>
                    <div style={{ display: "flex", gap: "8px" }}>
                      {(["org", "reps_pay"] as const).map(t => (
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
                          {t === "org" ? "My Company" : "My Reps, Individually"}
                        </button>
                      ))}
                    </div>
                    {setupForm.billingType === "reps_pay" && (
                      <p style={{ fontSize: "12px", color: "#7a8ba8", marginTop: "8px", marginBottom: 0, lineHeight: 1.5 }}>
                        Each rep sets up their own billing in their dashboard and gets their own
                        invoice. You still see all team usage here — you're just never billed.
                      </p>
                    )}
                  </div>

                  {/* Company name (both modes — it's what creates your org) */}
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

                  {/* Billing email — only when the company pays */}
                  {setupForm.billingType === "org" && (
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
                  )}

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

                  {payerMode === "reps_pay" ? (
                    <div style={{ fontSize: "12px", color: "#7a8ba8", marginTop: "4px" }}>
                      Current: Reps pay individually — you're never invoiced
                    </div>
                  ) : billingSettings ? (
                    <div style={{ fontSize: "12px", color: "#7a8ba8", marginTop: "4px" }}>
                      Current: {billingSettings.billing_type === "org" ? "Company billing" : "Individual billing"} · {billingSettings.billing_email}
                    </div>
                  ) : null}
                </form>
              )}
            </div>

          </div>
        )}

      </div>
    </PageShell>
  );
}
