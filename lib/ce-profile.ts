/**
 * CE Profile — optional professional context that makes requests more
 * claimable for reps: work setting, license renewal month, hours still needed.
 *
 * Single source of truth for the setting list and formatters. Collected
 * progressively (request modal asks only what's missing; the My CE Profile
 * card on the pro dashboard is the editable home). Never required.
 */

export const WORK_SETTINGS = [
  "Hospital — case management / discharge planning",
  "Hospital — other",
  "Home health",
  "Hospice / palliative care",
  "SNF / rehab / post-acute",
  "Outpatient clinic / private practice",
  "School / education",
  "Insurance / payer",
  "Independent / not facility-based",
  "Retired",
  "Other",
] as const;

export type WorkSetting = (typeof WORK_SETTINGS)[number];

/** Coerce arbitrary input to a valid setting, or null. */
export function normalizeWorkSetting(raw: unknown): string | null {
  const t = String(raw ?? "").trim();
  if (!t) return null;
  const hit = WORK_SETTINGS.find((s) => s.toLowerCase() === t.toLowerCase());
  return hit ?? null;
}

/**
 * Accepts "YYYY-MM" (HTML month input) or "YYYY-MM-DD"; returns "YYYY-MM-01"
 * for storage, or null when unparseable. Rejects years outside 2000–2100.
 */
export function normalizeRenewalDate(raw: unknown): string | null {
  const t = String(raw ?? "").trim();
  const m = t.match(/^(\d{4})-(\d{2})(?:-\d{2})?$/);
  if (!m) return null;
  const year = Number(m[1]);
  const month = Number(m[2]);
  if (year < 2000 || year > 2100 || month < 1 || month > 12) return null;
  return `${m[1]}-${m[2]}-01`;
}

/** 0–200 integer, or null. */
export function normalizeHoursNeeded(raw: unknown): number | null {
  const n = Number(raw);
  if (!Number.isFinite(n)) return null;
  const i = Math.round(n);
  return i >= 0 && i <= 200 ? i : null;
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** "2027-03-01" (or "2027-03") → "Mar 2027". Null-safe. */
export function formatRenewal(dateStr: string | null | undefined): string | null {
  const m = String(dateStr ?? "").match(/^(\d{4})-(\d{2})/);
  if (!m) return null;
  const month = Number(m[2]);
  if (month < 1 || month > 12) return null;
  return `${MONTHS[month - 1]} ${m[1]}`;
}

/** "2027-03-01" → "2027-03" for an HTML month input. */
export function toMonthInput(dateStr: string | null | undefined): string {
  const m = String(dateStr ?? "").match(/^(\d{4}-\d{2})/);
  return m ? m[1] : "";
}

/**
 * One rep-facing line, e.g. "Renews Mar 2027 · needs 18 more hrs this cycle".
 * Null when neither field is known.
 */
export function renewalLine(
  licenseRenewsOn: string | null | undefined,
  ceHoursNeeded: number | null | undefined
): string | null {
  const parts: string[] = [];
  const renewal = formatRenewal(licenseRenewsOn);
  if (renewal) parts.push(`Renews ${renewal}`);
  if (typeof ceHoursNeeded === "number" && ceHoursNeeded > 0)
    parts.push(`needs ${ceHoursNeeded} more hr${ceHoursNeeded === 1 ? "" : "s"} this cycle`);
  return parts.length ? parts.join(" · ") : null;
}
