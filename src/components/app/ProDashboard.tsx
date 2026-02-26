"use client";

import { useState, useEffect } from "react";

const PRO_TABS = [
  { id: "courses", label: "CE Courses" },
  { id: "events", label: "Events" },
  { id: "careers", label: "Careers" },
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

  return (
    <div className="space-y-5 pb-20">
      <div className="mb-2">
        <h1 className="font-[family-name:var(--font-fraunces)] text-2xl font-extrabold text-[var(--ink)]">Welcome, {welcomeName}</h1>
        <p className="text-[13px] text-[var(--ink-muted)] mt-1">RN · St. Luke&apos;s Hospital · Houston, TX · <span className="inline-flex align-middle rounded-full bg-[var(--teal-glow)] px-2.5 py-0.5 text-[10px] font-bold text-[var(--teal)]">Texas License</span></p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {[
          { label: "Courses", val: "4", note: "Available", noteClass: "text-[var(--green)]" },
          { label: "Requests", val: "1", note: "Pending", noteClass: "text-[var(--coral)]" },
          { label: "Reps", val: "2", note: "Connected", noteClass: "text-[var(--blue)]" },
          { label: "CE Hours", val: "12", note: "This year", noteClass: "text-[var(--green)]" },
          { label: "Events", val: "2", note: "Near you", noteClass: "text-[var(--blue)]" },
          { label: "Jobs", val: "3", note: "New", noteClass: "text-[var(--green)]" },
        ].map((s) => (
          <div key={s.label} className="rounded-[var(--r-lg)] border border-[var(--border)] bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,.04)] transition-shadow hover:shadow-[0_2px_8px_rgba(0,0,0,.06)]">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-[var(--ink-muted)] mb-1">{s.label}</div>
            <div className="font-[family-name:var(--font-fraunces)] text-[28px] font-extrabold text-[var(--ink)]">{s.val}</div>
            <div className={`text-[11px] font-medium ${s.noteClass}`}>{s.note}</div>
          </div>
        ))}
      </div>

      <div className="flex gap-1 mb-4 p-1 bg-[var(--cream)] rounded-[var(--r)] overflow-x-auto">
        {PRO_TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`shrink-0 px-4 py-2 rounded-lg text-xs font-semibold border-none cursor-pointer font-sans whitespace-nowrap transition-colors ${
              tab === t.id ? "bg-white text-[var(--ink)] shadow-[var(--shadow-sm)]" : "bg-transparent text-[var(--ink-soft)]"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "courses" && (
        <>
          <div className="rounded-[var(--r-xl)] border border-[var(--border)] bg-white p-5 mb-5">
            <div className="border-b border-[var(--border)] pb-3 mb-3">
              <h2 className="font-[family-name:var(--font-fraunces)] text-base font-bold text-[var(--ink)]">My Courses</h2>
              <p className="text-[11px] text-[var(--ink-muted)] mt-1">CE courses sent to you by your reps</p>
            </div>
            {myCoursesLoading ? (
              <p className="text-sm text-[var(--ink-muted)] py-4">Loading…</p>
            ) : myCourses.length === 0 ? (
              <p className="text-sm text-[var(--ink-muted)] py-4">No courses sent to you yet. When a rep sends you a CE, it will appear here.</p>
            ) : (
              <div className="space-y-0">
                {myCourses.map((c) => (
                  <div key={c.id} className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-2 sm:gap-4 py-3 px-2 rounded-[var(--r)] border-b border-[var(--border)] last:border-0 items-center hover:bg-[var(--cream)]/50">
                    <div>
                      <div className="font-semibold text-[13px] text-[var(--ink)]">{c.courseName}</div>
                      <div className="text-[11px] text-[var(--ink-muted)]">Sent by {c.sentBy} · {formatDate(c.sentAt)} · Expires {formatDate(c.expiryAt)}</div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      {c.redeemedAt ? (
                        <>
                          <span className="inline-flex items-center gap-1 rounded-full bg-[var(--green-glow)] px-2.5 py-0.5 text-[10px] font-bold text-[var(--green)]">Redeemed ✅</span>
                          <span className="text-[10px] text-[var(--ink-muted)]">Redeemed {formatDate(c.redeemedAt)}</span>
                        </>
                      ) : (
                        <>
                          <div className="flex items-center gap-2">
                            <span className="inline-flex items-center gap-1 rounded-full bg-[var(--gold-glow)] px-2.5 py-0.5 text-[10px] font-bold text-[#B8860B]">Pending</span>
                            {c.redeemUrl && (
                              <a href={c.redeemUrl} target="_blank" rel="noopener noreferrer" className="rounded-[var(--r)] bg-[var(--green)] px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-[var(--green)]/90 shrink-0">
                                Redeem Course
                              </a>
                            )}
                          </div>
                          {c.redeemUrl && (
                            <button type="button" onClick={() => handleMarkRedeemed(c.id)} className="text-[10px] text-[var(--ink-soft)] hover:underline">
                              Mark as Redeemed
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="rounded-[var(--r-xl)] border border-[var(--border)] bg-white p-5">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--border)] pb-3 mb-4">
              <h2 className="font-[family-name:var(--font-fraunces)] text-base font-bold text-[var(--ink)]">Available CE Courses</h2>
              <button type="button" className="rounded-[var(--r)] bg-[var(--teal)] px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-[var(--teal-dark)]" onClick={() => alert("Request CE modal")}>+ Request CE</button>
            </div>
            <p className="text-[11px] text-[var(--ink-muted)] mb-3">Courses for <strong className="text-[var(--blue)]">Nursing</strong> in <strong className="text-[var(--blue)]">Texas</strong></p>
            {[
              { name: "Ethics in Caring for the Elderly", meta: "2 hrs · Marcus Johnson · 30 days", type: "Free", typeClass: "bg-[var(--green-glow)] text-[var(--green)]" },
              { name: "Palliative Care Fundamentals", meta: "3 hrs · Marcus Johnson · 45 days", type: "Free", typeClass: "bg-[var(--green-glow)] text-[var(--green)]" },
              { name: "Chronic Disease Management", meta: "2 hrs · Jessica Chen · 60 days", type: "50% Off", typeClass: "bg-[var(--gold-glow)] text-[#B8860B]" },
              { name: "Advanced Wound Care", meta: "4 hrs · NursingCE.com", type: "Partner", typeClass: "bg-[var(--blue-glow)] text-[var(--blue)]" },
            ].map((c) => (
              <div key={c.name} className="flex justify-between items-center gap-2 p-4 rounded-[var(--r-lg)] border border-[var(--border)] bg-[var(--cream)] mb-2">
                <div>
                  <div className="font-bold text-[13px] text-[var(--ink)] mb-0.5">{c.name}</div>
                  <div className="text-[10px] text-[var(--ink-muted)]">{c.meta}</div>
                  <div className="flex gap-1.5 flex-wrap mt-1">
                    <span className="rounded px-2 py-0.5 text-[10px] font-semibold bg-[var(--teal-glow)] text-[var(--teal)]">Nursing</span>
                    <span className="rounded px-2 py-0.5 text-[10px] font-semibold bg-[var(--blue-glow)] text-[var(--blue)]">TX</span>
                    <span className={`rounded px-2 py-0.5 text-[10px] font-semibold ${c.typeClass}`}>{c.type}</span>
                  </div>
                </div>
                <button type="button" className="rounded-[var(--r)] bg-[var(--teal)] px-3.5 py-1.5 text-xs font-semibold text-white shrink-0" onClick={() => alert("Redirecting to CE provider...")}>Access</button>
              </div>
            ))}
          </div>
          <div className="rounded-[var(--r-xl)] border border-[var(--border)] bg-white p-5">
            <div className="border-b border-[var(--border)] pb-3 mb-4">
              <h2 className="font-[family-name:var(--font-fraunces)] text-base font-bold text-[var(--ink)]">Your Requests</h2>
            </div>
            <div className="rounded-[var(--r-lg)] border border-[var(--border)] bg-[var(--cream)] p-4">
              <div className="flex justify-between items-start gap-2 mb-2">
                <div>
                  <div className="font-bold text-[13px] text-[var(--ink)]">Ethics CE (2 hrs)</div>
                  <div className="text-[11px] text-[var(--ink-muted)] mt-0.5">To Marcus Johnson</div>
                </div>
                <span className="rounded-full bg-[var(--gold-glow)] px-2.5 py-0.5 text-[10px] font-bold text-[#B8860B]">Pending</span>
              </div>
              <div className="text-xs text-[var(--ink-soft)]"><strong className="text-[var(--ink)]">Deadline:</strong> End of month · TX · Nursing</div>
            </div>
          </div>
        </>
      )}

      {tab === "events" && (
        <div className="rounded-[var(--r-xl)] border border-[var(--border)] bg-white p-5">
          <div className="border-b border-[var(--border)] pb-3 mb-4">
            <h2 className="font-[family-name:var(--font-fraunces)] text-base font-bold text-[var(--ink)]">Events Near You</h2>
          </div>
          {[
            { name: "Ethics Lunch & Learn", meta: "Feb 20, 12 PM · Memorial Medical", host: "Marcus Johnson", ce: "2 hrs Ethics" },
            { name: "Palliative Care In-Service", meta: "Feb 27, 1 PM · St. Luke's", host: "Marcus Johnson", ce: "3 hrs Palliative" },
          ].map((e) => (
            <div key={e.name} className="rounded-[var(--r-lg)] border border-[var(--border)] bg-[var(--cream)] p-4 mb-2.5">
              <div className="flex justify-between items-start gap-2 mb-2">
                <div>
                  <div className="font-bold text-[13px] text-[var(--ink)]">{e.name}</div>
                  <div className="text-[11px] text-[var(--ink-muted)] mt-0.5">{e.meta}</div>
                </div>
                <span className="rounded-full bg-[var(--green-glow)] px-2.5 py-0.5 text-[10px] font-bold text-[var(--green)]">Open</span>
              </div>
              <div className="text-xs text-[var(--ink-soft)] mb-2"><strong className="text-[var(--ink)]">Host:</strong> {e.host} · <strong className="text-[var(--ink)]">CE:</strong> {e.ce}</div>
              <div className="flex gap-1.5 flex-wrap mb-2">
                <span className="rounded px-2 py-0.5 text-[10px] font-semibold bg-[var(--teal-glow)] text-[var(--teal)]">Nursing</span>
                <span className="rounded px-2 py-0.5 text-[10px] font-semibold bg-[var(--blue-glow)] text-[var(--blue)]">TX</span>
              </div>
              <div className="flex gap-1.5 flex-wrap">
                <button type="button" className="rounded-[var(--r)] bg-[var(--teal)] px-3.5 py-1.5 text-xs font-semibold text-white" onClick={() => alert("RSVP confirmed!")}>RSVP</button>
                <button type="button" className="rounded-[var(--r)] border border-[var(--border)] bg-transparent px-3.5 py-1.5 text-xs font-semibold text-[var(--ink-soft)]">Details</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === "careers" && (
        <div className="rounded-[var(--r-xl)] border border-[var(--border)] bg-white p-5">
          <div className="border-b border-[var(--border)] pb-3 mb-4">
            <h2 className="font-[family-name:var(--font-fraunces)] text-base font-bold text-[var(--ink)]">Career Opportunities</h2>
          </div>
          <p className="text-[11px] text-[var(--ink-muted)] mb-3">Positions shared by sales reps in your network</p>
          {[
            { name: "RN Case Manager — Hospice", meta: "Compassionate Care · Houston, TX", detail: "Full-time · Shared by Marcus Johnson · 2 days ago", badge: "New" },
            { name: "Weekend RN — Home Health", meta: "Gulf Coast HH · Houston, TX", detail: "Part-time · Shared by Marcus Johnson · 3 days ago", badge: "New" },
            { name: "MSW — Inpatient Hospice", meta: "Serenity Hospice · Katy, TX", detail: "Full-time · Shared by Jessica Chen", badge: "1 wk ago" },
          ].map((j) => (
            <div key={j.name} className="rounded-[var(--r-lg)] border border-[var(--border)] bg-[var(--cream)] p-4 mb-2.5">
              <div className="flex justify-between items-start gap-2 mb-2">
                <div>
                  <div className="font-bold text-[13px] text-[var(--ink)]">{j.name}</div>
                  <div className="text-[11px] text-[var(--ink-muted)] mt-0.5">{j.meta}</div>
                </div>
                <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${j.badge === "New" ? "bg-[var(--green-glow)] text-[var(--green)]" : "bg-[var(--blue-glow)] text-[var(--blue)]"}`}>{j.badge}</span>
              </div>
              <div className="text-xs text-[var(--ink-soft)] mb-2">{j.detail}</div>
              <div className="flex gap-1.5 flex-wrap">
                <button type="button" className="rounded-[var(--r)] bg-[var(--teal)] px-3.5 py-1.5 text-xs font-semibold text-white" onClick={() => alert("Interest submitted!")}>Interested</button>
                <button type="button" className="rounded-[var(--r)] border border-[var(--border)] bg-transparent px-3.5 py-1.5 text-xs font-semibold text-[var(--ink-soft)]">Details</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === "network" && (
        <div className="rounded-[var(--r-xl)] border border-[var(--border)] bg-white p-5">
          <div className="border-b border-[var(--border)] pb-3 mb-3">
            <h2 className="font-[family-name:var(--font-fraunces)] text-base font-bold text-[var(--ink)]">Your Network</h2>
          </div>
          <div className="space-y-0">
            {[
              { initials: "MJ", name: "Marcus Johnson", meta: "Sales Rep · Houston", last: "3 CEs, 2 events, 1 job shared", ok: true },
              { initials: "JC", name: "Jessica Chen", meta: "Sales Rep · Dallas", last: "1 CE, 1 job shared", ok: true },
            ].map((r) => (
              <div key={r.name} className="grid grid-cols-[auto_1fr_auto] gap-3 py-3 px-2 rounded-[var(--r)] border-b border-[var(--border)] last:border-0 items-center hover:bg-[var(--cream)]/50">
                <div className="w-10 h-10 shrink-0 rounded-full bg-[var(--blue-glow)] text-[var(--blue)] flex items-center justify-center font-bold text-sm">{r.initials}</div>
                <div className="min-w-0">
                  <div className="font-semibold text-[13px] text-[var(--ink)]">{r.name}</div>
                  <div className="text-[11px] text-[var(--ink-muted)]">{r.meta}</div>
                  <div className={`text-[10px] font-semibold mt-1 ${r.ok ? "text-[var(--green)]" : "text-[var(--coral)]"}`}>{r.last}</div>
                </div>
                <button type="button" className="rounded-[var(--r)] border border-[var(--border)] bg-transparent px-3.5 py-1.5 text-xs font-semibold text-[var(--ink-soft)] shrink-0">Message</button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
