// Facility data-quality helpers.
//
// Signup and pro onboarding REQUIRE a facility, so people with nothing real
// to enter type junk ("NA", "none", "various", …). These helpers reject the
// junk while giving an honest path: a real facility name, or the explicit
// "not based at a facility" option (stored as NO_FACILITY_VALUE).
//
// Deliberately NOT junk: "Retired" and real-sounding partial names — the
// goal is to block placeholders, not to second-guess honest answers.

export const NO_FACILITY_VALUE = "Independent / not facility-based";

export const JUNK_FACILITY_MESSAGE =
  "That doesn't look like a facility name — reps use this to send you relevant CE. " +
  "Enter where you work, or choose the “not based at a facility” option.";

const JUNK_TOKENS = new Set([
  "na", "n", "no", "none", "non", "nil", "null", "nothing", "blank",
  "notapplicable", "notsure", "unknown", "unk", "tbd", "idk", "dk",
  "x", "xx", "xxx", "xyz", "abc", "asdf", "asdfasdf", "qwerty", "test", "testing",
  "various", "multiple", "many", "misc", "other", "any", "all", "everywhere",
  "self", "myself", "me", "yes", "ok", "okay", "good",
  "work", "job", "facility", "hospital", "home",
]);

/** True when a facility value is missing or an obvious placeholder. */
export function isJunkFacility(value: string | null | undefined): boolean {
  if (!value || !value.trim()) return true;
  if (value.trim() === NO_FACILITY_VALUE) return false;
  const normalized = value.toLowerCase().replace(/[^a-z0-9]/g, "");
  if (normalized.length < 2) return true;
  if (!/[a-z]/.test(normalized)) return true; // digits / punctuation only
  return JUNK_TOKENS.has(normalized);
}
