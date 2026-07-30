// lib/ce-requirements/index.ts
// Query helpers for the CE requirements dataset.
//
// KEY RULE: page generation and the lookup tool should ONLY use
// getPublishableRequirements() — entries with lastVerified set. Unverified
// entries never render publicly, so you can verify and launch state-by-state.

import type { Discipline, StateRequirement } from "./types";
import { RN_REQUIREMENTS } from "./rn-data";

export type { Discipline, StateRequirement, RequirementType, MandatoryTopic } from "./types";

/** All datasets, keyed by discipline. Add social-work etc. here as they're built. */
const DATASETS: Record<string, StateRequirement[]> = {
  rn: RN_REQUIREMENTS,
};

/** Display names for discipline slugs (used in titles, headings, metadata). */
export const DISCIPLINE_LABELS: Record<Discipline, { singular: string; plural: string; audience: string }> = {
  rn: { singular: "Nurse", plural: "Nurses", audience: "RNs and LPNs" },
  "social-work": { singular: "Social Worker", plural: "Social Workers", audience: "LMSWs and LCSWs" },
  "case-management": { singular: "Case Manager", plural: "Case Managers", audience: "case managers" },
  therapy: { singular: "Therapist", plural: "Therapists", audience: "PTs, OTs, and SLPs" },
};

/** Every entry for a discipline, verified or not. Internal/admin use only. */
export function getAllRequirements(discipline: Discipline): StateRequirement[] {
  return DATASETS[discipline] ?? [];
}

/**
 * ONLY verified entries — the set that gets public pages and lookup results.
 * generateStaticParams and the sitemap must use this.
 */
export function getPublishableRequirements(discipline: Discipline): StateRequirement[] {
  return getAllRequirements(discipline).filter((r) => r.lastVerified !== null);
}

/** Look up one state by slug (e.g. "texas") or USPS code (e.g. "TX"), verified only. */
export function getRequirement(discipline: Discipline, stateSlugOrCode: string): StateRequirement | null {
  const needle = stateSlugOrCode.toLowerCase();
  return (
    getPublishableRequirements(discipline).find(
      (r) => r.slug === needle || r.stateCode.toLowerCase() === needle
    ) ?? null
  );
}

/** Which disciplines currently have at least one publishable state (drives hub pages). */
export function getLiveDisciplines(): Discipline[] {
  return (Object.keys(DATASETS) as Discipline[]).filter(
    (d) => getPublishableRequirements(d).length > 0
  );
}

/** Sitemap helper: every live /free-ce/[discipline]/[state] path. */
export function getAllPublishablePaths(): { discipline: Discipline; slug: string }[] {
  return getLiveDisciplines().flatMap((discipline) =>
    getPublishableRequirements(discipline).map((r) => ({ discipline, slug: r.slug }))
  );
}

/** Verification progress — handy to log or show on the admin page. */
export function getVerificationProgress(discipline: Discipline): {
  verified: number;
  total: number;
  unverifiedStates: string[];
} {
  const all = getAllRequirements(discipline);
  const unverified = all.filter((r) => r.lastVerified === null);
  return {
    verified: all.length - unverified.length,
    total: all.length,
    unverifiedStates: unverified.map((r) => r.stateCode),
  };
}
