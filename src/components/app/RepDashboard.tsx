"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { createClient } from "../../../lib/supabase/client";
import { StatCard, StatsGrid, PageShell, SectionCard, TabBar } from "./DashboardShell";

const TABS = [
  { id: "discover", label: "Discover" },
  { id: "requests", label: "Requests" },
  { id: "distribute", label: "Distribute" },
  { id: "network", label: "Network" },
  { id: "ce-history", label: "CE History" },
] as const;

const CE_DISCOUNTS = ["100% Free"] as const;

const BTN_PRIMARY = "rounded-lg bg-[var(--blue)] px-5 py-2 text-sm font-semibold text-white hover:bg-[var(--blue-dark)] transition-colors shadow-sm";
const BTN_SECONDARY = "rounded-lg border border-[var(--border)] bg-white px-5 py-2 text-sm font-semibold text-[var(--ink-soft)] hover:bg-[#F8FAFC] transition-colors";

const US_STATES = [
  "AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA",
  "HI","ID","IL","IN","IA","KS","KY","LA","ME","MD",
  "MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ",
  "NM","NY","NC","ND","OH","OK","OR","PA","RI","SC",
  "SD","TN","TX","UT","VT","VA","WA","WV","WI","WY","DC",
];

const DISCIPLINE_MAP: Record<string, string> = {
  "Nursing": "Nursing",
  "Social Work": "Social Work",
  "Case Mgmt": "Case Management",
  "PT": "PT",
  "OT": "OT",
  "SLP": "ST",
  "ST": "ST",
};

function mapDiscipline(discipline: string | null | undefined): string | null {
  if (!discipline) return null;
  return DISCIPLINE_MAP[discipline] ?? discipline;
}

type RepTab = (typeof TABS)[number]["id"];

type CourseRow = {
  id: string;
  name: string;
  hours: number;
  price: number;
  topic: string | null;
  product_id: number | null;
};

type CourseProfessionRow = {
  profession: string;
  courses: CourseRow | CourseRow[] | null;
};

type NormalizedCourseProfessionRow = {
  profession: string;
  courses: CourseRow;
};

export type ProfessionalRow = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  facility: string | null;
  city: string | null;
  state: string | null;
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

const NATIONALLY_APPROVED = new Set(["Nursing", "Case Management"]);

