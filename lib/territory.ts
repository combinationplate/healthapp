/**
 * Multi-state rep territories.
 *
 * profiles.state         = the rep's HOME state (city, flyers, onboarding).
 * profiles.territory_states = additional states they cover (text[], nullable).
 * Effective territory    = home + additional, deduped — what Discover filters on.
 */

export const US_STATE_CODES = [
  "AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA",
  "HI","ID","IL","IN","IA","KS","KY","LA","ME","MD",
  "MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ",
  "NM","NY","NC","ND","OH","OK","OR","PA","RI","SC",
  "SD","TN","TX","UT","VT","VA","WA","WV","WI","WY","DC",
] as const;

const VALID = new Set<string>(US_STATE_CODES);

/**
 * Sanitize a client-supplied list of state codes: uppercase, trim, drop
 * anything that isn't a real code, dedupe, and drop the home state (it is
 * always implicitly covered). Returns null when nothing valid remains, so
 * the DB stores NULL rather than an empty array.
 */
export function sanitizeTerritoryStates(
  raw: unknown,
  homeState?: string | null
): string[] | null {
  if (!Array.isArray(raw)) return null;
  const home = (homeState ?? "").trim().toUpperCase();
  const out: string[] = [];
  for (const item of raw) {
    const code = String(item ?? "").trim().toUpperCase();
    if (!VALID.has(code)) continue;
    if (code === home) continue;
    if (!out.includes(code)) out.push(code);
  }
  return out.length ? out.sort() : null;
}

/** Home state + additional states, deduped. Empty array = no territory set yet. */
export function effectiveTerritory(
  homeState?: string | null,
  territoryStates?: string[] | null
): string[] {
  const home = (homeState ?? "").trim().toUpperCase();
  const out: string[] = home && VALID.has(home) ? [home] : [];
  for (const s of territoryStates ?? []) {
    const code = String(s ?? "").trim().toUpperCase();
    if (VALID.has(code) && !out.includes(code)) out.push(code);
  }
  return out;
}
