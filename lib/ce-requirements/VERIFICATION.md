# CE Requirements Dataset — Verification Workflow

## Status (2026-07-30)
- **8 states verified and live:** TX, FL, PA, IL, OH, MI, GA, NC — researched against
  official board/statute pages and owner-approved 2026-07-30.
- **CA and NY intentionally REMOVED from the dataset** (not just unverified) to avoid
  provider-approval issues: California requires a BRN CEP provider number (ANCC alone
  doesn't count for courses offered in-state), and New York's only mandated trainings
  (infection control, child abuse) require NYSED-approved providers. Re-add them from
  the project notes if Hiscornerstone obtains CA CEP approval or a NY strategy emerges.
- 41 entries remain pre-filled and unverified.

## Why this exists
Remaining RN entries in `rn-data.ts` are pre-filled from general knowledge and marked
`lastVerified: null`. **No state renders publicly until you verify it** —
`getPublishableRequirements()` filters unverified entries out of page generation,
the sitemap, and the lookup tool. Wrong CE numbers on a CE company's site is a
trust killer, so this gate is deliberate.

## How to verify a state (≈5 min each)
1. Open the `sourceUrl` for the state in `rn-data.ts` and find the board's
   CE / renewal / continued-competency page.
2. Check: contact hours, cycle length, mandated topics, and whether
   nationally accredited (ANCC) providers are accepted.
3. Fix anything stale in the entry. Delete any "verify" notes you've resolved.
4. Set `lastVerified: "2026-07-29"` (the date you checked).
5. If the deep source page is stable, replace `sourceUrl` with it (better UX
   than the board homepage).

## Suggested order (search volume, roughly)
TX · CA · FL · NY · PA · IL · OH · GA · NC · MI — these 10 cover the bulk of
"free CE [state]" volume. Launch with these, then chip away at ~5/week.

## Watch-outs found during pre-fill
- **California**: requires a BRN CEP provider number — ANCC alone may not count.
  Confirm Hiscornerstone's CEP status before marking CA courses as accepted
  (`acceptsNationalAccreditation` is already set to `false` pending that).
- **Florida**: CE Broker reporting is expected of providers. Confirm
  Hiscornerstone reports to CE Broker before going live in FL.
- **Options states** (GA, NC, VA, SC, OK, TN, UT, WY, AK, HI, ID, KY, AR):
  CE is one path among several — the page copy should say "one way to meet
  the requirement," which the `summary` fields already do.
- **No-requirement states** (AZ, CO, CT, IN, ME, MD, MO, SD, VT, WI, MS?, ND?):
  still worth pages — the angle becomes certifications, compact moves, and
  professional development. MS and ND were uncertain during pre-fill; check
  them carefully.

## Annual maintenance
Boards change rules, usually effective Jan 1 or at legislative session end.
Set a yearly reminder (January) to re-check any state whose `lastVerified`
is >12 months old. The `getVerificationProgress()` helper reports staleness
counts if you want to surface it on the admin page later.
