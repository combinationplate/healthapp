"use client";

import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import html2canvas from "html2canvas";
import { createClient } from "../../../lib/supabase/client";
import { StatCard, StatsGrid, PageShell, SectionCard, TabBar } from "./DashboardShell";

const TABS = [
  { id: "distribute", label: "Distribute" },
  { id: "discover", label: "Discover" },
  { id: "network", label: "Network" },
  { id: "requests", label: "Requests" },
  { id: "events", label: "Events" },
  { id: "ce-history", label: "CE History" },
  { id: "billing", label: "Billing" },
] as const;

const CE_DISCOUNTS = ["100% Free"] as const;

const BTN_PRIMARY = "rounded-xl bg-[var(--blue)] px-5 py-2.5 text-[13px] font-semibold text-white hover:bg-[var(--blue-dark)] active:scale-[0.98] transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed";
const BTN_SECONDARY = "rounded-xl border border-[var(--border)] bg-white px-5 py-2.5 text-[13px] font-semibold text-[var(--ink-soft)] hover:bg-[var(--cream)] active:scale-[0.98] transition-all disabled:opacity-50";

const US_STATES = [
  "AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA",
  "HI","ID","IL","IN","IA","KS","KY","LA","ME","MD",
  "MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ",
  "NM","NY","NC","ND","OH","OK","OR","PA","RI","SC",
  "SD","TN","TX","UT","VT","VA","WA","WV","WI","WY","DC",
];

const QR_DISCIPLINE_OPTIONS = ["All", "Nursing", "Social Work", "Case Management", "PT", "OT", "ST"] as const;

