"use client";

import React from "react";
import { useState, useEffect } from "react";
import { StatCard, StatsGrid, PageShell, SectionCard, TabBar } from "./DashboardShell";

const PRO_TABS = [
  { id: "courses", label: "CE Courses" },
  { id: "events", label: "Events" },
  { id: "network", label: "Network" },
] as const;

type ProTab = (typeof PRO_TABS)[number]["id"];

type MyCourseRow = {
  id: string;
  courseName: string;
  courseHours: number;
  sentBy: string;
  sentAt: string;
  expiryAt: string;
  redeemUrl: string | null;
  redeemedAt: string | null;
};

const BTN_PRIMARY = "rounded-xl bg-[var(--blue)] px-5 py-2.5 text-[13px] font-semibold text-white hover:bg-[var(--blue-dark)] active:scale-[0.98] transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed";
const BTN_SECONDARY = "rounded-xl border border-[var(--border)] bg-white px-5 py-2.5 text-[13px] font-semibold text-[var(--ink-soft)] hover:bg-[var(--cream)] active:scale-[0.98] transition-all disabled:opacity-50";

function displayName(nameOrEmail: string): string {
  if (!nameOrEmail) return "there";
  const trimmed = nameOrEmail.trim();
  if (trimmed.includes("@")) return trimmed.split("@")[0];
  return trimmed.split(/\s+/)[0] ?? trimmed;
}