function ApprovalBadge({
  profession,
  proState,
  course,
  approvalMap,
}: {
  profession: string;
  proState: string | null;
  course: CourseRow;
  approvalMap: Record<string, string>;
}) {
  if (!proState) {
    if (NATIONALLY_APPROVED.has(profession)) {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-[var(--green-glow)] px-2 py-0.5 text-[10px] font-semibold text-[var(--green)] whitespace-nowrap">
          ✅ Nationally approved
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-[var(--gold-glow)] px-2 py-0.5 text-[10px] font-semibold text-[#B8860B] whitespace-nowrap">
        ⚠️ Add state to verify
      </span>
    );
  }

  const status = approvalMap[profession];
  if (!status) return null;

  if (status === "approved") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-[var(--green-glow)] px-2 py-0.5 text-[10px] font-semibold text-[var(--green)] whitespace-nowrap">
        ✅ Approved in {proState}
      </span>
    );
  }

  return (
    <span className="flex flex-col gap-0.5 items-end">
      <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-semibold text-red-600 whitespace-nowrap">
        ❌ Not approved in {proState}
      </span>
      {course.product_id && (
        <a
          href={`https://hiscornerstone.com/?p=${course.product_id}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[10px] text-[var(--blue)] hover:underline"
        >
          View details ↗
        </a>
      )}
    </span>
  );
}

export function RepDashboard({ repId }: { repId?: string }) {
  const [tab, setTab] = useState<RepTab>("discover");
  const [filter, setFilter] = useState("All");
  const [professionals, setProfessionals] = useState<ProfessionalRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [addForm, setAddForm] = useState({
    name: "", email: "", phone: "", facility: "", city: "", state: "", discipline: "",
  });
  const [addSaving, setAddSaving] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);
  const [sendCeOpen, setSendCeOpen] = useState(false);
  const [sendCePro, setSendCePro] = useState<ProfessionalRow | null>(null);
  const [sendCeCourse, setSendCeCourse] = useState<string>("");
  const [sendCeDiscount, setSendCeDiscount] = useState<string>(CE_DISCOUNTS[0]);
  const [sendCeMessage, setSendCeMessage] = useState("");
  const [sendCeSaving, setSendCeSaving] = useState(false);
  const [sendCeError, setSendCeError] = useState<string | null>(null);
  const [sendCeSuccess, setSendCeSuccess] = useState(false);
  const [ceHistory, setCeHistory] = useState<CeHistoryRow[]>([]);
  const [ceHistoryLoading, setCeHistoryLoading] = useState(false);
  const [ceHistoryExpanded, setCeHistoryExpanded] = useState(false);
  const [reminderSending, setReminderSending] = useState<string | null>(null);
  const [availableCourses, setAvailableCourses] = useState<NormalizedCourseProfessionRow[]>([]);
  const [availableCoursesLoading, setAvailableCoursesLoading] = useState(false);
  const [professionApproval, setProfessionApproval] = useState<Record<string, string>>({});

  const fetchProfessionals = useCallback(async () => {
    if (!repId) return;
    setLoading(true);
    const supabase = createClient();
    const { data, error } = await supabase
      .from("professionals")
      .select("id, name, email, phone, facility, city, state, discipline, rep_id, created_at")
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

  // Compute state approval badges whenever the selected professional or loaded courses change
  useEffect(() => {
    if (!sendCeOpen || !sendCePro || !availableCourses.length) return;
    let cancelled = false;

    async function computeApprovals() {
      const supabase = createClient();
      const mappedDiscipline = mapDiscipline(sendCePro!.discipline);
      const relevantProfessions = mappedDiscipline
        ? [mappedDiscipline]
        : [...new Set(availableCourses.map((r) => r.profession))];

      const approvals: Record<string, string> = {};

      for (const profession of relevantProfessions) {
        if (!sendCePro!.state) {
          approvals[profession] = NATIONALLY_APPROVED.has(profession) ? "national" : "no-state";
        } else {
          const { data } = await supabase
            .from("discipline_states")
            .select("state")
            .eq("profession", profession)
            .eq("state", sendCePro!.state);
          if (cancelled) return;
          approvals[profession] = data && data.length > 0 ? "approved" : "not-approved";
        }
      }

      if (!cancelled) setProfessionApproval(approvals);
    }

    computeApprovals();
    return () => { cancelled = true; };
  }, [sendCeOpen, sendCePro, availableCourses]);

  // Deduplicated courses filtered to the selected professional's discipline
  const filteredCourses = useMemo(() => {
    if (!availableCourses.length) return [];
    const mappedDiscipline = sendCePro ? mapDiscipline(sendCePro.discipline) : null;
    const rows = mappedDiscipline
      ? availableCourses.filter((r) => r.profession === mappedDiscipline)
      : availableCourses;
    const seen = new Set<string>();
    const result: { course: CourseRow; profession: string }[] = [];
    for (const row of rows) {
      if (!seen.has(row.courses.id)) {
        seen.add(row.courses.id);
        result.push({ course: row.courses, profession: row.profession });
      }
    }
    return result;
  }, [availableCourses, sendCePro]);

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
      city: addForm.city.trim() || null,
      state: addForm.state.trim() || null,
      discipline: addForm.discipline.trim() || null,
    });
    setAddSaving(false);
    if (error) {
      setAddError(error.message);
      return;
    }
    setAddForm({ name: "", email: "", phone: "", facility: "", city: "", state: "", discipline: "" });
    setAddOpen(false);
    fetchProfessionals();
  }

  async function openSendCeModal(pro: ProfessionalRow | null) {
    const resolvedPro = pro ?? (professionals.length === 1 ? professionals[0] : null);
    setSendCePro(resolvedPro);
    setSendCeCourse("");
    setSendCeDiscount(CE_DISCOUNTS[0]);
    setSendCeMessage("");
    setSendCeError(null);
    setSendCeSuccess(false);
    setAvailableCourses([]);
    setProfessionApproval({});
    setSendCeOpen(true);

    setAvailableCoursesLoading(true);
    try {
      const supabase = createClient();
      const { data } = await supabase
        .from("course_professions")
        .select("profession, courses(id, name, hours, price, topic, product_id)");
      const rows = ((data as CourseProfessionRow[]) ?? [])
        .map((r) => ({
          ...r,
          courses: Array.isArray(r.courses) ? r.courses[0] : r.courses,
        }))
        .filter((r): r is NormalizedCourseProfessionRow => r.courses != null);
      rows.sort((a, b) => a.courses.name.localeCompare(b.courses.name));
      setAvailableCourses(rows);
    } finally {
      setAvailableCoursesLoading(false);
    }
  }

  async function handleSendCe(e: React.FormEvent) {
    e.preventDefault();
    if (professionals.length > 1 && !sendCePro) {
      setSendCeError("Select a professional.");
      return;
    }
    if (!sendCeCourse) {
      setSendCeError("Please select a course.");
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
    <PageShell>
      <div className="space-y-6 pb-20 pt-6">
        <div>
          <h1 className="font-[family-name:var(--font-fraunces)] text-2xl font-extrabold text-[var(--ink)]">Your Dashboard</h1>
          <p className="mt-1 text-[13px] text-[var(--ink-muted)]">Manage your network and send CE courses</p>
        </div>

        <div className="rounded-xl bg-white border border-[var(--border)] p-4 shadow-[0_1px_3px_rgba(0,0,0,0.08)]">
          <StatsGrid>
            <StatCard label="Touchpoints" value={professionals.length * 2} note="This week" noteClass="text-[var(--blue)]" />
            <StatCard label="CEs Sent" value={ceHistory.length} note="Total" noteClass="text-[var(--green)]" />
            <StatCard label="Credits" value={ceHistory.length} note="CE sends" noteClass="text-[var(--blue)]" />
            <StatCard label="Requests" value="0" note="Pending" noteClass="text-[var(--coral)]" />
          </StatsGrid>
        </div>

        <TabBar tabs={[...TABS]} active={tab} onChange={(id) => setTab(id as RepTab)} />

        {tab === "discover" && (
          <SectionCard>
            <div className="border-b border-[var(--border)] pb-3 mb-4">
              <h2 className="font-[family-name:var(--font-fraunces)] text-base font-bold text-[var(--ink)]">Professionals Seeking Resources</h2>
              <p className="mt-1 text-[11px] text-[var(--ink-muted)]">Professionals looking for CE will appear here</p>
            </div>
            <div className="py-8 text-center">
              <p className="text-sm text-[var(--ink-muted)]">No professionals seeking resources right now.</p>
              <p className="mt-1 text-[13px] text-[var(--ink-soft)]">Check back later or add professionals to your network to send them CEs.</p>
              <button type="button" className={`mt-4 ${BTN_PRIMARY}`} onClick={() => setTab("network")}>View My Network</button>
            </div>
          </SectionCard>
        )}

        {tab === "requests" && (
          <SectionCard>
            <div className="border-b border-[var(--border)] pb-3 mb-4">
              <h2 className="font-[family-name:var(--font-fraunces)] text-base font-bold text-[var(--ink)]">CE Requests</h2>
              <p className="mt-1 text-[11px] text-[var(--ink-muted)]">Requests from professionals will appear here</p>
            </div>
            <div className="py-8 text-center">
              <p className="text-sm text-[var(--ink-muted)]">No pending CE requests.</p>
              <button type="button" className={`mt-4 ${BTN_PRIMARY}`} onClick={() => setTab("network")}>View My Network</button>
            </div>
          </SectionCard>
        )}

        {tab === "distribute" && (
          <div className="space-y-6">
            <SectionCard>
              <div className="border-b border-[var(--border)] pb-3 mb-4">
                <h2 className="font-[family-name:var(--font-fraunces)] text-base font-bold text-[var(--ink)]">Distribution Tools</h2>
              </div>
              <p className="text-xs text-[var(--ink-soft)] mb-4">QR codes, flyers, kiosk mode, and bulk send.</p>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 mb-4">
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
            </SectionCard>
            <SectionCard>
              <div className="border-b border-[var(--border)] pb-3 mb-4">
                <h2 className="font-[family-name:var(--font-fraunces)] text-base font-bold text-[var(--ink)]">Bulk Send</h2>
              </div>
              <div className="flex gap-2 flex-wrap">
                <button type="button" className={BTN_PRIMARY} onClick={() => alert("Select professionals, choose course, send to all.")}>Send to Group</button>
                <button type="button" className={BTN_SECONDARY}>Event Attendees</button>
                <button type="button" className={BTN_SECONDARY}>Import & Send</button>
              </div>
            </SectionCard>
          </div>
        )}

        {tab === "network" && (
          <SectionCard>
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--border)] pb-3 mb-4">
              <h2 className="font-[family-name:var(--font-fraunces)] text-base font-bold text-[var(--ink)]">My Network</h2>
              <div className="flex gap-2 flex-wrap">
                <button type="button" className={BTN_SECONDARY}>Import CSV</button>
                <button type="button" className={BTN_PRIMARY} onClick={() => setAddOpen(true)}>+ Add Professional</button>
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
                <button
                  type="button"
                  className={`mt-4 ${BTN_PRIMARY}`}
                  onClick={() => setAddOpen(true)}
                >
                  + Add Professional
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {professionals
                  .filter(
                    (p) =>
                      filter === "All" ||
                      (p.discipline &&
                        p.discipline.toLowerCase().includes(filter.toLowerCase().split(/[/\s]/)[0]))
                  )
                  .map((pro) => (
                    <div
                      key={pro.id}
                      className="rounded-xl border border-[var(--border)] bg-white p-4 shadow-[0_1px_3px_rgba(0,0,0,0.06)] grid grid-cols-[auto_1fr_auto] gap-3 items-center"
                    >
                      <div className="w-10 h-10 shrink-0 rounded-full bg-[var(--blue-glow)] text-[var(--blue)] flex items-center justify-center font-bold text-sm">
                        {initials(pro.name)}
                      </div>
                      <div className="min-w-0 space-y-1">
                        <div className="font-semibold text-[13px] text-[var(--ink)]">{pro.name}</div>
                        {pro.facility && (
                          <div className="text-[11px] text-[var(--ink-muted)]">
                            <strong className="text-[var(--ink)]">Facility:</strong> {pro.facility}
                          </div>
                        )}
                        {(pro.city || pro.state) && (
                          <div className="text-[11px] text-[var(--ink-muted)]">
                            <strong className="text-[var(--ink)]">Location:</strong>{" "}
                            {[pro.city, pro.state].filter(Boolean).join(", ")}
                          </div>
                        )}
                        {pro.discipline && (
                          <div className="text-[11px] text-[var(--ink-muted)]">
                            <strong className="text-[var(--ink)]">Discipline:</strong> {pro.discipline}
                          </div>
                        )}
                      </div>
                      <div className="flex gap-2 shrink-0">
                        <button
                          type="button"
                          className={BTN_PRIMARY}
                          onClick={() => openSendCeModal(pro)}
                        >
                          Send CE
                        </button>
                        <button
                          type="button"
                          className={BTN_SECONDARY}
                        >
                          Log Touchpoint
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </SectionCard>
        )}

        {tab === "ce-history" && (
          <SectionCard>
            <div className="border-b border-[var(--border)] pb-3 mb-4">
              <h2 className="font-[family-name:var(--font-fraunces)] text-base font-bold text-[var(--ink)]">CE History</h2>
              <p className="text-[11px] text-[var(--ink-muted)] mt-1">All CE courses you&apos;ve sent to your network</p>
            </div>
            {ceHistoryLoading ? (
              <p className="text-sm text-[var(--ink-muted)] py-4">Loading…</p>
            ) : ceHistory.length === 0 ? (
              <div className="py-8 text-center">
                <p className="text-sm text-[var(--ink-muted)]">No CE sends yet.</p>
                <p className="mt-1 text-[13px] text-[var(--ink-soft)]">Use the Network tab to send a course to a professional.</p>
                <button type="button" className={`mt-4 ${BTN_PRIMARY}`} onClick={() => setTab("network")}>Go to Network</button>
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
                          className={`${BTN_SECONDARY} disabled:opacity-50`}
                        >
                          {reminderSending === row.id ? "Sending…" : "Send Reminder"}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                {ceHistory.length > 3 && !ceHistoryExpanded && (
                  <div className="mt-4 pt-3 border-t border-[var(--border)]">
                    <button type="button" onClick={() => setCeHistoryExpanded(true)} className={BTN_SECONDARY}>
                      Show more ({ceHistory.length - 3} more)
                    </button>
                  </div>
                )}
              </>
            )}
          </SectionCard>
        )}

        {/* Send CE modal */}
        {sendCeOpen && (
          <div className="fixed inset-0 z-[300] flex items-center justify-center bg-[var(--ink)]/50 backdrop-blur-sm" onClick={() => !sendCeSaving && setSendCeOpen(false)}>
            <div className="w-[92%] max-w-[520px] rounded-xl border border-[var(--border)] bg-white p-6 shadow-lg max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
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
                        value=""
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
                    <p className="text-[13px] text-[var(--ink-muted)]">
                      To: <strong className="text-[var(--ink)]">{sendCePro.name}</strong> ({sendCePro.email})
                      {sendCePro.discipline && (
                        <span className="ml-2 text-[11px] text-[var(--ink-soft)]">· {sendCePro.discipline}{sendCePro.state ? `, ${sendCePro.state}` : ""}</span>
                      )}
                    </p>
                  )}

                  {/* Course card list */}
                  <div>
                    <label className="block text-[11px] font-semibold text-[var(--ink-soft)] mb-2">Select Course</label>
                    {availableCoursesLoading ? (
                      <div className="flex items-center justify-center py-8 text-sm text-[var(--ink-muted)]">
                        <svg className="animate-spin mr-2 h-4 w-4 text-[var(--blue)]" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                        </svg>
                        Loading courses…
                      </div>
                    ) : filteredCourses.length === 0 ? (
                      <p className="py-4 text-center text-sm text-[var(--ink-muted)]">No courses available.</p>
                    ) : (
                      <div className="max-h-[280px] overflow-y-auto space-y-2 pr-1">
                        {filteredCourses.map(({ course, profession }) => (
                          <div
                            key={course.id}
                            onClick={() => setSendCeCourse(course.id)}
                            className={`cursor-pointer rounded-lg border p-3 flex items-start gap-3 justify-between transition-colors ${
                              sendCeCourse === course.id
                                ? "border-[var(--blue)] bg-[var(--blue-glow)]"
                                : "border-[var(--border)] bg-white hover:bg-[#F8FAFC]"
                            }`}
                          >
                            <div className="min-w-0">
                              <div className="font-semibold text-[13px] text-[var(--ink)]">{course.name}</div>
                              <div className="text-[11px] text-[var(--ink-muted)] mt-0.5">
                                {course.hours} hr{course.hours !== 1 ? "s" : ""}
                                {course.price != null ? ` · $${course.price}` : ""}
                                {course.topic ? ` · ${course.topic}` : ""}
                              </div>
                            </div>
                            <div className="shrink-0 mt-0.5">
                              <ApprovalBadge
                                profession={profession}
                                proState={sendCePro?.state ?? null}
                                course={course}
                                approvalMap={professionApproval}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
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
                    <button type="button" className={BTN_SECONDARY} onClick={() => !sendCeSaving && setSendCeOpen(false)}>Cancel</button>
                    <button type="submit" disabled={sendCeSaving || !sendCeCourse} className={`${BTN_PRIMARY} disabled:opacity-60`}>{sendCeSaving ? "Sending…" : "Send CE"}</button>
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
                    <label className="block text-[11px] font-semibold text-[var(--ink-soft)] mb-1">City</label>
                    <input type="text" value={addForm.city} onChange={(e) => setAddForm((f) => ({ ...f, city: e.target.value }))} placeholder="Chicago" className="w-full rounded-[var(--r)] border border-[var(--border)] px-3 py-2 text-sm" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
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
                  <div>
                    <label className="block text-[11px] font-semibold text-[var(--ink-soft)] mb-1">State</label>
                    <select value={addForm.state} onChange={(e) => setAddForm((f) => ({ ...f, state: e.target.value }))} className="w-full rounded-[var(--r)] border border-[var(--border)] px-3 py-2 text-sm">
                      <option value="">Select…</option>
                      {US_STATES.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-[var(--ink-soft)] mb-1">Phone</label>
                  <input type="tel" value={addForm.phone} onChange={(e) => setAddForm((f) => ({ ...f, phone: e.target.value }))} placeholder="555-0100" className="w-full rounded-[var(--r)] border border-[var(--border)] px-3 py-2 text-sm" />
                </div>
                {addError && <p className="text-sm text-[var(--coral)]">{addError}</p>}
                <div className="flex gap-2 justify-end pt-2">
                  <button type="button" className={BTN_SECONDARY} onClick={() => !addSaving && setAddOpen(false)}>Cancel</button>
                  <button type="submit" disabled={addSaving} className={`${BTN_PRIMARY} disabled:opacity-60`}>{addSaving ? "Saving…" : "Add"}</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </PageShell>
  );
}
