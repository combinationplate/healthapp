"use client";

import { useState, useEffect } from "react";

const PRO_TABS = [
  { id: "courses", label: "CE Courses" },
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

const BTN_PRIMARY = "rounded-lg bg-[var(--teal)] px-4 py-2 text-sm font-semibold text-white hover:bg-[var(--teal-dark)]";
const BTN_SECONDARY = "rounded-lg border border-[var(--border)] bg-transparent px-4 py-2 text-sm font-semibold text-[var(--ink-soft)] hover:bg-[#F8FAFC]";

function displayName(nameOrEmail: string): string {
  if (!nameOrEmail) return "there";
  const trimmed = nameOrEmail.trim();
  if (trimmed.includes("@")) return trimmed.split("@")[0];
  return trimmed.split(/\s+/)[0] ?? trimmed;
}

export function ProDashboard({ userName }: { userName?: string | null }) {
  const [tab, setTab] = useState<ProTab>("courses");
  const welcomeName = displayName(userName ?? "");
  const [myCourses, setMyCourses] = useState<MyCourseRow[]>([]);
  const [myCoursesLoading, setMyCoursesLoading] = useState(false);
  const [myCoursesExpanded, setMyCoursesExpanded] = useState(false);

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

  const showMyCoursesCount = 3;
  const myCoursesVisible = myCoursesExpanded ? myCourses : myCourses.slice(0, showMyCoursesCount);
  const hasMoreMyCourses = myCourses.length > showMyCoursesCount && !myCoursesExpanded;

  return (
    <div className="space-y-4 pb-20">
      <div>
        <h1 className="font-[family-name:var(--font-fraunces)] text-2xl font-extrabold text-[var(--ink)]">Welcome, {welcomeName}</h1>
        <p className="mt-1 text-[13px] text-[var(--ink-muted)]">View your CE courses and network</p>
      </div>

      <section className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))" }}>
        {[
          { label: "Courses", val: String(myCourses.length), note: "Available", noteClass: "text-[var(--green)]" },
          { label: "Requests", val: "0", note: "Pending", noteClass: "text-[var(--coral)]" },
          { label: "Reps", val: "—", note: "Connected", noteClass: "text-[var(--blue)]" },
          { label: "CE Hours", val: String(myCourses.reduce((acc, c) => acc + c.courseHours, 0)), note: "Completed", noteClass: "text-[var(--green)]" },
        ].map((s) => (
          <div key={s.label} className="rounded-[12px] border border-[var(--border)] bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.08)]">
            <div className="mb-1 text-xs font-semibold uppercase tracking-wider text-[var(--ink-muted)]">{s.label}</div>
            <div className="font-[family-name:var(--font-fraunces)] text-[32px] font-bold text-[var(--ink)]">{s.val}</div>
            <div className={`text-[13px] font-medium ${s.noteClass}`}>{s.note}</div>
          </div>
        ))}
      </section>

      <div className="flex gap-1 overflow-x-auto rounded-lg bg-white p-1 shadow-[0_1px_3px_rgba(0,0,0,0.08)]">
        {PRO_TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`shrink-0 rounded-lg px-4 py-2 text-xs font-semibold transition-colors ${tab === t.id ? "bg-[var(--blue)] text-white" : "text-[var(--ink-soft)] hover:bg-[#F8FAFC]"}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "courses" && (
        <div className="space-y-4">
          <div className="rounded-[12px] border border-[var(--border)] bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.08)]">
            <div className="border-b border-[var(--border)] pb-3 mb-4">
              <h2 className="font-[family-name:var(--font-fraunces)] text-base font-bold text-[var(--ink)]">My Courses</h2>
              <p className="mt-1 text-[11px] text-[var(--ink-muted)]">CE courses sent to you by your reps</p>
            </div>
            {myCoursesLoading ? (
              <p className="py-6 text-sm text-[var(--ink-muted)]">Loading…</p>
            ) : myCourses.length === 0 ? (
              <div className="py-8 text-center">
                <p className="text-sm text-[var(--ink-muted)]">No courses sent to you yet.</p>
                <p className="mt-1 text-[13px] text-[var(--ink-soft)]">When a rep sends you a CE, it will appear here.</p>
                <a href="/app" className="mt-4 inline-block rounded-lg bg-[var(--teal)] px-4 py-2 text-sm font-semibold text-white hover:bg-[var(--teal-dark)]">Go to Dashboard</a>
              </div>
            ) : (
              <>
                <div className="space-y-0">
                  {myCoursesVisible.map((c) => (
                    <div key={c.id} className="grid grid-cols-1 items-center gap-2 border-b border-[var(--border)] py-3 last:border-0 sm:grid-cols-[1fr_auto] sm:gap-4 sm:px-0">
                      <div>
                        <div className="font-semibold text-[13px] text-[var(--ink)]">{c.courseName}</div>
                        <div className="text-[11px] text-[var(--ink-muted)]">Sent by {c.sentBy} · {formatDate(c.sentAt)} · Expires {formatDate(c.expiryAt)}</div>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        {c.redeemedAt ? (
                          <>
                            <span className="inline-flex items-center gap-1 rounded-full bg-[var(--green-glow)] px-2.5 py-0.5 text-[10px] font-bold text-[var(--green)]">Redeemed</span>
                            <span className="text-[10px] text-[var(--ink-muted)]">Redeemed {formatDate(c.redeemedAt)}</span>
                          </>
                        ) : (
                          <>
                            <div className="flex items-center gap-2">
                              <span className="inline-flex items-center gap-1 rounded-full bg-[var(--gold-glow)] px-2.5 py-0.5 text-[10px] font-bold text-[#B8860B]">Pending</span>
                              <a href={c.redeemUrl || "https://hiscornerstone.com"} target="_blank" rel="noopener noreferrer" className="rounded-lg bg-[var(--green)] px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-[var(--green)]/90">
                                Redeem Course
                              </a>
                            </div>
                            <button type="button" onClick={() => handleMarkRedeemed(c.id)} className="text-[10px] text-[var(--ink-soft)] hover:underline">
                              Mark as Redeemed
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                {hasMoreMyCourses && (
                  <div className="mt-4 pt-3 border-t border-[var(--border)]">
                    <button type="button" onClick={() => setMyCoursesExpanded(true)} className="rounded-lg border border-[var(--border)] bg-transparent px-4 py-2 text-sm font-semibold text-[var(--ink-soft)] hover:bg-[#F8FAFC]">
                      Show more ({myCourses.length - showMyCoursesCount} more)
                    </button>
                  </div>
                )}
              </>
            )}
          </div>

          <div className="rounded-[12px] border border-[var(--border)] bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.08)]">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--border)] pb-3 mb-4">
              <h2 className="font-[family-name:var(--font-fraunces)] text-base font-bold text-[var(--ink)]">Available CE Courses</h2>
              <button type="button" className={BTN_PRIMARY} onClick={() => alert("Request CE")}>+ Request CE</button>
            </div>
            <div className="py-8 text-center">
              <p className="text-sm text-[var(--ink-muted)]">Browse and request CE courses from your reps.</p>
              <button type="button" className="mt-4 rounded-lg bg-[var(--teal)] px-4 py-2 text-sm font-semibold text-white hover:bg-[var(--teal-dark)]" onClick={() => alert("Request CE")}>Request a course</button>
            </div>
          </div>

          <div className="rounded-[12px] border border-[var(--border)] bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.08)]">
            <div className="border-b border-[var(--border)] pb-3 mb-4">
              <h2 className="font-[family-name:var(--font-fraunces)] text-base font-bold text-[var(--ink)]">Your Requests</h2>
            </div>
            <div className="py-8 text-center">
              <p className="text-sm text-[var(--ink-muted)]">No pending requests.</p>
              <button type="button" className="mt-4 rounded-lg border border-[var(--border)] bg-transparent px-4 py-2 text-sm font-semibold text-[var(--ink-soft)] hover:bg-[#F8FAFC]" onClick={() => alert("Request CE")}>Request CE</button>
            </div>
          </div>
        </div>
      )}

      {tab === "network" && (
        <div className="rounded-[12px] border border-[var(--border)] bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.08)]">
          <div className="border-b border-[var(--border)] pb-3 mb-4">
            <h2 className="font-[family-name:var(--font-fraunces)] text-base font-bold text-[var(--ink)]">Your Network</h2>
            <p className="mt-1 text-[11px] text-[var(--ink-muted)]">Sales reps connected to you</p>
          </div>
          <div className="py-8 text-center">
            <p className="text-sm text-[var(--ink-muted)]">No reps in your network yet.</p>
            <p className="mt-1 text-[13px] text-[var(--ink-soft)]">When you connect with a rep, they will appear here.</p>
          </div>
        </div>
      )}
    </div>
  );
}
