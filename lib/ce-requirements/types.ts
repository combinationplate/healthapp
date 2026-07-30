// lib/ce-requirements/types.ts
// Shared types for the state CE requirements dataset.
// Powers: /free-ce/[discipline]/[state] pages, discipline hubs, and the lookup tool.

export type Discipline = "rn" | "social-work" | "case-management" | "therapy";

export type RequirementType =
  /** A fixed number of contact hours per renewal cycle. */
  | "hours"
  /** No general CE requirement (may still have one-time or topic mandates). */
  | "none"
  /** Board offers multiple pathways (CE hours is one option among practice hours, certification, etc.). */
  | "options";

export interface MandatoryTopic {
  topic: string;
  /** Hours required for this topic, if the board specifies a number. */
  hours?: number;
  /** e.g. "every renewal", "one-time", "every 3rd renewal" */
  frequency: string;
}

export interface StateRequirement {
  /** Full state name, e.g. "Texas" */
  state: string;
  /** USPS code, e.g. "TX" */
  stateCode: string;
  /** URL slug, e.g. "texas" */
  slug: string;
  discipline: Discipline;
  requirementType: RequirementType;
  /** Contact hours per cycle. null when requirementType is "none" or purely options-based. */
  contactHours: number | null;
  /** Renewal cycle length in years. null when not applicable. */
  cycleYears: number | null;
  /**
   * One-sentence plain-English summary, safe to render directly on the page.
   * e.g. "Texas RNs must complete 20 contact hours every 2 years."
   */
  summary: string;
  /** Longer nuance: options pathways, practice-hour alternatives, phase-in rules. */
  details?: string;
  mandatoryTopics?: MandatoryTopic[];
  /**
   * Whether the board accepts CE from nationally accredited providers (e.g. ANCC
   * accredited providers for nursing). Drives the "our courses count in your state"
   * copy — confirm against Hiscornerstone's actual accreditations before rendering.
   */
  acceptsNationalAccreditation: boolean;
  /**
   * Optional caveat rendered directly under the national-accreditation answer.
   * Use when "accepts national accreditation" is true but incomplete — e.g. WA
   * accepts any nursing-related CE yet requires its suicide-prevention training to
   * come from the state DOH Model List, or AZ where no CE is required at all.
   */
  accreditationNote?: string;
  /** Official board name, e.g. "Texas Board of Nursing" */
  boardName: string;
  /** Official board URL for CE/renewal requirements — link this on the page ("Source"). */
  sourceUrl: string;
  /**
   * ISO date (YYYY-MM-DD) when Andrew last verified this entry against the board.
   * null = UNVERIFIED. Page generation should ONLY include verified states, so you
   * can launch incrementally as you verify.
   */
  lastVerified: string | null;
}
