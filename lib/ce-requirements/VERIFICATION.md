# CE Requirements Dataset — Verification Workflow

## Status (2026-07-30, batch 2)
- **14 states verified and live:** TX, FL, PA, IL, OH, MI, GA, NC, LA, KS (batch 1)
  + **AZ, MA, VA, WA** (batch 2) — each researched against official board/statute
  sources only (.gov and official board domains; no CE vendor sites), every field
  quoted from rule text before being set.
- **NJ researched but deliberately HELD at `lastVerified: null`.** The entry is
  corrected and ready, but `njconsumeraffairs.gov` returns 403 to every automated
  fetcher, so the board's own CE page was never actually read, and a bias-training
  rule proposed 2024-07-15 for perinatal providers may have been adopted since.
  Open the two URLs in the entry's comment block by hand, then set the date.
- **CA and NY intentionally REMOVED from the dataset** (not just unverified) to avoid
  provider-approval issues: California requires a BRN CEP provider number (ANCC alone
  doesn't count for courses offered in-state), and New York's only mandated trainings
  (infection control, child abuse) require NYSED-approved providers. Re-add them from
  the project notes if Hiscornerstone obtains CA CEP approval or a NY strategy emerges.
- 35 entries remain pre-filled and unverified.

## What batch 2 proved about the pre-filled data
Two of five drafts were not merely stale, they were **wrong in a way that would have
embarrassed us**, which is the case for keeping the verify-before-publish gate:
- **WA** draft said 45 hours / 3 years / 531 practice hours. Reality: **8 hours and
  96 practice hours EVERY YEAR** (annual cycle since 2021-06-12). The 45 appears to be
  the ARNP figure (30 CE + 15 pharmacology, 2-yr) misapplied to RNs; "531" appears
  nowhere in Washington law.
- **AZ** draft said "no mandatory CE requirement" and stopped there — technically true
  and dangerously incomplete. A.A.C. R4-19-312 bars the Board from renewing a license
  unless the nurse shows **960 practice hours in 5 years, a recent qualifying degree, or
  a Board-approved refresher program**. CE hours are explicitly *not* a substitute.
- **MA** draft listed no mandatory topics; there are two one-time trainings, and the
  Alzheimer's/dementia one lives in statute (M.G.L. c. 112 § 74), not in 244 CMR 5.00 —
  invisible to anyone reading only the CE regulation.
- **NJ** draft missed the 1-hour prescription-opioid mandate that applies at *every*
  renewal, and overstated the organ/tissue donation hour as universal when it reaches
  only pre-2008 licensees who didn't cover it in nursing school.

**Lesson for future batches:** read the *regulation*, not just the board's summary page,
and always ask whether a mandate lives outside the CE rule.

## Why this exists
Remaining RN entries in `rn-data.ts` are pre-filled from general knowledge and marked
`lastVerified: null`. **No state renders publicly until you verify it** —
`getPublishableRequirements()` filters unverified entries out of page generation,
the sitemap, and the lookup tool. Wrong CE numbers on a CE company's site is a
trust killer, so this gate is deliberate.

## How to verify a state
1. Find the **regulation**, not just the board's summary page — the state
   administrative code section on nurse CE (e.g. WAC 246-840-220, 244 CMR 5.00,
   18VAC90-19-160, N.J.A.C. 13:37-5.3). Board summary pages omit things.
2. Then check the **statutes** for mandates that live outside the CE rule. MA's
   Alzheimer's requirement and AZ's opioid CE are both statutory, not in the CE reg.
3. Verify each field separately: hours, cycle, requirementType, and for every
   mandatory topic — hours, frequency, and **whether it counts inside the total or
   on top of it**. That last one is the field most often gotten wrong, and it's the
   one that makes a nurse buy the wrong number of hours.
4. Verify `acceptsNationalAccreditation` against the rule's list of approving bodies.
   Watch for topic-level exceptions: WA accepts almost any CE generally, but its
   suicide-prevention training must come from the state DOH Model List.
5. Fix the entry, replace `sourceUrl` with a deep link (never a board homepage),
   and use `accreditationNote` for any caveat that would otherwise mislead.
6. Only then set `lastVerified` to the date you checked. **If any field is below
   high confidence, leave it null and note why in a comment** — an unverified state
   costs nothing; a wrong one costs trust.

## Suggested order (search volume, roughly)
Batches 1–2 covered TX FL PA IL OH MI GA NC LA KS AZ MA VA WA. Next by volume:
NJ (pending hand-check) · TN · IN · MO · MN · CO · WI · SC · AL · MD.

## Watch-outs found during pre-fill
- **California**: requires a BRN CEP provider number — ANCC alone may not count.
  Confirm Hiscornerstone's CEP status before marking CA courses as accepted
  (`acceptsNationalAccreditation` is already set to `false` pending that).
- **Florida / Georgia**: CE Broker reporting is expected of providers.
  **Status 2026-07-30: Hiscornerstone is working on CE Broker but does NOT report yet.**
  Until it does, no page or email may imply automatic reporting — nurses upload their
  own certificates. Revisit the FL/GA outreach language once reporting is live.
- **Washington**: the one-time 6-hour suicide-prevention training must come from a
  program on the WA DOH Model List. ANCC accreditation alone does not satisfy it — if
  we ever market a suicide-prevention course into WA, confirm Model List status first.
  The 2-hour health-equity course must meet WAC 246-12-830 content standards
  (implicit bias content + an assessment or attendance attestation).
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
