// ============================================================================
// ⚠️  CE REQUIREMENT DATA — THE OWNER MUST VERIFY EVERY FIGURE BEFORE PUBLISH ⚠️
// ----------------------------------------------------------------------------
// Every requirement value below is a PLACEHOLDER. Publishing wrong CE
// requirement information is a COMPLIANCE PROBLEM. Nothing here is researched
// or guessed — the values are intentionally fake.
//
// TO PUBLISH A STATE PAGE:
//   1. Open the official board site in `boardUrl`.
//   2. Verify and replace EVERY field: renewalCycle, totalHours, each
//      mandatedTopics entry, reportingSystem.
//   3. Set `lastReviewed` to today's date and your initials.
//   4. Set `verified: true`. This removes the noindex and adds the page to the
//      sitemap. Do NOT set verified:true until steps 1-3 are done.
// ============================================================================

export type MandatedTopic = { label: string; hours: string };

export type StateRequirement = {
  slug: string;
  state: string;
  discipline: string;
  disciplineProfessions: string[]; // course_professions labels for relevant Pulse courses
  verified: boolean; // false => page is noindex and excluded from sitemap
  renewalCycle: string;
  totalHours: string;
  mandatedTopics: MandatedTopic[];
  reportingSystem: string;
  boardName: string;
  boardUrl: string;
  lastReviewed: string; // "YYYY-MM-DD — initials", set when verified
};

export const STATE_REQUIREMENTS: Record<string, StateRequirement> = {
  "texas-social-work": {
    slug: "texas-social-work",
    state: "Texas",
    discipline: "Social Work",
    disciplineProfessions: ["Social Work"],
    verified: false, // ← keep false until every field below is verified
    renewalCycle: "PLACEHOLDER — verify renewal cycle length (e.g. every 2 years)",
    totalHours: "PLACEHOLDER — verify total CE hours required per cycle",
    mandatedTopics: [
      { label: "Ethics", hours: "PLACEHOLDER — verify required ethics hours" },
      { label: "PLACEHOLDER — verify any other mandated topic", hours: "PLACEHOLDER" },
    ],
    reportingSystem: "PLACEHOLDER — verify how CE is reported/audited (self-report, audit, online portal, etc.)",
    boardName: "Texas Behavioral Health Executive Council (BHEC) — Texas State Board of Social Worker Examiners",
    boardUrl: "https://www.bhec.texas.gov/",
    lastReviewed: "",
  },
};

export const ALL_STATE_SLUGS = Object.keys(STATE_REQUIREMENTS);
export const VERIFIED_STATE_SLUGS = Object.values(STATE_REQUIREMENTS)
  .filter((r) => r.verified)
  .map((r) => r.slug);
