"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";

const TABS = [
  { id: "discover", label: "Discover" },
  { id: "requests", label: "Requests" },
  { id: "distribute", label: "Distribute" },
  { id: "network", label: "Network" },
  { id: "ce-history", label: "CE History" },
] as const;

const CE_COURSES = [
  { id: "ethics", name: "Ethics in Caring for the Elderly", hours: 2 },
  { id: "palliative", name: "Palliative and Hospice Care", hours: 3 },
  { id: "mental-health", name: "Mental Health and The Elderly", hours: 2 },
  { id: "chronic", name: "Chronic Disease Management", hours: 2 },
  { id: "patient-safety", name: "Patient Safety", hours: 2 },
] as const;

const CE_DISCOUNTS = ["100% Free", "50% Off", "25% Off"] as const;

type RepTab = (typeof TABS)[number]["id"];

export type ProfessionalRow = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  facility: string | null;
  discipline: string | null;
  rep_id: string;
  created_at: string;
};

type CeHistoryRow = {
  id: string;
  professional_id: string;
  professional_name: string;
  course_name: string;
  course_hours: number;
  discount: string;
  created_at: string;
  redeemed_at: string | null;
};

function initials(name: string): string {
  return name
    .split(/\s+/)
    .map((s) => s[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function RepDashboard({ repId }: { repId?: string }) {
  const [tab, setTab] = useState<RepTab>("discover");
  const [filter, setFilter] = useState("All");
  const [professionals, setProfessionals] = useState<ProfessionalRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [addForm, setAddForm] = useState({ name: "", email: "", phone: "", facility: "", discipline: "" });
  const [addSaving, setAddSaving] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);
  const [sendCeOpen, setSendCeOpen] = useState(false);
  const [sendCePro, setSendCePro] = useState<ProfessionalRow | null>(null);
  const [sendCeCourse, setSendCeCourse] = useState<string>(CE_COURSES[0].id);
  const [sendCeDiscount, setSendCeDiscount] = useState<string>(CE_DISCOUNTS[0]);
  const [sendCeMessage, setSendCeMessage] = useState("");
  const [sendCeSaving, setSendCeSaving] = useState(false);
  const [sendCeError, setSendCeError] = useState<string | null>(null);
  const [sendCeSuccess, setSendCeSuccess] = useState(false);
  const [ceHistory, setCeHistory] = useState<CeHistoryRow[]>([]);
  const [ceHistoryLoading, setCeHistoryLoading] = useState(false);
  const [ceHistoryExpanded, setCeHistoryExpanded] = useState(false);
  const [reminderSending, setReminderSending] = useState<string | null>(null);

  const fetchProfessionals = useCallback(async () => {
    if (!repId) return;
    setLoading(true);
    const supabase = createClient();
    const { data, error } = await supabase
      .from("professionals")
      .select("id, name, email, phone, facility, discipline, rep_id, created_at")
      .eq("rep_id", repId)
      .order("created_at", { ascending: false });
    setLoading(false);
    if (!error) setProfessionals((data as ProfessionalRow[]) ?? []);
  }, [repId]);

  useEffect(() => {
    fetchProfessionals();
  }, [fetchProfessionals]);

  const fetchCeHistory = useCallback(async () => {
    if (!repId) return;
    setCeHistoryLoading(true);
    const supabase = createClient();
    const { data, error } = await supabase
      .from("ce_sends")
      .select("id, professional_id, course_name, course_hours, discount, created_at, redeemed_at, professionals(name)")
      .eq("rep_id", repId)
      .order("created_at", { ascending: false });
    setCeHistoryLoading(false);
    if (!error && data) {
      setCeHistory(data.map((r: Record<string, unknown>) => ({
        id: r.id as string,
        professional_id: r.professional_id as string,
        professional_name: (r.professionals as { name?: string } | null)?.name ?? "—",
        course_name: r.course_name as string,
        course_hours: r.course_hours as number,
        discount: r.discount as string,
        created_at: r.created_at as string,
        redeemed_at: r.redeemed_at as string | null,
      })));
    }
  }, [repId]);

  useEffect(() => {
    if (repId) fetchCeHistory();
  }, [repId, fetchCeHistory]);

  async function handleAddProfessional(e: React.FormEvent) {
    e.preventDefault();
    if (!repId) return;
    setAddSaving(true);
    setAddError(null);
    const supabase = createClient();
    const emailNorm = addForm.email.trim().toLowerCase();
    const existing = professionals.find((p) => p.email.toLowerCase() === emailNorm);
    if (existing) {
      setAddError("This professional is already in your network.");
      setAddSaving(false);
      return;
    }
    const { error } = await supabase.from("professionals").insert({
      rep_id: repId,
      name: addForm.name.trim(),
      email: addForm.email.trim(),
      phone: addForm.phone.trim() || null,
      facility: addForm.facility.trim() || null,
      discipline: addForm.discipline.trim() || null,
    });
    setAddSaving(false);
    if (error) {
      setAddError(error.message);
      return;
    }
    setAddForm({ name: "", email: "", phone: "", facility: "", discipline: "" });
    setAddOpen(false);
    fetchProfessionals();
  }

  function openSendCeModal(pro: ProfessionalRow | null) {
    setSendCePro(pro ?? (professionals.length === 1 ? professionals[0] : null));
    setSendCeCourse(CE_COURSES[0].id);
    setSendCeDiscount(CE_DISCOUNTS[0]);
    setSendCeMessage("");
    setSendCeError(null);
    setSendCeSuccess(false);
    setSendCeOpen(true);
  }

  async function handleSendCe(e: React.FormEvent) {
    e.preventDefault();
    if (professionals.length > 1 && !sendCePro) {
      setSendCeError("Select a professional.");
      return;
    }
    const pro = sendCePro ?? (professionals.length > 0 ? professionals[0] : null);
    if (!repId || !pro) {
      setSendCeError("Add a professional to your network first.");
      return;
    }
    setSendCeSaving(true);
    setSendCeError(null);
    try {
      const res = await fetch("/api/ce/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          professionalId: pro.id,
          repId,
          courseId: sendCeCourse,
          discount: sendCeDiscount,
          personalMessage: sendCeMessage.trim() || undefined,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setSendCeError(data.error ?? "Failed to send CE");
        return;
      }
      setSendCeSuccess(true);
      setTimeout(() => {
        setSendCeOpen(false);
        setSendCeSuccess(false);
      }, 2000);
    } finally {
      setSendCeSaving(false);
    }
  }

  return (
    <div className="space-y-4 pb-20">
      <div>
        <h1 className="font-[family-name:var(--font-fraunces)] text-2xl font-extrabold text-[var(--ink)]">Your Dashboard</h1>
        <p className="mt-1 text-[13px] text-[var(--ink-muted)]">Manage your network and send CE courses</p>
      </div>

      <section className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))" }}>
        {[
          { label: "Touchpoints", val: String(professionals.length * 2), note: "This week", noteClass: "text-[var(--blue)]" },
          { label: "CEs Sent", val: String(ceHistory.length), note: "Total", noteClass: "text-[var(--green)]" },
          { label: "Credits", val: String(ceHistory.length), note: "CE sends", noteClass: "text-[var(--blue)]" },
          { label: "Requests", val: "0", note: "Pending", noteClass: "text-[var(--coral)]" },
        ].map((s) => (
          <div key={s.label} className="rounded-[12px] border border-[var(--border)] bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.08)]">
            <div className="mb-1 text-xs font-semibold uppercase tracking-wider text-[var(--ink-muted)]">{s.label}</div>
            <div className="font-[family-name:var(--font-fraunces)] text-[32px] font-bold text-[var(--ink)]">{s.val}</div>
            <div className={`text-[13px] font-medium ${s.noteClass}`}>{s.note}</div>
          </div>
        ))}
      </section>

      <div className="flex gap-1 overflow-x-auto rounded-lg bg-white p-1 shadow-[0_1px_3px_rgba(0,0,0,0.08)]">
        {TABS.map((t) => (
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

      {tab === "discover" && (
        <div className="rounded-[12px] border border-[var(--border)] bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.08)]">
          <div className="border-b border-[var(--border)] pb-3 mb-4">
            <h2 className="font-[family-name:var(--font-fraunces)] text-base font-bold text-[var(--ink)]">Professionals Seeking Resources</h2>
            <p className="mt-1 text-[11px] text-[var(--ink-muted)]">Professionals looking for CE will appear here</p>
          </div>
          <div className="py-8 text-center">
            <p className="text-sm text-[var(--ink-muted)]">No professionals seeking resources right now.</p>
            <p className="mt-1 text-[13px] text-[var(--ink-soft)]">Check back later or add professionals to your network to send them CEs.</p>
            <button type="button" className="mt-4 rounded-lg bg-[var(--blue)] px-4 py-2 text-sm font-semibold text-white hover:bg-[var(--blue-dark)]" onClick={() => setTab("network")}>View My Network</button>
          </div>
        </div>
      )}

      {tab === "requests" && (
        <div className="rounded-[12px] border border-[var(--border)] bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.08)]">
          <div className="border-b border-[var(--border)] pb-3 mb-4">
            <h2 className="font-[family-name:var(--font-fraunces)] text-base font-bold text-[var(--ink)]">CE Requests</h2>
            <p className="mt-1 text-[11px] text-[var(--ink-muted)]">Requests from professionals will appear here</p>
          </div>
          <div className="py-8 text-center">
            <p className="text-sm text-[var(--ink-muted)]">No pending CE requests.</p>
            <button type="button" className="mt-4 rounded-lg bg-[var(--blue)] px-4 py-2 text-sm font-semibold text-white hover:bg-[var(--blue-dark)]" onClick={() => setTab("network")}>View My Network</button>
          </div>
        </div>
      )}

      {tab === "distribute" && (
        <div className="space-y-4">
          <div className="rounded-[12px] border border-[var(--border)] bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.08)]">
            <div className="border-b border-[var(--border)] pb-3 mb-4">
              <h2 className="font-[family-name:var(--font-fraunces)] text-base font-bold text-[var(--ink)]">Distribution Tools</h2>
            </div>
            <p className="text-xs text-[var(--ink-soft)] mb-4">QR codes, flyers, kiosk mode, and bulk send.</p>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 mb-4">
              {[
                { emoji: "📱", name: "My QR Code", meta: "Personal page" },
                { emoji: "📚", name: "Course QR", meta: "Specific course" },
                { emoji: "📅", name: "Event QR", meta: "Event RSVP" },
              ].map((c) => (
                <button key={c.name} type="button" className="rounded-xl border border-[var(--border)] bg-[#F8FAFC] p-5 text-center transition-colors hover:border-[var(--border)] hover:shadow-[0_1px_3px_rgba(0,0,0,0.08)]" onClick={() => alert("QR: " + c.name)}>
                  <span className="text-2xl block mb-2">{c.emoji}</span>
                  <div className="font-bold text-[13px] text-[var(--ink)]">{c.name}</div>
                  <div className="text-[11px] text-[var(--ink-muted)]">{c.meta}</div>
                </button>
              ))}
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <button type="button" className="rounded-xl border border-[var(--border)] bg-[#F8FAFC] p-5 text-center hover:shadow-[0_1px_3px_rgba(0,0,0,0.08)]" onClick={() => alert("Generate Flyer")}>
                <span className="text-2xl block mb-2">📄</span>
                <div className="font-bold text-[13px] text-[var(--ink)]">Generate Flyer</div>
                <div className="text-[11px] text-[var(--ink-muted)]">PDF with QR</div>
              </button>
              <button type="button" className="rounded-xl border border-[var(--border)] bg-[#F8FAFC] p-5 text-center hover:shadow-[0_1px_3px_rgba(0,0,0,0.08)]" onClick={() => alert("Kiosk Mode")}>
                <span className="text-2xl block mb-2">💻</span>
                <div className="font-bold text-[13px] text-[var(--ink)]">Kiosk Mode</div>
                <div className="text-[11px] text-[var(--ink-muted)]">Event sign-up</div>
              </button>
            </div>
          </div>
          <div className="rounded-[12px] border border-[var(--border)] bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.08)]">
            <div className="border-b border-[var(--border)] pb-3 mb-4">
              <h2 className="font-[family-name:var(--font-fraunces)] text-base font-bold text-[var(--ink)]">Bulk Send</h2>
            </div>
            <div className="flex gap-2 flex-wrap">
              <button type="button" className="rounded-lg bg-[var(--blue)] px-4 py-2 text-sm font-semibold text-white hover:bg-[var(--blue-dark)]" onClick={() => alert("Select professionals, choose course, send to all.")}>Send to Group</button>
              <button type="button" className="rounded-lg border border-[var(--border)] bg-transparent px-4 py-2 text-sm font-semibold text-[var(--ink-soft)] hover:bg-[#F8FAFC]">Event Attendees</button>
              <button type="button" className="rounded-lg border border-[var(--border)] bg-transparent px-4 py-2 text-sm font-semibold text-[var(--ink-soft)] hover:bg-[#F8FAFC]">Import & Send</button>
            </div>
          </div>
        </div>
      )}

      {tab === "network" && (
        <div className="rounded-[12px] border border-[var(--border)] bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.08)]">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--border)] pb-3 mb-4">
            <h2 className="font-[family-name:var(--font-fraunces)] text-base font-bold text-[var(--ink)]">My Network</h2>
            <div className="flex gap-2 flex-wrap">
              <button type="button" className="rounded-lg border border-[var(--border)] bg-transparent px-4 py-2 text-xs font-semibold text-[var(--ink-soft)] hover:bg-[#F8FAFC]">Import CSV</button>
              <button type="button" className="rounded-lg bg-[var(--blue)] px-4 py-2 text-xs font-semibold text-white hover:bg-[var(--blue-dark)]" onClick={() => setAddOpen(true)}>+ Add Professional</button>
            </div>
          </div>
          <div className="flex gap-2 flex-wrap mb-4">
            {["All", "Nursing", "Social Work", "Case Mgmt", "PT/OT/SLP"].map((f) => (
              <button key={f} type="button" onClick={() => setFilter(f)} className={`rounded-lg px-3 py-1.5 text-[11px] font-semibold border ${filter === f ? "bg-[var(--blue)] text-white border-[var(--blue)]" : "border-[var(--border)] bg-white text-[var(--ink-soft)] hover:bg-[#F8FAFC]"}`}>
                {f} {f === "All" ? `(${professionals.length})` : ""}
              </button>
            ))}
          </div>
          {loading ? (
            <p className="text-sm text-[var(--ink-muted)] py-2">Loading…</p>
          ) : professionals.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-sm text-[var(--ink-muted)]">No professionals in your network yet.</p>
              <button type="button" className="mt-4 rounded-lg bg-[var(--blue)] px-4 py-2 text-sm font-semibold text-white hover:bg-[var(--blue-dark)]" onClick={() => setAddOpen(true)}>+ Add Professional</button>
            </div>
          ) : (
            <div className="space-y-0">
              {professionals
                .filter((p) => filter === "All" || (p.discipline && p.discipline.toLowerCase().includes(filter.toLowerCase().split(/[/\s]/)[0])))
                .map((pro) => (
                  <div key={pro.id} className="grid grid-cols-[auto_1fr_auto] gap-3 py-3 px-2 rounded-[var(--r)] border-b border-[var(--border)] last:border-0 items-center hover:bg-[var(--cream)]/50">
                    <div className="w-10 h-10 shrink-0 rounded-full bg-[var(--blue-glow)] text-[var(--blue)] flex items-center justify-center font-bold text-sm">{initials(pro.name)}</div>
                    <div className="min-w-0">
                      <div className="font-semibold text-[13px] text-[var(--ink)]">{pro.name}</div>
                      <div className="text-[11px] text-[var(--ink-muted)]">{[pro.facility, pro.discipline].filter(Boolean).join(" · ") || pro.email}</div>
                      {pro.discipline && (
                        <span className="inline-block mt-1 rounded px-2 py-0.5 text-[10px] font-semibold bg-[var(--teal-glow)] text-[var(--teal)]">{pro.discipline}</span>
                      )}
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <button type="button" className="rounded-lg bg-[var(--blue)] px-4 py-2 text-[11px] font-semibold text-white hover:bg-[var(--blue-dark)]" onClick={() => openSendCeModal(pro)}>CE</button>
                      <button type="button" className="rounded-lg border border-[var(--border)] bg-transparent px-4 py-2 text-[11px] font-semibold text-[var(--ink-soft)] hover:bg-[#F8FAFC]">Log</button>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      )}

      {tab === "ce-history" && (
        <div className="rounded-[12px] border border-[var(--border)] bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.08)]">
          <div className="border-b border-[var(--border)] pb-3 mb-4">
            <h2 className="font-[family-name:var(--font-fraunces)] text-base font-bold text-[var(--ink)]">CE History</h2>
            <p className="text-[11px] text-[var(--ink-muted)] mt-1">All CE courses you’ve sent to your network</p>
          </div>
          {ceHistoryLoading ? (
            <p className="text-sm text-[var(--ink-muted)] py-4">Loading…</p>
          ) : ceHistory.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-sm text-[var(--ink-muted)]">No CE sends yet.</p>
              <p className="mt-1 text-[13px] text-[var(--ink-soft)]">Use the Network tab to send a course to a professional.</p>
              <button type="button" className="mt-4 rounded-lg bg-[var(--blue)] px-4 py-2 text-sm font-semibold text-white hover:bg-[var(--blue-dark)]" onClick={() => setTab("network")}>Go to Network</button>
            </div>
          ) : (
            <>
              <div className="space-y-0">
                {(ceHistoryExpanded ? ceHistory : ceHistory.slice(0, 3)).map((row) => (
                <div key={row.id} className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_auto_auto_auto] gap-2 sm:gap-4 py-3 px-2 rounded-lg border-b border-[var(--border)] last:border-0 items-center hover:bg-[#F8FAFC]/50">
                  <div>
                    <div className="font-semibold text-[13px] text-[var(--ink)]">{row.professional_name}</div>
                    <div className="text-[11px] text-[var(--ink-muted)]">{row.course_name} ({row.course_hours} hrs) · {row.discount}</div>
                  </div>
                  <div className="text-[11px] text-[var(--ink-muted)]">
                    Sent {new Date(row.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                  </div>
                  <div>
                    {row.redeemed_at ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-[var(--green-glow)] px-2.5 py-0.5 text-[10px] font-bold text-[var(--green)]">Redeemed</span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-[var(--gold-glow)] px-2.5 py-0.5 text-[10px] font-bold text-[#B8860B]">Pending</span>
                    )}
                  </div>
                  <div>
                    <button
                      type="button"
                      disabled={reminderSending === row.id}
                      onClick={async () => {
                        setReminderSending(row.id);
                        try {
                          const res = await fetch("/api/ce/send-reminder", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            credentials: "include",
                            body: JSON.stringify({ ceSendId: row.id }),
                          });
                          const data = await res.json().catch(() => ({}));
                          if (!res.ok) alert(data.error ?? "Failed to send reminder");
                        } finally {
                          setReminderSending(null);
                        }
                      }}
                      className="rounded-lg border border-[var(--border)] bg-transparent px-4 py-2 text-[11px] font-semibold text-[var(--ink-soft)] hover:bg-[#F8FAFC] disabled:opacity-50"
                    >
                      {reminderSending === row.id ? "Sending…" : "Send Reminder"}
                    </button>
                  </div>
                </div>
              ))}
              </div>
              {ceHistory.length > 3 && !ceHistoryExpanded && (
                <div className="mt-4 pt-3 border-t border-[var(--border)]">
                  <button type="button" onClick={() => setCeHistoryExpanded(true)} className="rounded-lg border border-[var(--border)] bg-transparent px-4 py-2 text-sm font-semibold text-[var(--ink-soft)] hover:bg-[#F8FAFC]">
                    Show more ({ceHistory.length - 3} more)
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Send CE modal */}
      {sendCeOpen && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center bg-[var(--ink)]/50 backdrop-blur-sm" onClick={() => !sendCeSaving && setSendCeOpen(false)}>
          <div className="w-[92%] max-w-[480px] rounded-xl border border-[var(--border)] bg-white p-6 shadow-lg" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-start mb-4">
              <h3 className="font-[family-name:var(--font-fraunces)] text-lg font-extrabold text-[var(--ink)]">Send CE Course</h3>
              <button type="button" className="rounded-full bg-[var(--cream)] w-8 h-8 flex items-center justify-center text-[var(--ink-soft)] hover:bg-[var(--border)]" onClick={() => !sendCeSaving && setSendCeOpen(false)} aria-label="Close">×</button>
            </div>
            {sendCeSuccess ? (
              <p className="py-4 font-semibold text-[var(--green)]">CE sent successfully.</p>
            ) : (
              <form onSubmit={handleSendCe} className="grid gap-4">
                {!sendCePro && professionals.length > 1 && (
                  <div>
                    <label className="block text-[11px] font-semibold text-[var(--ink-soft)] mb-1">Send to</label>
                    <select
                      required
                      value={sendCePro?.id ?? ""}
                      onChange={(e) => setSendCePro(professionals.find((p) => p.id === e.target.value) ?? null)}
                      className="w-full rounded-[var(--r)] border border-[var(--border)] px-3 py-2 text-sm"
                    >
                      <option value="">Select professional…</option>
                      {professionals.map((p) => (
                        <option key={p.id} value={p.id}>{p.name} · {p.email}</option>
                      ))}
                    </select>
                  </div>
                )}
                {sendCePro && (
                  <p className="text-[13px] text-[var(--ink-muted)]">To: <strong className="text-[var(--ink)]">{sendCePro.name}</strong> ({sendCePro.email})</p>
                )}
                <div>
                  <label className="block text-[11px] font-semibold text-[var(--ink-soft)] mb-1">Course</label>
                  <select value={sendCeCourse} onChange={(e) => setSendCeCourse(e.target.value)} className="w-full rounded-[var(--r)] border border-[var(--border)] px-3 py-2 text-sm" required>
                    {CE_COURSES.map((c) => (
                      <option key={c.id} value={c.id}>{c.name} ({c.hours}hrs)</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-[var(--ink-soft)] mb-1">Discount</label>
                  <div className="flex flex-wrap gap-2">
                    {CE_DISCOUNTS.map((d) => (
                      <label key={d} className="flex items-center gap-1.5 cursor-pointer">
                        <input type="radio" name="discount" value={d} checked={sendCeDiscount === d} onChange={() => setSendCeDiscount(d)} className="rounded-full" />
                        <span className="text-sm">{d}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-[var(--ink-soft)] mb-1">Personal message (optional)</label>
                  <textarea value={sendCeMessage} onChange={(e) => setSendCeMessage(e.target.value)} placeholder="Add a note for the professional…" rows={3} className="w-full rounded-[var(--r)] border border-[var(--border)] px-3 py-2 text-sm resize-none" />
                </div>
                {sendCeError && <p className="text-sm text-[var(--coral)]">{sendCeError}</p>}
                <div className="flex gap-2 justify-end pt-1">
                  <button type="button" className="rounded-lg border border-[var(--border)] px-4 py-2 text-sm font-semibold text-[var(--ink-soft)] hover:bg-[#F8FAFC]" onClick={() => !sendCeSaving && setSendCeOpen(false)}>Cancel</button>
                  <button type="submit" disabled={sendCeSaving} className="rounded-lg bg-[var(--blue)] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">{sendCeSaving ? "Sending…" : "Send CE"}</button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Add Professional modal */}
      {addOpen && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center bg-[var(--ink)]/50 backdrop-blur-sm" onClick={() => !addSaving && setAddOpen(false)}>
          <div className="w-[92%] max-w-[560px] rounded-xl border border-[var(--border)] bg-white p-6 shadow-lg max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-start mb-4">
              <h3 className="font-[family-name:var(--font-fraunces)] text-lg font-extrabold text-[var(--ink)]">Add Professional</h3>
              <button type="button" className="rounded-full bg-[var(--cream)] w-8 h-8 flex items-center justify-center text-[var(--ink-soft)] hover:bg-[var(--border)]" onClick={() => !addSaving && setAddOpen(false)} aria-label="Close">×</button>
            </div>
            <form onSubmit={handleAddProfessional} className="grid gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-[var(--ink-soft)] mb-1">Name</label>
                <input type="text" required value={addForm.name} onChange={(e) => setAddForm((f) => ({ ...f, name: e.target.value }))} placeholder="Jennifer Lopez, RN" className="w-full rounded-[var(--r)] border border-[var(--border)] px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-[var(--ink-soft)] mb-1">Email</label>
                <input type="email" required value={addForm.email} onChange={(e) => setAddForm((f) => ({ ...f, email: e.target.value }))} placeholder="jennifer@hospital.com" className="w-full rounded-[var(--r)] border border-[var(--border)] px-3 py-2 text-sm" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-semibold text-[var(--ink-soft)] mb-1">Facility</label>
                  <input type="text" value={addForm.facility} onChange={(e) => setAddForm((f) => ({ ...f, facility: e.target.value }))} placeholder="St. Luke's Hospital" className="w-full rounded-[var(--r)] border border-[var(--border)] px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-[var(--ink-soft)] mb-1">Discipline</label>
                  <select value={addForm.discipline} onChange={(e) => setAddForm((f) => ({ ...f, discipline: e.target.value }))} className="w-full rounded-[var(--r)] border border-[var(--border)] px-3 py-2 text-sm">
                    <option value="">Select…</option>
                    <option value="Nursing">Nursing</option>
                    <option value="Social Work">Social Work</option>
                    <option value="Case Mgmt">Case Mgmt</option>
                    <option value="PT">PT</option>
                    <option value="OT">OT</option>
                    <option value="SLP">SLP</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-[var(--ink-soft)] mb-1">Phone</label>
                <input type="tel" value={addForm.phone} onChange={(e) => setAddForm((f) => ({ ...f, phone: e.target.value }))} placeholder="555-0100" className="w-full rounded-[var(--r)] border border-[var(--border)] px-3 py-2 text-sm" />
              </div>
              {addError && <p className="text-sm text-[var(--coral)]">{addError}</p>}
              <div className="flex gap-2 justify-end pt-2">
                <button type="button" className="rounded-lg border border-[var(--border)] px-4 py-2 text-sm font-semibold text-[var(--ink-soft)] hover:bg-[#F8FAFC]" onClick={() => !addSaving && setAddOpen(false)}>Cancel</button>
                <button type="submit" disabled={addSaving} className="rounded-lg bg-[var(--blue)] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">{addSaving ? "Saving…" : "Add"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
