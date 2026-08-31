/**
 * Canonical CE-request topics — the ONE list shared by the professional's
 * "Request CE Course" dropdown, the server-side normalizer, rep-facing views,
 * the public demand map, and notification emails.
 *
 * Values stored in ce_requests.topic MUST come from this list (the server
 * coerces anything else to "Other"). Labels shown in the UI may differ.
 */

export const ANY_TOPIC = "Any Topic";

export const CE_REQUEST_TOPICS = [
  ANY_TOPIC,
  "Ethics",
  "Palliative Care",
  "Mental Health",
  "Chronic Disease Management",
  "Patient Safety",
  "Care Transitions",
  "Other",
] as const;

export type CeRequestTopic = (typeof CE_REQUEST_TOPICS)[number];

/** Dropdown labels — value stays canonical English so browser translators can't corrupt it. */
export const CE_REQUEST_TOPIC_LABELS: Record<CeRequestTopic, string> = {
  [ANY_TOPIC]: "Any topic — whatever counts toward my license",
  Ethics: "Ethics",
  "Palliative Care": "Palliative Care",
  "Mental Health": "Mental Health",
  "Chronic Disease Management": "Chronic Disease Management",
  "Patient Safety": "Patient Safety",
  "Care Transitions": "Care Transitions",
  Other: "Other",
};

/** Loose inputs that should map to "Any Topic" (older clients, HISC form, translators). */
const ANY_TOPIC_ALIASES = new Set([
  "any topic",
  "any",
  "anything",
  "any subject",
  "no preference",
  "open to anything",
  "flexible",
]);

/** True when a stored/raw topic means "the professional will take any course". */
export function isAnyTopic(topic: string | null | undefined): boolean {
  const t = (topic ?? "").trim().toLowerCase();
  return t === ANY_TOPIC.toLowerCase() || ANY_TOPIC_ALIASES.has(t);
}

/**
 * Coerce free-form / translated / legacy input to a canonical topic.
 * Unknown values become "Other" so nothing non-canonical is ever stored.
 */
export function normalizeRequestTopic(raw: unknown): CeRequestTopic {
  const t = String(raw ?? "").trim();
  if (!t) return "Other";
  if (isAnyTopic(t)) return ANY_TOPIC;
  const hit = CE_REQUEST_TOPICS.find((c) => c.toLowerCase() === t.toLowerCase());
  return hit ?? "Other";
}

/**
 * Human-readable topic for lists, chips, and emails.
 * "Any Topic" reads as a flexible request rather than a course called "Any Topic".
 */
export function formatRequestTopic(topic: string | null | undefined): string {
  if (isAnyTopic(topic)) return "Any topic";
  const t = (topic ?? "").trim();
  return t || "Continuing education";
}
