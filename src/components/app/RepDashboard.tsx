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
  { id: "ce-history", label: "CE History" },
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
  const [sendCeCourse, setSendCeCourse] = useState<string>("");
  const [sendCeDiscount, setSendCeDiscount] = useState<string>(CE_DISCOUNTS[0]);
  const [sendCeMessage, setSendCeMessage] = useState("");
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
  const [repOnboardingForm, setRepOnboardingForm] = useState({ state: "", city: "" });
  const [repOnboardingSaving, setRepOnboardingSaving] = useState(false);
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
                  .map((pro) => (
                  <div key={pro.id} style={{padding:'16px',borderRadius:'10px',border:'1px solid var(--border)',background:'white'}}>
                    <div style={{display:'flex',justifyContent:'space-between',alignItems:'start',marginBottom:'8px'}}>
                      <div>
                        <div style={{fontWeight:600,fontSize:'14px',color:'var(--ink)'}}>{pro.name}</div>
                        <div style={{fontSize:'11px',color:'var(--ink-muted)',marginTop:'2px'}}>
                          {[pro.discipline, pro.facility, pro.city && pro.state ? `${pro.city}, ${pro.state}` : pro.state].filter(Boolean).join(' · ')}
                        </div>
                      </div>
                      <button
                        type="button"
                        className={BTN_PRIMARY}
                        style={{fontSize:'12px',padding:'6px 14px'}}
                        onClick={() => {
                          const tempPro = {
                            id: pro.id,
                            name: pro.name,
                            email: "",
                            phone: null,
                            facility: pro.facility,
                            city: pro.city,
                            state: pro.state,
                            discipline: pro.discipline,
                            rep_id: repId ?? "",
                            created_at: new Date().toISOString(),
                          };
                          openSendCeModal(tempPro);
                        }}
                      >
                        Send CE
                      </button>
                    </div>
                    {pro.requests.length > 0 && (
                      <div style={{marginTop:'8px',display:'flex',flexWrap:'wrap',gap:'6px'}}>
                        {pro.requests.map((r, i) => (
                          <span key={i} style={{padding:'3px 10px',borderRadius:'20px',fontSize:'10px',fontWeight:700,background:'var(--gold-glow)',color:'#B8860B'}}>
                            Needs: {r.topic} · {r.hours} hrs
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
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
                  onClick={() => setQrOpen(true)}
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
              <div style={{ position: "fixed", inset: 0, zIndex: 300, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(10,18,34,0.55)", backdropFilter: "blur(4px)", padding: "16px" }} onClick={() => setQrOpen(false)}>
                <div style={{ width: "100%", maxWidth: "800px", background: "white", borderRadius: "16px", padding: "24px", boxShadow: "0 20px 60px rgba(0,0,0,0.15)", overflowY: "auto", maxHeight: "90vh" }} onClick={e => e.stopPropagation()}>
                  {/* Header */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "20px" }}>
                    <div>
                      <h3 style={{ fontSize: "18px", fontWeight: 700, color: "var(--ink)", margin: 0 }}>Generate a QR Code</h3>
                      <p style={{ fontSize: "13px", color: "#7a8ba8", margin: "6px 0 0", lineHeight: 1.45 }}>Print this or show it on your phone during visits. When a nurse or social worker scans it, they enter their email and instantly receive a free CE course — no app required.</p>
                    </div>
                    <button type="button" style={{ background: "none", border: "none", fontSize: "20px", cursor: "pointer", color: "#7a8ba8", flexShrink: 0, marginLeft: "12px" }} onClick={() => setQrOpen(false)} aria-label="Close">×</button>
                  </div>

                  {/* Two-column body on wide screens, single on mobile */}
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "32px", alignItems: "start" }}>
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
                      <div style={{ background: "#f0efeb", borderRadius: "8px", padding: "12px", fontSize: "12px", color: "#7a8ba8", lineHeight: 1.45, marginBottom: "12px" }}>
                        <div style={{ fontWeight: 600, color: "#3b4963", marginBottom: "4px" }}>Scan Limit</div>
                        <div style={{ marginBottom: "10px", lineHeight: 1.4 }}>How many times can this QR code be used? Each scan sends one free course and counts toward your billing.</div>
                        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                          {([10, 25, 50, 100] as const).map((n) => (
                            <label key={n} style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}>
                              <input
                                type="radio"
                                name="qrCap"
                                checked={qrCap === n}
                                onChange={() => { setQrCap(n); saveQrCap(n); }}
                              />
                              <span style={{ fontSize: "13px", color: "#3b4963" }}>{n} scans</span>
                              {n === 25 && (
                                <span style={{ fontSize: "11px", fontWeight: 600, background: "rgba(13,148,136,0.15)", color: "#0f766e", borderRadius: "4px", padding: "1px 6px" }}>Recommended</span>
                              )}
                            </label>
                          ))}
                          <label style={{ display: "flex", alignItems: "flex-start", gap: "8px", cursor: "pointer" }}>
                            <input
                              type="radio"
                              name="qrCap"
                              checked={qrCap === null}
                              onChange={() => { setQrCap(null); saveQrCap(null); }}
                              style={{ marginTop: "2px" }}
                            />
                            <span style={{ fontSize: "13px", color: "#3b4963" }}>
                              Unlimited
                              <span style={{ display: "block", fontSize: "11px", color: "#92670A", marginTop: "2px" }}>⚠️ Anyone with this link can claim a free course</span>
                            </span>
                          </label>
                        </div>
                        {qrScanCount !== null && (
                          <div style={{ marginTop: "10px", fontSize: "12px", color: "#7a8ba8" }}>
                            🔍 {qrScanCount} {qrScanCount === 1 ? "scan" : "scans"} used{qrCap !== null ? ` of ${qrCap}` : ""}
                            {qrCapSaving && <span style={{ marginLeft: "8px", color: "#7a8ba8" }}>Saving…</span>}
                          </div>
                        )}
                      </div>

                      {/* Billing note */}
                      <div style={{ background: "#f0efeb", borderRadius: "8px", padding: "12px", fontSize: "12px", color: "#7a8ba8", lineHeight: 1.45 }}>
                        💳 Billing: Each course sent via QR is charged at the standard course rate. You will see all QR sends in your CE History tab.
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
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--border)] pb-3 mb-4">
              <h2 style={{ fontFamily: "'Fraunces', Georgia, serif", fontSize: '16px', fontWeight: 800, color: '#0b1222', margin: 0 }}>My Network</h2>
              <div className="flex gap-2 flex-wrap">
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
            <div className="flex gap-2 flex-wrap mb-4">
              {["All", "Nursing", "Social Work", "Case Mgmt", "PT/OT/SLP"].map((f) => (
                <button key={f} type="button" onClick={() => setFilter(f)} className={`rounded-lg px-3 py-1.5 text-[11px] font-semibold border ${filter === f ? "bg-[var(--blue)] text-white border-[var(--blue)]" : "border-[var(--border)] bg-white text-[var(--ink-soft)] hover:bg-[#f6f5f0]"}`}>
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
                          background: 'rgba(36,85,255,0.10)',
                          color: '#2455ff',
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
                              background: 'rgba(36,85,255,0.08)', color: '#2455ff',
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
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button
                            type="button"
                            className={BTN_PRIMARY}
                            style={{ fontSize: '12px', padding: '7px 16px' }}
                            onClick={() => openSendCeModal(pro)}
                          >
                            Send CE
                          </button>
                          <button
                            type="button"
                            className={BTN_SECONDARY}
                            style={{ fontSize: '12px', padding: '7px 16px' }}
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
                  <div className="py-8 text-center">
                    <p className="text-sm text-[var(--ink-muted)]">{ceHistory.length === 0 ? "No CE sends yet." : "No sends match this filter."}</p>
                    {ceHistory.length === 0 && (
                      <>
                        <p className="mt-1 text-[13px] text-[var(--ink-soft)]">Use the Network tab to send a course to a professional.</p>
                        <button type="button" className={`mt-4 ${BTN_PRIMARY}`} onClick={() => setTab("network")}>Go to Network</button>
                      </>
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
                                <span style={{ display: "inline-flex", alignItems: "center", padding: "2px 8px", borderRadius: "999px", fontSize: "11px", fontWeight: 700, background: "#f0efeb", color: "#7a8ba8" }}>Sent</span>
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