export function ProDashboard({ userName, userId }: { userName?: string | null; userId?: string }) {
  const [tab, setTab] = useState<ProTab>("courses");
  const welcomeName = displayName(userName ?? "");
  const [myCourses, setMyCourses] = useState<MyCourseRow[]>([]);
  const [myCoursesLoading, setMyCoursesLoading] = useState(false);
  const [myCoursesExpanded, setMyCoursesExpanded] = useState(false);
  const [profileLoading, setProfileLoading] = useState(true);
const [needsOnboarding, setNeedsOnboarding] = useState(false);
const [onboardingForm, setOnboardingForm] = useState({
  discipline: "",
  state: "",
  city: "",
  facility: "",
});
const [onboardingSaving, setOnboardingSaving] = useState(false);
const [requestOpen, setRequestOpen] = useState(false);
const [requestForm, setRequestForm] = useState({
  topic: "",
  hours: "2",
  deadline: "",
  notes: "",
  visible: false,
  repId: "",
  inviteEmail: "",
});
const [requestSaving, setRequestSaving] = useState(false);
const [requestSuccess, setRequestSuccess] = useState(false);
const [myRequests, setMyRequests] = useState<{id: string; topic: string; hours: number; deadline: string; status: string; created_at: string}[]>([]);
const [connectedReps, setConnectedReps] = useState<{id: string; name: string}[]>([]);
const [networkReps, setNetworkReps] = useState<{id: string; name: string; connectedAt: string | null}[]>([]);
const [networkLoading, setNetworkLoading] = useState(true);

  // ── Events ──
  const [proEvents, setProEvents] = useState<any[]>([]);
  const [proEventsLoading, setProEventsLoading] = useState(true);
  const [rsvpSaving, setRsvpSaving] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setMyCoursesLoading(true);
    fetch("/api/ce/my-courses", { credentials: "include" })
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled && data.list) setMyCourses(data.list);
      })
      .finally(() => { if (!cancelled) setMyCoursesLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  const refreshMyCourses = () => {
    fetch("/api/ce/my-courses", { credentials: "include" })
      .then((r) => r.json())
      .then((data) => { if (data.list) setMyCourses(data.list); });
  };

  async function handleMarkRedeemed(ceSendId: string) {
    const res = await fetch("/api/ce/mark-redeemed", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ ceSendId }),
    });
    if (res.ok) refreshMyCourses();
  }
  useEffect(() => {
    fetch("/api/pro/profile", { credentials: "include" })
      .then((r) => r.json())
      .then((data) => {
        if (data.profile && !data.profile.discipline) {
          setNeedsOnboarding(true);
        }
        setProfileLoading(false);
      });
  }, []);
  
  useEffect(() => {
    if (!userId) return;
    fetch("/api/pro/requests", { credentials: "include" })
      .then((r) => r.json())
      .then((data) => {
        if (data.requests) setMyRequests(data.requests);
        if (data.reps) setConnectedReps(data.reps);
      });
  }, [userId]);

  useEffect(() => {
    fetch("/api/pro/events", { credentials: "include" })
      .then((r) => r.json())
      .then((data) => { if (data.events) setProEvents(data.events); setProEventsLoading(false); });
  }, []);

  async function handleProRsvp(eventId: string, status: "going" | "maybe" | "declined") {
    setRsvpSaving(eventId);
    const res = await fetch("/api/events/rsvp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ eventId, status }),
    });
    if (res.ok) {
      setProEvents((prev) => prev.map((e) => e.id === eventId ? { ...e, myRsvp: status } : e));
    }
    setRsvpSaving(null);
  }

  useEffect(() => {
    fetch("/api/pro/network", { credentials: "include" })
      .then((r) => r.json())
      .then((data) => {
        if (data.reps) setNetworkReps(data.reps);
        setNetworkLoading(false);
      });
  }, []);

  async function handleOnboarding(e: React.FormEvent) {
    e.preventDefault();
    setOnboardingSaving(true);
    const res = await fetch("/api/pro/profile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(onboardingForm),
    });
    setOnboardingSaving(false);
    if (res.ok) setNeedsOnboarding(false);
  }
  
  async function handleSubmitRequest(e: React.FormEvent) {
    e.preventDefault();
    setRequestSaving(true);
    const res = await fetch("/api/pro/requests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(requestForm),
    });
    setRequestSaving(false);
    if (res.ok) {
      setRequestSuccess(true);
      const data = await res.json();
      if (data.request) setMyRequests((prev) => [data.request, ...prev]);
      setTimeout(() => {
        setRequestOpen(false);
        setRequestSuccess(false);
        setRequestForm({ topic: "", hours: "2", deadline: "", notes: "", visible: false, repId: "", inviteEmail: "" });
      }, 1500);
    }
  }
  const showMyCoursesCount = 3;
  const myCoursesVisible = myCoursesExpanded ? myCourses : myCourses.slice(0, showMyCoursesCount);
  const hasMoreMyCourses = myCourses.length > showMyCoursesCount && !myCoursesExpanded;

  return (
    <PageShell>
      <div className="space-y-6 pb-20 pt-6">
        <div>
          <h1 style={{ fontFamily: "'Fraunces', Georgia, serif", fontSize: '26px', fontWeight: 800, color: '#0b1222', letterSpacing: '-0.01em', margin: 0 }}>Welcome, {welcomeName}</h1>
          <p style={{ marginTop: '4px', fontSize: '13px', color: '#7a8ba8' }}>View your CE courses and network</p>
        </div>

        <div style={{ borderRadius: '16px', background: '#ffffff', border: '1px solid rgba(11,18,34,0.08)', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
          <StatsGrid>
            <StatCard
              label="Courses"
              value={myCourses.length}
              note="In My Courses"
              noteClass="text-[var(--green)]"
            />
            <StatCard
              label="CE Hours"
              value={myCourses.reduce((acc, c) => acc + c.courseHours, 0)}
              note="Completed"
              noteClass="text-[var(--green)]"
            />
            <StatCard
              label="Courses Available"
              value={myCourses.length}
              note="From your reps"
              noteClass="text-[var(--blue)]"
            />
            <StatCard
              label="Reps"
              value={networkLoading ? "—" : networkReps.length}
              note="Connected"
              noteClass="text-[var(--blue)]"
            />
          </StatsGrid>
        </div>

        <TabBar tabs={[...PRO_TABS]} active={tab} onChange={(id) => setTab(id as ProTab)} />

        {tab === "courses" && (
          <div className="space-y-6">
            <SectionCard>
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--border)] pb-3 mb-4">
              <div>
                <h2 style={{ fontFamily: "'Fraunces', Georgia, serif", fontSize: '16px', fontWeight: 800, color: '#0b1222', margin: 0 }}>My Courses</h2>
                <p className="mt-1 text-[11px] text-[var(--ink-muted)]">CE courses sent to you by your reps</p>
              </div>
              <button type="button" className={BTN_PRIMARY} onClick={() => setRequestOpen(true)}>+ Request CE</button>
            </div>
            {myCoursesLoading ? (
              <p className="py-6 text-sm text-[var(--ink-muted)]">Loading…</p>
            ) : myCourses.length === 0 ? (
              <div className="py-8 text-center">
                <p className="text-sm text-[var(--ink-muted)]">No courses sent to you yet.</p>
                <p className="mt-1 text-[13px] text-[var(--ink-soft)]">When a rep sends you a CE, it will appear here.</p>
                <a href="/app" className={`mt-4 inline-block ${BTN_PRIMARY}`}>Go to Dashboard</a>
              </div>
            ) : (
              <>
                <div style={{ display: 'grid', gap: '12px' }}>
                  {myCoursesVisible.map((c) => {
                    const isRedeemed = !!c.redeemedAt;
                    return (
                      <div
                        key={c.id}
                        style={{
                          borderRadius: '14px',
                          border: `1px solid ${isRedeemed ? 'rgba(13,148,136,0.15)' : 'rgba(11,18,34,0.08)'}`,
                          background: isRedeemed ? 'rgba(13,148,136,0.03)' : '#ffffff',
                          padding: '20px',
                          boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                          transition: 'box-shadow 0.2s',
                        }}
                      >
                        {/* Top row: course info + hours badge */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px', marginBottom: '12px' }}>
                          <div style={{ minWidth: 0, flex: 1 }}>
                            <div style={{ fontWeight: 700, fontSize: '15px', color: '#0b1222', lineHeight: 1.3, marginBottom: '4px' }}>
                              {c.courseName.replace(/^\*NEW\*\s*/i, "").replace(/^\*[^*]+\*\s*/i, "")}
                            </div>
                            <div style={{ fontSize: '12px', color: '#7a8ba8', display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                              <span>From {c.sentBy}</span>
                              <span style={{ color: 'rgba(11,18,34,0.15)' }}>·</span>
                              <span>{formatDate(c.sentAt)}</span>
                              <span style={{ color: 'rgba(11,18,34,0.15)' }}>·</span>
                              <span>Expires {formatDate(c.expiryAt)}</span>
                            </div>
                          </div>
                          <div style={{
                            flexShrink: 0,
                            background: '#f6f5f0',
                            borderRadius: '8px',
                            padding: '6px 12px',
                            textAlign: 'center',
                          }}>
                            <div style={{ fontFamily: "'Fraunces', Georgia, serif", fontSize: '20px', fontWeight: 800, color: '#0b1222', lineHeight: 1 }}>
                              {c.courseHours}
                            </div>
                            <div style={{ fontSize: '10px', fontWeight: 600, color: '#7a8ba8', marginTop: '2px' }}>
                              {c.courseHours === 1 ? 'hour' : 'hours'}
                            </div>
                          </div>
                        </div>

                        {/* Bottom row: status + actions */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
                          {isRedeemed ? (
                            <>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span style={{
                                  display: 'inline-flex', alignItems: 'center', gap: '4px',
                                  background: 'rgba(13,148,136,0.10)', color: '#0d9488',
                                  padding: '4px 12px', borderRadius: '999px',
                                  fontSize: '12px', fontWeight: 700,
                                }}>✓ Completed</span>
                                <span style={{ fontSize: '11px', color: '#7a8ba8' }}>
                                  {formatDate(c.redeemedAt!)}
                                </span>
                              </div>
                              <a
                                href={c.redeemUrl || "https://hiscornerstone.com"}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{
                                  fontSize: '12px', color: '#2455ff', fontWeight: 600,
                                  textDecoration: 'none',
                                }}
                              >
                                View Course →
                              </a>
                            </>
                          ) : (
                            <>
                              <span style={{
                                display: 'inline-flex', alignItems: 'center',
                                background: 'rgba(217,119,6,0.08)', color: '#92670A',
                                padding: '4px 12px', borderRadius: '999px',
                                fontSize: '12px', fontWeight: 700,
                              }}>Ready to redeem</span>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <button
                                  type="button"
                                  onClick={() => handleMarkRedeemed(c.id)}
                                  style={{
                                    fontSize: '12px', color: '#7a8ba8', fontWeight: 500,
                                    background: 'none', border: 'none', cursor: 'pointer',
                                    textDecoration: 'underline', textUnderlineOffset: '2px',
                                  }}
                                >
                                  Already completed?
                                </button>
                                <a
                                  href={c.redeemUrl || "https://hiscornerstone.com"}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  style={{
                                    display: 'inline-flex', alignItems: 'center', gap: '6px',
                                    background: '#2455ff', color: '#ffffff', fontWeight: 700,
                                    padding: '10px 24px', borderRadius: '10px',
                                    fontSize: '14px', textDecoration: 'none',
                                    boxShadow: '0 2px 10px rgba(36,85,255,0.18)',
                                    transition: 'background 0.2s, transform 0.15s',
                                  }}
                                >
                                  Access Course →
                                </a>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
                {hasMoreMyCourses && (
                  <div className="mt-4 pt-3 border-t border-[var(--border)]">
                    <button
                      type="button"
                      onClick={() => setMyCoursesExpanded(true)}
                      className={BTN_SECONDARY}
                    >
                      Show more ({myCourses.length - showMyCoursesCount} more)
                    </button>
                  </div>
                )}
              </>
            )}
            </SectionCard>

            <SectionCard>
            <div className="border-b border-[var(--border)] pb-3 mb-4">
              <h2 style={{ fontFamily: "'Fraunces', Georgia, serif", fontSize: '16px', fontWeight: 800, color: '#0b1222', margin: 0 }}>Your Requests</h2>
            </div>
            {myRequests.length === 0 ? (
  <div className="py-8 text-center">
    <p className="text-sm text-[var(--ink-muted)]">No pending requests.</p>
    <button type="button" className={`mt-4 ${BTN_SECONDARY}`} onClick={() => setRequestOpen(true)}>Request CE</button>
  </div>
) : (
  <div className="space-y-3">
    {myRequests.map(r => (
      <div key={r.id} style={{padding:'14px',borderRadius:'10px',border:'1px solid var(--border)',background:'white'}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'start'}}>
          <div>
            <div style={{fontWeight:600,fontSize:'13px',color:'var(--ink)'}}>{r.topic}</div>
            <div style={{fontSize:'11px',color:'var(--ink-muted)',marginTop:'2px'}}>{r.hours} hrs · Due {new Date(r.deadline).toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"})}</div>
          </div>
          <span style={{padding:'3px 10px',borderRadius:'20px',fontSize:'10px',fontWeight:700,background: r.status === 'pending' ? 'var(--gold-glow)' : 'var(--green-glow)',color: r.status === 'pending' ? '#92670A' : 'var(--green)'}}>{r.status}</span>
        </div>
      </div>
    ))}
  </div>
)}
            </SectionCard>
        </div>
      )}

      {tab === "events" && (
        <SectionCard>
          <div className="border-b border-[var(--border)] pb-3 mb-4">
            <h2 style={{ fontFamily: "'Fraunces', Georgia, serif", fontSize: '16px', fontWeight: 800, color: '#0b1222', margin: 0 }}>Upcoming Events</h2>
            <p className="mt-1 text-[11px] text-[var(--ink-muted)]">Events from your reps and in your area</p>
          </div>
          {proEventsLoading ? (
            <p className="py-6 text-sm text-[var(--ink-muted)]">Loading…</p>
          ) : proEvents.length === 0 ? (
            <div className="py-8 text-center">
              <div style={{ fontSize: "48px", marginBottom: "16px" }}>📅</div>
              <p className="text-sm text-[var(--ink-muted)]">No upcoming events in your area.</p>
              <p className="mt-1 text-[13px] text-[var(--ink-soft)]">When reps schedule lunch & learns or workshops, they'll appear here.</p>
            </div>
          ) : (
            <div style={{ display: "grid", gap: "16px" }}>
              {proEvents.map((evt) => {
                const typeEmoji: Record<string, string> = { lunch_and_learn: "🍽️", networking_dinner: "🥂", workshop: "📋", in_service: "🏥", other: "📅" };
                const typeLabel: Record<string, string> = { lunch_and_learn: "Lunch & Learn", networking_dinner: "Networking Dinner", workshop: "Workshop", in_service: "In-Service", other: "Event" };
                return (
                  <div key={evt.id} style={{ borderRadius: "14px", border: "1px solid rgba(11,18,34,0.08)", background: "white", padding: "20px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap", marginBottom: "6px" }}>
                      <span style={{ fontSize: "12px", color: "#7a8ba8" }}>{typeEmoji[evt.eventType] || "📅"} {typeLabel[evt.eventType] || "Event"}</span>
                      <span style={{ fontSize: "10px", fontWeight: 700, padding: "2px 8px", borderRadius: "4px", background: evt.source === "public" ? "rgba(36,85,255,0.08)" : "rgba(13,148,136,0.08)", color: evt.source === "public" ? "#2455ff" : "#0d9488" }}>{evt.source === "public" ? "In Your Area" : "From Your Rep"}</span>
                    </div>
                    <div style={{ fontWeight: 700, fontSize: "16px", color: "#0b1222", lineHeight: 1.3, marginBottom: "4px" }}>{evt.title}</div>
                    <div style={{ fontSize: "12px", color: "#7a8ba8", marginBottom: "12px" }}>Hosted by {evt.repName}{evt.repOrg ? ` · ${evt.repOrg}` : ""}</div>
                    <div style={{ background: "#f6f5f0", borderRadius: "10px", padding: "14px", marginBottom: "14px", fontSize: "13px", color: "#3b4963", display: "grid", gap: "4px" }}>
                      <div>📅 {new Date(evt.startsAt).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })} at {new Date(evt.startsAt).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}</div>
                      <div>⏱ {evt.durationMinutes} min</div>
                      {evt.locationName && <div>📍 {evt.locationName}{evt.address ? ` · ${evt.address}` : ""}</div>}
                    </div>
                    {evt.description && <p style={{ fontSize: "13px", color: "#3b4963", lineHeight: 1.6, marginBottom: "14px" }}>{evt.description}</p>}
                    {evt.externalUrl && (
                      <div style={{ marginBottom: "14px" }}>
                        <a href={evt.externalUrl} target="_blank" rel="noopener noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "13px", color: "#2455ff", fontWeight: 600, textDecoration: "none", padding: "8px 16px", borderRadius: "8px", border: "1px solid rgba(36,85,255,0.15)", background: "rgba(36,85,255,0.04)" }}>🔗 View Details & Sign Up →</a>
                      </div>
                    )}
                    {evt.myRsvp === "going" ? (
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", background: "rgba(13,148,136,0.10)", color: "#0d9488", padding: "6px 14px", borderRadius: "999px", fontSize: "12px", fontWeight: 700 }}>✓ You're going</span>
                        <button type="button" onClick={() => handleProRsvp(evt.id, "declined")} disabled={rsvpSaving === evt.id} style={{ fontSize: "12px", color: "#7a8ba8", background: "none", border: "none", cursor: "pointer", textDecoration: "underline" }}>Cancel</button>
                      </div>
                    ) : evt.myRsvp === "maybe" ? (
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <span style={{ background: "rgba(217,119,6,0.08)", color: "#92670A", padding: "6px 14px", borderRadius: "999px", fontSize: "12px", fontWeight: 700 }}>Maybe</span>
                        <button type="button" onClick={() => handleProRsvp(evt.id, "going")} disabled={rsvpSaving === evt.id} style={{ fontSize: "12px", color: "#0d9488", background: "none", border: "none", cursor: "pointer", textDecoration: "underline", fontWeight: 600 }}>Confirm</button>
                        <button type="button" onClick={() => handleProRsvp(evt.id, "declined")} disabled={rsvpSaving === evt.id} style={{ fontSize: "12px", color: "#7a8ba8", background: "none", border: "none", cursor: "pointer", textDecoration: "underline" }}>Decline</button>
                      </div>
                    ) : evt.myRsvp === "declined" ? (
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <span style={{ background: "rgba(11,18,34,0.06)", color: "#7a8ba8", padding: "6px 14px", borderRadius: "999px", fontSize: "12px", fontWeight: 700 }}>Declined</span>
                        <button type="button" onClick={() => handleProRsvp(evt.id, "going")} disabled={rsvpSaving === evt.id} style={{ fontSize: "12px", color: "#2455ff", background: "none", border: "none", cursor: "pointer", textDecoration: "underline", fontWeight: 600 }}>Changed your mind?</button>
                      </div>
                    ) : (
                      <div style={{ display: "flex", gap: "8px" }}>
                        <button type="button" onClick={() => handleProRsvp(evt.id, "going")} disabled={rsvpSaving === evt.id} style={{ padding: "10px 24px", borderRadius: "10px", border: "none", background: "#2455ff", color: "white", fontSize: "13px", fontWeight: 700, cursor: rsvpSaving === evt.id ? "not-allowed" : "pointer", opacity: rsvpSaving === evt.id ? 0.6 : 1, boxShadow: "0 2px 10px rgba(36,85,255,0.18)" }}>I'll Be There</button>
                        <button type="button" onClick={() => handleProRsvp(evt.id, "maybe")} disabled={rsvpSaving === evt.id} style={{ padding: "10px 16px", borderRadius: "10px", border: "1px solid rgba(11,18,34,0.08)", background: "white", color: "#3b4963", fontSize: "13px", fontWeight: 600, cursor: "pointer" }}>Maybe</button>
                        <button type="button" onClick={() => handleProRsvp(evt.id, "declined")} disabled={rsvpSaving === evt.id} style={{ padding: "10px 16px", borderRadius: "10px", border: "1px solid rgba(11,18,34,0.08)", background: "white", color: "#7a8ba8", fontSize: "13px", fontWeight: 600, cursor: "pointer" }}>Decline</button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </SectionCard>
      )}

      {tab === "network" && (
        <SectionCard>
          <div className="border-b border-[var(--border)] pb-3 mb-4">
            <h2 style={{ fontFamily: "'Fraunces', Georgia, serif", fontSize: '16px', fontWeight: 800, color: '#0b1222', margin: 0 }}>Your Network</h2>
            <p className="mt-1 text-[11px] text-[var(--ink-muted)]">Sales reps connected to you</p>
          </div>
          {networkLoading ? (
            <p className="py-6 text-sm text-[var(--ink-muted)]">Loading…</p>
          ) : networkReps.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-sm text-[var(--ink-muted)]">No reps in your network yet.</p>
              <p className="mt-1 text-[13px] text-[var(--ink-soft)]">When a rep adds you to their network, they will appear here.</p>
            </div>
          ) : (
            <div style={{display:'grid',gap:'12px'}}>
              {networkReps.map((rep) => (
                <div key={rep.id} style={{padding:'16px',borderRadius:'10px',border:'1px solid var(--border)',background:'white',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                  <div>
                    <div style={{fontWeight:600,fontSize:'14px',color:'var(--ink)'}}>{rep.name}</div>
                    {rep.connectedAt && (
                      <div style={{fontSize:'11px',color:'var(--ink-muted)',marginTop:'2px'}}>
                        Connected {new Date(rep.connectedAt).toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"})}
                      </div>
                    )}
                  </div>
                  <button
                    type="button"
                    className={BTN_PRIMARY}
                    style={{fontSize:'12px',padding:'6px 14px'}}
                    onClick={() => setRequestOpen(true)}
                  >
                    Request CE
                  </button>
                </div>
              ))}
            </div>
          )}
        </SectionCard>
      )}
    </div>
    {/* Onboarding Modal */}
{!profileLoading && needsOnboarding && (
  <div style={{position:'fixed',inset:0,zIndex:300,display:'flex',alignItems:'center',justifyContent:'center',background:'rgba(10,18,34,0.6)',backdropFilter:'blur(4px)'}}>
    <div style={{width:'92%',maxWidth:'480px',background:'white',borderRadius:'16px',padding:'32px',boxShadow:'0 20px 60px rgba(0,0,0,0.15)'}}>
      <h3 style={{fontSize:'20px',fontWeight:700,color:'var(--ink)',marginBottom:'6px'}}>Welcome to Pulse</h3>
      <p style={{fontSize:'13px',color:'var(--ink-muted)',marginBottom:'24px'}}>Tell us a bit about yourself so reps can send you the right CE courses.</p>
      <form onSubmit={handleOnboarding} style={{display:'grid',gap:'16px'}}>
        <div>
          <label style={{display:'block',fontSize:'11px',fontWeight:600,color:'var(--ink-soft)',marginBottom:'6px',textTransform:'uppercase',letterSpacing:'0.05em'}}>Discipline</label>
          <select required value={onboardingForm.discipline} onChange={e => setOnboardingForm(f => ({...f, discipline: e.target.value}))} style={{width:'100%',borderRadius:'8px',border:'1px solid var(--border)',padding:'10px 12px',fontSize:'13px',fontFamily:'inherit'}}>
            <option value="">Select...</option>
            <option value="Nursing">Nursing</option>
            <option value="Social Work">Social Work</option>
            <option value="Case Mgmt">Case Management</option>
            <option value="PT">Physical Therapy</option>
            <option value="OT">Occupational Therapy</option>
            <option value="SLP">Speech-Language Pathology</option>
          </select>
        </div>
        <div>
          <label style={{display:'block',fontSize:'11px',fontWeight:600,color:'var(--ink-soft)',marginBottom:'6px',textTransform:'uppercase',letterSpacing:'0.05em'}}>Facility</label>
          <input type="text" required value={onboardingForm.facility} onChange={e => setOnboardingForm(f => ({...f, facility: e.target.value}))} placeholder="St. Luke's Hospital" style={{width:'100%',borderRadius:'8px',border:'1px solid var(--border)',padding:'10px 12px',fontSize:'13px',fontFamily:'inherit',boxSizing:'border-box'}} />
        </div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'12px'}}>
          <div>
            <label style={{display:'block',fontSize:'11px',fontWeight:600,color:'var(--ink-soft)',marginBottom:'6px',textTransform:'uppercase',letterSpacing:'0.05em'}}>City</label>
            <input type="text" value={onboardingForm.city} onChange={e => setOnboardingForm(f => ({...f, city: e.target.value}))} placeholder="Houston" style={{width:'100%',borderRadius:'8px',border:'1px solid var(--border)',padding:'10px 12px',fontSize:'13px',fontFamily:'inherit',boxSizing:'border-box'}} />
          </div>
          <div>
            <label style={{display:'block',fontSize:'11px',fontWeight:600,color:'var(--ink-soft)',marginBottom:'6px',textTransform:'uppercase',letterSpacing:'0.05em'}}>State</label>
            <select value={onboardingForm.state} onChange={e => setOnboardingForm(f => ({...f, state: e.target.value}))} style={{width:'100%',borderRadius:'8px',border:'1px solid var(--border)',padding:'10px 12px',fontSize:'13px',fontFamily:'inherit'}}>
              <option value="">Select...</option>
              {["AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN","IA","KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ","NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT","VT","VA","WA","WV","WI","WY","DC"].map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>
        <button type="submit" disabled={onboardingSaving} style={{padding:'12px',borderRadius:'10px',border:'none',background:'var(--blue)',color:'white',fontSize:'14px',fontWeight:600,cursor:'pointer',opacity:onboardingSaving?0.6:1}}>
          {onboardingSaving ? 'Saving...' : 'Get Started'}
        </button>
      </form>
    </div>
  </div>
)}

{/* Request CE Modal */}
{requestOpen && (
  <div style={{position:'fixed',inset:0,zIndex:300,display:'flex',alignItems:'center',justifyContent:'center',background:'rgba(10,18,34,0.5)',backdropFilter:'blur(4px)'}} onClick={() => !requestSaving && setRequestOpen(false)}>
    <div style={{width:'92%',maxWidth:'480px',background:'white',borderRadius:'16px',padding:'24px',boxShadow:'0 20px 60px rgba(0,0,0,0.15)'}} onClick={e => e.stopPropagation()}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'start',marginBottom:'16px'}}>
        <h3 style={{fontSize:'18px',fontWeight:700,color:'var(--ink)'}}>Request CE Course</h3>
        <button type="button" onClick={() => !requestSaving && setRequestOpen(false)} style={{background:'none',border:'none',fontSize:'22px',cursor:'pointer',color:'var(--ink-muted)',lineHeight:1}}>×</button>
      </div>
      {requestSuccess ? (
        <div style={{padding:'24px',textAlign:'center'}}>
          <div style={{fontSize:'40px',marginBottom:'8px'}}>✓</div>
          <p style={{fontWeight:600,color:'var(--green)'}}>Request submitted!</p>
        </div>
      ) : (
        <form onSubmit={handleSubmitRequest} style={{display:'grid',gap:'16px'}}>
          <div>
            <label style={{display:'block',fontSize:'11px',fontWeight:600,color:'var(--ink-soft)',marginBottom:'6px',textTransform:'uppercase',letterSpacing:'0.05em'}}>Topic</label>
            <select required value={requestForm.topic} onChange={e => setRequestForm(f => ({...f, topic: e.target.value}))} style={{width:'100%',borderRadius:'8px',border:'1px solid var(--border)',padding:'10px 12px',fontSize:'13px',fontFamily:'inherit'}}>
              <option value="">Select topic...</option>
              <option>Ethics</option>
              <option>Palliative Care</option>
              <option>Mental Health</option>
              <option>Chronic Disease Management</option>
              <option>Patient Safety</option>
              <option>Care Transitions</option>
              <option>Other</option>
            </select>
          </div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'12px'}}>
            <div>
              <label style={{display:'block',fontSize:'11px',fontWeight:600,color:'var(--ink-soft)',marginBottom:'6px',textTransform:'uppercase',letterSpacing:'0.05em'}}>Hours needed</label>
              <input type="number" required min="1" max="10" value={requestForm.hours} onChange={e => setRequestForm(f => ({...f, hours: e.target.value}))} style={{width:'100%',borderRadius:'8px',border:'1px solid var(--border)',padding:'10px 12px',fontSize:'13px',fontFamily:'inherit',boxSizing:'border-box'}} />
            </div>
            <div>
              <label style={{display:'block',fontSize:'11px',fontWeight:600,color:'var(--ink-soft)',marginBottom:'6px',textTransform:'uppercase',letterSpacing:'0.05em'}}>Deadline</label>
              <input type="date" required value={requestForm.deadline} onChange={e => setRequestForm(f => ({...f, deadline: e.target.value}))} style={{width:'100%',borderRadius:'8px',border:'1px solid var(--border)',padding:'10px 12px',fontSize:'13px',fontFamily:'inherit',boxSizing:'border-box'}} />
            </div>
          </div>
          {connectedReps.length > 0 && (
            <div>
              <label style={{display:'block',fontSize:'11px',fontWeight:600,color:'var(--ink-soft)',marginBottom:'6px',textTransform:'uppercase',letterSpacing:'0.05em'}}>Request from specific rep (optional)</label>
              <select value={requestForm.repId} onChange={e => setRequestForm(f => ({...f, repId: e.target.value, inviteEmail: ""}))} style={{width:'100%',borderRadius:'8px',border:'1px solid var(--border)',padding:'10px 12px',fontSize:'13px',fontFamily:'inherit'}}>
                <option value="">Any rep in my area</option>
                {connectedReps.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                <option value="__invite__">Invite rep by email…</option>
              </select>
              {requestForm.repId === "__invite__" && (
                <input
                  type="email"
                  required
                  placeholder="rep@example.com"
                  value={requestForm.inviteEmail}
                  onChange={e => setRequestForm(f => ({...f, inviteEmail: e.target.value}))}
                  style={{marginTop:'8px',width:'100%',borderRadius:'8px',border:'1px solid var(--border)',padding:'10px 12px',fontSize:'13px',fontFamily:'inherit',boxSizing:'border-box'}}
                />
              )}
            </div>
          )}
          <div style={{padding:'12px',borderRadius:'10px',border:'1px solid var(--border)',background:'#f6f5f0',cursor:'pointer'}} onClick={() => setRequestForm(f => ({...f, visible: !f.visible}))}>
            <div style={{display:'flex',alignItems:'center',gap:'10px'}}>
            <input type="checkbox" checked={requestForm.visible} onChange={() => {}} style={{width:'16px',height:'16px'}} />
              <div>
                <div style={{fontSize:'13px',fontWeight:600,color:'var(--ink)'}}>Make me visible to local reps</div>
                <div style={{fontSize:'11px',color:'var(--ink-muted)',marginTop:'2px'}}>Reps in your area can see your request and send you CEs</div>
              </div>
            </div>
          </div>
          {requestSaving && <p style={{fontSize:'13px',color:'var(--ink-muted)'}}>Submitting...</p>}
          <div style={{display:'flex',gap:'8px',justifyContent:'flex-end'}}>
            <button type="button" onClick={() => !requestSaving && setRequestOpen(false)} style={{padding:'10px 20px',borderRadius:'10px',border:'1px solid var(--border)',background:'white',fontSize:'13px',fontWeight:600,cursor:'pointer',color:'var(--ink-soft)'}}>Cancel</button>
            <button type="submit" disabled={requestSaving} style={{padding:'10px 20px',borderRadius:'10px',border:'none',background:'var(--blue)',color:'white',fontSize:'13px',fontWeight:600,cursor:'pointer',opacity:requestSaving?0.6:1}}>Submit Request</button>
          </div>
        </form>
      )}
    </div>
  </div>
)}
    </PageShell>
  );
}
  