const STATE_NAMES: Record<string, string> = {
  AL:"Alabama",AK:"Alaska",AZ:"Arizona",AR:"Arkansas",CA:"California",
  CO:"Colorado",CT:"Connecticut",DE:"Delaware",FL:"Florida",GA:"Georgia",
  HI:"Hawaii",ID:"Idaho",IL:"Illinois",IN:"Indiana",IA:"Iowa",KS:"Kansas",
  KY:"Kentucky",LA:"Louisiana",ME:"Maine",MD:"Maryland",MA:"Massachusetts",
  MI:"Michigan",MN:"Minnesota",MS:"Mississippi",MO:"Missouri",MT:"Montana",
  NE:"Nebraska",NV:"Nevada",NH:"New Hampshire",NJ:"New Jersey",NM:"New Mexico",
  NY:"New York",NC:"North Carolina",ND:"North Dakota",OH:"Ohio",OK:"Oklahoma",
  OR:"Oregon",PA:"Pennsylvania",RI:"Rhode Island",SC:"South Carolina",
  SD:"South Dakota",TN:"Tennessee",TX:"Texas",UT:"Utah",VT:"Vermont",
  VA:"Virginia",WA:"Washington",WV:"West Virginia",WI:"Wisconsin",WY:"Wyoming",
  DC:"DC"
};


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
  professional_id: string | null;
  professional_name: string;
  recipient_email: string | null;
  course_name: string;
  course_hours: number;
  coupon_code: string | null;
  source: string | null;
  created_at: string;
  clicked_at: string | null;
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
        <span className="inline-flex items-center gap-1 rounded-full bg-green-50 border border-green-200 px-2.5 py-0.5 text-[11px] font-semibold text-green-700 whitespace-nowrap">
          Nationally approved
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-yellow-50 border border-yellow-200 px-2.5 py-0.5 text-[11px] font-semibold text-yellow-700 whitespace-nowrap">
        Add state to verify
      </span>
    );
  }

  const status = approvalMap[profession];
  if (!status) return null;

  if (status === "approved") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-green-50 border border-green-200 px-2.5 py-0.5 text-[11px] font-semibold text-green-700 whitespace-nowrap">
        Approved in {proState}
      </span>
    );
  }

  return (
    <span className="flex flex-col gap-0.5 items-end">
      <span className="inline-flex items-center gap-1 rounded-full bg-red-50 border border-red-200 px-2.5 py-0.5 text-[11px] font-semibold text-red-700 whitespace-nowrap">
        Not approved in {proState}
      </span>
      {course.product_id && (
        <a
          href={`https://hiscornerstone.com/?p=${course.product_id}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[10px] text-[var(--blue)] hover:underline mt-0.5"
        >
          View details ↗
        </a>
      )}
    </span>
  );
}

export function RepDashboard({ repId }: { repId?: string }) {
  const [tab, setTab] = useState<RepTab>("distribute");
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

  // ── Events ──
  const [events, setEvents] = useState<any[]>([]);
  const [eventsLoading, setEventsLoading] = useState(false);
  const [createEventOpen, setCreateEventOpen] = useState(false);
  const [eventForm, setEventForm] = useState({
    title: "", description: "", eventType: "lunch_and_learn",
    externalUrl: "", locationName: "", address: "", city: "", state: "",
    startsAt: "", startsAtTime: "12:00", durationMinutes: "60",
    maxCapacity: "", visibility: "network",
  });
  const [eventSaving, setEventSaving] = useState(false);
  const [inviteModalEvent, setInviteModalEvent] = useState<any>(null);
  const [inviteSelectedPros, setInviteSelectedPros] = useState<string[]>([]);
  const [inviteGuestRows, setInviteGuestRows] = useState([{ name: "", email: "" }]);
  const [inviteSending, setInviteSending] = useState(false);
  const [inviteResults, setInviteResults] = useState<any>(null);

  // Billing state
  const [billingUsage, setBillingUsage] = useState<any>(null);
  const [billingUsageLoading, setBillingUsageLoading] = useState(false);
  const [billingInvoices, setBillingInvoices] = useState<any[]>([]);
  const [billingSettings, setBillingSettings] = useState<any>(null);
  const [billingSetupForm, setBillingSetupForm] = useState<{ billingType: "org" | "rep"; billingEmail: string; orgName: string }>({
    billingType: "rep",
    billingEmail: "",
    orgName: "",
  });
  const [billingSetupSaving, setBillingSetupSaving] = useState(false);
  const [sendCeCourse, setSendCeCourse] = useState<string>("");
  const [sendCeDiscount, setSendCeDiscount] = useState<string>(CE_DISCOUNTS[0]);
  const [sendCeMessage, setSendCeMessage] = useState("");
  const [sendCeAddToNetwork, setSendCeAddToNetwork] = useState(true);
  const [sendCeSaving, setSendCeSaving] = useState(false);
  const [sendCeError, setSendCeError] = useState<string | null>(null);
  const [sendCeSuccess, setSendCeSuccess] = useState(false);
  const [activeRequestId, setActiveRequestId] = useState<string | null>(null);
  const [courseTopicFilter, setCourseTopicFilter] = useState("All");
  const [courseSearch, setCourseSearch] = useState("");
  const [ceHistory, setCeHistory] = useState<CeHistoryRow[]>([]);
  const [ceHistoryLoading, setCeHistoryLoading] = useState(false);
  const [ceHistoryFilter, setCeHistoryFilter] = useState<"all" | "manual" | "qr" | "bulk">("all");
  const [reminderSending, setReminderSending] = useState<string | null>(null);
  const [availableCourses, setAvailableCourses] = useState<NormalizedCourseProfessionRow[]>([]);
  const [availableCoursesLoading, setAvailableCoursesLoading] = useState(false);
  const [professionApproval, setProfessionApproval] = useState<Record<string, string>>({});
  const [repStats, setRepStats] = useState({
    touchpointsThisWeek: 0,
    cesSentThisMonth: 0,
    cesSentAllTime: 0,
    redeemed: 0,
    requests: 0,
  });
  const [repOnboarding, setRepOnboarding] = useState(false);
  const [repOnboardingForm, setRepOnboardingForm] = useState({ state: "", city: "", orgName: "" });
  const [repOnboardingSaving, setRepOnboardingSaving] = useState(false);
  const [onboardingDismissed, setOnboardingDismissed] = useState(false);
  const [repRequests, setRepRequests] = useState<{
    id: string;
    topic: string;
    hours: number;
    deadline: string;
    status: string;
    created_at: string;
    professionalName: string;
    discipline: string | null;
    facility: string | null;
    city: string | null;
    state: string | null;
    isDirectRequest: boolean;
    isInNetwork: boolean;
    professionalId: string;
  }[]>([]);
  
  useEffect(() => {
    fetch("/api/rep/requests", { credentials: "include" })
      .then((r) => r.json())
      .then((data) => {
        if (data.requests) setRepRequests(data.requests);
      });
  }, []);

  const [discoverPros, setDiscoverPros] = useState<{
    id: string;
    name: string;
    email: string | null;
    discipline: string | null;
    city: string | null;
    state: string | null;
    facility: string | null;
    requests: { professional_id: string; topic: string; hours: number; deadline: string }[];
  }[]>([]);
  const [discoverLoading, setDiscoverLoading] = useState(true);
  const [discoverCityFilter, setDiscoverCityFilter] = useState("All");
  const [discoverCities, setDiscoverCities] = useState<string[]>([]);

  useEffect(() => {
    fetch("/api/rep/discover", { credentials: "include" })
      .then((r) => r.json())
      .then((data) => {
        if (data.professionals) setDiscoverPros(data.professionals);
        if (data.cities) setDiscoverCities(data.cities);
        setDiscoverLoading(false);
      });
  }, []);

  useEffect(() => {
    fetch("/api/rep/profile", { credentials: "include" })
      .then((r) => r.json())
      .then((data) => {
        if (data.profile && !data.profile.state) {
          setRepOnboarding(true);
        }
        if (data.profile) {
          setRepProfile({
            full_name: data.profile.full_name ?? "",
            org_name: data.profile.org_name ?? null,
          });
        }
      });
  }, []);

  const fetchRepStats = useCallback(async () => {
    const res = await fetch("/api/rep/stats", { credentials: "include" });
    const data = await res.json();
    if (res.ok) setRepStats(data);
  }, []);
  
  useEffect(() => {
    if (repId) fetchRepStats();
  }, [repId, fetchRepStats]);

  async function handleRepOnboarding(e: React.FormEvent) {
    e.preventDefault();
    setRepOnboardingSaving(true);
    await fetch("/api/rep/profile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(repOnboardingForm),
    });
    setRepOnboardingSaving(false);
    setRepOnboarding(false);
  }

  const [touchpointOpen, setTouchpointOpen] = useState(false);
  const [touchpointPro, setTouchpointPro] = useState<ProfessionalRow | null>(null);
  const [touchpointType, setTouchpointType] = useState<string>("call");
  const [touchpointNotes, setTouchpointNotes] = useState("");
  const [touchpointSaving, setTouchpointSaving] = useState(false);
  const [touchpointError, setTouchpointError] = useState<string | null>(null);
  const [touchpointSuccess, setTouchpointSuccess] = useState(false);
  const [repProfile, setRepProfile] = useState<{ full_name: string; org_name: string | null } | null>(null);
  const [flyerSize, setFlyerSize] = useState<"print" | "social">("print");
  const [flyerGenerating, setFlyerGenerating] = useState(false);
  const flyerRef = useRef<HTMLDivElement>(null);
  const [qrOpen, setQrOpen] = useState(false);
  const [hasOpenedQr, setHasOpenedQr] = useState(false);
  const [qrMode, setQrMode] = useState<"any" | "specific">("any");
  const [qrCourseId, setQrCourseId] = useState("");
  const [qrCourses, setQrCourses] = useState<{ id: string; name: string; hours: number }[]>([]);
  const [qrCoursesLoading, setQrCoursesLoading] = useState(false);
  const [qrDisciplineFilter, setQrDisciplineFilter] = useState("All");
  const [qrStateFilter, setQrStateFilter] = useState("");
  const [qrCourseRows, setQrCourseRows] = useState<{ profession: string; course: { id: string; name: string; hours: number } }[]>([]);
  const [qrApprovedProfessions, setQrApprovedProfessions] = useState<string[]>([]);
  const [qrCap, setQrCap] = useState<number | null>(25);
  const [qrScanCount, setQrScanCount] = useState<number | null>(null);
  const [qrCapSaving, setQrCapSaving] = useState(false);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [bulkTab, setBulkTab] = useState<"manual" | "network" | "csv">("manual");
  const [bulkRows, setBulkRows] = useState([{ name: "", email: "", discipline: "" }, { name: "", email: "", discipline: "" }, { name: "", email: "", discipline: "" }]);
  const [bulkSelectedPros, setBulkSelectedPros] = useState<string[]>([]);
  const [bulkNetworkSearch, setBulkNetworkSearch] = useState("");
  const [bulkCourseId, setBulkCourseId] = useState("");
  const [bulkDiscount, setBulkDiscount] = useState("100% Free");
  const [bulkSending, setBulkSending] = useState(false);
  const [bulkResults, setBulkResults] = useState<null | { succeeded: number; skipped: number; failed: number; results: { email: string; name: string; success: boolean; error?: string }[] }>(null);
  const [bulkCsvData, setBulkCsvData] = useState<{ name: string; email: string; discipline: string }[]>([]);
  const [importOpen, setImportOpen] = useState(false);
  const [importCsvData, setImportCsvData] = useState<{ name: string; email: string; phone: string; facility: string; city: string; state: string; discipline: string }[]>([]);
  const [importSaving, setImportSaving] = useState(false);
  const [importResults, setImportResults] = useState<{ added: number; skipped: number; errors: string[] } | null>(null);

  useEffect(() => {
    if (!qrOpen || !repId) return;
    setQrCoursesLoading(true);
    const supabase = createClient();
    supabase
      .from("course_professions")
      .select("profession, courses(id, name, hours)")
      .then(({ data }) => {
        const rows = ((data ?? []) as unknown) as { profession: string; courses: { id: string; name: string; hours: number } | { id: string; name: string; hours: number }[] }[];
        const courseRows: { profession: string; course: { id: string; name: string; hours: number } }[] = [];
        rows.forEach((r) => {
          const c = Array.isArray(r.courses) ? r.courses[0] : r.courses;
          if (c && c.id) courseRows.push({ profession: r.profession, course: { id: c.id, name: c.name, hours: c.hours } });
        });
        setQrCourseRows(courseRows);
        const byId = new Map<string, { id: string; name: string; hours: number }>();
        courseRows.forEach(({ course }) => byId.set(course.id, course));
        setQrCourses(Array.from(byId.values()).sort((a, b) => a.name.localeCompare(b.name)));
        setQrCoursesLoading(false);
      });
  }, [qrOpen, repId]);

  useEffect(() => {
    if (!qrOpen || !repId) return;
    const courseParam = qrMode === "specific" && qrCourseId ? qrCourseId : "";
    fetch(`/api/qr/cap?repId=${repId}&courseId=${encodeURIComponent(courseParam)}`, { credentials: "include" })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data) {
          setQrCap(data.cap ?? 25);
          setQrScanCount(data.scanCount ?? 0);
        }
      });
  }, [qrOpen, repId, qrMode, qrCourseId]);

  async function saveQrCap(cap: number | null) {
    if (!repId) return;
    setQrCapSaving(true);
    const courseParam = qrMode === "specific" && qrCourseId ? qrCourseId : "";
    await fetch("/api/qr/cap", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ repId, courseId: courseParam || null, cap }),
    });
    setQrCapSaving(false);
  }

  async function downloadFlyer(size: "print" | "social", qrUrl: string) {
    if (!flyerRef.current) return;
    setFlyerGenerating(true);
    try {
      // Fetch QR image as a blob and convert to data URL to avoid CORS issues
      const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=600x600&data=${encodeURIComponent(qrUrl)}`;
      const response = await fetch(qrImageUrl);
      const blob = await response.blob();
      const dataUrl = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.readAsDataURL(blob);
      });

      // Swap the img src to the local data URL before capturing
      const qrImg = flyerRef.current.querySelector("img");
      if (qrImg) qrImg.src = dataUrl;

      // Brief pause to let the image render
      await new Promise((resolve) => setTimeout(resolve, 200));

      const canvas = await html2canvas(flyerRef.current, {
        scale: 3,
        backgroundColor: "#ffffff",
      });
      const link = document.createElement("a");
      link.download = `pulse-flyer-${size}-${Date.now()}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    } finally {
      setFlyerGenerating(false);
    }
  }

  // Load courses when bulk modal opens (reuse availableCourses state)
  useEffect(() => {
    if (!bulkOpen || availableCourses.length > 0) return;
    setAvailableCoursesLoading(true);
    const supabase = createClient();
    supabase
      .from("course_professions")
      .select("profession, courses(id, name, hours, price, topic, product_id)")
      .then(({ data }) => {
        const rows = ((data as CourseProfessionRow[]) ?? [])
          .map((r) => ({ ...r, courses: Array.isArray(r.courses) ? r.courses[0] : r.courses }))
          .filter((r): r is NormalizedCourseProfessionRow => r.courses != null);
        rows.sort((a, b) => a.courses.name.localeCompare(b.courses.name));
        setAvailableCourses(rows);
        setAvailableCoursesLoading(false);
      });
  }, [bulkOpen, availableCourses.length]);

  const bulkCourseOptions = useMemo(() => {
    const seen = new Set<string>();
    const result: CourseRow[] = [];
    for (const row of availableCourses) {
      if (!seen.has(row.courses.id)) {
        seen.add(row.courses.id);
        result.push(row.courses);
      }
    }
    return result;
  }, [availableCourses]);

  const bulkCourse = useMemo(
    () => bulkCourseOptions.find((c) => c.id === bulkCourseId) ?? null,
    [bulkCourseOptions, bulkCourseId]
  );

  const bulkRecipients = useMemo(() => {
    if (bulkTab === "manual") return bulkRows.filter((r) => r.name.trim() && r.email.trim());
    if (bulkTab === "network") {
      return professionals
        .filter((p) => bulkSelectedPros.includes(p.id))
        .map((p) => ({ name: p.name, email: p.email, discipline: p.discipline ?? "" }));
    }
    return bulkCsvData;
  }, [bulkTab, bulkRows, bulkSelectedPros, professionals, bulkCsvData]);

  const bulkEstimatedCost = useMemo(() => {
    if (!bulkCourse || !bulkCourse.price) return 0;
    return Math.round(bulkCourse.price * bulkRecipients.length * 100) / 100;
  }, [bulkCourse, bulkRecipients]);

  function parseBulkCsv(text: string) {
    const lines = text.trim().split(/\r?\n/);
    if (lines.length < 2) return [];
    return lines.slice(1).map((line) => {
      const [name = "", email = "", discipline = ""] = line.split(",").map((s) => s.replace(/^"|"$/g, "").trim());
      return { name, email, discipline };
    }).filter((r) => r.name && r.email);
  }

  function parseImportCsv(text: string) {
    const lines = text.trim().split(/\r?\n/);
    if (lines.length < 2) return [];
    const headers = lines[0].split(",").map(h => h.replace(/^"|"$/g, "").trim().toLowerCase());
    return lines.slice(1).map((line) => {
      const vals = line.split(",").map(s => s.replace(/^"|"$/g, "").trim());
      const row: Record<string, string> = {};
      headers.forEach((h, i) => { row[h] = vals[i] ?? ""; });
      return {
        name: row["name"] || row["full name"] || row["fullname"] || "",
        email: row["email"] || row["email address"] || "",
        phone: row["phone"] || row["phone number"] || "",
        facility: row["facility"] || row["facility name"] || row["organization"] || "",
        city: row["city"] || "",
        state: row["state"] || "",
        discipline: row["discipline"] || row["profession"] || "",
      };
    }).filter(r => r.name && r.email);
  }

  async function handleImportCsv() {
    if (!repId || importCsvData.length === 0) return;
    setImportSaving(true);
    const supabase = createClient();
    const existingEmails = new Set(professionals.map(p => p.email.toLowerCase()));
    const toInsert = importCsvData.filter(r => !existingEmails.has(r.email.toLowerCase()));
    const skipped = importCsvData.length - toInsert.length;
    const errors: string[] = [];
    let added = 0;

    for (let i = 0; i < toInsert.length; i += 50) {
      const batch = toInsert.slice(i, i + 50).map(r => ({
        rep_id: repId,
        name: r.name,
        email: r.email,
        phone: r.phone || null,
        facility: r.facility || null,
        city: r.city || null,
        state: r.state || null,
        discipline: r.discipline || null,
      }));
      const { error, data } = await supabase.from("professionals").insert(batch).select();
      if (error) {
        errors.push(error.message);
      } else {
        added += data?.length ?? batch.length;
      }
    }

    setImportResults({ added, skipped, errors });
    setImportSaving(false);
    if (added > 0) fetchProfessionals();
  }

  function resetImportModal() {
    setImportOpen(false);
    setImportCsvData([]);
    setImportResults(null);
    setImportSaving(false);
  }

  function exportNetworkCsv() {
    if (professionals.length === 0) return;
    const headers = ["Name", "Email", "Phone", "Facility", "City", "State", "Discipline", "Added"];
    const rows = professionals.map((p) => [
      p.name,
      p.email,
      p.phone ?? "",
      p.facility ?? "",
      p.city ?? "",
      p.state ?? "",
      p.discipline ?? "",
      new Date(p.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
    ]);
    const csv = [headers, ...rows].map((r) => r.map((v) => `"${v.replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `pulse-network-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function handleBulkSend() {
    if (!repId || !bulkRecipients.length || !bulkCourseId) return;
    setBulkSending(true);
    try {
      const res = await fetch("/api/rep/bulk-send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ repId, courseId: bulkCourseId, discount: bulkDiscount, recipients: bulkRecipients }),
      });
      const data = await res.json();
      setBulkResults(data);
    } finally {
      setBulkSending(false);
    }
  }

  function resetBulkModal() {
    setBulkOpen(false);
    setBulkTab("manual");
    setBulkRows([{ name: "", email: "", discipline: "" }, { name: "", email: "", discipline: "" }, { name: "", email: "", discipline: "" }]);
    setBulkSelectedPros([]);
    setBulkNetworkSearch("");
    setBulkCourseId("");
    setBulkDiscount("100% Free");
    setBulkSending(false);
    setBulkResults(null);
    setBulkCsvData([]);
  }

  useEffect(() => {
    if (!qrOpen || !qrStateFilter) {
      setQrApprovedProfessions([]);
      return;
    }
    const stateFull = STATE_NAMES[qrStateFilter] ?? qrStateFilter;
    const supabase = createClient();
    supabase
      .from("discipline_states")
      .select("profession")
      .eq("state", stateFull)
      .then(({ data }) => {
        const professions = [...new Set((data ?? []).map((r: { profession: string }) => r.profession))];
        setQrApprovedProfessions(professions);
      });
  }, [qrOpen, qrStateFilter]);

  const qrFilteredCourses = useMemo(() => {
    let rows = qrCourseRows;
    if (qrDisciplineFilter !== "All") {
      rows = rows.filter((r) => r.profession === qrDisciplineFilter);
    }
    if (qrStateFilter && qrApprovedProfessions.length > 0) {
      rows = rows.filter((r) => qrApprovedProfessions.includes(r.profession));
    }
    const byId = new Map<string, { id: string; name: string; hours: number }>();
    rows.forEach(({ course }) => byId.set(course.id, course));
    return Array.from(byId.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [qrCourseRows, qrDisciplineFilter, qrStateFilter, qrApprovedProfessions]);

  useEffect(() => {
    if (qrCourseId && qrFilteredCourses.length > 0 && !qrFilteredCourses.some((c) => c.id === qrCourseId)) {
      setQrCourseId("");
    }
  }, [qrCourseId, qrFilteredCourses]);

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
      .select("id, professional_id, course_name, course_hours, coupon_code, source, created_at, clicked_at, recipient_email, professionals(name)")
      .eq("rep_id", repId)
      .order("created_at", { ascending: false });
    setCeHistoryLoading(false);
    if (!error && data) {
      setCeHistory(data.map((r: Record<string, unknown>) => ({
        id: r.id as string,
        professional_id: r.professional_id as string | null,
        professional_name: (r.professionals as { name?: string } | null)?.name ?? (r.recipient_email as string | null) ?? "—",
        recipient_email: r.recipient_email as string | null,
        course_name: r.course_name as string,
        course_hours: r.course_hours as number,
        coupon_code: r.coupon_code as string | null,
        source: r.source as string | null,
        created_at: r.created_at as string,
        clicked_at: r.clicked_at as string | null,
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

      const stateFull = STATE_NAMES[sendCePro!.state ?? ""] ?? sendCePro!.state;

      for (const profession of relevantProfessions) {
        if (!sendCePro!.state) {
          approvals[profession] = NATIONALLY_APPROVED.has(profession) ? "national" : "no-state";
        } else {
          const { data } = await supabase
            .from("discipline_states")
            .select("state")
            .eq("profession", profession)
            .eq("state", stateFull);
          if (cancelled) return;
          approvals[profession] = data && data.length > 0 ? "approved" : "not-approved";
        }
      }

      if (!cancelled) setProfessionApproval(approvals);
    }

    computeApprovals();
    return () => { cancelled = true; };
  }, [sendCeOpen, sendCePro, availableCourses]);

  // ── Events ──
  const refreshEvents = useCallback(() => {
    setEventsLoading(true);
    fetch("/api/events", { credentials: "include" })
      .then((r) => r.json())
      .then((data) => { setEvents(data.events ?? []); setEventsLoading(false); });
  }, []);

  useEffect(() => {
    if (tab === "events") refreshEvents();
  }, [tab, refreshEvents]);

  async function handleCreateEvent(e: React.FormEvent) {
    e.preventDefault();
    setEventSaving(true);
    const startsAt = new Date(
      `${eventForm.startsAt}T${eventForm.startsAtTime}`
    ).toISOString();
    const res = await fetch("/api/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        title: eventForm.title, description: eventForm.description,
        eventType: eventForm.eventType, externalUrl: eventForm.externalUrl,
        locationName: eventForm.locationName, address: eventForm.address,
        city: eventForm.city, state: eventForm.state, startsAt,
        durationMinutes: eventForm.durationMinutes,
        maxCapacity: eventForm.maxCapacity || null,
        visibility: eventForm.visibility,
      }),
    });
    setEventSaving(false);
    if (res.ok) {
      setCreateEventOpen(false);
      setEventForm({
        title: "", description: "", eventType: "lunch_and_learn",
        externalUrl: "", locationName: "", address: "", city: "", state: "",
        startsAt: "", startsAtTime: "12:00", durationMinutes: "60",
        maxCapacity: "", visibility: "network",
      });
      refreshEvents();
    }
  }

  async function handleCancelEvent(eventId: string) {
    if (!confirm("Cancel this event? Invitees won't be notified automatically.")) return;
    await fetch(`/api/events/${eventId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ status: "cancelled" }),
    });
    refreshEvents();
  }

  async function handleSendInvites() {
    if (!inviteModalEvent) return;
    setInviteSending(true);
    const guestEmails = inviteGuestRows
      .filter((r) => r.email.trim())
      .map((r) => ({ name: r.name.trim(), email: r.email.trim() }));
    const networkEmails = professionals
      .filter((p) => inviteSelectedPros.includes(p.id))
      .map((p) => ({ name: p.name, email: p.email }));
    const allEmails = [...networkEmails, ...guestEmails];
    if (allEmails.length === 0) { setInviteSending(false); return; }
    const res = await fetch("/api/events/invite", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ eventId: inviteModalEvent.id, emails: allEmails }),
    });
    const data = await res.json();
    setInviteSending(false);
    setInviteResults(data);
  }

  function closeInviteModal() {
    setInviteModalEvent(null);
    setInviteSelectedPros([]);
    setInviteGuestRows([{ name: "", email: "" }]);
    setInviteResults(null);
  }

  useEffect(() => {
    if (tab !== "billing") return;
    setBillingUsageLoading(true);
    Promise.all([
      fetch("/api/billing/current-usage", { credentials: "include" }).then(r => r.json()),
      fetch("/api/billing/invoices", { credentials: "include" }).then(r => r.json()),
      fetch("/api/billing/setup", { credentials: "include" }).then(r => r.json()),
    ]).then(([usage, invoices, settings]) => {
      setBillingUsage(usage);
      setBillingInvoices(invoices.invoices ?? []);
      setBillingSettings(settings.settings);
      if (settings.settings?.billing_email) {
        setBillingSetupForm(f => ({ ...f, billingEmail: settings.settings.billing_email }));
      }
      if (settings.orgName) {
        setBillingSetupForm(f => ({ ...f, orgName: settings.orgName }));
      }
      setBillingUsageLoading(false);
    });
  }, [tab]);

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
    setCourseTopicFilter("All");
    setCourseSearch("");
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
          recipient: pro.email ? {
            name: pro.name,
            email: pro.email,
            discipline: pro.discipline ?? undefined,
            city: pro.city ?? undefined,
            state: pro.state ?? undefined,
            facility: pro.facility ?? undefined,
          } : undefined,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setSendCeError(data.error ?? "Failed to send CE");
        return;
      }
      setSendCeSuccess(true);
      if (activeRequestId) {
        setRepRequests(prev => prev.filter(req => req.id !== activeRequestId));
        setActiveRequestId(null);
      }
      setTimeout(() => {
        setSendCeOpen(false);
        setSendCeSuccess(false);
      }, 2000);
    } finally {
      setSendCeSaving(false);
    }
  }

  function openTouchpointModal(pro: ProfessionalRow) {
    setTouchpointPro(pro);
    setTouchpointType("call");
    setTouchpointNotes("");
    setTouchpointError(null);
    setTouchpointSuccess(false);
    setTouchpointOpen(true);
  }

  async function handleSendReminder(ceSendId: string) {
    setReminderSending(ceSendId);
    try {
      const res = await fetch("/api/ce/remind", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ ceSendId }),
      });
      if (res.ok) {
        fetchCeHistory();
      }
    } finally {
      setReminderSending(null);
    }
  }

  async function handleSaveTouchpoint(e: React.FormEvent) {
    e.preventDefault();
    if (!repId || !touchpointPro) return;
    setTouchpointSaving(true);
    setTouchpointError(null);
    const pointsMap: Record<string, number> = {
      call: 1,
      visit: 3,
      lunch: 8,
      event: 8,
      other: 1,
    };
    const supabase = createClient();
    const { error } = await supabase.from("touchpoints").insert({
      rep_id: repId,
      professional_id: touchpointPro.id,
      type: touchpointType,
      notes: touchpointNotes.trim() || null,
      points: pointsMap[touchpointType] ?? 1,
    });
    setTouchpointSaving(false);
    if (error) {
      setTouchpointError(error.message);
      return;
    }
    setTouchpointSuccess(true);
    setTimeout(() => {
      setTouchpointOpen(false);
      setTouchpointSuccess(false);
    }, 1500);
  }

  return (
    <>
    <PageShell>
      <div className="space-y-6 pb-20 pt-6">
        <div>
          <h1 style={{ fontFamily: "'Fraunces', Georgia, serif", fontSize: '26px', fontWeight: 800, color: '#0b1222', letterSpacing: '-0.01em', margin: 0 }}>Your Dashboard</h1>
          <p style={{ marginTop: '4px', fontSize: '13px', color: '#7a8ba8' }}>Manage your network and send CE courses</p>
        </div>

        <div style={{ borderRadius: '16px', background: '#ffffff', border: '1px solid rgba(11,18,34,0.08)', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
        <StatsGrid>
  <StatCard label="Touchpoints This Week" value={repStats.touchpointsThisWeek} note="Calls, visits, CEs & events" noteClass="text-[var(--blue)]" />
  <StatCard label="CEs Sent" value={repStats.cesSentThisMonth} note={`All time: ${repStats.cesSentAllTime}`} noteClass="text-[var(--green)]" />
  <StatCard label="Accessed" value={repStats.redeemed} note="Link opened" noteClass="text-[var(--green)]" />
  <StatCard label="Requests" value={repStats.requests} note="Pending in network" noteClass="text-[var(--coral)]" />
</StatsGrid>
        </div>

        {/* Onboarding checklist — shown for new reps */}
        {(() => {
          const onboardingSteps = [
            { id: "network", label: "Add your first professional", done: professionals.length > 0, action: () => { setTab("network"); setAddOpen(true); } },
            { id: "send", label: "Send your first CE", done: repStats.cesSentAllTime > 0, action: () => { if (professionals.length > 0) openSendCeModal(null); else { setTab("network"); setAddOpen(true); } } },
            { id: "qr", label: "Generate a QR code", done: hasOpenedQr, action: () => { setTab("distribute"); setQrOpen(true); setHasOpenedQr(true); } },
          ];
          const onboardingComplete = onboardingSteps.filter(s => s.done).length;
          const showOnboarding = !onboardingDismissed && onboardingComplete < 3 && !repOnboarding;
          if (!showOnboarding) return null;
          return (
          <div style={{
            borderRadius: '16px',
            border: '1px solid rgba(13,148,136,0.15)',
            background: 'linear-gradient(135deg, rgba(13,148,136,0.03), rgba(36,85,255,0.03))',
            padding: '24px',
            position: 'relative',
            marginBottom: '4px',
          }}>
            <button
              type="button"
              onClick={() => setOnboardingDismissed(true)}
              style={{
                position: 'absolute', top: '12px', right: '12px',
                background: 'none', border: 'none', cursor: 'pointer',
                fontSize: '18px', color: '#7a8ba8', lineHeight: 1,
              }}
              aria-label="Dismiss"
            >×</button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '6px' }}>
              <span style={{ fontSize: '24px' }}>👋</span>
              <h3 style={{
                fontFamily: "'Fraunces', Georgia, serif",
                fontSize: '18px', fontWeight: 800, color: '#0b1222', margin: 0,
              }}>Welcome to Pulse!</h3>
            </div>
            <p style={{ fontSize: '13px', color: '#7a8ba8', marginBottom: '20px', marginLeft: '36px' }}>
              Get set up in 3 steps. You&apos;ll be sending free CE courses to professionals in minutes.
            </p>

            <div style={{
              height: '4px', borderRadius: '2px',
              background: 'rgba(11,18,34,0.06)',
              marginBottom: '18px', marginLeft: '36px',
              overflow: 'hidden',
            }}>
              <div style={{
                width: `${(onboardingComplete / 3) * 100}%`,
                height: '100%', borderRadius: '2px',
                background: 'linear-gradient(90deg, #2455ff, #0d9488)',
                transition: 'width 0.5s ease',
              }} />
            </div>

            <div style={{ display: 'grid', gap: '8px', marginLeft: '36px' }}>
              {onboardingSteps.map((step, i) => (
                <div
                  key={step.id}
                  onClick={step.done ? undefined : step.action}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '12px',
                    padding: '12px 14px', borderRadius: '10px',
                    background: step.done ? 'rgba(13,148,136,0.04)' : 'white',
                    border: `1px solid ${step.done ? 'rgba(13,148,136,0.12)' : 'rgba(11,18,34,0.08)'}`,
                    cursor: step.done ? 'default' : 'pointer',
                    transition: 'all 0.15s',
                  }}
                >
                  <div style={{
                    width: '28px', height: '28px', borderRadius: '50%', flexShrink: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '12px', fontWeight: 800,
                    background: step.done ? '#0d9488' : '#0b1222',
                    color: 'white',
                  }}>
                    {step.done ? '✓' : i + 1}
                  </div>
                  <span style={{
                    fontSize: '14px', fontWeight: 600, flex: 1,
                    color: step.done ? '#7a8ba8' : '#0b1222',
                    textDecoration: step.done ? 'line-through' : 'none',
                  }}>
                    {step.label}
                  </span>
                  {!step.done && (
                    <span style={{ color: '#2455ff', fontSize: '16px', fontWeight: 700 }}>→</span>
                  )}
                </div>
              ))}
            </div>
          </div>
          );
        })()}

        <TabBar tabs={[...TABS]} active={tab} onChange={(id) => setTab(id as RepTab)} />

        {tab === "discover" && (
          <SectionCard>
            <div className="border-b border-[var(--border)] pb-3 mb-4">
              <h2 style={{ fontFamily: "'Fraunces', Georgia, serif", fontSize: '16px', fontWeight: 800, color: '#0b1222', margin: 0 }}>Professionals Seeking CEs</h2>
              <p className="mt-1 text-[11px] text-[var(--ink-muted)]">Professionals in your area looking for CE courses</p>
            </div>
            {discoverCities.length > 0 && (
              <div className="flex gap-2 flex-wrap mb-4">
                {["All", ...discoverCities].map((city) => (
                  <button
                    key={city}
                    type="button"
                    onClick={() => setDiscoverCityFilter(city)}
                    className={`rounded-lg px-3 py-1.5 text-[11px] font-semibold border ${discoverCityFilter === city ? "bg-[var(--blue)] text-white border-[var(--blue)]" : "border-[var(--border)] bg-white text-[var(--ink-soft)] hover:bg-[#f6f5f0]"}`}
                  >
                    {city}
                  </button>
                ))}
              </div>
            )}
            {discoverLoading ? (
              <p className="py-6 text-sm text-[var(--ink-muted)]">Loading…</p>
            ) : discoverPros.length === 0 ? (
              <div className="py-8 text-center">
                <p className="text-sm text-[var(--ink-muted)]">No professionals seeking CEs right now.</p>
                <p className="mt-1 text-[13px] text-[var(--ink-soft)]">Check back later or add professionals to your network.</p>
                <button type="button" className={`mt-4 ${BTN_PRIMARY}`} onClick={() => setTab("network")}>View My Network</button>
              </div>
            ) : (
              <div style={{display:'grid',gap:'12px'}}>
                {discoverPros
                  .filter((pro) => discoverCityFilter === "All" || pro.city === discoverCityFilter)
                  .map((pro) => {
                    const inNetwork = professionals.some((p) => p.email?.toLowerCase() === (pro as any).email?.toLowerCase()) ||
                                      professionals.some((p) => p.name === pro.name && p.facility === pro.facility);
                    return (
                  <div key={pro.id} style={{
                    padding:'18px',
                    borderRadius:'12px',
                    border: inNetwork ? '1px solid rgba(13,148,136,0.15)' : '1px solid rgba(11,18,34,0.08)',
                    background: inNetwork ? 'rgba(13,148,136,0.03)' : 'white',
                    transition: 'box-shadow 0.2s',
                  }}>
                    <div style={{display:'flex',justifyContent:'space-between',alignItems:'start',gap:'12px',marginBottom:'8px'}}>
                      <div style={{minWidth:0,flex:1}}>
                        <div style={{display:'flex',alignItems:'center',gap:'8px',flexWrap:'wrap'}}>
                          <span style={{fontWeight:700,fontSize:'15px',color:'#0b1222'}}>{pro.name}</span>
                          {pro.discipline && (
                            <span style={{
                              fontSize:'10px',fontWeight:600,
                              background:'rgba(13,148,136,0.08)',color:'#0d9488',
                              padding:'2px 8px',borderRadius:'4px',
                            }}>{pro.discipline}</span>
                          )}
                          {inNetwork && (
                            <span style={{
                              fontSize:'10px',fontWeight:700,
                              background:'rgba(13,148,136,0.10)',color:'#0d9488',
                              padding:'2px 8px',borderRadius:'4px',
                              display:'inline-flex',alignItems:'center',gap:'3px',
                            }}>✓ In Network</span>
                          )}
                        </div>
                        <div style={{fontSize:'12px',color:'#7a8ba8',marginTop:'3px'}}>
                          {[pro.facility, pro.city && pro.state ? `${pro.city}, ${pro.state}` : pro.state].filter(Boolean).join(' · ')}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          const tempPro = {
                            id: pro.id,
                            name: pro.name,
                            email: (pro as any).email ?? "",
                            phone: null,
                            facility: pro.facility,
                            city: pro.city,
                            state: pro.state,
                            discipline: pro.discipline,
                            rep_id: repId ?? "",
                            created_at: new Date().toISOString(),
                          };
                          setSendCeAddToNetwork(true);
                          openSendCeModal(tempPro);
                        }}
                        style={{
                          flexShrink:0,
                          fontSize:'12px',
                          padding:'7px 16px',
                          borderRadius:'10px',
                          border: inNetwork ? '1.5px solid #0d9488' : '1.5px solid #2455ff',
                          background:'white',
                          color: inNetwork ? '#0d9488' : '#2455ff',
                          fontWeight:600,
                          cursor:'pointer',
                          fontFamily:"'DM Sans', system-ui, sans-serif",
                          transition:'all 0.15s',
                        }}
                      >
                        {inNetwork ? 'Send Another CE' : 'Send CE'}
                      </button>
                    </div>
                    {pro.requests.length > 0 && (
                      <div style={{marginTop:'8px',display:'flex',flexWrap:'wrap',gap:'6px'}}>
                        {pro.requests.map((r, i) => (
                          <span key={i} style={{padding:'3px 10px',borderRadius:'20px',fontSize:'10px',fontWeight:700,background:'rgba(217,119,6,0.08)',color:'#92670A'}}>
                            Needs: {r.topic} · {r.hours} hrs
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                    );
                  })}
              </div>
            )}
          </SectionCard>
        )}

{tab === "requests" && (
  <SectionCard>
    <div className="border-b border-[var(--border)] pb-3 mb-4">
      <h2 style={{ fontFamily: "'Fraunces', Georgia, serif", fontSize: '16px', fontWeight: 800, color: '#0b1222', margin: 0 }}>CE Requests</h2>
      <p className="mt-1 text-[11px] text-[var(--ink-muted)]">Professionals requesting CE courses</p>
    </div>
    {repRequests.length === 0 ? (
      <div className="py-8 text-center">
        <p className="text-sm text-[var(--ink-muted)]">No pending CE requests.</p>
        <button type="button" className={`mt-4 ${BTN_PRIMARY}`} onClick={() => setTab("network")}>View My Network</button>
      </div>
    ) : (
      <div style={{display:'grid',gap:'12px'}}>
        {repRequests.map((r) => (
          <div key={r.id} style={{padding:'16px',borderRadius:'10px',border:'1px solid var(--border)',background:'white'}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'start',marginBottom:'8px'}}>
              <div>
                <div style={{fontWeight:600,fontSize:'14px',color:'var(--ink)'}}>{r.professionalName}</div>
                <div style={{fontSize:'11px',color:'var(--ink-muted)',marginTop:'2px'}}>
                  {[r.discipline, r.facility, r.city && r.state ? `${r.city}, ${r.state}` : r.state].filter(Boolean).join(' · ')}
                </div>
              </div>
              <div style={{display:'flex',gap:'6px',alignItems:'center'}}>
                {r.isDirectRequest && (
                  <span style={{padding:'3px 8px',borderRadius:'20px',fontSize:'10px',fontWeight:700,background:'var(--blue-glow)',color:'var(--blue)'}}>Direct</span>
                )}
                <span style={{padding:'3px 8px',borderRadius:'20px',fontSize:'10px',fontWeight:700,background:'var(--gold-glow)',color:'#B8860B'}}>Pending</span>
              </div>
            </div>
            <div style={{fontSize:'13px',color:'var(--ink)',marginBottom:'12px'}}>
              <strong>{r.topic}</strong> · {r.hours} hrs · Due {new Date(r.deadline).toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"})}
            </div>
            <div style={{display:'flex',gap:'8px'}}>
              <button
                type="button"
                className={BTN_PRIMARY}
                style={{fontSize:'12px',padding:'6px 14px'}}
                onClick={async () => {
                  setActiveRequestId(r.id);
                  let pro = professionals.find((p) => p.name === r.professionalName) ?? null;
                  if (!pro) {
                    pro = {
                      id: r.professionalId,
                      name: r.professionalName,
                      email: "",
                      phone: null,
                      facility: r.facility,
                      city: r.city,
                      state: r.state,
                      discipline: r.discipline,
                      rep_id: repId ?? "",
                      created_at: r.created_at,
                    };
                  }
                  openSendCeModal(pro);
                }}
              >
                Send CE
              </button>
            </div>
          </div>
        ))}
      </div>
    )}
  </SectionCard>
)}

        {tab === "distribute" && (
          <div className="space-y-6">
            <SectionCard>
              <div className="border-b border-[var(--border)] pb-3 mb-4">
                <h2 style={{ fontFamily: "'Fraunces', Georgia, serif", fontSize: '16px', fontWeight: 800, color: '#0b1222', margin: 0 }}>CE Course Distribution Tools</h2>
              </div>
              <p className="text-xs text-[var(--ink-soft)] mb-4">QR codes, flyers, and bulk send.</p>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                <button
                  type="button"
                  className="rounded-xl border border-[var(--border)] bg-[#f6f5f0] p-5 text-center transition-colors hover:border-[var(--border)] hover:shadow-[0_1px_3px_rgba(0,0,0,0.08)]"
                  onClick={() => { setQrOpen(true); setHasOpenedQr(true); }}
                >
                  <span className="text-2xl block mb-2">📱</span>
                  <div className="font-bold text-[13px] text-[var(--ink)]">Generate QR Code &amp; Flyer</div>
                  <div className="text-[11px] text-[var(--ink-muted)]">CE landing page link</div>
                </button>
                <button
                  type="button"
                  className="rounded-xl border border-[var(--border)] bg-[#f6f5f0] p-5 text-center transition-colors hover:border-[var(--border)] hover:shadow-[0_1px_3px_rgba(0,0,0,0.08)]"
                  onClick={() => setBulkOpen(true)}
                >
                  <span className="text-2xl block mb-2">📨</span>
                  <div className="font-bold text-[13px] text-[var(--ink)]">Bulk Send</div>
                  <div className="text-[11px] text-[var(--ink-muted)]">Send to multiple people</div>
                </button>
              </div>
            </SectionCard>

            {qrOpen && repId && (
              <div style={{ position: "fixed", inset: 0, zIndex: 300, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(10,18,34,0.55)", backdropFilter: "blur(6px)", padding: "12px" }} onClick={() => setQrOpen(false)}>
                <div style={{ width: "100%", maxWidth: "800px", background: "white", borderRadius: "16px", padding: "20px", boxShadow: "0 20px 60px rgba(0,0,0,0.15)", overflowY: "auto", maxHeight: "92vh" }} onClick={e => e.stopPropagation()}>
                  {/* Header */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "20px" }}>
                    <div>
                      <h3 style={{ fontSize: "18px", fontWeight: 700, color: "var(--ink)", margin: 0 }}>Generate a QR Code</h3>
                      <p style={{ fontSize: "13px", color: "#7a8ba8", margin: "6px 0 0", lineHeight: 1.45 }}>Print this or show it on your phone during visits. When a nurse or social worker scans it, they enter their email and instantly receive a free CE course — no app required.</p>
                    </div>
                    <button type="button" style={{ background: "none", border: "none", fontSize: "20px", cursor: "pointer", color: "#7a8ba8", flexShrink: 0, marginLeft: "12px" }} onClick={() => setQrOpen(false)} aria-label="Close">×</button>
                  </div>

                  {/* Two-column body on wide screens, single on mobile */}
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "24px", alignItems: "start" }}>
                    {/* LEFT: controls */}
                    <div>
                      {/* Mode toggle */}
                      <div style={{ marginBottom: "16px" }}>
                        <div style={{ display: "flex", gap: "16px", marginBottom: "8px" }}>
                          <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}>
                            <input type="radio" name="qrMode" checked={qrMode === "any"} onChange={() => { setQrMode("any"); setQrCourseId(""); }} />
                            <span style={{ fontSize: "14px" }}>Any Course</span>
                          </label>
                          <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}>
                            <input type="radio" name="qrMode" checked={qrMode === "specific"} onChange={() => setQrMode("specific")} />
                            <span style={{ fontSize: "14px" }}>Specific Course</span>
                          </label>
                        </div>
                        {qrMode === "any" && <p style={{ fontSize: "12px", color: "#7a8ba8", margin: 0, lineHeight: 1.4 }}>The professional picks from your full course catalog. Best for general visits.</p>}
                        {qrMode === "specific" && <p style={{ fontSize: "12px", color: "#7a8ba8", margin: 0, lineHeight: 1.4 }}>You pick one course upfront. Best for targeting a specific need like Ethics or Palliative Care.</p>}
                      </div>

                      {/* Course selector + filters */}
                      {qrMode === "specific" && (
                        <div style={{ marginBottom: "16px" }}>
                          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "12px" }}>
                            <div>
                              <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#7a8ba8", marginBottom: "6px" }}>Discipline</label>
                              <select
                                value={qrDisciplineFilter}
                                onChange={e => setQrDisciplineFilter(e.target.value)}
                                style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid var(--border)", fontSize: "14px", boxSizing: "border-box" }}
                              >
                                {QR_DISCIPLINE_OPTIONS.map((d) => (
                                  <option key={d} value={d}>{d}</option>
                                ))}
                              </select>
                            </div>
                            <div>
                              <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#7a8ba8", marginBottom: "6px" }}>State</label>
                              <select
                                value={qrStateFilter}
                                onChange={e => setQrStateFilter(e.target.value)}
                                style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid var(--border)", fontSize: "14px", boxSizing: "border-box" }}
                              >
                                <option value="">All states</option>
                                {US_STATES.map((s) => (
                                  <option key={s} value={s}>{s}</option>
                                ))}
                              </select>
                            </div>
                          </div>
                          <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#7a8ba8", marginBottom: "6px" }}>Course</label>
                          <select
                            value={qrCourseId}
                            onChange={e => setQrCourseId(e.target.value)}
                            style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid var(--border)", fontSize: "14px", boxSizing: "border-box" }}
                          >
                            <option value="">Select…</option>
                            {qrCoursesLoading ? <option disabled>Loading…</option> : qrFilteredCourses.map(c => <option key={c.id} value={c.id}>{c.name} ({c.hours} hrs)</option>)}
                          </select>
                        </div>
                      )}

                      {/* Scan limit */}
                      <div style={{ background: "#f6f5f0", borderRadius: "12px", padding: "16px", fontSize: "13px", color: "#3b4963", lineHeight: 1.5, marginBottom: "12px" }}>
                        <div style={{ fontWeight: 700, color: "#0b1222", marginBottom: "4px", fontSize: "14px" }}>Scan Limit</div>
                        <div style={{ marginBottom: "14px", fontSize: "12px", color: "#7a8ba8", lineHeight: 1.5 }}>
                          How many professionals can use this QR code? Once the limit is reached, the code will stop accepting new scans.
                        </div>

                        {/* Two options: Unlimited or Custom */}
                        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                          <label
                            onClick={() => { setQrCap(null); saveQrCap(null); }}
                            style={{
                              display: "flex", alignItems: "center", gap: "10px",
                              padding: "12px 14px", borderRadius: "10px", cursor: "pointer",
                              border: qrCap === null ? "1.5px solid #0d9488" : "1px solid rgba(11,18,34,0.08)",
                              background: qrCap === null ? "rgba(13,148,136,0.04)" : "white",
                              transition: "all 0.15s",
                            }}
                          >
                            <input
                              type="radio"
                              name="qrCap"
                              checked={qrCap === null}
                              onChange={() => {}}
                              style={{ accentColor: "#0d9488" }}
                            />
                            <div>
                              <div style={{ fontWeight: 600, color: "#0b1222", fontSize: "13px" }}>Unlimited</div>
                              <div style={{ fontSize: "11px", color: "#7a8ba8", marginTop: "1px" }}>No scan limit — best for high-traffic locations</div>
                            </div>
                          </label>

                          <label
                            onClick={() => { if (qrCap === null) { setQrCap(25); saveQrCap(25); } }}
                            style={{
                              display: "flex", alignItems: "center", gap: "10px",
                              padding: "12px 14px", borderRadius: "10px", cursor: "pointer",
                              border: qrCap !== null ? "1.5px solid #2455ff" : "1px solid rgba(11,18,34,0.08)",
                              background: qrCap !== null ? "rgba(36,85,255,0.04)" : "white",
                              transition: "all 0.15s",
                            }}
                          >
                            <input
                              type="radio"
                              name="qrCap"
                              checked={qrCap !== null}
                              onChange={() => {}}
                              style={{ accentColor: "#2455ff" }}
                            />
                            <div style={{ flex: 1 }}>
                              <div style={{ fontWeight: 600, color: "#0b1222", fontSize: "13px" }}>Set a limit</div>
                              <div style={{ fontSize: "11px", color: "#7a8ba8", marginTop: "1px" }}>QR code stops working after this many scans</div>
                            </div>
                            {qrCap !== null && (
                              <input
                                type="number"
                                min="1"
                                max="10000"
                                value={qrCap}
                                onClick={(e) => e.stopPropagation()}
                                onChange={(e) => {
                                  const val = parseInt(e.target.value) || 1;
                                  setQrCap(val);
                                }}
                                onBlur={() => saveQrCap(qrCap)}
                                style={{
                                  width: "72px",
                                  padding: "6px 10px",
                                  borderRadius: "8px",
                                  border: "1px solid rgba(11,18,34,0.12)",
                                  fontSize: "14px",
                                  fontWeight: 700,
                                  color: "#0b1222",
                                  textAlign: "center",
                                  fontFamily: "'DM Sans', system-ui, sans-serif",
                                }}
                              />
                            )}
                          </label>
                        </div>

                        {/* Usage counter */}
                        {qrScanCount !== null && (
                          <div style={{
                            marginTop: "14px",
                            paddingTop: "12px",
                            borderTop: "1px solid rgba(11,18,34,0.06)",
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            fontSize: "12px",
                          }}>
                            <span style={{ color: "#7a8ba8" }}>
                              {qrScanCount} {qrScanCount === 1 ? "scan" : "scans"} used{qrCap !== null ? ` of ${qrCap}` : ""}
                              {qrCapSaving && <span style={{ marginLeft: "8px", color: "#7a8ba8", fontStyle: "italic" }}>Saving…</span>}
                            </span>
                            {qrCap !== null && qrScanCount > 0 && (
                              <div style={{
                                width: "80px", height: "6px",
                                borderRadius: "3px",
                                background: "rgba(11,18,34,0.06)",
                                overflow: "hidden",
                              }}>
                                <div style={{
                                  width: `${Math.min((qrScanCount / qrCap) * 100, 100)}%`,
                                  height: "100%",
                                  borderRadius: "3px",
                                  background: qrScanCount >= qrCap ? "#e8604c" : "#0d9488",
                                  transition: "width 0.3s",
                                }} />
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Billing note */}
                      <div style={{ background: "#f6f5f0", borderRadius: "12px", padding: "14px 16px", fontSize: "12px", color: "#7a8ba8", lineHeight: 1.5 }}>
                        <span style={{ fontWeight: 600, color: "#3b4963" }}>How billing works:</span> Scanning a QR code does not incur a charge. You are only charged when a professional uses the coupon code to access their course. All QR sends appear in your CE History tab.
                      </div>
                    </div>

                    {/* RIGHT: QR code + URL + actions */}
                    <div>
                      {(() => {
                        const origin = process.env.NEXT_PUBLIC_APP_URL ?? (typeof window !== "undefined" ? window.location.origin : "");
                        const qrUrl = qrMode === "any" ? `${origin}/ce/${repId}` : qrCourseId ? `${origin}/ce/${repId}/${qrCourseId}` : "";
                        return qrUrl ? (
                          <>
                            <div style={{ textAlign: "center", marginBottom: "16px" }}>
                              <img src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(qrUrl)}`} alt="QR Code" style={{ display: "block", margin: "0 auto", maxWidth: "250px", width: "100%" }} />
                            </div>
                            <div style={{ display: "flex", gap: "8px", alignItems: "center", marginBottom: "12px" }}>
                              <input readOnly value={qrUrl} style={{ flex: 1, fontSize: "12px", padding: "8px 10px", borderRadius: "6px", border: "1px solid var(--border)", background: "#f6f5f0" }} />
                              <button type="button" className={BTN_SECONDARY} style={{ fontSize: "12px", padding: "8px 12px", whiteSpace: "nowrap" }} onClick={() => { navigator.clipboard.writeText(qrUrl); }}>Copy</button>
                            </div>
                            <a href={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(qrUrl)}`} target="_blank" rel="noopener noreferrer" className={BTN_PRIMARY} style={{ display: "inline-block", textAlign: "center", padding: "10px 16px", fontSize: "13px", textDecoration: "none" }}>Download QR</a>

                            {/* Flyer generator section */}
                            <div>
                              <div style={{ borderTop: "1px solid rgba(11,18,34,0.08)", margin: "24px 0" }} />
                              <div style={{ marginBottom: "12px" }}>
                                <div style={{ fontWeight: 700, fontSize: "14px", marginBottom: "4px" }}>Download Flyer</div>
                                <div style={{ fontSize: "12px", color: "#7a8ba8", marginBottom: "12px" }}>
                                  Print-ready or social media size. Perfect for leaving at facilities or posting on LinkedIn.
                                </div>
                                <div style={{ display: "flex", gap: "8px", marginBottom: "16px" }}>
                                  <button
                                    onClick={() => setFlyerSize("print")}
                                    style={{
                                      padding: "6px 14px", borderRadius: "6px", fontSize: "13px", fontWeight: 600, cursor: "pointer",
                                      background: flyerSize === "print" ? "#2455ff" : "#f0efeb",
                                      color: flyerSize === "print" ? "white" : "#7a8ba8",
                                      border: "none"
                                    }}
                                  >🖨️ Print (8.5×11)</button>
                                  <button
                                    onClick={() => setFlyerSize("social")}
                                    style={{
                                      padding: "6px 14px", borderRadius: "6px", fontSize: "13px", fontWeight: 600, cursor: "pointer",
                                      background: flyerSize === "social" ? "#2455ff" : "#f0efeb",
                                      color: flyerSize === "social" ? "white" : "#7a8ba8",
                                      border: "none"
                                    }}
                                  >📱 Social (1080×1080)</button>
                                </div>
                                <button
                                  onClick={() => downloadFlyer(flyerSize, qrUrl)}
                                  disabled={flyerGenerating}
                                  style={{
                                    width: "100%", padding: "10px", borderRadius: "8px", border: "none",
                                    background: "#10B981", color: "white", fontWeight: 700, fontSize: "14px",
                                    cursor: flyerGenerating ? "not-allowed" : "pointer",
                                    opacity: flyerGenerating ? 0.6 : 1
                                  }}
                                >
                                  {flyerGenerating ? "Generating..." : "⬇️ Download Flyer"}
                                </button>
                              </div>

                              {/* ── Flyer template (captured by html2canvas) ── */}
                              <div style={{ position: "fixed", left: "-9999px", top: 0 }}>
                                <div
                                  ref={flyerRef}
                                  style={{
                                    width: flyerSize === "print" ? "816px" : "1080px",
                                    height: flyerSize === "print" ? "1056px" : "1080px",
                                    background: "#ffffff",
                                    position: "relative",
                                    overflow: "hidden",
                                    fontFamily: "'DM Sans', sans-serif",
                                    boxSizing: "border-box" as const,
                                    display: "flex",
                                    flexDirection: "column" as const,
                                  }}
                                >
                                  {/* ▌ TOP SPONSOR BAND — dark, company name huge ────────── */}
                                  <div
                                    style={{
                                      background: "linear-gradient(135deg, #0b1222 0%, #1a2744 100%)",
                                      padding: flyerSize === "print"
                                        ? "40px 56px 36px"
                                        : "48px 64px 44px",
                                      display: "flex",
                                      alignItems: "flex-start",
                                      justifyContent: "space-between",
                                    }}
                                  >
                                    <div>
                                      <div
                                        style={{
                                          fontSize: flyerSize === "print" ? "11px" : "13px",
                                          fontWeight: 600,
                                          color: "rgba(255,255,255,0.5)",
                                          textTransform: "uppercase" as const,
                                          letterSpacing: "0.1em",
                                          marginBottom: flyerSize === "print" ? "6px" : "8px",
                                        }}
                                      >
                                        Compliments of
                                      </div>
                                      <div
                                        style={{
                                          fontFamily: "'Fraunces', serif",
                                          fontSize: flyerSize === "print" ? "34px" : "40px",
                                          fontWeight: 900,
                                          color: "#ffffff",
                                          letterSpacing: "-0.01em",
                                          lineHeight: 1.1,
                                        }}
                                      >
                                        {repProfile?.org_name || repProfile?.full_name || "Your Company"}
                                      </div>
                                      <div
                                        style={{
                                          fontSize: flyerSize === "print" ? "14px" : "16px",
                                          color: "rgba(255,255,255,0.6)",
                                          marginTop: flyerSize === "print" ? "4px" : "6px",
                                        }}
                                      >
                                        {repProfile?.org_name
                                          ? `${repProfile.full_name} · Business Development`
                                          : "Business Development"}
                                      </div>
                                    </div>
                                    <div
                                      style={{
                                        background: "rgba(255,255,255,0.12)",
                                        border: "1px solid rgba(255,255,255,0.15)",
                                        padding: flyerSize === "print" ? "8px 18px" : "10px 22px",
                                        borderRadius: flyerSize === "print" ? "8px" : "10px",
                                        fontSize: flyerSize === "print" ? "13px" : "15px",
                                        fontWeight: 700,
                                        color: "#ffffff",
                                        whiteSpace: "nowrap" as const,
                                        marginTop: flyerSize === "print" ? "18px" : "22px",
                                        flexShrink: 0,
                                      }}
                                    >
                                      100% FREE
                                    </div>
                                  </div>

                                  {/* ▌ MAIN CONTENT ─────────────────────────────────────── */}
                                  <div
                                    style={{
                                      flex: 1,
                                      padding: flyerSize === "print"
                                        ? "40px 56px 0"
                                        : "44px 64px 0",
                                      display: "flex",
                                      flexDirection: "column" as const,
                                    }}
                                  >
                                    {/* Headline */}
                                    <div style={{ marginBottom: flyerSize === "print" ? "32px" : "32px" }}>
                                      <h1
                                        style={{
                                          fontFamily: "'Fraunces', serif",
                                          fontSize: flyerSize === "print" ? "48px" : "56px",
                                          fontWeight: 900,
                                          lineHeight: 1.05,
                                          color: "#0b1222",
                                          letterSpacing: "-0.02em",
                                          margin: "0 0 10px",
                                        }}
                                      >
                                        Get a Free
                                        <br />
                                        CE Course
                                      </h1>
                                      <p
                                        style={{
                                          fontSize: flyerSize === "print" ? "17px" : "19px",
                                          lineHeight: 1.5,
                                          color: "#3b4963",
                                          margin: 0,
                                          maxWidth: flyerSize === "print" ? "420px" : "560px",
                                        }}
                                      >
                                        Scan the code below to instantly claim a complimentary continuing
                                        education course. No account needed.
                                      </p>
                                    </div>

                                    {/* Two-column: QR left, content right */}
                                    <div
                                      style={{
                                        display: "flex",
                                        gap: flyerSize === "print" ? "36px" : "44px",
                                        flex: 1,
                                        alignItems: "stretch",
                                      }}
                                    >
                                      {/* ── Left column: QR + course card ── */}
                                      <div
                                        style={{
                                          display: "flex",
                                          flexDirection: "column" as const,
                                          gap: flyerSize === "print" ? "16px" : "18px",
                                          flexShrink: 0,
                                          width: flyerSize === "print" ? "248px" : "300px",
                                        }}
                                      >
                                        {/* QR code */}
                                        <div
                                          style={{
                                            background: "#f6f5f0",
                                            padding: flyerSize === "print" ? "20px" : "24px",
                                            borderRadius: flyerSize === "print" ? "16px" : "20px",
                                            border: "1px solid rgba(11,18,34,0.06)",
                                            display: "flex",
                                            flexDirection: "column" as const,
                                            alignItems: "center",
                                          }}
                                        >
                                          <img
                                            src={`https://api.qrserver.com/v1/create-qr-code/?size=600x600&data=${encodeURIComponent(qrUrl)}`}
                                            width={flyerSize === "print" ? 208 : 252}
                                            height={flyerSize === "print" ? 208 : 252}
                                            alt="QR Code"
                                            crossOrigin="anonymous"
                                            style={{ display: "block", borderRadius: "8px" }}
                                          />
                                          <div
                                            style={{
                                              marginTop: flyerSize === "print" ? "12px" : "14px",
                                              fontSize: flyerSize === "print" ? "13px" : "15px",
                                              fontWeight: 700,
                                              color: "#0b1222",
                                              textAlign: "center" as const,
                                            }}
                                          >
                                            Scan with your phone
                                          </div>
                                          <div
                                            style={{
                                              fontSize: flyerSize === "print" ? "11px" : "12px",
                                              color: "#7a8ba8",
                                              textAlign: "center" as const,
                                              marginTop: "2px",
                                            }}
                                          >
                                            No app needed · Takes 30 sec
                                          </div>
                                        </div>

                                        {/* Course card — specific course */}
                                        {qrMode === "specific" &&
                                          qrCourseId &&
                                          qrCourses.length > 0 &&
                                          (() => {
                                            const course = qrCourses.find((c) => c.id === qrCourseId);
                                            return course ? (
                                              <div
                                                style={{
                                                  background: "rgba(36,85,255,0.05)",
                                                  borderRadius: flyerSize === "print" ? "12px" : "14px",
                                                  padding: flyerSize === "print" ? "16px" : "18px 20px",
                                                  borderLeft: flyerSize === "print"
                                                    ? "3px solid #2455ff"
                                                    : "4px solid #2455ff",
                                                }}
                                              >
                                                <div
                                                  style={{
                                                    fontSize: flyerSize === "print" ? "10px" : "11px",
                                                    fontWeight: 700,
                                                    color: "#7a8ba8",
                                                    textTransform: "uppercase" as const,
                                                    letterSpacing: "0.06em",
                                                    marginBottom: "3px",
                                                  }}
                                                >
                                                  Featured Course
                                                </div>
                                                <div
                                                  style={{
                                                    fontSize: flyerSize === "print" ? "15px" : "18px",
                                                    fontWeight: 700,
                                                    color: "#0b1222",
                                                    lineHeight: 1.25,
                                                  }}
                                                >
                                                  {course.name}
                                                </div>
                                                <div
                                                  style={{
                                                    fontSize: flyerSize === "print" ? "12px" : "13px",
                                                    color: "#3b4963",
                                                    marginTop: "3px",
                                                  }}
                                                >
                                                  {course.hours} credit hours · Complimentary
                                                </div>
                                              </div>
                                            ) : null;
                                          })()}

                                        {/* Course card — any course */}
                                        {qrMode === "any" && (
                                          <div
                                            style={{
                                              background: "rgba(13,148,136,0.05)",
                                              borderRadius: flyerSize === "print" ? "12px" : "14px",
                                              padding: flyerSize === "print" ? "16px" : "18px 20px",
                                              borderLeft: flyerSize === "print"
                                                ? "3px solid #0d9488"
                                                : "4px solid #0d9488",
                                            }}
                                          >
                                            <div
                                              style={{
                                                fontSize: flyerSize === "print" ? "10px" : "11px",
                                                fontWeight: 700,
                                                color: "#7a8ba8",
                                                textTransform: "uppercase" as const,
                                                letterSpacing: "0.06em",
                                                marginBottom: "3px",
                                              }}
                                            >
                                              Choose From
                                            </div>
                                            <div
                                              style={{
                                                fontSize: flyerSize === "print" ? "15px" : "18px",
                                                fontWeight: 700,
                                                color: "#0b1222",
                                                lineHeight: 1.25,
                                              }}
                                            >
                                              Our Full Course Catalog
                                            </div>
                                            <div
                                              style={{
                                                fontSize: flyerSize === "print" ? "12px" : "13px",
                                                color: "#3b4963",
                                                marginTop: "3px",
                                              }}
                                            >
                                              Ethics · Palliative Care · Mental Health &amp; more
                                            </div>
                                          </div>
                                        )}
                                      </div>

                                      {/* ── Right column: how it works + who qualifies ── */}
                                      <div
                                        style={{
                                          flex: 1,
                                          display: "flex",
                                          flexDirection: "column" as const,
                                          gap: flyerSize === "print" ? "20px" : "24px",
                                          paddingTop: "4px",
                                        }}
                                      >
                                        {/* How it works */}
                                        <div>
                                          <div
                                            style={{
                                              fontSize: flyerSize === "print" ? "11px" : "12px",
                                              fontWeight: 700,
                                              color: "#7a8ba8",
                                              textTransform: "uppercase" as const,
                                              letterSpacing: "0.06em",
                                              marginBottom: flyerSize === "print" ? "12px" : "14px",
                                            }}
                                          >
                                            How it works
                                          </div>
                                          <div style={{ display: "grid", gap: flyerSize === "print" ? "10px" : "12px" }}>
                                            {[
                                              { n: "1", bg: "#0b1222", title: "Scan the QR code", sub: "Use your phone camera" },
                                              { n: "2", bg: "#0b1222", title: "Enter your email", sub: "No account or password needed" },
                                              { n: "3", bg: "#0d9488", title: "Get your free course", sub: "Link delivered to your inbox instantly" },
                                            ].map((step) => (
                                              <div
                                                key={step.n}
                                                style={{
                                                  display: "flex",
                                                  alignItems: "flex-start",
                                                  gap: flyerSize === "print" ? "12px" : "14px",
                                                }}
                                              >
                                                <div
                                                  style={{
                                                    width: flyerSize === "print" ? "32px" : "36px",
                                                    minHeight: flyerSize === "print" ? "32px" : "36px",
                                                    borderRadius: flyerSize === "print" ? "8px" : "10px",
                                                    flexShrink: 0,
                                                    background: step.bg,
                                                    color: "white",
                                                    display: "flex",
                                                    alignItems: "center",
                                                    justifyContent: "center",
                                                    fontSize: flyerSize === "print" ? "14px" : "16px",
                                                    fontWeight: 800,
                                                  }}
                                                >
                                                  {step.n}
                                                </div>
                                                <div>
                                                  <div
                                                    style={{
                                                      fontSize: flyerSize === "print" ? "14px" : "16px",
                                                      fontWeight: 700,
                                                      color: "#0b1222",
                                                      lineHeight: 1.2,
                                                    }}
                                                  >
                                                    {step.title}
                                                  </div>
                                                  <div
                                                    style={{
                                                      fontSize: flyerSize === "print" ? "11px" : "13px",
                                                      color: "#7a8ba8",
                                                      lineHeight: 1.3,
                                                      marginTop: "1px",
                                                    }}
                                                  >
                                                    {step.sub}
                                                  </div>
                                                </div>
                                              </div>
                                            ))}
                                          </div>
                                        </div>

                                        {/* Who qualifies */}
                                        <div
                                          style={{
                                            background: "#f6f5f0",
                                            borderRadius: flyerSize === "print" ? "12px" : "14px",
                                            padding: flyerSize === "print" ? "16px" : "18px",
                                          }}
                                        >
                                          <div
                                            style={{
                                              fontSize: flyerSize === "print" ? "11px" : "12px",
                                              fontWeight: 700,
                                              color: "#7a8ba8",
                                              textTransform: "uppercase" as const,
                                              letterSpacing: "0.06em",
                                              marginBottom: flyerSize === "print" ? "8px" : "10px",
                                            }}
                                          >
                                            Who qualifies
                                          </div>
                                          <div
                                            style={{
                                              display: "flex",
                                              flexWrap: "wrap" as const,
                                              gap: flyerSize === "print" ? "6px" : "8px",
                                            }}
                                          >
                                            {["RN / LPN", "MSW / LCSW", "Case Managers", "PT / OT / SLP"].map(
                                              (label) => (
                                                <span
                                                  key={label}
                                                  style={{
                                                    background: "white",
                                                    border: "1px solid rgba(11,18,34,0.08)",
                                                    borderRadius: flyerSize === "print" ? "6px" : "8px",
                                                    padding: flyerSize === "print" ? "4px 10px" : "6px 14px",
                                                    fontSize: flyerSize === "print" ? "12px" : "14px",
                                                    fontWeight: 600,
                                                    color: "#0b1222",
                                                  }}
                                                >
                                                  {label}
                                                </span>
                                              )
                                            )}
                                          </div>
                                        </div>

                                        {/* Accreditation */}
                                        <div style={{ display: "flex", alignItems: "flex-start", gap: flyerSize === "print" ? "8px" : "10px" }}>
                                          <div
                                            style={{
                                              width: flyerSize === "print" ? "22px" : "24px",
                                              height: flyerSize === "print" ? "22px" : "24px",
                                              borderRadius: "50%",
                                              background: "rgba(13,148,136,0.12)",
                                              color: "#0d9488",
                                              display: "flex",
                                              alignItems: "center",
                                              justifyContent: "center",
                                              fontSize: flyerSize === "print" ? "11px" : "12px",
                                              fontWeight: 800,
                                              flexShrink: 0,
                                              marginTop: "1px",
                                            }}
                                          >
                                            ✓
                                          </div>
                                          <span
                                            style={{
                                              fontSize: flyerSize === "print" ? "12px" : "14px",
                                              color: "#3b4963",
                                            }}
                                          >
                                            State-approved · Accredited · 100% online &amp; self-paced
                                          </span>
                                        </div>
                                      </div>
                                    </div>
                                  </div>

                                  {/* ▌ BOTTOM BAR — Pulse small ─────────────────────────── */}
                                  <div
                                    style={{
                                      padding: flyerSize === "print" ? "20px 56px" : "24px 64px",
                                      display: "flex",
                                      alignItems: "center",
                                      justifyContent: "space-between",
                                      borderTop: "1px solid rgba(11,18,34,0.06)",
                                      marginTop: "auto",
                                    }}
                                  >
                                    <div style={{ display: "flex", alignItems: "center", gap: flyerSize === "print" ? "6px" : "8px" }}>
                                      <svg
                                        width={flyerSize === "print" ? "20" : "22"}
                                        height={flyerSize === "print" ? "20" : "22"}
                                        viewBox="0 0 56 56"
                                        fill="none"
                                      >
                                        <rect width="56" height="56" rx="14" fill="#0b1222" />
                                        <path d="M10 28 L17 28 L21 16 L26 40 L31 22 L35 32 L38 28 L46 28"
                                          stroke="url(#flyer-sm-glow)" strokeWidth="10" strokeLinecap="round" strokeLinejoin="round" opacity="0.3" />
                                        <path d="M10 28 L17 28 L21 16 L26 40 L31 22 L35 32 L38 28 L46 28"
                                          stroke="url(#flyer-sm-line)" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
                                        <defs>
                                          <linearGradient id="flyer-sm-line" x1="10" y1="28" x2="46" y2="28">
                                            <stop offset="0%" stopColor="#6B8AFF" />
                                            <stop offset="100%" stopColor="#5EEAD4" />
                                          </linearGradient>
                                          <linearGradient id="flyer-sm-glow" x1="10" y1="28" x2="46" y2="28">
                                            <stop offset="0%" stopColor="#2455ff" />
                                            <stop offset="100%" stopColor="#0d9488" />
                                          </linearGradient>
                                        </defs>
                                      </svg>
                                      <span
                                        style={{
                                          fontFamily: "'Fraunces', serif",
                                          fontSize: flyerSize === "print" ? "13px" : "14px",
                                          fontWeight: 900,
                                          color: "#7a8ba8",
                                        }}
                                      >
                                        Pulse
                                      </span>
                                    </div>
                                    <div
                                      style={{
                                        fontSize: flyerSize === "print" ? "11px" : "12px",
                                        color: "#7a8ba8",
                                      }}
                                    >
                                      pulsereferrals.vercel.app
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </>
                        ) : qrMode === "specific" && !qrCourseId ? (
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "200px", color: "#7a8ba8", fontSize: "13px", textAlign: "center", border: "2px dashed rgba(11,18,34,0.08)", borderRadius: "12px" }}>
                            Select a course to preview the QR code.
                          </div>
                        ) : null;
                      })()}
                    </div>
                  </div>
                </div>
              </div>
            )}
            {/* Bulk Send Modal */}
            {bulkOpen && (
              <div style={{ position: "fixed", inset: 0, zIndex: 300, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(10,18,34,0.55)", backdropFilter: "blur(4px)", padding: "16px" }} onClick={resetBulkModal}>
                <div style={{ width: "100%", maxWidth: "760px", background: "white", borderRadius: "16px", boxShadow: "0 20px 60px rgba(0,0,0,0.15)", overflowY: "auto", maxHeight: "92vh", display: "flex", flexDirection: "column" }} onClick={e => e.stopPropagation()}>
                  {/* Header */}
                  <div style={{ padding: "20px 24px 0", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div>
                      <h3 style={{ fontSize: "18px", fontWeight: 700, color: "var(--ink)", margin: 0 }}>Bulk Send CE</h3>
                      <p style={{ fontSize: "13px", color: "#7a8ba8", margin: "4px 0 0" }}>Send free CE courses to multiple people at once.</p>
                    </div>
                    <button type="button" style={{ background: "none", border: "none", fontSize: "20px", cursor: "pointer", color: "#7a8ba8" }} onClick={resetBulkModal} aria-label="Close">×</button>
                  </div>

                  {bulkResults ? (
                    /* Results view */
                    <div style={{ padding: "24px" }}>
                      <div style={{ textAlign: "center", marginBottom: "20px" }}>
                        <div style={{ fontSize: "48px", marginBottom: "8px" }}>
                          {bulkResults.failed === 0 ? "✅" : "⚠️"}
                        </div>
                        <h4 style={{ fontSize: "16px", fontWeight: 700, color: "var(--ink)", margin: 0 }}>Send Complete</h4>
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px", marginBottom: "20px" }}>
                        <div style={{ background: "rgba(13,148,136,0.08)", borderRadius: "8px", padding: "12px", textAlign: "center" }}>
                          <div style={{ fontSize: "22px", fontWeight: 700, color: "#0d9488" }}>{bulkResults.succeeded}</div>
                          <div style={{ fontSize: "12px", color: "#7a8ba8" }}>Sent</div>
                        </div>
                        <div style={{ background: "rgba(217,119,6,0.08)", borderRadius: "8px", padding: "12px", textAlign: "center" }}>
                          <div style={{ fontSize: "22px", fontWeight: 700, color: "#D97706" }}>{bulkResults.skipped}</div>
                          <div style={{ fontSize: "12px", color: "#7a8ba8" }}>Skipped</div>
                        </div>
                        <div style={{ background: bulkResults.failed > 0 ? "rgba(232,96,76,0.08)" : "#f6f5f0", borderRadius: "8px", padding: "12px", textAlign: "center" }}>
                          <div style={{ fontSize: "22px", fontWeight: 700, color: bulkResults.failed > 0 ? "#DC2626" : "#7a8ba8" }}>{bulkResults.failed}</div>
                          <div style={{ fontSize: "12px", color: "#7a8ba8" }}>Failed</div>
                        </div>
                      </div>
                      {bulkResults.skipped > 0 && (
                        <p style={{ fontSize: "12px", color: "#7a8ba8", marginBottom: "8px" }}>⏭️ {bulkResults.skipped} recipient{bulkResults.skipped !== 1 ? "s" : ""} skipped — they already received this course.</p>
                      )}
                      {bulkResults.failed > 0 && (
                        <div style={{ marginBottom: "12px" }}>
                          <p style={{ fontSize: "12px", fontWeight: 600, color: "#DC2626", marginBottom: "6px" }}>❌ Failed sends:</p>
                          <div style={{ background: "rgba(232,96,76,0.08)", borderRadius: "8px", padding: "10px", fontSize: "12px", color: "#7F1D1D", maxHeight: "120px", overflowY: "auto" }}>
                            {bulkResults.results.filter(r => !r.success && r.error !== "already_sent").map((r, i) => (
                              <div key={i}>{r.name} ({r.email}) — {r.error}</div>
                            ))}
                          </div>
                        </div>
                      )}
                      <button type="button" className={BTN_PRIMARY} style={{ width: "100%" }} onClick={resetBulkModal}>Done</button>
                    </div>
                  ) : (
                    <>
                      {/* Tabs */}
                      <div style={{ padding: "16px 24px 0", display: "flex", gap: "4px", borderBottom: "1px solid var(--border)", marginTop: "16px" }}>
                        {(["manual", "network", "csv"] as const).map((t) => {
                          const labels: Record<string, string> = { manual: "Manual Entry", network: "From Network", csv: "Upload CSV" };
                          return (
                            <button key={t} type="button" onClick={() => setBulkTab(t)} style={{ padding: "8px 14px", fontSize: "13px", fontWeight: bulkTab === t ? 700 : 400, borderBottom: `2px solid ${bulkTab === t ? "var(--blue)" : "transparent"}`, background: "none", border: "none", borderBottomWidth: "2px", borderBottomStyle: "solid", borderBottomColor: bulkTab === t ? "var(--blue)" : "transparent", color: bulkTab === t ? "var(--blue)" : "#7a8ba8", cursor: "pointer", marginBottom: "-1px" }}>{labels[t]}</button>
                          );
                        })}
                      </div>

                      <div style={{ padding: "20px 24px", flex: 1, overflowY: "auto" }}>
                        {/* Manual Entry tab */}
                        {bulkTab === "manual" && (
                          <div>
                            <div style={{ overflowX: "auto" }}>
                              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                                <thead>
                                  <tr style={{ borderBottom: "1px solid var(--border)" }}>
                                    <th style={{ textAlign: "left", padding: "6px 8px", color: "#7a8ba8", fontWeight: 600, fontSize: "11px" }}>Name</th>
                                    <th style={{ textAlign: "left", padding: "6px 8px", color: "#7a8ba8", fontWeight: 600, fontSize: "11px" }}>Email</th>
                                    <th style={{ textAlign: "left", padding: "6px 8px", color: "#7a8ba8", fontWeight: 600, fontSize: "11px" }}>Discipline</th>
                                    <th style={{ width: "32px" }}></th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {bulkRows.map((row, i) => (
                                    <tr key={i}>
                                      <td style={{ padding: "4px 4px 4px 0" }}>
                                        <input value={row.name} onChange={e => { const r = [...bulkRows]; r[i] = { ...r[i], name: e.target.value }; setBulkRows(r); }} placeholder="Full name" style={{ width: "100%", padding: "6px 8px", borderRadius: "6px", border: "1px solid var(--border)", fontSize: "13px", boxSizing: "border-box" }} />
                                      </td>
                                      <td style={{ padding: "4px" }}>
                                        <input type="email" value={row.email} onChange={e => { const r = [...bulkRows]; r[i] = { ...r[i], email: e.target.value }; setBulkRows(r); }} placeholder="email@example.com" style={{ width: "100%", padding: "6px 8px", borderRadius: "6px", border: "1px solid var(--border)", fontSize: "13px", boxSizing: "border-box" }} />
                                      </td>
                                      <td style={{ padding: "4px" }}>
                                        <select value={row.discipline} onChange={e => { const r = [...bulkRows]; r[i] = { ...r[i], discipline: e.target.value }; setBulkRows(r); }} style={{ width: "100%", padding: "6px 8px", borderRadius: "6px", border: "1px solid var(--border)", fontSize: "13px" }}>
                                          <option value="">Any</option>
                                          {["Nursing","Social Work","Case Management","PT","OT","ST"].map(d => <option key={d} value={d}>{d}</option>)}
                                        </select>
                                      </td>
                                      <td style={{ padding: "4px", textAlign: "center" }}>
                                        <button type="button" onClick={() => setBulkRows(bulkRows.filter((_, idx) => idx !== i))} style={{ background: "none", border: "none", color: "#7a8ba8", cursor: "pointer", fontSize: "16px", lineHeight: 1 }}>×</button>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                            <button type="button" onClick={() => { if (bulkRows.length < 100) setBulkRows([...bulkRows, { name: "", email: "", discipline: "" }]); }} disabled={bulkRows.length >= 100} style={{ marginTop: "10px", fontSize: "12px", color: "var(--blue)", background: "none", border: "1px dashed rgba(11,18,34,0.12)", borderRadius: "6px", padding: "6px 14px", cursor: bulkRows.length >= 100 ? "not-allowed" : "pointer", opacity: bulkRows.length >= 100 ? 0.5 : 1 }}>+ Add Row</button>
                          </div>
                        )}

                        {/* From Network tab */}
                        {bulkTab === "network" && (
                          <div>
                            <div style={{ display: "flex", gap: "8px", marginBottom: "12px" }}>
                              <input value={bulkNetworkSearch} onChange={e => setBulkNetworkSearch(e.target.value)} placeholder="Search by name, email, facility…" style={{ flex: 1, padding: "8px 12px", borderRadius: "8px", border: "1px solid var(--border)", fontSize: "13px" }} />
                              <button type="button" onClick={() => setBulkSelectedPros(professionals.map(p => p.id))} className={BTN_SECONDARY} style={{ fontSize: "12px", padding: "6px 10px", whiteSpace: "nowrap" }}>Select All</button>
                              <button type="button" onClick={() => setBulkSelectedPros([])} className={BTN_SECONDARY} style={{ fontSize: "12px", padding: "6px 10px", whiteSpace: "nowrap" }}>Deselect All</button>
                            </div>
                            {professionals.length === 0 ? (
                              <p style={{ color: "#7a8ba8", fontSize: "13px", textAlign: "center", padding: "24px 0" }}>No professionals in your network yet.</p>
                            ) : (
                              <div style={{ maxHeight: "260px", overflowY: "auto", border: "1px solid var(--border)", borderRadius: "8px" }}>
                                {professionals
                                  .filter(p => {
                                    const q = bulkNetworkSearch.toLowerCase();
                                    return !q || p.name.toLowerCase().includes(q) || p.email.toLowerCase().includes(q) || (p.facility ?? "").toLowerCase().includes(q);
                                  })
                                  .map(p => (
                                    <label key={p.id} style={{ display: "flex", alignItems: "center", gap: "10px", padding: "10px 12px", borderBottom: "1px solid var(--border)", cursor: "pointer", background: bulkSelectedPros.includes(p.id) ? "rgba(36,85,255,0.08)" : "white" }}>
                                      <input type="checkbox" checked={bulkSelectedPros.includes(p.id)} onChange={e => { if (e.target.checked) setBulkSelectedPros([...bulkSelectedPros, p.id]); else setBulkSelectedPros(bulkSelectedPros.filter(id => id !== p.id)); }} />
                                      <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ fontWeight: 600, fontSize: "13px", color: "var(--ink)" }}>{p.name}</div>
                                        <div style={{ fontSize: "11px", color: "#7a8ba8" }}>{[p.discipline, p.facility].filter(Boolean).join(" · ")}</div>
                                      </div>
                                      <div style={{ fontSize: "11px", color: "#7a8ba8", flexShrink: 0 }}>{p.email}</div>
                                    </label>
                                  ))}
                              </div>
                            )}
                          </div>
                        )}

                        {/* CSV tab */}
                        {bulkTab === "csv" && (
                          <div>
                            <div style={{ display: "flex", gap: "8px", marginBottom: "12px", alignItems: "center" }}>
                              <a href={`data:text/csv;charset=utf-8,${encodeURIComponent("Name,Email,Discipline\nJennifer Smith,jennifer@hospital.com,Nursing")}`} download="pulse-bulk-template.csv" style={{ fontSize: "12px", color: "var(--blue)", textDecoration: "underline" }}>Download template</a>
                              <span style={{ color: "rgba(11,18,34,0.12)" }}>·</span>
                              <span style={{ fontSize: "12px", color: "#7a8ba8" }}>Columns: Name, Email, Discipline</span>
                            </div>
                            <label style={{ display: "block", border: "2px dashed rgba(11,18,34,0.12)", borderRadius: "10px", padding: "28px", textAlign: "center", cursor: "pointer", marginBottom: "16px" }}>
                              <input type="file" accept=".csv,text/csv" style={{ display: "none" }} onChange={e => {
                                const file = e.target.files?.[0];
                                if (!file) return;
                                const reader = new FileReader();
                                reader.onload = (ev) => {
                                  const text = ev.target?.result as string;
                                  setBulkCsvData(parseBulkCsv(text));
                                };
                                reader.readAsText(file);
                              }} />
                              <div style={{ fontSize: "24px", marginBottom: "6px" }}>📁</div>
                              <div style={{ fontSize: "13px", color: "#7a8ba8" }}>Click to upload a CSV file</div>
                            </label>
                            {bulkCsvData.length > 0 && (
                              <div>
                                <p style={{ fontSize: "12px", color: "#7a8ba8", marginBottom: "8px" }}>{bulkCsvData.length} recipients loaded</p>
                                <div style={{ maxHeight: "180px", overflowY: "auto", border: "1px solid var(--border)", borderRadius: "8px" }}>
                                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
                                    <thead><tr style={{ borderBottom: "1px solid var(--border)", background: "#f6f5f0" }}>
                                      <th style={{ textAlign: "left", padding: "6px 10px", color: "#7a8ba8" }}>Name</th>
                                      <th style={{ textAlign: "left", padding: "6px 10px", color: "#7a8ba8" }}>Email</th>
                                      <th style={{ textAlign: "left", padding: "6px 10px", color: "#7a8ba8" }}>Discipline</th>
                                    </tr></thead>
                                    <tbody>
                                      {bulkCsvData.map((r, i) => (
                                        <tr key={i} style={{ borderBottom: "1px solid var(--border)" }}>
                                          <td style={{ padding: "6px 10px" }}>{r.name}</td>
                                          <td style={{ padding: "6px 10px" }}>{r.email}</td>
                                          <td style={{ padding: "6px 10px" }}>{r.discipline || "—"}</td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Course + Discount + Cost summary — always visible */}
                        <div style={{ marginTop: "20px", paddingTop: "16px", borderTop: "1px solid var(--border)" }}>
                          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "12px" }}>
                            <div>
                              <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#7a8ba8", marginBottom: "6px" }}>Course</label>
                              <select value={bulkCourseId} onChange={e => setBulkCourseId(e.target.value)} style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid var(--border)", fontSize: "14px" }}>
                                <option value="">Select a course…</option>
                                {availableCoursesLoading ? <option disabled>Loading…</option> : bulkCourseOptions.map(c => <option key={c.id} value={c.id}>{c.name} ({c.hours} hrs)</option>)}
                              </select>
                            </div>
                            <div>
                              <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#7a8ba8", marginBottom: "6px" }}>Discount</label>
                              <select value={bulkDiscount} onChange={e => setBulkDiscount(e.target.value)} style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid var(--border)", fontSize: "14px" }}>
                                <option>100% Free</option>
                                <option>50% Off</option>
                                <option>25% Off</option>
                              </select>
                            </div>
                          </div>

                          {/* Cost summary */}
                          {bulkRecipients.length > 0 && bulkCourse && (
                            <div style={{ background: "rgba(36,85,255,0.08)", borderRadius: "8px", padding: "12px", fontSize: "13px", color: "#1a3fcc", marginBottom: "12px", lineHeight: 1.6 }}>
                              <div>Sending to <strong>{bulkRecipients.length}</strong> recipient{bulkRecipients.length !== 1 ? "s" : ""}</div>
                              <div>Course: <strong>{bulkCourse.name}</strong> · ${bulkCourse.price?.toFixed(2) ?? "—"} per person</div>
                              <div>Discount: <strong>{bulkDiscount}</strong></div>
                              <div>Total cost to you: <strong>${bulkEstimatedCost.toFixed(2)}</strong></div>
                            </div>
                          )}

                          <button
                            type="button"
                            className={BTN_PRIMARY}
                            disabled={bulkSending || bulkRecipients.length === 0 || !bulkCourseId}
                            onClick={handleBulkSend}
                            style={{ width: "100%", padding: "12px", fontSize: "14px", opacity: (bulkSending || bulkRecipients.length === 0 || !bulkCourseId) ? 0.6 : 1 }}
                          >
                            {bulkSending ? "Sending…" : `Send to ${bulkRecipients.length} ${bulkRecipients.length === 1 ? "Person" : "People"}`}
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {tab === "network" && (
          <SectionCard>
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '12px', borderBottom: '1px solid rgba(11,18,34,0.08)', paddingBottom: '14px', marginBottom: '16px' }}>
              <h2 style={{ fontFamily: "'Fraunces', Georgia, serif", fontSize: '16px', fontWeight: 800, color: '#0b1222', margin: 0 }}>My Network</h2>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  className={BTN_SECONDARY}
                  onClick={exportNetworkCsv}
                  disabled={professionals.length === 0}
                  style={{ opacity: professionals.length === 0 ? 0.5 : 1 }}
                >
                  ↓ Export
                </button>
                <button type="button" className={BTN_SECONDARY} onClick={() => setImportOpen(true)}>Import CSV</button>
                <button type="button" className={BTN_PRIMARY} onClick={() => setAddOpen(true)}>+ Add Professional</button>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', overflowX: 'auto', paddingBottom: '4px', WebkitOverflowScrolling: 'touch' }}>
              {["All", "Nursing", "Social Work", "Case Mgmt", "PT/OT/SLP"].map((f) => (
                <button key={f} type="button" onClick={() => setFilter(f)} style={{
                  flexShrink: 0,
                  borderRadius: '8px',
                  padding: '6px 14px',
                  fontSize: '12px',
                  fontWeight: 600,
                  border: filter === f ? '1.5px solid #2455ff' : '1px solid rgba(11,18,34,0.08)',
                  background: filter === f ? 'rgba(36,85,255,0.08)' : '#ffffff',
                  color: filter === f ? '#2455ff' : '#3b4963',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  fontFamily: "'DM Sans', system-ui, sans-serif",
                }}>
                  {f} {f === "All" ? `(${professionals.length})` : ""}
                </button>
              ))}
            </div>
            {loading ? (
              <p className="text-sm text-[var(--ink-muted)] py-2">Loading…</p>
            ) : professionals.length === 0 ? (
              <div style={{ padding: '48px 24px', textAlign: 'center' }}>
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>👥</div>
                <h3 style={{
                  fontFamily: "'Fraunces', Georgia, serif",
                  fontSize: '20px', fontWeight: 800, color: '#0b1222', marginBottom: '8px',
                }}>Build your referral network</h3>
                <p style={{ fontSize: '14px', color: '#7a8ba8', maxWidth: '360px', margin: '0 auto 24px', lineHeight: 1.6 }}>
                  Add nurses, social workers, case managers, and therapists you work with. Once they&apos;re in your network, you can send them free CE courses.
                </p>
                <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    onClick={() => setAddOpen(true)}
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: '6px',
                      background: '#2455ff', color: 'white', fontWeight: 700,
                      padding: '12px 24px', borderRadius: '10px', border: 'none',
                      fontSize: '14px', cursor: 'pointer',
                      boxShadow: '0 2px 10px rgba(36,85,255,0.18)',
                    }}
                  >+ Add Professional</button>
                  <button
                    type="button"
                    onClick={() => setImportOpen(true)}
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: '6px',
                      background: 'white', color: '#3b4963', fontWeight: 600,
                      padding: '12px 24px', borderRadius: '10px',
                      border: '1px solid rgba(11,18,34,0.08)',
                      fontSize: '14px', cursor: 'pointer',
                    }}
                  >Import CSV</button>
                </div>
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
                      style={{
                        borderRadius: '12px',
                        border: '1px solid rgba(11,18,34,0.08)',
                        background: 'white',
                        padding: '18px',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                        display: 'grid',
                        gridTemplateColumns: '40px 1fr',
                        gap: '14px',
                        alignItems: 'start',
                      }}
                    >
                      {/* Avatar */}
                      <div
                        style={{
                          width: '40px',
                          height: '40px',
                          borderRadius: '50%',
                          background: 'rgba(11,18,34,0.06)',
                          color: '#3b4963',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 700,
                          fontSize: '14px',
                          flexShrink: 0,
                          marginTop: '2px',
                        }}
                      >
                        {initials(pro.name)}
                      </div>

                      {/* Content */}
                      <div style={{ minWidth: 0 }}>
                        {/* Top row: name + badges */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '4px' }}>
                          <span style={{ fontWeight: 700, fontSize: '15px', color: '#0b1222' }}>{pro.name}</span>
                          {pro.discipline && (
                            <span style={{
                              fontSize: '10px', fontWeight: 600,
                              background: 'rgba(13,148,136,0.08)', color: '#0d9488',
                              padding: '2px 8px', borderRadius: '4px',
                            }}>{pro.discipline}</span>
                          )}
                        </div>

                        {/* Info row: facility + location */}
                        {(pro.facility || pro.city || pro.state) && (
                          <div style={{ fontSize: '12px', color: '#7a8ba8', marginBottom: '6px' }}>
                            {[
                              pro.facility,
                              pro.city && pro.state ? `${pro.city}, ${pro.state}` : (pro.city || pro.state),
                            ].filter(Boolean).join(' · ')}
                          </div>
                        )}

                        {/* Contact row: email + phone */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap', marginBottom: '12px' }}>
                          <a
                            href={`mailto:${pro.email}`}
                            style={{ fontSize: '13px', color: '#2455ff', textDecoration: 'none', fontWeight: 500 }}
                            onClick={(e) => e.stopPropagation()}
                          >
                            {pro.email}
                          </a>
                          {pro.phone && (
                            <a
                              href={`tel:${pro.phone}`}
                              style={{ fontSize: '13px', color: '#3b4963', textDecoration: 'none', fontWeight: 500 }}
                              onClick={(e) => e.stopPropagation()}
                            >
                              📞 {pro.phone}
                            </a>
                          )}
                        </div>

                        {/* Action buttons */}
                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'nowrap' }}>
                          <button
                            type="button"
                            onClick={() => openSendCeModal(pro)}
                            style={{
                              fontSize: '12px',
                              padding: '7px 16px',
                              borderRadius: '10px',
                              border: '1.5px solid #2455ff',
                              background: 'white',
                              color: '#2455ff',
                              fontWeight: 600,
                              cursor: 'pointer',
                              fontFamily: "'DM Sans', system-ui, sans-serif",
                              transition: 'all 0.15s',
                              whiteSpace: 'nowrap',
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background = 'rgba(36,85,255,0.06)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = 'white';
                            }}
                          >
                            Send CE
                          </button>
                          <button
                            type="button"
                            className={BTN_SECONDARY}
                            style={{ fontSize: '12px', padding: '7px 16px', whiteSpace: 'nowrap' }}
                            onClick={() => openTouchpointModal(pro)}
                          >
                            Log Touchpoint
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </SectionCard>
        )}

        {tab === "events" && (
          <div className="space-y-6">
            <SectionCard>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", borderBottom: "1px solid rgba(11,18,34,0.08)", paddingBottom: "14px", marginBottom: "16px" }}>
                <div>
                  <h2 style={{ fontFamily: "'Fraunces', Georgia, serif", fontSize: "16px", fontWeight: 800, color: "#0b1222", margin: 0 }}>Events</h2>
                  <p style={{ marginTop: "3px", fontSize: "11px", color: "#7a8ba8" }}>Create and manage lunch & learns, dinners, and workshops</p>
                </div>
                <button type="button" onClick={() => setCreateEventOpen(true)} style={{ borderRadius: "10px", background: "#2455ff", padding: "10px 20px", fontSize: "13px", fontWeight: 700, color: "white", border: "none", cursor: "pointer", boxShadow: "0 2px 10px rgba(36,85,255,0.18)", fontFamily: "'DM Sans', system-ui, sans-serif" }}>+ Create Event</button>
              </div>

              {eventsLoading ? (
                <p style={{ fontSize: "14px", color: "#7a8ba8", padding: "16px 0" }}>Loading…</p>
              ) : events.filter((e) => e.status !== "cancelled").length === 0 ? (
                <div style={{ padding: "48px 0", textAlign: "center" }}>
                  <div style={{ fontSize: "48px", marginBottom: "16px" }}>📅</div>
                  <h3 style={{ fontFamily: "'Fraunces', Georgia, serif", fontSize: "20px", fontWeight: 800, color: "#0b1222", marginBottom: "8px" }}>No events yet</h3>
                  <p style={{ fontSize: "14px", color: "#7a8ba8", maxWidth: "360px", margin: "0 auto 24px", lineHeight: 1.6 }}>Create a lunch & learn or networking dinner to bring professionals together. They can RSVP right from their dashboard.</p>
                  <button type="button" onClick={() => setCreateEventOpen(true)} style={{ display: "inline-flex", alignItems: "center", gap: "6px", background: "#2455ff", color: "white", fontWeight: 700, padding: "12px 24px", borderRadius: "10px", border: "none", fontSize: "14px", cursor: "pointer", boxShadow: "0 2px 10px rgba(36,85,255,0.18)" }}>+ Create Event</button>
                </div>
              ) : (
                <div style={{ display: "grid", gap: "16px" }}>
                  {events.filter((e) => e.status !== "cancelled").map((evt) => {
                    const isPast = new Date(evt.starts_at) < new Date();
                    const c = evt.counts ?? {};
                    const typeEmoji: Record<string, string> = { lunch_and_learn: "🍽️", networking_dinner: "🥂", workshop: "📋", in_service: "🏥", other: "📅" };
                    const typeLabel: Record<string, string> = { lunch_and_learn: "Lunch & Learn", networking_dinner: "Networking Dinner", workshop: "Workshop", in_service: "In-Service", other: "Event" };
                    return (
                      <div key={evt.id} style={{ borderRadius: "14px", border: "1px solid rgba(11,18,34,0.08)", background: isPast ? "#fafaf7" : "white", padding: "20px", opacity: isPast ? 0.7 : 1 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap", marginBottom: "6px" }}>
                          <span style={{ fontSize: "12px", color: "#7a8ba8" }}>{typeEmoji[evt.event_type] || "📅"} {typeLabel[evt.event_type] || "Event"}</span>
                          <span style={{ fontSize: "10px", fontWeight: 700, padding: "2px 8px", borderRadius: "4px", background: evt.visibility === "public" ? "rgba(36,85,255,0.08)" : "rgba(11,18,34,0.05)", color: evt.visibility === "public" ? "#2455ff" : "#7a8ba8" }}>{evt.visibility === "public" ? "Public" : "Network Only"}</span>
                          {isPast && <span style={{ fontSize: "10px", fontWeight: 700, padding: "2px 8px", borderRadius: "4px", background: "#f6f5f0", color: "#7a8ba8" }}>Past</span>}
                        </div>
                        <div style={{ fontWeight: 700, fontSize: "16px", color: "#0b1222", lineHeight: 1.3, marginBottom: "8px" }}>{evt.title}</div>
                        <div style={{ fontSize: "13px", color: "#3b4963", marginBottom: "12px", display: "flex", flexWrap: "wrap", gap: "12px" }}>
                          <span>📅 {new Date(evt.starts_at).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })} at {new Date(evt.starts_at).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}</span>
                          {evt.location_name && <span>📍 {evt.location_name}</span>}
                          <span>⏱ {evt.duration_minutes} min</span>
                        </div>
                        {evt.external_url && (
                          <div style={{ marginBottom: "12px" }}>
                            <a href={evt.external_url} target="_blank" rel="noopener noreferrer" style={{ fontSize: "12px", color: "#2455ff", fontWeight: 600, textDecoration: "none" }}>🔗 {evt.external_url.replace(/^https?:\/\//, "").split("/")[0]} →</a>
                          </div>
                        )}
                        <div style={{ display: "flex", gap: "16px", flexWrap: "wrap", marginBottom: "14px" }}>
                          {[
                            { label: "Going", val: c.going, color: "#0d9488" },
                            { label: "Maybe", val: c.maybe, color: "#92670A" },
                            { label: "Declined", val: c.declined, color: "#e8604c" },
                          ].map((s) => (
                            <span key={s.label} style={{ fontSize: "13px", fontWeight: 700, color: s.color }}>{s.val ?? 0} <span style={{ fontWeight: 500, color: "#7a8ba8" }}>{s.label}</span></span>
                          ))}
                        </div>
                        {(evt.event_rsvps ?? []).length > 0 && (
                          <div style={{ marginBottom: "14px", borderTop: "1px solid rgba(11,18,34,0.06)", paddingTop: "12px" }}>
                            <div style={{ fontSize: "11px", fontWeight: 600, color: "#7a8ba8", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: "8px" }}>RSVPs</div>
                            <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                              {(evt.event_rsvps ?? []).map((rsvp: any) => {
                                const rName = rsvp.professionals?.name || rsvp.guest_name || rsvp.guest_email || "—";
                                const sColor: Record<string, string> = { going: "#0d9488", maybe: "#92670A", declined: "#e8604c" };
                                const sBg: Record<string, string> = { going: "rgba(13,148,136,0.08)", maybe: "rgba(217,119,6,0.08)", declined: "rgba(232,96,76,0.08)" };
                                return (
                                  <span key={rsvp.id} style={{ fontSize: "11px", fontWeight: 600, padding: "4px 10px", borderRadius: "6px", background: sBg[rsvp.status] ?? "#f6f5f0", color: sColor[rsvp.status] ?? "#7a8ba8" }}>{rName} · {rsvp.status}</span>
                                );
                              })}
                            </div>
                          </div>
                        )}
                        {!isPast && (
                          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                            <button type="button" onClick={() => { setInviteModalEvent(evt); setInviteSelectedPros([]); setInviteGuestRows([{ name: "", email: "" }]); setInviteResults(null); }} style={{ fontSize: "12px", padding: "7px 16px", borderRadius: "10px", border: "1.5px solid #2455ff", background: "white", color: "#2455ff", fontWeight: 600, cursor: "pointer", fontFamily: "'DM Sans', system-ui, sans-serif" }}>Invite People</button>
                            <button type="button" onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/events/rsvp/${evt.id}`); }} style={{ fontSize: "12px", padding: "7px 16px", borderRadius: "10px", border: "1px solid rgba(11,18,34,0.08)", background: "white", color: "#3b4963", fontWeight: 600, cursor: "pointer", fontFamily: "'DM Sans', system-ui, sans-serif" }}>Copy Link</button>
                            <button type="button" onClick={() => handleCancelEvent(evt.id)} style={{ fontSize: "12px", padding: "7px 16px", borderRadius: "10px", border: "1px solid rgba(11,18,34,0.08)", background: "white", color: "#7a8ba8", fontWeight: 600, cursor: "pointer", fontFamily: "'DM Sans', system-ui, sans-serif" }}>Cancel Event</button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                  {events.filter((e) => e.status === "cancelled").length > 0 && (
                    <details style={{ marginTop: "8px" }}>
                      <summary style={{ fontSize: "12px", color: "#7a8ba8", cursor: "pointer", fontWeight: 600 }}>{events.filter((e) => e.status === "cancelled").length} cancelled</summary>
                      <div style={{ display: "grid", gap: "8px", marginTop: "8px" }}>
                        {events.filter((e) => e.status === "cancelled").map((evt) => (
                          <div key={evt.id} style={{ padding: "12px 16px", borderRadius: "10px", border: "1px solid rgba(232,96,76,0.12)", background: "rgba(232,96,76,0.03)", opacity: 0.6 }}>
                            <span style={{ fontSize: "13px", color: "#e8604c", fontWeight: 600 }}>{evt.title}</span>
                            <span style={{ fontSize: "11px", color: "#7a8ba8", marginLeft: "8px" }}>{new Date(evt.starts_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
                          </div>
                        ))}
                      </div>
                    </details>
                  )}
                </div>
              )}
            </SectionCard>
          </div>
        )}

        {tab === "ce-history" && (() => {
          const now = new Date();
          const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
          const totalSent = ceHistory.length;
          const totalAccessed = ceHistory.filter((r) => r.clicked_at).length;
          const thisMonth = ceHistory.filter((r) => r.created_at >= monthStart).length;
          const manualCount = ceHistory.filter((r) => (r.source ?? "manual") === "manual").length;
          const qrCount = ceHistory.filter((r) => r.source === "qr").length;
          const bulkCount = ceHistory.filter((r) => r.source === "bulk").length;

          const filtered = ceHistoryFilter === "all"
            ? ceHistory
            : ceHistory.filter((r) => (ceHistoryFilter === "manual" ? (r.source ?? "manual") === "manual" : r.source === ceHistoryFilter));

          const sourceBadge = (source: string | null) => {
            const s = source ?? "manual";
            if (s === "qr") return <span style={{ display: "inline-flex", alignItems: "center", padding: "2px 8px", borderRadius: "999px", fontSize: "11px", fontWeight: 700, background: "rgba(36,85,255,0.14)", color: "#2455ff" }}>QR</span>;
            if (s === "bulk") return <span style={{ display: "inline-flex", alignItems: "center", padding: "2px 8px", borderRadius: "999px", fontSize: "11px", fontWeight: 700, background: "#EDE9FE", color: "#6D28D9" }}>Bulk</span>;
            return <span style={{ display: "inline-flex", alignItems: "center", padding: "2px 8px", borderRadius: "999px", fontSize: "11px", fontWeight: 700, background: "#f0efeb", color: "#3b4963" }}>Manual</span>;
          };

          return (
            <div className="space-y-4">
              {/* Summary stat cards */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px" }}>
                {[
                  { label: "Total Sent", value: totalSent },
                  { label: "Accessed", value: totalAccessed },
                  { label: "This Month", value: thisMonth },
                ].map(({ label, value }) => (
                  <div key={label} style={{ background: "white", border: "1px solid var(--border)", borderRadius: "12px", padding: "16px", textAlign: "center" }}>
                    <div style={{ fontSize: "28px", fontWeight: 800, color: "var(--ink)", lineHeight: 1 }}>{value}</div>
                    <div style={{ fontSize: "12px", color: "var(--ink-muted)", marginTop: "4px" }}>{label}</div>
                  </div>
                ))}
              </div>

              {/* Source breakdown */}
              <div style={{ fontSize: "12px", color: "#7a8ba8", paddingLeft: "2px" }}>
                {manualCount} manual · {qrCount} QR · {bulkCount} bulk
              </div>

              <SectionCard>
                <div className="border-b border-[var(--border)] pb-3 mb-4">
                  <h2 style={{ fontFamily: "'Fraunces', Georgia, serif", fontSize: '16px', fontWeight: 800, color: '#0b1222', margin: 0 }}>CE History</h2>
                </div>

                {/* Filter pills */}
                <div style={{ display: "flex", gap: "8px", marginBottom: "16px", flexWrap: "wrap" }}>
                  {(["all", "manual", "qr", "bulk"] as const).map((f) => (
                    <button
                      key={f}
                      type="button"
                      onClick={() => setCeHistoryFilter(f)}
                      style={{
                        padding: "4px 14px", borderRadius: "999px", fontSize: "12px", fontWeight: 600, cursor: "pointer", border: "none",
                        background: ceHistoryFilter === f ? "var(--ink)" : "#f0efeb",
                        color: ceHistoryFilter === f ? "white" : "#7a8ba8",
                      }}
                    >
                      {f === "all" ? "All" : f === "qr" ? "QR" : f.charAt(0).toUpperCase() + f.slice(1)}
                    </button>
                  ))}
                </div>

                {ceHistoryLoading ? (
                  <p className="text-sm text-[var(--ink-muted)] py-4">Loading…</p>
                ) : filtered.length === 0 ? (
                  <div style={{ padding: '48px 24px', textAlign: 'center' }}>
                    {ceHistory.length === 0 ? (
                      <>
                        <div style={{ fontSize: '48px', marginBottom: '16px' }}>📬</div>
                        <h3 style={{
                          fontFamily: "'Fraunces', Georgia, serif",
                          fontSize: '20px', fontWeight: 800, color: '#0b1222', marginBottom: '8px',
                        }}>No CE courses sent yet</h3>
                        <p style={{ fontSize: '14px', color: '#7a8ba8', maxWidth: '360px', margin: '0 auto 24px', lineHeight: 1.6 }}>
                          {professionals.length === 0
                            ? "Start by adding a professional to your network, then send them a free CE course."
                            : "You have professionals in your network — send one a free CE course to get started."}
                        </p>
                        <button
                          type="button"
                          onClick={() => {
                            if (professionals.length === 0) { setTab("network"); setAddOpen(true); }
                            else { setTab("network"); }
                          }}
                          style={{
                            display: 'inline-flex', alignItems: 'center', gap: '6px',
                            background: '#2455ff', color: 'white', fontWeight: 700,
                            padding: '12px 24px', borderRadius: '10px', border: 'none',
                            fontSize: '14px', cursor: 'pointer',
                            boxShadow: '0 2px 10px rgba(36,85,255,0.18)',
                          }}
                        >{professionals.length === 0 ? "Add a Professional" : "Go to Network"}</button>
                      </>
                    ) : (
                      <p style={{ fontSize: '14px', color: '#7a8ba8' }}>No sends match this filter.</p>
                    )}
                  </div>
                ) : (
                  <div style={{ overflowX: "auto" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                      <thead>
                        <tr style={{ borderBottom: "1px solid var(--border)" }}>
                          {["Professional", "Course", "Hrs", "Sent Date", "Source", "Status"].map((h) => (
                            <th key={h} style={{ textAlign: "left", padding: "6px 10px", fontSize: "11px", fontWeight: 700, color: "var(--ink-muted)", whiteSpace: "nowrap" }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {filtered.map((row) => (
                          <tr key={row.id} style={{ borderBottom: "1px solid var(--border)" }} className="hover:bg-[#f6f5f0]/60">
                            <td style={{ padding: "10px 10px" }}>
                              <div style={{ fontWeight: 600, color: "var(--ink)" }}>{row.professional_name}</div>
                              {row.recipient_email && row.professional_name !== row.recipient_email && (
                                <div style={{ fontSize: "11px", color: "var(--ink-muted)" }}>{row.recipient_email}</div>
                              )}
                            </td>
                            <td style={{ padding: "10px 10px", color: "var(--ink)", maxWidth: "200px" }}>
                              <div style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{row.course_name}</div>
                            </td>
                            <td style={{ padding: "10px 10px", color: "var(--ink-muted)", whiteSpace: "nowrap" }}>{row.course_hours}</td>
                            <td style={{ padding: "10px 10px", color: "var(--ink-muted)", whiteSpace: "nowrap" }}>
                              {new Date(row.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                            </td>
                            <td style={{ padding: "10px 10px" }}>{sourceBadge(row.source)}</td>
                            <td style={{ padding: "10px 10px" }}>
                              {row.clicked_at ? (
                                <span style={{ display: "inline-flex", alignItems: "center", padding: "2px 8px", borderRadius: "999px", fontSize: "11px", fontWeight: 700, background: "rgba(13,148,136,0.12)", color: "#0d9488" }}>Accessed ✓</span>
                              ) : (
                                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                  <span style={{ display: "inline-flex", alignItems: "center", padding: "2px 8px", borderRadius: "999px", fontSize: "11px", fontWeight: 700, background: "#f6f5f0", color: "#7a8ba8" }}>Sent</span>
                                  <button
                                    type="button"
                                    disabled={reminderSending === row.id}
                                    onClick={() => handleSendReminder(row.id)}
                                    style={{
                                      fontSize: "11px",
                                      fontWeight: 600,
                                      color: reminderSending === row.id ? "#7a8ba8" : "#2455ff",
                                      background: "none",
                                      border: "none",
                                      cursor: reminderSending === row.id ? "not-allowed" : "pointer",
                                      padding: "2px 0",
                                      textDecoration: "underline",
                                      textUnderlineOffset: "2px",
                                      fontFamily: "'DM Sans', system-ui, sans-serif",
                                    }}
                                  >
                                    {reminderSending === row.id ? "Sending…" : "Remind"}
                                  </button>
                                </div>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </SectionCard>
            </div>
          );
        })()}

        {/* Billing tab */}
        {tab === "billing" && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* If rep is in an org, show simplified view */}
            {billingUsage?.viewScope === "rep" && billingSettings?.billing_type === "org" && (
              <div style={{
                borderRadius: '12px', padding: '20px',
                background: 'rgba(36,85,255,0.04)',
                border: '1px solid rgba(36,85,255,0.08)',
                textAlign: 'center',
              }}>
                <p style={{ fontSize: '14px', color: '#3b4963', margin: '0 0 4px' }}>
                  <strong>Your company manages billing.</strong>
                </p>
                <p style={{ fontSize: '13px', color: '#7a8ba8', margin: 0 }}>
                  Below is your personal CE usage this month. Invoices are sent to your company admin.
                </p>
              </div>
            )}

            {/* Current Period */}
            <SectionCard>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                <div>
                  <h2 style={{ fontFamily: "'Fraunces', Georgia, serif", fontSize: '16px', fontWeight: 800, color: '#0b1222', margin: 0 }}>
                    {billingUsage ? new Date(billingUsage.periodStart).toLocaleDateString("en-US", { month: "long", year: "numeric" }) : "Current Period"}
                  </h2>
                  <p style={{ fontSize: '12px', color: '#7a8ba8', marginTop: '3px' }}>
                    {billingUsage ? `${billingUsage.periodStart} — ${billingUsage.periodEnd}` : ""}
                  </p>
                </div>
                <span style={{
                  background: 'rgba(36,85,255,0.08)', color: '#2455ff',
                  padding: '5px 12px', borderRadius: '8px',
                  fontSize: '11px', fontWeight: 700,
                }}>🚀 Early Access</span>
              </div>

              {billingUsageLoading ? (
                <p style={{ color: '#7a8ba8', fontSize: '14px' }}>Loading…</p>
              ) : billingUsage ? (
                <>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                    <div style={{ background: '#f6f5f0', borderRadius: '12px', padding: '18px', textAlign: 'center' }}>
                      <div style={{ fontFamily: "'Fraunces', Georgia, serif", fontSize: '32px', fontWeight: 900, color: '#0b1222' }}>
                        {billingUsage.ceCount}
                      </div>
                      <div style={{ fontSize: '12px', color: '#7a8ba8', marginTop: '3px' }}>CEs redeemed</div>
                    </div>
                    <div style={{ background: '#f6f5f0', borderRadius: '12px', padding: '18px', textAlign: 'center' }}>
                      <div style={{ fontFamily: "'Fraunces', Georgia, serif", fontSize: '32px', fontWeight: 900, color: '#0b1222' }}>
                        ${(billingUsage.totalCents / 100).toFixed(2)}
                      </div>
                      <div style={{ fontSize: '12px', color: '#7a8ba8', marginTop: '3px' }}>Estimated cost</div>
                    </div>
                  </div>
                  <div style={{
                    padding: '12px 14px', borderRadius: '10px',
                    background: 'rgba(36,85,255,0.04)', border: '1px solid rgba(36,85,255,0.08)',
                    fontSize: '12px', color: '#3b4963',
                  }}>
                    🚀 <strong>Early access</strong> — no charges during launch. Usage is tracked so you can see the value.
                  </div>
                </>
              ) : null}
            </SectionCard>

            {/* Usage Breakdown */}
            {billingUsage && billingUsage.lineItems.length > 0 && (
              <SectionCard>
                <h2 style={{ fontFamily: "'Fraunces', Georgia, serif", fontSize: '16px', fontWeight: 800, color: '#0b1222', margin: '0 0 14px' }}>
                  Usage This Month
                </h2>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                    <thead>
                      <tr style={{ borderBottom: '2px solid rgba(11,18,34,0.08)' }}>
                        {["Date", "Professional", "Course", "Hrs", "Cost"].map(h => (
                          <th key={h} style={{ textAlign: 'left', padding: '8px 10px', fontSize: '11px', fontWeight: 700, color: '#7a8ba8', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {billingUsage.lineItems.map((li: any) => (
                        <tr key={li.id} style={{ borderBottom: '1px solid rgba(11,18,34,0.04)' }}>
                          <td style={{ padding: '10px', color: '#7a8ba8', whiteSpace: 'nowrap' }}>
                            {new Date(li.redeemedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                          </td>
                          <td style={{ padding: '10px', color: '#0b1222', fontWeight: 600 }}>{li.professionalName}</td>
                          <td style={{ padding: '10px', color: '#3b4963', maxWidth: '180px' }}>
                            <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{li.courseName}</div>
                          </td>
                          <td style={{ padding: '10px', color: '#7a8ba8', textAlign: 'center' }}>{li.courseHours}</td>
                          <td style={{ padding: '10px', fontWeight: 600, color: '#0b1222' }}>${(li.priceCents / 100).toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </SectionCard>
            )}

            {/* Past Invoices */}
            <SectionCard>
              <h2 style={{ fontFamily: "'Fraunces', Georgia, serif", fontSize: '16px', fontWeight: 800, color: '#0b1222', margin: '0 0 14px' }}>
                Invoices
              </h2>
              {billingInvoices.length === 0 ? (
                <p style={{ color: '#7a8ba8', fontSize: '13px', textAlign: 'center', padding: '24px 0' }}>
                  No invoices yet. Usage is tracked during early access — invoices appear here once billing is active.
                </p>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                    <thead>
                      <tr style={{ borderBottom: '2px solid rgba(11,18,34,0.08)' }}>
                        {["Period", "CEs", "Amount", "Status", ""].map(h => (
                          <th key={h} style={{ textAlign: 'left', padding: '8px 10px', fontSize: '11px', fontWeight: 700, color: '#7a8ba8', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {billingInvoices.map((inv: any) => (
                        <tr key={inv.id} style={{ borderBottom: '1px solid rgba(11,18,34,0.04)' }}>
                          <td style={{ padding: '10px', fontWeight: 600, color: '#0b1222' }}>
                            {new Date(inv.period_start).toLocaleDateString("en-US", { month: "long", year: "numeric" })}
                          </td>
                          <td style={{ padding: '10px', color: '#3b4963' }}>{inv.ce_count}</td>
                          <td style={{ padding: '10px', fontWeight: 600, color: '#0b1222' }}>${(inv.total_cents / 100).toFixed(2)}</td>
                          <td style={{ padding: '10px' }}>
                            <span style={{
                              padding: '3px 10px', borderRadius: '999px', fontSize: '11px', fontWeight: 700,
                              background: inv.status === 'paid' ? 'rgba(13,148,136,0.10)' : inv.status === 'overdue' ? 'rgba(232,96,76,0.10)' : '#f6f5f0',
                              color: inv.status === 'paid' ? '#0d9488' : inv.status === 'overdue' ? '#e8604c' : '#7a8ba8',
                            }}>{inv.status === 'paid' ? '✓ Paid' : inv.status.charAt(0).toUpperCase() + inv.status.slice(1)}</span>
                          </td>
                          <td style={{ padding: '10px' }}>
                            {inv.stripe_hosted_url && (
                              <a href={inv.stripe_hosted_url} target="_blank" rel="noopener noreferrer" style={{ fontSize: '12px', color: '#2455ff', fontWeight: 600, textDecoration: 'none' }}>View →</a>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </SectionCard>

            {/* Billing Settings */}
            <SectionCard>
              <h2 style={{ fontFamily: "'Fraunces', Georgia, serif", fontSize: '16px', fontWeight: 800, color: '#0b1222', margin: '0 0 14px' }}>
                Billing Settings
              </h2>
              <form onSubmit={async (e) => {
                e.preventDefault();
                setBillingSetupSaving(true);
                const res = await fetch("/api/billing/setup", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  credentials: "include",
                  body: JSON.stringify(billingSetupForm),
                });
                const data = await res.json();
                setBillingSetupSaving(false);
                if (res.ok) {
                  setBillingSettings(data);
                } else {
                  alert(data.error || "Failed to save");
                }
              }} style={{ display: 'grid', gap: '14px', maxWidth: '420px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#7a8ba8', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Billing Email</label>
                  <input
                    type="email"
                    required
                    value={billingSetupForm.billingEmail}
                    onChange={e => setBillingSetupForm(f => ({ ...f, billingEmail: e.target.value }))}
                    placeholder="your@email.com"
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid rgba(11,18,34,0.08)', fontSize: '14px', fontFamily: "'DM Sans', system-ui, sans-serif", boxSizing: 'border-box' }}
                  />
                </div>
                <button
                  type="submit"
                  disabled={billingSetupSaving}
                  style={{
                    padding: '10px 20px', borderRadius: '10px', border: 'none',
                    background: '#2455ff', color: 'white', fontSize: '13px', fontWeight: 700,
                    cursor: billingSetupSaving ? 'not-allowed' : 'pointer',
                    opacity: billingSetupSaving ? 0.6 : 1,
                    boxShadow: '0 2px 10px rgba(36,85,255,0.18)',
                    fontFamily: "'DM Sans', system-ui, sans-serif",
                    width: 'fit-content',
                  }}
                >{billingSetupSaving ? "Saving…" : billingSettings ? "Update" : "Set Up Billing"}</button>
                {billingSettings && (
                  <div style={{ fontSize: '12px', color: '#7a8ba8' }}>
                    Currently: {billingSettings.billing_type === "org" ? "Company billing" : "Individual billing"} · {billingSettings.billing_email}
                  </div>
                )}
              </form>
            </SectionCard>
          </div>
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

                  {/* Course selection */}
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#3b4963', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Select Course</label>
                    {availableCoursesLoading ? (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '32px 0', fontSize: '14px', color: '#7a8ba8' }}>
                        Loading courses…
                      </div>
                    ) : filteredCourses.length === 0 ? (
                      <p style={{ padding: '16px 0', textAlign: 'center', fontSize: '14px', color: '#7a8ba8' }}>No courses available for this discipline.</p>
                    ) : (() => {
                      const TOPIC_PILLS = ["All", "Ethics", "Palliative Care", "Mental Health", "Care Transitions", "Rehabilitation", "General"];
                      const topicFiltered = (courseTopicFilter === "All"
                        ? filteredCourses
                        : filteredCourses.filter(({ course }) =>
                            course.topic?.toLowerCase().includes(courseTopicFilter.toLowerCase())
                          )
                      ).filter(({ course }) => {
                        if (!courseSearch.trim()) return true;
                        const q = courseSearch.toLowerCase();
                        return course.name.toLowerCase().includes(q) || (course.topic ?? "").toLowerCase().includes(q);
                      });
                      const disciplineLabel = sendCePro?.discipline ?? "all disciplines";
                      const cleanCourseName = (name: string) => name.replace(/^\*NEW\*\s*/i, "").replace(/^\*[^*]+\*\s*/i, "");

                      return (
                        <>
                          {/* Search bar */}
                          <div style={{ position: 'relative', marginBottom: '10px' }}>
                            <input
                              type="text"
                              value={courseSearch}
                              onChange={(e) => setCourseSearch(e.target.value)}
                              placeholder="Search courses…"
                              style={{
                                width: '100%',
                                padding: '10px 12px 10px 36px',
                                borderRadius: '10px',
                                border: '1px solid rgba(11,18,34,0.08)',
                                fontSize: '13px',
                                fontFamily: "'DM Sans', system-ui, sans-serif",
                                background: '#f6f5f0',
                                boxSizing: 'border-box' as const,
                                outline: 'none',
                              }}
                            />
                            <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', fontSize: '14px', color: '#7a8ba8', pointerEvents: 'none' }}>🔍</span>
                          </div>

                          {/* Topic filter pills */}
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '10px' }}>
                            {TOPIC_PILLS.map((pill) => {
                              const isActive = courseTopicFilter === pill;
                              return (
                                <button
                                  key={pill}
                                  type="button"
                                  tabIndex={-1}
                                  onClick={() => setCourseTopicFilter(pill)}
                                  style={{
                                    padding: '5px 14px',
                                    borderRadius: '999px',
                                    fontSize: '12px',
                                    fontWeight: isActive ? 700 : 500,
                                    border: isActive ? '1.5px solid #2455ff' : '1px solid rgba(11,18,34,0.08)',
                                    background: isActive ? 'rgba(36,85,255,0.08)' : '#ffffff',
                                    color: isActive ? '#2455ff' : '#3b4963',
                                    cursor: 'pointer',
                                    fontFamily: "'DM Sans', system-ui, sans-serif",
                                    transition: 'all 0.15s',
                                  }}
                                >
                                  {pill}
                                </button>
                              );
                            })}
                          </div>

                          {/* Count */}
                          <div style={{ fontSize: '12px', color: '#7a8ba8', marginBottom: '8px' }}>
                            {topicFiltered.length} course{topicFiltered.length !== 1 ? "s" : ""} for {disciplineLabel}
                            {courseSearch.trim() ? ` matching "${courseSearch.trim()}"` : ""}
                          </div>

                          {/* Scrollable course list */}
                          <div style={{
                            maxHeight: '300px',
                            overflowY: 'auto',
                            borderRadius: '12px',
                            border: '1px solid rgba(11,18,34,0.08)',
                            background: '#f6f5f0',
                            padding: '6px',
                          }}>
                            {topicFiltered.length === 0 ? (
                              <p style={{ padding: '24px 0', textAlign: 'center', fontSize: '13px', color: '#7a8ba8' }}>
                                {courseSearch.trim() ? "No courses match your search." : "No courses match this topic."}
                              </p>
                            ) : (
                              topicFiltered.map(({ course, profession }) => {
                                const isSelected = sendCeCourse === course.id;
                                const displayName = cleanCourseName(course.name);
                                const isNew = /^\*NEW\*/i.test(course.name);
                                return (
                                  <div
                                    key={course.id}
                                    onClick={() => setSendCeCourse(course.id)}
                                    style={{
                                      padding: '14px 16px',
                                      borderRadius: '10px',
                                      border: isSelected ? '2px solid #2455ff' : '1px solid transparent',
                                      background: isSelected ? 'rgba(36,85,255,0.06)' : '#ffffff',
                                      cursor: 'pointer',
                                      marginBottom: '4px',
                                      transition: 'all 0.15s',
                                      display: 'grid',
                                      gridTemplateColumns: '1fr auto',
                                      gap: '12px',
                                      alignItems: 'center',
                                    }}
                                    onMouseEnter={(e) => {
                                      if (!isSelected) e.currentTarget.style.background = '#fafaf7';
                                    }}
                                    onMouseLeave={(e) => {
                                      if (!isSelected) e.currentTarget.style.background = '#ffffff';
                                    }}
                                  >
                                    <div style={{ minWidth: 0 }}>
                                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                        <span style={{ fontWeight: 600, fontSize: '14px', color: '#0b1222', lineHeight: 1.3 }}>
                                          {displayName}
                                        </span>
                                        {isNew && (
                                          <span style={{
                                            fontSize: '10px', fontWeight: 700,
                                            background: 'rgba(13,148,136,0.10)', color: '#0d9488',
                                            padding: '2px 7px', borderRadius: '4px',
                                            flexShrink: 0,
                                          }}>NEW</span>
                                        )}
                                      </div>
                                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px', flexWrap: 'wrap' }}>
                                        <span style={{
                                          display: 'inline-flex', alignItems: 'center',
                                          background: '#f6f5f0', borderRadius: '6px',
                                          padding: '2px 8px', fontSize: '11px', fontWeight: 600, color: '#3b4963',
                                        }}>
                                          {course.hours} hr{course.hours !== 1 ? "s" : ""}
                                        </span>
                                        {course.price != null && (
                                          <span style={{
                                            display: 'inline-flex', alignItems: 'center',
                                            background: '#f6f5f0', borderRadius: '6px',
                                            padding: '2px 8px', fontSize: '11px', fontWeight: 600, color: '#3b4963',
                                          }}>
                                            ${course.price}
                                          </span>
                                        )}
                                        {course.topic && (
                                          <span style={{ fontSize: '11px', color: '#7a8ba8' }}>
                                            {course.topic}
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                                      <ApprovalBadge
                                        profession={profession}
                                        proState={sendCePro?.state ? (STATE_NAMES[sendCePro.state] ?? sendCePro.state) : null}
                                        course={course}
                                        approvalMap={professionApproval}
                                      />
                                      {isSelected && (
                                        <div style={{
                                          width: '22px', height: '22px', borderRadius: '50%',
                                          background: '#2455ff', color: 'white',
                                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                                          fontSize: '12px', fontWeight: 700,
                                        }}>✓</div>
                                      )}
                                    </div>
                                  </div>
                                );
                              })
                            )}
                          </div>
                        </>
                      );
                    })()}
                  </div>

                  <div style={{
                    background: '#f6f5f0',
                    borderRadius: '10px',
                    padding: '14px 16px',
                    border: '1px solid rgba(11,18,34,0.06)',
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontSize: '13px', fontWeight: 600, color: '#0b1222' }}>Free to professional</div>
                        <div style={{ fontSize: '11px', color: '#7a8ba8', marginTop: '2px' }}>
                          {sendCeCourse && filteredCourses.find(({ course }) => course.id === sendCeCourse)?.course.price
                            ? `Your company covers $${filteredCourses.find(({ course }) => course.id === sendCeCourse)!.course.price} per send`
                            : "Course cost billed to your company"}
                        </div>
                      </div>
                      <span style={{
                        background: 'rgba(13,148,136,0.10)',
                        color: '#0d9488',
                        padding: '4px 12px',
                        borderRadius: '8px',
                        fontSize: '12px',
                        fontWeight: 700,
                      }}>Complimentary</span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-[var(--ink-soft)] mb-1">Personal message (optional)</label>
                    <textarea value={sendCeMessage} onChange={(e) => setSendCeMessage(e.target.value)} placeholder="Add a note for the professional…" rows={3} className="w-full rounded-[var(--r)] border border-[var(--border)] px-3 py-2 text-sm resize-none" />
                  </div>

                  {/* Add to network checkbox — shown when sending to someone not already in network */}
                  {sendCePro && !professionals.some((p) => p.id === sendCePro.id) && (
                    <div
                      onClick={() => setSendCeAddToNetwork(!sendCeAddToNetwork)}
                      style={{
                        padding: '14px 16px',
                        borderRadius: '10px',
                        border: '1px solid rgba(11,18,34,0.08)',
                        background: sendCeAddToNetwork ? 'rgba(13,148,136,0.04)' : '#f6f5f0',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '10px',
                        transition: 'background 0.15s',
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={sendCeAddToNetwork}
                        onChange={() => {}}
                        style={{ width: '16px', height: '16px', marginTop: '1px', accentColor: '#0d9488' }}
                      />
                      <div>
                        <div style={{ fontSize: '13px', fontWeight: 600, color: '#0b1222' }}>
                          Add to my network
                        </div>
                        <div style={{ fontSize: '11px', color: '#7a8ba8', marginTop: '2px', lineHeight: 1.4 }}>
                          Save this professional to your network when the CE is sent. You&apos;ll be able to see their email, send more courses, and log touchpoints.
                        </div>
                      </div>
                    </div>
                  )}

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
      {touchpointOpen && (
        <div
          style={{position:'fixed',inset:0,zIndex:300,display:'flex',alignItems:'center',justifyContent:'center',background:'rgba(10,18,34,0.5)',backdropFilter:'blur(4px)'}}
          onClick={() => !touchpointSaving && setTouchpointOpen(false)}
        >
          <div
            style={{width:'92%',maxWidth:'440px',background:'white',borderRadius:'16px',padding:'24px',boxShadow:'0 20px 60px rgba(0,0,0,0.15)'}}
            onClick={e => e.stopPropagation()}
          >
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'start',marginBottom:'16px'}}>
              <div>
                <h3 style={{fontSize:'18px',fontWeight:700,color:'var(--ink)'}}>Log Touchpoint</h3>
                {touchpointPro && <p style={{fontSize:'13px',color:'var(--ink-muted)',marginTop:'2px'}}>{touchpointPro.name}</p>}
              </div>
              <button type="button" onClick={() => !touchpointSaving && setTouchpointOpen(false)} style={{background:'none',border:'none',fontSize:'22px',cursor:'pointer',color:'var(--ink-muted)',lineHeight:1}}>×</button>
            </div>

            {touchpointSuccess ? (
              <div style={{padding:'24px',textAlign:'center'}}>
                <div style={{fontSize:'40px',marginBottom:'8px'}}>✓</div>
                <p style={{fontWeight:600,color:'var(--green)'}}>Touchpoint logged!</p>
              </div>
            ) : (
              <form onSubmit={handleSaveTouchpoint}>
                <div style={{marginBottom:'16px'}}>
                  <label style={{display:'block',fontSize:'11px',fontWeight:600,color:'var(--ink-soft)',marginBottom:'8px',textTransform:'uppercase',letterSpacing:'0.05em'}}>Type</label>
                  <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'8px'}}>
                    {[
                      {id:'call', label:'📞 Phone Call', points:1},
                      {id:'visit', label:'🏥 In-Person Visit', points:3},
                      {id:'lunch', label:'🍽️ Lunch & Learn', points:8},
                      {id:'event', label:'🎉 Event', points:8},
                      {id:'other', label:'📝 Other', points:1},
                    ].map(t => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => setTouchpointType(t.id)}
                        style={{
                          padding:'10px 12px',
                          borderRadius:'10px',
                          border: touchpointType === t.id ? '2px solid var(--blue)' : '1px solid var(--border)',
                          background: touchpointType === t.id ? 'rgba(36,85,255,0.14)' : 'white',
                          cursor:'pointer',
                          fontSize:'13px',
                          fontWeight:600,
                          color: touchpointType === t.id ? 'var(--blue)' : 'var(--ink-soft)',
                          textAlign:'left',
                        }}
                      >
                        <div>{t.label}</div>
                      </button>
                    ))}
                  </div>
                </div>

                <div style={{marginBottom:'16px'}}>
                  <label style={{display:'block',fontSize:'11px',fontWeight:600,color:'var(--ink-soft)',marginBottom:'6px',textTransform:'uppercase',letterSpacing:'0.05em'}}>Notes (optional)</label>
                  <textarea
                    value={touchpointNotes}
                    onChange={e => setTouchpointNotes(e.target.value)}
                    placeholder="What was discussed?"
                    rows={3}
                    style={{width:'100%',borderRadius:'8px',border:'1px solid var(--border)',padding:'10px 12px',fontSize:'13px',resize:'none',fontFamily:'inherit',boxSizing:'border-box'}}
                  />
                </div>

                {touchpointError && <p style={{fontSize:'13px',color:'var(--coral)',marginBottom:'12px'}}>{touchpointError}</p>}

                <div style={{display:'flex',gap:'8px',justifyContent:'flex-end'}}>
                  <button type="button" onClick={() => !touchpointSaving && setTouchpointOpen(false)} style={{padding:'10px 20px',borderRadius:'10px',border:'1px solid var(--border)',background:'white',fontSize:'13px',fontWeight:600,cursor:'pointer',color:'var(--ink-soft)'}}>Cancel</button>
                  <button type="submit" disabled={touchpointSaving} style={{padding:'10px 20px',borderRadius:'10px',border:'none',background:'var(--blue)',color:'white',fontSize:'13px',fontWeight:600,cursor:'pointer',opacity:touchpointSaving?0.6:1}}>{touchpointSaving ? 'Saving…' : 'Log Touchpoint'}</button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
      </div>
    </PageShell>

    {importOpen && (
      <div
        style={{ position: "fixed", inset: 0, zIndex: 300, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(10,18,34,0.55)", backdropFilter: "blur(6px)", padding: "16px" }}
        onClick={resetImportModal}
      >
        <div
          style={{ width: "92%", maxWidth: "560px", background: "white", borderRadius: "16px", padding: "28px", boxShadow: "0 20px 60px rgba(0,0,0,0.15)", maxHeight: "90vh", overflowY: "auto" }}
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "20px" }}>
            <div>
              <h3 style={{ fontFamily: "'Fraunces', Georgia, serif", fontSize: "18px", fontWeight: 800, color: "#0b1222", margin: 0 }}>Import Professionals</h3>
              <p style={{ fontSize: "13px", color: "#7a8ba8", marginTop: "4px" }}>Upload a CSV to add multiple professionals at once.</p>
            </div>
            <button type="button" onClick={resetImportModal} style={{ background: "none", border: "none", fontSize: "22px", cursor: "pointer", color: "#7a8ba8", lineHeight: 1 }}>×</button>
          </div>

          {importResults ? (
            /* ── Results view ── */
            <div>
              <div style={{ textAlign: "center", marginBottom: "20px" }}>
                <div style={{ fontSize: "48px", marginBottom: "8px" }}>{importResults.errors.length === 0 ? "✅" : "⚠️"}</div>
                <h4 style={{ fontSize: "16px", fontWeight: 700, color: "#0b1222", margin: 0 }}>Import Complete</h4>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "20px" }}>
                <div style={{ background: "rgba(13,148,136,0.08)", borderRadius: "10px", padding: "16px", textAlign: "center" }}>
                  <div style={{ fontSize: "28px", fontWeight: 800, color: "#0d9488" }}>{importResults.added}</div>
                  <div style={{ fontSize: "12px", color: "#7a8ba8", marginTop: "2px" }}>Added</div>
                </div>
                <div style={{ background: "rgba(217,119,6,0.08)", borderRadius: "10px", padding: "16px", textAlign: "center" }}>
                  <div style={{ fontSize: "28px", fontWeight: 800, color: "#92670A" }}>{importResults.skipped}</div>
                  <div style={{ fontSize: "12px", color: "#7a8ba8", marginTop: "2px" }}>Skipped (already in network)</div>
                </div>
              </div>
              {importResults.errors.length > 0 && (
                <div style={{ background: "rgba(232,96,76,0.08)", borderRadius: "8px", padding: "12px", fontSize: "12px", color: "#B91C1C", marginBottom: "16px" }}>
                  {importResults.errors.map((err, i) => <div key={i}>{err}</div>)}
                </div>
              )}
              <button type="button" className={BTN_PRIMARY} style={{ width: "100%" }} onClick={resetImportModal}>Done</button>
            </div>
          ) : (
            /* ── Upload view ── */
            <div>
              {/* Required columns info */}
              <div style={{ background: "#f6f5f0", borderRadius: "10px", padding: "16px", marginBottom: "20px" }}>
                <div style={{ fontSize: "12px", fontWeight: 700, color: "#3b4963", marginBottom: "8px" }}>Required CSV columns:</div>
                <div style={{ fontSize: "12px", color: "#7a8ba8", lineHeight: 1.7 }}>
                  <strong style={{ color: "#0b1222" }}>Name</strong> and <strong style={{ color: "#0b1222" }}>Email</strong> (required)<br/>
                  Facility, City, State, Discipline, Phone (optional)
                </div>
                <a
                  href={`data:text/csv;charset=utf-8,${encodeURIComponent("Name,Email,Facility,City,State,Discipline,Phone\nJennifer Smith,jennifer@hospital.com,Memorial Hospital,Houston,TX,Nursing,555-0100\nMike Chen,mike@hospice.com,Sunrise Hospice,Dallas,TX,Social Work,")}`}
                  download="pulse-import-template.csv"
                  style={{ display: "inline-block", marginTop: "10px", fontSize: "12px", color: "#2455ff", fontWeight: 600, textDecoration: "none" }}
                >
                  ⬇ Download template
                </a>
              </div>

              {/* File upload area */}
              <label style={{
                display: "block",
                border: "2px dashed rgba(11,18,34,0.12)",
                borderRadius: "12px",
                padding: "32px",
                textAlign: "center",
                cursor: "pointer",
                marginBottom: "20px",
                transition: "border-color 0.15s",
              }}>
                <input
                  type="file"
                  accept=".csv,text/csv"
                  style={{ display: "none" }}
                  onChange={e => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    const reader = new FileReader();
                    reader.onload = (ev) => {
                      const text = ev.target?.result as string;
                      setImportCsvData(parseImportCsv(text));
                    };
                    reader.readAsText(file);
                  }}
                />
                <div style={{ fontSize: "32px", marginBottom: "8px" }}>📁</div>
                <div style={{ fontSize: "14px", fontWeight: 600, color: "#0b1222" }}>Click to upload a CSV file</div>
                <div style={{ fontSize: "12px", color: "#7a8ba8", marginTop: "4px" }}>or drag and drop</div>
              </label>

              {/* Preview */}
              {importCsvData.length > 0 && (
                <div style={{ marginBottom: "20px" }}>
                  <div style={{ fontSize: "13px", fontWeight: 600, color: "#0b1222", marginBottom: "8px" }}>
                    Preview — {importCsvData.length} professional{importCsvData.length !== 1 ? "s" : ""} found
                  </div>
                  <div style={{ maxHeight: "200px", overflowY: "auto", border: "1px solid rgba(11,18,34,0.08)", borderRadius: "10px" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
                      <thead>
                        <tr style={{ borderBottom: "1px solid rgba(11,18,34,0.08)", background: "#f6f5f0" }}>
                          <th style={{ textAlign: "left", padding: "8px 12px", color: "#7a8ba8", fontWeight: 600, fontSize: "11px" }}>Name</th>
                          <th style={{ textAlign: "left", padding: "8px 12px", color: "#7a8ba8", fontWeight: 600, fontSize: "11px" }}>Email</th>
                          <th style={{ textAlign: "left", padding: "8px 12px", color: "#7a8ba8", fontWeight: 600, fontSize: "11px" }}>Facility</th>
                          <th style={{ textAlign: "left", padding: "8px 12px", color: "#7a8ba8", fontWeight: 600, fontSize: "11px" }}>Discipline</th>
                        </tr>
                      </thead>
                      <tbody>
                        {importCsvData.slice(0, 10).map((r, i) => (
                          <tr key={i} style={{ borderBottom: "1px solid rgba(11,18,34,0.06)" }}>
                            <td style={{ padding: "8px 12px", fontWeight: 600, color: "#0b1222" }}>{r.name}</td>
                            <td style={{ padding: "8px 12px", color: "#7a8ba8" }}>{r.email}</td>
                            <td style={{ padding: "8px 12px", color: "#7a8ba8" }}>{r.facility || "—"}</td>
                            <td style={{ padding: "8px 12px", color: "#7a8ba8" }}>{r.discipline || "—"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {importCsvData.length > 10 && (
                      <div style={{ padding: "8px 12px", fontSize: "11px", color: "#7a8ba8", textAlign: "center" }}>
                        + {importCsvData.length - 10} more rows
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
                <button
                  type="button"
                  onClick={resetImportModal}
                  style={{ padding: "10px 20px", borderRadius: "10px", border: "1px solid rgba(11,18,34,0.08)", background: "white", fontSize: "13px", fontWeight: 600, cursor: "pointer", color: "#3b4963" }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={importSaving || importCsvData.length === 0}
                  onClick={handleImportCsv}
                  style={{
                    padding: "10px 20px", borderRadius: "10px", border: "none",
                    background: "#2455ff", color: "white", fontSize: "13px", fontWeight: 700,
                    cursor: importSaving || importCsvData.length === 0 ? "not-allowed" : "pointer",
                    opacity: importSaving || importCsvData.length === 0 ? 0.5 : 1,
                    boxShadow: "0 2px 10px rgba(36,85,255,0.18)",
                  }}
                >
                  {importSaving ? "Importing…" : `Import ${importCsvData.length} Professional${importCsvData.length !== 1 ? "s" : ""}`}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    )}

        {/* ── Create Event Modal ── */}
        {createEventOpen && (
          <div style={{ position: "fixed", inset: 0, zIndex: 300, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(10,18,34,0.55)", backdropFilter: "blur(4px)", padding: "16px" }} onClick={() => !eventSaving && setCreateEventOpen(false)}>
            <div style={{ width: "100%", maxWidth: "560px", background: "white", borderRadius: "16px", padding: "28px", boxShadow: "0 20px 60px rgba(0,0,0,0.15)", maxHeight: "92vh", overflowY: "auto" }} onClick={(e) => e.stopPropagation()}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "20px" }}>
                <h3 style={{ fontFamily: "'Fraunces', Georgia, serif", fontSize: "18px", fontWeight: 800, color: "#0b1222", margin: 0 }}>Create Event</h3>
                <button type="button" onClick={() => !eventSaving && setCreateEventOpen(false)} style={{ background: "none", border: "none", fontSize: "22px", cursor: "pointer", color: "#7a8ba8", lineHeight: 1 }}>×</button>
              </div>
              <form onSubmit={handleCreateEvent} style={{ display: "grid", gap: "16px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "11px", fontWeight: 600, color: "#7a8ba8", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.04em" }}>Type</label>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                    {[{ id: "lunch_and_learn", label: "🍽️ Lunch & Learn" }, { id: "networking_dinner", label: "🥂 Networking Dinner" }, { id: "workshop", label: "📋 Workshop" }, { id: "in_service", label: "🏥 In-Service" }].map((t) => (
                      <button key={t.id} type="button" onClick={() => setEventForm((f) => ({ ...f, eventType: t.id }))} style={{ padding: "10px 12px", borderRadius: "10px", fontSize: "13px", fontWeight: 600, textAlign: "left", border: eventForm.eventType === t.id ? "2px solid #2455ff" : "1px solid rgba(11,18,34,0.08)", background: eventForm.eventType === t.id ? "rgba(36,85,255,0.06)" : "white", color: eventForm.eventType === t.id ? "#2455ff" : "#3b4963", cursor: "pointer", fontFamily: "'DM Sans', system-ui, sans-serif" }}>{t.label}</button>
                    ))}
                  </div>
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "11px", fontWeight: 600, color: "#7a8ba8", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.04em" }}>Event Name</label>
                  <input type="text" required value={eventForm.title} onChange={(e) => setEventForm((f) => ({ ...f, title: e.target.value }))} placeholder="Ethics in Elderly Care — Lunch & Learn" style={{ width: "100%", padding: "10px 14px", borderRadius: "10px", border: "1px solid rgba(11,18,34,0.08)", fontSize: "14px", fontFamily: "'DM Sans', system-ui, sans-serif", boxSizing: "border-box" }} />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "11px", fontWeight: 600, color: "#7a8ba8", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.04em" }}>Description (optional)</label>
                  <textarea value={eventForm.description} onChange={(e) => setEventForm((f) => ({ ...f, description: e.target.value }))} placeholder="Join us for lunch and a discussion on…" rows={3} style={{ width: "100%", padding: "10px 14px", borderRadius: "10px", border: "1px solid rgba(11,18,34,0.08)", fontSize: "13px", fontFamily: "'DM Sans', system-ui, sans-serif", boxSizing: "border-box", resize: "none" }} />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "11px", fontWeight: 600, color: "#7a8ba8", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.04em" }}>External Link (optional)</label>
                  <input type="url" value={eventForm.externalUrl} onChange={(e) => setEventForm((f) => ({ ...f, externalUrl: e.target.value }))} placeholder="https://eventbrite.com/your-event" style={{ width: "100%", padding: "10px 14px", borderRadius: "10px", border: "1px solid rgba(11,18,34,0.08)", fontSize: "14px", fontFamily: "'DM Sans', system-ui, sans-serif", boxSizing: "border-box" }} />
                  <p style={{ fontSize: "11px", color: "#7a8ba8", marginTop: "4px" }}>If you have an existing signup page, paste it here. It'll be the primary link in invitations.</p>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "11px", fontWeight: 600, color: "#7a8ba8", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.04em" }}>Date</label>
                    <input type="date" required value={eventForm.startsAt} onChange={(e) => setEventForm((f) => ({ ...f, startsAt: e.target.value }))} style={{ width: "100%", padding: "10px 14px", borderRadius: "10px", border: "1px solid rgba(11,18,34,0.08)", fontSize: "14px", fontFamily: "'DM Sans', system-ui, sans-serif", boxSizing: "border-box" }} />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "11px", fontWeight: 600, color: "#7a8ba8", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.04em" }}>Time</label>
                    <input type="time" required value={eventForm.startsAtTime} onChange={(e) => setEventForm((f) => ({ ...f, startsAtTime: e.target.value }))} style={{ width: "100%", padding: "10px 14px", borderRadius: "10px", border: "1px solid rgba(11,18,34,0.08)", fontSize: "14px", fontFamily: "'DM Sans', system-ui, sans-serif", boxSizing: "border-box" }} />
                  </div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "11px", fontWeight: 600, color: "#7a8ba8", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.04em" }}>Duration</label>
                    <select value={eventForm.durationMinutes} onChange={(e) => setEventForm((f) => ({ ...f, durationMinutes: e.target.value }))} style={{ width: "100%", padding: "10px 14px", borderRadius: "10px", border: "1px solid rgba(11,18,34,0.08)", fontSize: "14px", fontFamily: "'DM Sans', system-ui, sans-serif" }}>
                      <option value="30">30 min</option><option value="45">45 min</option><option value="60">1 hour</option><option value="90">1.5 hours</option><option value="120">2 hours</option><option value="180">3 hours</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "11px", fontWeight: 600, color: "#7a8ba8", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.04em" }}>Max Capacity</label>
                    <input type="number" min="1" max="500" value={eventForm.maxCapacity} onChange={(e) => setEventForm((f) => ({ ...f, maxCapacity: e.target.value }))} placeholder="Unlimited" style={{ width: "100%", padding: "10px 14px", borderRadius: "10px", border: "1px solid rgba(11,18,34,0.08)", fontSize: "14px", fontFamily: "'DM Sans', system-ui, sans-serif", boxSizing: "border-box" }} />
                  </div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "11px", fontWeight: 600, color: "#7a8ba8", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.04em" }}>Venue</label>
                    <input type="text" value={eventForm.locationName} onChange={(e) => setEventForm((f) => ({ ...f, locationName: e.target.value }))} placeholder="Memorial Hospital Cafeteria" style={{ width: "100%", padding: "10px 14px", borderRadius: "10px", border: "1px solid rgba(11,18,34,0.08)", fontSize: "14px", fontFamily: "'DM Sans', system-ui, sans-serif", boxSizing: "border-box" }} />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "11px", fontWeight: 600, color: "#7a8ba8", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.04em" }}>Address</label>
                    <input type="text" value={eventForm.address} onChange={(e) => setEventForm((f) => ({ ...f, address: e.target.value }))} placeholder="1234 Main St" style={{ width: "100%", padding: "10px 14px", borderRadius: "10px", border: "1px solid rgba(11,18,34,0.08)", fontSize: "14px", fontFamily: "'DM Sans', system-ui, sans-serif", boxSizing: "border-box" }} />
                  </div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "11px", fontWeight: 600, color: "#7a8ba8", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.04em" }}>City</label>
                    <input type="text" value={eventForm.city} onChange={(e) => setEventForm((f) => ({ ...f, city: e.target.value }))} placeholder="Houston" style={{ width: "100%", padding: "10px 14px", borderRadius: "10px", border: "1px solid rgba(11,18,34,0.08)", fontSize: "14px", fontFamily: "'DM Sans', system-ui, sans-serif", boxSizing: "border-box" }} />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "11px", fontWeight: 600, color: "#7a8ba8", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.04em" }}>State</label>
                    <select value={eventForm.state} onChange={(e) => setEventForm((f) => ({ ...f, state: e.target.value }))} style={{ width: "100%", padding: "10px 14px", borderRadius: "10px", border: "1px solid rgba(11,18,34,0.08)", fontSize: "14px", fontFamily: "'DM Sans', system-ui, sans-serif" }}>
                      <option value="">Select…</option>
                      {US_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                </div>
                <div style={{ padding: "16px", borderRadius: "12px", background: "#f6f5f0", border: "1px solid rgba(11,18,34,0.06)" }}>
                  <div style={{ fontSize: "11px", fontWeight: 600, color: "#7a8ba8", marginBottom: "10px", textTransform: "uppercase", letterSpacing: "0.04em" }}>Who can see this event?</div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                    <button type="button" onClick={() => setEventForm((f) => ({ ...f, visibility: "network" }))} style={{ padding: "12px", borderRadius: "10px", textAlign: "left", border: eventForm.visibility === "network" ? "2px solid #2455ff" : "1px solid rgba(11,18,34,0.08)", background: eventForm.visibility === "network" ? "rgba(36,85,255,0.04)" : "white", cursor: "pointer" }}>
                      <div style={{ fontSize: "13px", fontWeight: 700, color: eventForm.visibility === "network" ? "#2455ff" : "#0b1222" }}>🔒 My Network</div>
                      <div style={{ fontSize: "11px", color: "#7a8ba8", marginTop: "2px" }}>Only professionals I've added</div>
                    </button>
                    <button type="button" onClick={() => setEventForm((f) => ({ ...f, visibility: "public" }))} style={{ padding: "12px", borderRadius: "10px", textAlign: "left", border: eventForm.visibility === "public" ? "2px solid #2455ff" : "1px solid rgba(11,18,34,0.08)", background: eventForm.visibility === "public" ? "rgba(36,85,255,0.04)" : "white", cursor: "pointer" }}>
                      <div style={{ fontSize: "13px", fontWeight: 700, color: eventForm.visibility === "public" ? "#2455ff" : "#0b1222" }}>🌐 Public</div>
                      <div style={{ fontSize: "11px", color: "#7a8ba8", marginTop: "2px" }}>All professionals in my area</div>
                    </button>
                  </div>
                  {eventForm.visibility === "public" && <p style={{ fontSize: "11px", color: "#3b4963", marginTop: "8px", lineHeight: 1.4 }}>Public events appear for all professionals in your city/state. Make sure the city and state above are filled in.</p>}
                </div>
                <button type="submit" disabled={eventSaving} style={{ padding: "12px", borderRadius: "10px", border: "none", background: "#2455ff", color: "white", fontSize: "14px", fontWeight: 700, cursor: eventSaving ? "not-allowed" : "pointer", opacity: eventSaving ? 0.6 : 1, boxShadow: "0 2px 10px rgba(36,85,255,0.18)", fontFamily: "'DM Sans', system-ui, sans-serif" }}>{eventSaving ? "Creating…" : "Create Event"}</button>
              </form>
            </div>
          </div>
        )}

        {/* ── Invite Modal ── */}
        {inviteModalEvent && (
          <div style={{ position: "fixed", inset: 0, zIndex: 300, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(10,18,34,0.55)", backdropFilter: "blur(4px)", padding: "16px" }} onClick={() => !inviteSending && closeInviteModal()}>
            <div style={{ width: "100%", maxWidth: "560px", background: "white", borderRadius: "16px", padding: "28px", boxShadow: "0 20px 60px rgba(0,0,0,0.15)", maxHeight: "92vh", overflowY: "auto" }} onClick={(e) => e.stopPropagation()}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
                <div>
                  <h3 style={{ fontFamily: "'Fraunces', Georgia, serif", fontSize: "18px", fontWeight: 800, color: "#0b1222", margin: 0 }}>Invite People</h3>
                  <p style={{ fontSize: "12px", color: "#7a8ba8", marginTop: "4px" }}>{inviteModalEvent.title}</p>
                </div>
                <button type="button" onClick={() => !inviteSending && closeInviteModal()} style={{ background: "none", border: "none", fontSize: "22px", cursor: "pointer", color: "#7a8ba8", lineHeight: 1 }}>×</button>
              </div>
              {inviteResults ? (
                <div style={{ textAlign: "center", padding: "20px 0" }}>
                  <div style={{ fontSize: "48px", marginBottom: "8px" }}>{inviteResults.failed === 0 ? "✅" : "⚠️"}</div>
                  <p style={{ fontWeight: 700, color: "#0b1222", fontSize: "16px" }}>{inviteResults.sent} invite{inviteResults.sent !== 1 ? "s" : ""} sent</p>
                  {inviteResults.failed > 0 && <p style={{ fontSize: "13px", color: "#e8604c", marginTop: "8px" }}>{inviteResults.failed} failed</p>}
                  <button type="button" onClick={closeInviteModal} style={{ marginTop: "20px", padding: "10px 24px", borderRadius: "10px", border: "none", background: "#2455ff", color: "white", fontSize: "14px", fontWeight: 700, cursor: "pointer" }}>Done</button>
                </div>
              ) : (
                <>
                  {professionals.length > 0 && (
                    <div style={{ marginBottom: "20px" }}>
                      <div style={{ fontSize: "11px", fontWeight: 600, color: "#7a8ba8", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: "8px" }}>From Your Network</div>
                      <div style={{ maxHeight: "200px", overflowY: "auto", border: "1px solid rgba(11,18,34,0.08)", borderRadius: "10px" }}>
                        {professionals.map((p) => (
                          <label key={p.id} style={{ display: "flex", alignItems: "center", gap: "10px", padding: "10px 14px", borderBottom: "1px solid rgba(11,18,34,0.06)", cursor: "pointer", background: inviteSelectedPros.includes(p.id) ? "rgba(36,85,255,0.04)" : "white" }}>
                            <input type="checkbox" checked={inviteSelectedPros.includes(p.id)} onChange={(e) => { if (e.target.checked) setInviteSelectedPros((prev) => [...prev, p.id]); else setInviteSelectedPros((prev) => prev.filter((id) => id !== p.id)); }} style={{ accentColor: "#2455ff" }} />
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontWeight: 600, fontSize: "13px", color: "#0b1222" }}>{p.name}</div>
                              <div style={{ fontSize: "11px", color: "#7a8ba8" }}>{p.email}</div>
                            </div>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}
                  <div style={{ marginBottom: "20px" }}>
                    <div style={{ fontSize: "11px", fontWeight: 600, color: "#7a8ba8", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: "8px" }}>Invite by Email</div>
                    {inviteGuestRows.map((row, i) => (
                      <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 1fr 32px", gap: "8px", marginBottom: "6px" }}>
                        <input type="text" placeholder="Name" value={row.name} onChange={(e) => { const rows = [...inviteGuestRows]; rows[i] = { ...rows[i], name: e.target.value }; setInviteGuestRows(rows); }} style={{ padding: "8px 12px", borderRadius: "8px", border: "1px solid rgba(11,18,34,0.08)", fontSize: "13px", fontFamily: "'DM Sans', system-ui, sans-serif", boxSizing: "border-box" }} />
                        <input type="email" placeholder="email@example.com" value={row.email} onChange={(e) => { const rows = [...inviteGuestRows]; rows[i] = { ...rows[i], email: e.target.value }; setInviteGuestRows(rows); }} style={{ padding: "8px 12px", borderRadius: "8px", border: "1px solid rgba(11,18,34,0.08)", fontSize: "13px", fontFamily: "'DM Sans', system-ui, sans-serif", boxSizing: "border-box" }} />
                        <button type="button" onClick={() => setInviteGuestRows(inviteGuestRows.filter((_, idx) => idx !== i))} style={{ background: "none", border: "none", color: "#7a8ba8", cursor: "pointer", fontSize: "16px" }}>×</button>
                      </div>
                    ))}
                    <button type="button" onClick={() => setInviteGuestRows([...inviteGuestRows, { name: "", email: "" }])} style={{ fontSize: "12px", color: "#2455ff", background: "none", border: "1px dashed rgba(11,18,34,0.12)", borderRadius: "6px", padding: "6px 14px", cursor: "pointer", marginTop: "4px" }}>+ Add Another</button>
                  </div>
                  {(() => {
                    const total = inviteSelectedPros.length + inviteGuestRows.filter((r) => r.email.trim()).length;
                    return (
                      <button type="button" disabled={inviteSending || total === 0} onClick={handleSendInvites} style={{ width: "100%", padding: "12px", borderRadius: "10px", border: "none", background: "#2455ff", color: "white", fontSize: "14px", fontWeight: 700, cursor: (inviteSending || total === 0) ? "not-allowed" : "pointer", opacity: (inviteSending || total === 0) ? 0.6 : 1, boxShadow: "0 2px 10px rgba(36,85,255,0.18)", fontFamily: "'DM Sans', system-ui, sans-serif" }}>
                        {inviteSending ? "Sending…" : `Send ${total} Invite${total !== 1 ? "s" : ""}`}
                      </button>
                    );
                  })()}
                </>
              )}
            </div>
          </div>
        )}

    {repOnboarding && (
      <div style={{ position: "fixed", inset: 0, zIndex: 300, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(10,18,34,0.55)", backdropFilter: "blur(4px)" }}>
        <div style={{ width: "92%", maxWidth: "480px", background: "white", borderRadius: "16px", padding: "32px", boxShadow: "0 20px 60px rgba(0,0,0,0.15)" }}>
          <h3 style={{ fontSize: "20px", fontWeight: 700, color: "var(--ink)", marginBottom: "6px" }}>Welcome to Pulse</h3>
          <p style={{ fontSize: "13px", color: "var(--ink-muted)", marginBottom: "24px" }}>Tell us where you work so we can show you professionals in your area.</p>
          <form onSubmit={handleRepOnboarding} style={{ display: "grid", gap: "16px" }}>
            <div>
              <label style={{ display: "block", fontSize: "11px", fontWeight: 600, color: "var(--ink-soft)", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.05em" }}>State</label>
              <select
                required
                value={repOnboardingForm.state}
                onChange={(e) => setRepOnboardingForm((f) => ({ ...f, state: e.target.value }))}
                style={{ width: "100%", borderRadius: "8px", border: "1px solid var(--border)", padding: "10px 12px", fontSize: "13px", fontFamily: "inherit" }}
              >
                <option value="">Select...</option>
                {US_STATES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ display: "block", fontSize: "11px", fontWeight: 600, color: "var(--ink-soft)", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.05em" }}>Company Name</label>
              <input
                type="text"
                required
                value={repOnboardingForm.orgName}
                onChange={(e) => setRepOnboardingForm((f) => ({ ...f, orgName: e.target.value }))}
                placeholder="e.g. Harmony Hospice"
                style={{ width: "100%", borderRadius: "8px", border: "1px solid var(--border)", padding: "10px 12px", fontSize: "13px", fontFamily: "inherit", boxSizing: "border-box" }}
              />
            </div>
            <div>
              <label style={{ display: "block", fontSize: "11px", fontWeight: 600, color: "var(--ink-soft)", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.05em" }}>City</label>
              <input
                type="text"
                required
                value={repOnboardingForm.city}
                onChange={(e) => setRepOnboardingForm((f) => ({ ...f, city: e.target.value }))}
                placeholder="e.g. Houston"
                style={{ width: "100%", borderRadius: "8px", border: "1px solid var(--border)", padding: "10px 12px", fontSize: "13px", fontFamily: "inherit", boxSizing: "border-box" }}
              />
            </div>
            <button type="submit" disabled={repOnboardingSaving} style={{ padding: "12px", borderRadius: "10px", border: "none", background: "var(--blue)", color: "white", fontSize: "14px", fontWeight: 600, cursor: "pointer", opacity: repOnboardingSaving ? 0.6 : 1 }}>
              {repOnboardingSaving ? "Saving…" : "Get Started"}
            </button>
          </form>
        </div>
      </div>
    )}
    </>
  );
}
