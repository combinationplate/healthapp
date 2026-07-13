import { createClient as createServiceClient } from "@supabase/supabase-js";
import { foldToMetro, metroLabel, type Metro } from "@/lib/demand/metros";

// ─── Public, anonymized shapes (NEVER include name/email/PII) ────────
export type PublicRequest = {
  id: string;
  discipline: string;
  metro: string; // "Boston, MA"
  state: string;
  topic: string;
  hours: number;
  urgency: string; // "by Aug 12" | "ASAP"
};

export type MetroDot = {
  name: string;
  state: string;
  label: string; // "Boston, MA"
  x: number;
  y: number;
  disciplines: string[];
  topics: string[];
  hours: number; // total CE hours at this metro
};

export type DemandData = {
  requests: PublicRequest[]; // capped at 12, sorted
  dots: MetroDot[]; // one uniform dot per metro
  ceHoursDelivered: number | null; // hidden (null) until it exceeds 25
};

// Founders / internal accounts to exclude.
const TEST_PATTERNS = ["test", "zach", "ztaylor"];
function isTestAccount(name?: string | null, email?: string | null): boolean {
  const hay = `${(name || "").toLowerCase()} ${(email || "").toLowerCase()}`;
  return TEST_PATTERNS.some((p) => hay.includes(p));
}

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
function urgencyFor(deadline: string | null | undefined): { label: string; ts: number | null } {
  if (!deadline) return { label: "ASAP", ts: null };
  const iso = deadline.length <= 10 ? `${deadline}T00:00:00` : deadline;
  const d = new Date(iso);
  const t = d.getTime();
  if (Number.isNaN(t) || t <= Date.now()) return { label: "ASAP", ts: null };
  return { label: `by ${MONTHS[d.getMonth()]} ${d.getDate()}`, ts: t };
}

function admin() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

type ReqRow = {
  id: string;
  professional_id: string;
  topic: string | null;
  hours: number | null;
  deadline: string | null;
  created_at: string;
};
type ProfRow = {
  id: string;
  full_name: string | null;
  discipline: string | null;
  city: string | null;
  state: string | null;
  email: string | null;
  role: string | null;
};

export async function getDemandData(): Promise<DemandData> {
  const db = admin();

  // Open = pending AND unassigned (rep_id is null)
  const { data: reqs } = await db
    .from("ce_requests")
    .select("id, professional_id, topic, hours, deadline, created_at, status, rep_id")
    .eq("status", "pending")
    .is("rep_id", null)
    .order("created_at", { ascending: false })
    .limit(300);

  const openReqs = (reqs ?? []) as unknown as ReqRow[];
  const proIds = [...new Set(openReqs.map((r) => r.professional_id).filter(Boolean))];

  const profMap = new Map<string, ProfRow>();
  if (proIds.length) {
    const { data: profs } = await db
      .from("profiles")
      .select("id, full_name, discipline, city, state, email, role")
      .in("id", proIds);
    for (const p of (profs ?? []) as unknown as ProfRow[]) profMap.set(p.id, p);
  }

  type Enriched = { r: ReqRow; metro: Metro; discipline: string; u: { label: string; ts: number | null } };
  const enriched: Enriched[] = [];
  for (const r of openReqs) {
    const p = profMap.get(r.professional_id);
    if (!p) continue;
    if (p.role && p.role !== "professional") continue; // requests belong to professionals
    if (isTestAccount(p.full_name, p.email)) continue;
    const metro = foldToMetro(p.city, p.state);
    if (!metro) continue;
    const discipline = (p.discipline || "").trim() || "Healthcare";
    enriched.push({ r, metro, discipline, u: urgencyFor(r.deadline) });
  }

  // Cards: soonest real deadline first, then newest. Capped at 12, no "X of Y".
  const sorted = [...enriched].sort((a, b) => {
    if (a.u.ts && b.u.ts) return a.u.ts - b.u.ts;
    if (a.u.ts) return -1;
    if (b.u.ts) return 1;
    return new Date(b.r.created_at).getTime() - new Date(a.r.created_at).getTime();
  });
  const requests: PublicRequest[] = sorted.slice(0, 12).map((e) => ({
    id: e.r.id,
    discipline: e.discipline,
    metro: metroLabel(e.metro),
    state: e.metro.state,
    topic: (e.r.topic || "Continuing education").trim(),
    hours: Number(e.r.hours) || 0,
    urgency: e.u.label,
  }));

  // Map dots: one uniform dot per metro (continental only; AK/HI have null coords)
  const dotMap = new Map<string, MetroDot>();
  for (const e of enriched) {
    if (e.metro.x == null || e.metro.y == null) continue;
    const key = `${e.metro.name}|${e.metro.state}`;
    let d = dotMap.get(key);
    if (!d) {
      d = { name: e.metro.name, state: e.metro.state, label: metroLabel(e.metro), x: e.metro.x, y: e.metro.y, disciplines: [], topics: [], hours: 0 };
      dotMap.set(key, d);
    }
    if (!d.disciplines.includes(e.discipline)) d.disciplines.push(e.discipline);
    const topic = (e.r.topic || "").trim();
    if (topic && !d.topics.includes(topic)) d.topics.push(topic);
    d.hours += Number(e.r.hours) || 0;
  }
  const dots = [...dotMap.values()];

  // Cumulative CE hours delivered — hidden until it exceeds 25 (redeemed sends).
  let ceHoursDelivered: number | null = null;
  const { data: sends } = await db.from("ce_sends").select("course_hours, clicked_at");
  if (sends) {
    const total = (sends as { course_hours: number | null; clicked_at: string | null }[])
      .filter((s) => s.clicked_at)
      .reduce((sum, s) => sum + (Number(s.course_hours) || 0), 0);
    ceHoursDelivered = total > 25 ? total : null;
  }

  return { requests, dots, ceHoursDelivered };
}
