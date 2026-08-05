# CE Requirements Dataset — Verification Workflow

## Status (2026-08-04, after the PT batch)
- **PT (pt-data.ts): 7 states verified and live** — TX, FL, OH, MI, GA, NC, KS.
  **3 states researched but HELD** at `lastVerified: null` — PA, IL, LA (HOLD comments
  with the exact URLs sit above each entry). 39 PT entries pre-filled and unverified.
  Registered as discipline `pt` (not `therapy`) — OT and SLP get their own datasets.

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

## PT batch (pt-data.ts) — added 2026-08-04

### ⚠️ `acceptsNationalAccreditation` means something DIFFERENT for PT
There is no national accreditor for physical therapy CE the way ANCC covers nursing or
ASWB ACE covers social work. H.I.S. Cornerstone's PT courses are approved through the
**Texas board only**, via the Continuing Competence Approval Program (CCAP) administered
by the **Texas Physical Therapy Association (TPTA)**. **APTA is not an accreditor of
these courses and must never be claimed as one.** So in `pt-data.ts` the flag means
exactly: *"this board accepts CE approved by another state's PT board or APTA chapter —
i.e. a TPTA/CCAP approval is recognized here."* Every `true` is backed by quoted official
rule text. All 39 unverified drafts default to `false` so an un-reviewed flip of
`lastVerified` under-claims rather than over-claims.

`app/free-ce/[discipline]/[state]/page.tsx` branches on `discipline === "pt"` and asks
*"Does our Texas-approved CE count in {state}?"* instead of the national-accreditation
question, precisely so a PT page can never imply an accreditation we don't hold.

### Method (2026-08-04)
5 parallel research agents, 2 states each, official sources only — state boards,
statutes, administrative codes. Then a **second adversarial verification pass** (4 more
agents) on the states whose first-pass findings were shaky. That second pass paid for
itself: it caught that Georgia rule **490-4-.02(2)(a)** is a *codified* provider
restriction on the 4 ethics hours, which the first pass had read as mere board guidance.
Full verbatim rule quotes and per-field confidence ratings live in the project doc
`claude/pt-ce-research-batch1.md`.

### The finding that changes marketing copy
**A Texas/TPTA approval does not travel everywhere.** Of the 10 researched states:

| Accepts TPTA-approved CE | States |
|---|---|
| Yes | TX (it is the approving body), PA, MI, NC, KS |
| **No** | **FL, OH, LA** |
| Unclear — treated as no | **IL** |
| Partial | **GA** — yes for 26 of 30 hours, no for the 4 ethics hours |

`/free-ce-for-therapists` and any therapy marketing copy must not imply nationwide
acceptance. FL, OH and LA each run a closed or state-specific approval gate; OH and LA
are reachable per-course (OPTA approval number; LPTB sponsor approval at $100–$150).

### The second finding: on-demand delivery caps
Our courses are online and self-paced. Four states limit that:
- **FL** — max 12 of 24 hours self-paced, and a **12-hour live/real-time-webinar minimum**
- **NC** — max **10 points** from on-demand (33% of a PT's 30, 50% of a PTA's 20)
- **IL** — max 75% (PT 30 of 40, PTA 15 of 20)
- **MI** — no format cap, but purchased courses max **30 of 36** (PT) / **20 of 24** (PTA),
  plus a 12-credits-per-24-hours pace limit
TX, PA, GA, OH, LA and KS have no self-paced cap at all. Adding **live real-time
interactive webinars** is the single product change that unlocks FL, NC and IL.

### Modeling limitations to know before editing entries
- **`contactHours` holds the PT figure only.** The PTA figure lives in `details` — the
  two differ in TX (30/20), OH (24/12), MI (36/24), IL (40/20) and KS (40/20), and are
  identical in FL, PA, GA, NC and LA.
- **Unit names differ.** TX uses continuing competence units (CCUs), MI uses PDR credits,
  NC uses points. All map 1:1 to a contact hour, but certificates should use the state's
  own word. FL's contact hour is **50 minutes** and 1 CEU = 10 contact hours — label FL
  certificates in contact hours or credit is misstated tenfold.
- **`cycleYears` is a poor fit for NC.** North Carolina renews the *license* annually each
  January while running a staggered **25-month** CE reporting period per licensee. The
  entry uses `cycleYears: 2` with the real structure spelled out in `summary`/`details`.
  Note NC does **not** renew by birth month — any reminder automation keyed to birth month
  will be wrong for every NC licensee.
- **Split renewal years.** OH renews PTs in even years and PTAs in odd; IL renews PTs
  9/30 of even years and PTAs 9/30 of odd. Neither state can use one combined campaign.

### Things we cannot sell (board-monopolised)
TX JAM (2 CCUs, $48, FSBPT) · OH JAM (2 hrs, $48, FSBPT) · KS JAM (1 hr, PT only, FSBPT) ·
NC Jurisprudence Exercise (free, board-hosted) · LA jurisprudence (2 hrs, board-delivered) ·
GA Ethics & Jurisprudence (needs an APTA Georgia approval certificate) ·
PA Act 31 child abuse hours (needs a DHS-approved provider).

### Certificate requirements this batch imposes on us
Name, license number, course title, provider, date(s), **instructional format**, hours or
credits awarded, authorized signature, approval number — **and the name of the approving
organization ("Texas Physical Therapy Association")**. MI (R 338.7163(4)(a)) and NC
(48G .0110(c)) both fail an audit without the approving organization named. GA requires
certificates to be **CE-Broker-reportable** — since 1/1/2026 a Georgia licensee cannot even
submit a renewal until activities are pre-recorded in CE Broker.

### Never publish
An audit percentage for any state in this batch (none publishes one) · a record-retention
figure for OH or KS (neither states one in rule) · "Georgia Board Approved" (Georgia has no
pre-approval registry; acceptance is decided at audit) · a domestic-violence CE requirement
for Florida PTs (ch. 486 is absent from Fla. Stat. §456.031(1)(a) — a common vendor error).

### Held states — what a human must do
- **PA** — the only machine-readable official text is the ch. 40 PDF with footer serial
  "(405606) No. 564 Nov. 21", i.e. **November 2021 vintage**; a 2025 PA Bulletin item tied
  to the board is robots-blocked, and §40.192 (PTA) was never read verbatim. Four URLs are
  in the HOLD comment above the entry.
- **IL** — out-of-state acceptance genuinely unresolved: Illinois approves *sponsors*, not
  "approved by" bodies, and §1340.61(b)(2) bars credit for "courses taken in Illinois from
  unapproved sponsors" with no rule defining where an asynchronous course is taken. The
  exact statutory board name under 225 ILCS 90 is also unconfirmed.
- **LA** — LAC 46:LIV **§193.D** was never retrieved from an official Louisiana source: the
  board's Practice Act PDF truncates before the rules, doa.la.gov publishes Title 46:LIV
  only as a `.docx` no tool could decode, and the Aug-2021 Louisiana Register PDF truncates
  too. The "not accepted" verdict is the conservative one and rests on three official board
  pages plus two non-official legal databases. **⚠️ An earlier fetch of the LA Practice Act
  using a `#page=41` anchor returned fluent but PARTLY FABRICATED §§191–195 text. It was
  discarded. Do not let a future pass treat that kind of output as rule text.**

## Annual maintenance
Boards change rules, usually effective Jan 1 or at legislative session end.
Set a yearly reminder (January) to re-check any state whose `lastVerified`
is >12 months old. `getVerificationProgress()` reports staleness counts.
