# CE Requirements Dataset — Verification Workflow

## Status (2026-07-30, after batches 1–3)
- **RN (rn-data.ts): 14 states verified and live** — TX, FL, PA, IL, OH, MI, GA, NC, LA,
  KS (batch 1) + AZ, MA, VA, WA (batch 2). **NJ is corrected but HELD** at
  `lastVerified: null` — see the HOLD comment in its entry (board site blocks automated
  fetch; Andrew must open the two URLs, then flip the date). 34 RN entries unverified.
- **Social work (sw-data.ts): 10 states verified and live** — TX, FL, PA, IL, OH, MI, GA,
  NC, LA, KS (batch 3, researched 2026-07-30 against official board/statute pages).
  39 SW entries pre-filled and unverified. SW nuance: license levels (LBSW/LMSW/LCSW)
  can differ — main fields hold the general rule, level differences live in `details`.
  `acceptsNationalAccreditation` for SW means "accepts ASWB ACE-approved provider CE."
  FL and GA SW rule text was verified via legal-database mirrors of the official rules
  (official portals block automated fetching) — flagged for a quick owner glance.
- **CA and NY intentionally REMOVED from BOTH datasets** (not just unverified) to avoid
  provider-approval issues: CA requires state provider numbers (BRN CEP for nursing;
  BBS rules for social work), and NY requires NYSED-approved providers for its mandates.
  Re-add from the project notes if Hiscornerstone obtains the approvals.
- `accreditationNote?: string` (added batch 2) renders as a "One caveat:" line under the
  accreditation answer — use it when ANCC/ACE acceptance needs a qualifier.

## Why this exists
Entries with `lastVerified: null` are pre-filled from general knowledge. **No state
renders publicly until verified** — `getPublishableRequirements()` filters unverified
entries out of page generation, the sitemap, and the lookup tool. Wrong CE numbers on a
CE company's site is a trust killer, so this gate is deliberate. Batch-2 proof it works:
the WA RN draft was wrong by 5x, and AZ's "no CE" draft hid a 960-practice-hour rule.

## How to verify a state (≈5 min each)
1. Open the `sourceUrl` for the state in the dataset and find the board's
   CE / renewal / continued-competency page.
2. Check: contact hours, cycle length, mandated topics, and whether nationally
   accredited providers (ANCC for rn, ASWB ACE for social-work) are accepted.
3. Fix anything stale in the entry. Delete any "verify" notes you've resolved.
4. Set `lastVerified: "YYYY-MM-DD"` (the date you checked).
5. If the deep source page is stable, use it as `sourceUrl` (better than the homepage).

## Annual maintenance
Boards change rules, usually effective Jan 1 or at legislative session end.
Set a yearly reminder (January) to re-check any state whose `lastVerified`
is >12 months old. `getVerificationProgress()` reports staleness counts.
