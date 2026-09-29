/**
 * Client-side mirror of the Supabase "Before User Created" hook
 * (sql/2026-09-29-block-spam-signups.sql). The hook is the real enforcement —
 * this just gives real users a friendly message BEFORE the Turnstile token is
 * spent. Keep the rules in sync with the SQL function.
 */

const VOWELS = /[aeiouyàáâãäåèéêëìíîïòóôõöùúûüý]/;
const CONSONANT_RUN = /[bcdfghjklmnpqrstvwxz]{6,}/;

/** Returns an error message, or null if the name + email look legitimate. */
export function signupProblem(fullName: string, email: string): string | null {
  const e = email.trim().toLowerCase();
  const [local = "", domain = ""] = e.split("@");
  if (domain === "gmail.com" || domain === "googlemail.com") {
    const base = local.split("+")[0];
    if ((base.match(/\./g) ?? []).length >= 3) {
      return "Please sign up with your standard Gmail address (without extra dots).";
    }
  }

  const words = fullName
    .trim()
    .split(/\s+/)
    .filter((w) => /\p{L}/u.test(w));
  if (words.length < 2) return "Please enter your first and last name.";

  for (const w of words) {
    const letters = w.replace(/[^\p{L}]/gu, "");
    if (letters === letters.toUpperCase()) continue; // credentials: LCSW, LMFT, FNP-BC
    const lower = letters.toLowerCase();
    if ((lower.length >= 4 && !VOWELS.test(lower)) || CONSONANT_RUN.test(lower)) {
      return "Please enter your real first and last name.";
    }
  }
  return null;
}
