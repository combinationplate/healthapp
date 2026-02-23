"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";

const TABS = [
  { id: "discover", label: "Discover" },
  { id: "requests", label: "Requests" },
  { id: "events", label: "Events" },
  { id: "distribute", label: "Distribute" },
  { id: "network", label: "Network" },
] as const;

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

  async function handleAddProfessional(e: React.FormEvent) {
    e.preventDefault();
    if (!repId) return;
    setAddSaving(true);
    setAddError(null);
    const supabase = createClient();
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

  return (
    <div className="space-y-6 pb-20">
      <h1 className="font-[family-name:var(--font-fraunces)] text-2xl font-extrabold text-[var(--ink)]">Your Dashboard</h1>
      <p className="text-[13px] text-[var(--ink-muted)] -mt-5 mb-6">Houston Territory, Texas</p>

      <div className="grid gap-3 grid-cols-[repeat(auto-fit,minmax(170px,1fr))] mb-6">
        {[
          { label: "Points", val: "248", note: "#1 on team", noteClass: "text-[var(--green)]" },
          { label: "Touchpoints", val: "24", note: "+6 this week", noteClass: "text-[var(--green)]" },
          { label: "CEs Sent", val: "12", note: "This month", noteClass: "text-[var(--blue)]" },
          { label: "Credits", val: "42", note: "Of 100", noteClass: "text-[var(--blue)]" },
          { label: "Events", val: "2", note: "Upcoming", noteClass: "text-[var(--blue)]" },
          { label: "Requests", val: "3", note: "Pending", noteClass: "text-[var(--coral)]" },
        ].map((s) => (
          <div key={s.label} className="rounded-[var(--r-lg)] border border-[var(--border)] bg-white p-5 transition-shadow hover:shadow-[var(--shadow)]">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-[var(--ink-muted)] mb-1">{s.label}</div>
            <div className="font-[family-name:var(--font-fraunces)] text-[28px] font-extrabold text-[var(--ink)]">{s.val}</div>
            <div className={`text-[11px] font-medium ${s.noteClass}`}>{s.note}</div>
          </div>
        ))}
      </div>

      {/* My Network section - always visible below stats */}
      <div className="rounded-[var(--r-xl)] border border-[var(--border)] bg-white p-6 mb-6">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--border)] pb-3 mb-4">
          <h2 className="font-[family-name:var(--font-fraunces)] text-base font-bold text-[var(--ink)]">My Network</h2>
          <div className="flex gap-1.5 flex-wrap">
            <button type="button" className="rounded-[var(--r)] border border-[var(--border)] bg-transparent px-3.5 py-1.5 text-xs font-semibold text-[var(--ink-soft)]" onClick={() => setTab("network")}>View all</button>
            <button type="button" className="rounded-[var(--r)] bg-[var(--blue)] px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-[var(--blue-dark)]" onClick={() => setAddOpen(true)}>+ Add Professional</button>
          </div>
        </div>
        {loading ? (
          <p className="text-sm text-[var(--ink-muted)]">Loading…</p>
        ) : professionals.length === 0 ? (
          <p className="text-sm text-[var(--ink-muted)] mb-2">No professionals in your network yet.</p>
        ) : (
          <div className="space-y-2">
            {professionals.slice(0, 5).map((pro) => (
              <div key={pro.id} className="grid grid-cols-[auto_1fr] gap-3 p-3 rounded-[var(--r-lg)] border border-[var(--border)] bg-[var(--cream)] items-center">
                <div className="w-[36px] h-[36px] rounded-full bg-[var(--blue-glow)] text-[var(--blue)] flex items-center justify-center font-bold text-xs">{initials(pro.name)}</div>
                <div>
                  <div className="font-bold text-[13px] text-[var(--ink)]">{pro.name}</div>
                  <div className="text-[11px] text-[var(--ink-muted)]">{[pro.facility, pro.discipline].filter(Boolean).join(" · ") || pro.email}</div>
                </div>
              </div>
            ))}
            {professionals.length > 5 && (
              <button type="button" className="text-xs font-semibold text-[var(--blue)] hover:underline" onClick={() => setTab("network")}>View all {professionals.length} professionals →</button>
            )}
          </div>
        )}
      </div>

      <div className="flex gap-1 mb-4 p-1 bg-[var(--cream)] rounded-[var(--r)] overflow-x-auto">
        {TABS.map((t) => (
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

      {tab === "discover" && (
        <div className="rounded-[var(--r-xl)] border border-[var(--border)] bg-white p-6">
          <div className="border-b border-[var(--border)] pb-3 mb-4">
            <h2 className="font-[family-name:var(--font-fraunces)] text-base font-bold text-[var(--ink)]">Professionals Seeking Resources</h2>
          </div>
          <div className="flex gap-1.5 flex-wrap mb-3.5">
            {["All", "Nursing", "Social Work", "Case Mgmt", "PT/OT/SLP"].map((f) => (
              <button key={f} type="button" onClick={() => setFilter(f)} className={`rounded-full px-3 py-1.5 text-[11px] font-semibold border border-[var(--border)] font-sans cursor-pointer ${filter === f ? "bg-[var(--blue)] text-white border-[var(--blue)]" : "bg-white text-[var(--ink-soft)]"}`}>{f}</button>
            ))}
          </div>
          {[
            { name: "Sarah Martinez, RN, BSN", meta: "Memorial Medical · Houston, TX", looking: "Ethics CE (2 hrs)", deadline: "March 31", tags: ["Nursing", "TX", "Hospital"] },
            { name: "Robert Taylor, MSW, LCSW", meta: "St. Luke's · Houston, TX", looking: "Mental Health CE (3 hrs)", deadline: "June 30", tags: ["Social Work", "TX"] },
            { name: "Lisa Wang, PT, DPT", meta: "Bayou City Rehab · Houston, TX", looking: "Patient Safety CE (2 hrs)", deadline: "April 15", tags: ["Physical Therapy", "TX"] },
          ].map((pro) => (
            <div key={pro.name} className="rounded-[var(--r-lg)] border border-[var(--border)] bg-[var(--cream)] p-4 mb-2.5">
              <div className="flex justify-between items-start gap-2 mb-2">
                <div>
                  <div className="font-bold text-[13px] text-[var(--ink)]">{pro.name}</div>
                  <div className="text-[11px] text-[var(--ink-muted)] mt-0.5">{pro.meta}</div>
                </div>
                <span className="rounded-full bg-[var(--green-glow)] px-2.5 py-0.5 text-[10px] font-bold text-[var(--green)]">Available</span>
              </div>
              <div className="text-xs text-[var(--ink-soft)] leading-relaxed mb-2.5"><strong className="text-[var(--ink)]">Looking for:</strong> {pro.looking} · <strong className="text-[var(--ink)]">Deadline:</strong> {pro.deadline}</div>
              <div className="flex gap-1.5 flex-wrap mb-2.5">
                {pro.tags.map((t) => (
                  <span key={t} className="rounded px-2 py-0.5 text-[10px] font-semibold bg-[var(--teal-glow)] text-[var(--teal)]">{t}</span>
                ))}
              </div>
              <div className="flex gap-1.5 flex-wrap">
                <button type="button" className="rounded-[var(--r)] bg-[var(--blue)] px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-[var(--blue-dark)]" onClick={() => alert("Invitation sent to " + pro.name)}>Invite</button>
                <button type="button" className="rounded-[var(--r)] border border-[var(--border)] bg-transparent px-3.5 py-1.5 text-xs font-semibold text-[var(--ink-soft)] hover:bg-[var(--cream)]">Profile</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === "requests" && (
        <div className="rounded-[var(--r-xl)] border border-[var(--border)] bg-white p-6">
          <div className="border-b border-[var(--border)] pb-3 mb-4">
            <h2 className="font-[family-name:var(--font-fraunces)] text-base font-bold text-[var(--ink)]">CE Requests</h2>
          </div>
          {[
            { name: "Jennifer Lopez, RN", meta: "St. Luke's · 2 hours ago", requested: "2 hrs Ethics", deadline: "End of month", badge: "New" },
            { name: "Michael Chen, MSW", meta: "Harmony Hospice · Yesterday", requested: "3 hrs Mental Health", deadline: "March 15", badge: "Pending" },
          ].map((r) => (
            <div key={r.name} className="rounded-[var(--r-lg)] border border-[var(--border)] bg-[var(--cream)] p-4 mb-2.5">
              <div className="flex justify-between items-start gap-2 mb-2">
                <div>
                  <div className="font-bold text-[13px] text-[var(--ink)]">{r.name}</div>
                  <div className="text-[11px] text-[var(--ink-muted)] mt-0.5">{r.meta}</div>
                </div>
                <span className="rounded-full bg-[var(--gold-glow)] px-2.5 py-0.5 text-[10px] font-bold text-[#B8860B]">{r.badge}</span>
              </div>
              <div className="text-xs text-[var(--ink-soft)] mb-2.5"><strong className="text-[var(--ink)]">Requested:</strong> {r.requested} · <strong className="text-[var(--ink)]">Deadline:</strong> {r.deadline}</div>
              <div className="flex gap-1.5 flex-wrap">
                <button type="button" className="rounded-[var(--r)] bg-[var(--blue)] px-3.5 py-1.5 text-xs font-semibold text-white" onClick={() => alert("Send CE modal")}>Send CE</button>
                <button type="button" className="rounded-[var(--r)] border border-[var(--border)] bg-transparent px-3.5 py-1.5 text-xs font-semibold text-[var(--ink-soft)]">Message</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === "events" && (
        <div className="rounded-[var(--r-xl)] border border-[var(--border)] bg-white p-6">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--border)] pb-3 mb-4">
            <h2 className="font-[family-name:var(--font-fraunces)] text-base font-bold text-[var(--ink)]">Your Events</h2>
            <button type="button" className="rounded-[var(--r)] bg-[var(--blue)] px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-[var(--blue-dark)]" onClick={() => alert("Plan Event modal")}>+ Plan Event</button>
          </div>
          {[
            { name: "Ethics Lunch & Learn", meta: "Feb 20, 12 PM · Memorial Medical", ce: "Ethics (2 hrs)", for: "Nursing, Social Work", rsvps: "12 RSVPs" },
            { name: "Palliative Care In-Service", meta: "Feb 27, 1 PM · St. Luke's", ce: "Palliative (3 hrs)", for: "Nursing, Case Mgmt", rsvps: "8 RSVPs" },
          ].map((e) => (
            <div key={e.name} className="rounded-[var(--r-lg)] border border-[var(--border)] bg-[var(--cream)] p-4 mb-2.5">
              <div className="flex justify-between items-start gap-2 mb-2">
                <div>
                  <div className="font-bold text-[13px] text-[var(--ink)]">{e.name}</div>
                  <div className="text-[11px] text-[var(--ink-muted)] mt-0.5">{e.meta}</div>
                </div>
                <span className="rounded-full bg-[var(--green-glow)] px-2.5 py-0.5 text-[10px] font-bold text-[var(--green)]">{e.rsvps}</span>
              </div>
              <div className="text-xs text-[var(--ink-soft)] mb-2"><strong className="text-[var(--ink)]">CE:</strong> {e.ce} · <strong className="text-[var(--ink)]">For:</strong> {e.for}</div>
              <div className="flex gap-1.5 flex-wrap">
                <button type="button" className="rounded-[var(--r)] border border-[var(--border)] bg-transparent px-3.5 py-1.5 text-xs font-semibold text-[var(--ink-soft)]">RSVPs</button>
                <button type="button" className="rounded-[var(--r)] border border-[var(--border)] bg-transparent px-3.5 py-1.5 text-xs font-semibold text-[var(--ink-soft)]">Remind</button>
                <button type="button" className="rounded-[var(--r)] bg-[var(--blue)] px-3.5 py-1.5 text-xs font-semibold text-white" onClick={() => alert("QR Code modal")}>QR Code</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === "distribute" && (
        <div className="space-y-4">
          <div className="rounded-[var(--r-xl)] border border-[var(--border)] bg-white p-6">
            <div className="border-b border-[var(--border)] pb-3 mb-4">
              <h2 className="font-[family-name:var(--font-fraunces)] text-base font-bold text-[var(--ink)]">Distribution Tools</h2>
            </div>
            <p className="text-xs text-[var(--ink-soft)] mb-4">QR codes, flyers, kiosk mode, and bulk send — get CEs into hands fast.</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
              {[
                { emoji: "📱", name: "My QR Code", meta: "Personal page" },
                { emoji: "📚", name: "Course QR", meta: "Specific course" },
                { emoji: "📅", name: "Event QR", meta: "Event RSVP" },
              ].map((c) => (
                <button key={c.name} type="button" className="rounded-[var(--r-lg)] border border-[var(--border)] bg-[var(--cream)] p-4 text-center transition-colors hover:border-[var(--border-hover)] cursor-pointer" onClick={() => alert("QR: " + c.name)}>
                  <span className="text-2xl block mb-1.5">{c.emoji}</span>
                  <div className="font-bold text-[13px] text-[var(--ink)]">{c.name}</div>
                  <div className="text-[11px] text-[var(--ink-muted)]">{c.meta}</div>
                </button>
              ))}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button type="button" className="rounded-[var(--r-lg)] border border-[var(--border)] bg-[var(--cream)] p-4 text-center cursor-pointer" onClick={() => alert("Generate Flyer")}>
                <span className="text-2xl block mb-1.5">📄</span>
                <div className="font-bold text-[13px] text-[var(--ink)]">Generate Flyer</div>
                <div className="text-[11px] text-[var(--ink-muted)]">PDF with QR</div>
              </button>
              <button type="button" className="rounded-[var(--r-lg)] border border-[var(--border)] bg-[var(--cream)] p-4 text-center cursor-pointer" onClick={() => alert("Kiosk Mode")}>
                <span className="text-2xl block mb-1.5">💻</span>
                <div className="font-bold text-[13px] text-[var(--ink)]">Kiosk Mode</div>
                <div className="text-[11px] text-[var(--ink-muted)]">Event sign-up</div>
              </button>
            </div>
          </div>
          <div className="rounded-[var(--r-xl)] border border-[var(--border)] bg-white p-6">
            <div className="border-b border-[var(--border)] pb-3 mb-4">
              <h2 className="font-[family-name:var(--font-fraunces)] text-base font-bold text-[var(--ink)]">Bulk Send</h2>
            </div>
            <div className="flex gap-1.5 flex-wrap">
              <button type="button" className="rounded-[var(--r)] bg-[var(--blue)] px-3.5 py-1.5 text-xs font-semibold text-white" onClick={() => alert("Select professionals, choose course, send to all.")}>Send to Group</button>
              <button type="button" className="rounded-[var(--r)] border border-[var(--border)] bg-transparent px-3.5 py-1.5 text-xs font-semibold text-[var(--ink-soft)]">Event Attendees</button>
              <button type="button" className="rounded-[var(--r)] border border-[var(--border)] bg-transparent px-3.5 py-1.5 text-xs font-semibold text-[var(--ink-soft)]">Import & Send</button>
            </div>
          </div>
        </div>
      )}

      {tab === "network" && (
        <div className="rounded-[var(--r-xl)] border border-[var(--border)] bg-white p-6">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--border)] pb-3 mb-4">
            <h2 className="font-[family-name:var(--font-fraunces)] text-base font-bold text-[var(--ink)]">My Network</h2>
            <div className="flex gap-1.5 flex-wrap">
              <button type="button" className="rounded-[var(--r)] border border-[var(--border)] bg-transparent px-3.5 py-1.5 text-xs font-semibold text-[var(--ink-soft)]">Import CSV</button>
              <button type="button" className="rounded-[var(--r)] bg-[var(--blue)] px-3.5 py-1.5 text-xs font-semibold text-white" onClick={() => setAddOpen(true)}>+ Add</button>
            </div>
          </div>
          <div className="flex gap-1.5 flex-wrap mb-3.5">
            {["All", "Nursing", "Social Work", "Case Mgmt", "PT/OT/SLP"].map((f) => (
              <button key={f} type="button" onClick={() => setFilter(f)} className={`rounded-full px-3 py-1.5 text-[11px] font-semibold border border-[var(--border)] ${filter === f ? "bg-[var(--blue)] text-white border-[var(--blue)]" : "bg-white text-[var(--ink-soft)]"}`}>
                {f} {f === "All" ? `(${professionals.length})` : ""}
              </button>
            ))}
          </div>
          {loading ? (
            <p className="text-sm text-[var(--ink-muted)]">Loading…</p>
          ) : professionals.length === 0 ? (
            <p className="text-sm text-[var(--ink-muted)]">No professionals in your network yet. Click &quot;+ Add&quot; to add one.</p>
          ) : (
            professionals
              .filter((p) => filter === "All" || (p.discipline && p.discipline.toLowerCase().includes(filter.toLowerCase().split(/[/\s]/)[0])))
              .map((pro) => (
                <div key={pro.id} className="grid grid-cols-[auto_1fr_auto] gap-3 p-3.5 rounded-[var(--r-lg)] border border-[var(--border)] bg-[var(--cream)] items-center mb-2">
                  <div className="w-[38px] h-[38px] rounded-full bg-[var(--blue-glow)] text-[var(--blue)] flex items-center justify-center font-bold text-xs">{initials(pro.name)}</div>
                  <div>
                    <div className="font-bold text-[13px] text-[var(--ink)]">{pro.name}</div>
                    <div className="text-[11px] text-[var(--ink-muted)] flex gap-2 flex-wrap">
                      {[pro.facility, pro.discipline].filter(Boolean).join(" · ") || pro.email}
                    </div>
                    {pro.discipline && (
                      <div className="flex gap-1.5 flex-wrap mt-1">
                        <span className="rounded px-2 py-0.5 text-[10px] font-semibold bg-[var(--teal-glow)] text-[var(--teal)]">{pro.discipline}</span>
                      </div>
                    )}
                  </div>
                  <div className="flex gap-1 flex-wrap">
                    <button type="button" className="rounded-[var(--r)] bg-[var(--blue)] px-3.5 py-1.5 text-xs font-semibold text-white">CE</button>
                    <button type="button" className="rounded-[var(--r)] border border-[var(--border)] bg-transparent px-3.5 py-1.5 text-xs font-semibold text-[var(--ink-soft)]">Log</button>
                  </div>
                </div>
              ))
          )}
        </div>
      )}

      {/* Add Professional modal */}
      {addOpen && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center bg-[var(--ink)]/50 backdrop-blur-sm" onClick={() => !addSaving && setAddOpen(false)}>
          <div className="w-[92%] max-w-[560px] rounded-[var(--r-xl)] border border-[var(--border)] bg-white p-6 shadow-lg max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
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
                <button type="button" className="rounded-[var(--r)] border border-[var(--border)] px-4 py-2 text-sm font-semibold text-[var(--ink-soft)]" onClick={() => !addSaving && setAddOpen(false)}>Cancel</button>
                <button type="submit" disabled={addSaving} className="rounded-[var(--r)] bg-[var(--blue)] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">{addSaving ? "Saving…" : "Add"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
