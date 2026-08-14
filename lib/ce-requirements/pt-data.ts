// lib/ce-requirements/pt-data.ts
// Physical therapist / physical therapist assistant continuing education
// requirements — 48 states + DC.
// CA and NY are intentionally EXCLUDED (same policy as rn-data.ts and sw-data.ts):
// both require state-specific provider approval that our approvals do not satisfy.
//
// ⚠️ Entries with lastVerified: null are PRE-FILLED and UNVERIFIED — they never
// render publicly. Verify against the board site, correct, set lastVerified, push.
//
// ⚠️⚠️ READ THIS BEFORE EDITING acceptsNationalAccreditation ⚠️⚠️
// For PT there is NO national accreditation the way ANCC works for nursing or
// ASWB ACE works for social work. H.I.S. Cornerstone's PT courses are approved
// through the TEXAS board only — via the Continuing Competence Approval Program
// (CCAP) administered by the Texas Physical Therapy Association (TPTA).
// APTA is NOT an accreditor of these courses and must never be claimed as one.
//
// So in THIS dataset, `acceptsNationalAccreditation: true` means exactly:
//   "this board accepts CE approved by another state's PT board or another
//    state's APTA chapter — i.e. a TPTA/CCAP approval is recognized here."
// It is `false` where the board runs a closed or state-specific approval gate.
// Every `true` in this file is backed by quoted official rule text; every draft
// entry defaults to `false` so an un-reviewed flip of lastVerified under-claims
// rather than over-claims.
//
// Batch 1 researched 2026-08-04 against official board / statute / administrative
// code pages only (no CE-vendor or aggregator sources), then re-verified by a
// second adversarial pass. Full citations and verbatim rule quotes live in the
// project doc `claude/pt-ce-research-batch1.md`.
//
// Contact-hour note: several states use their own unit. Texas uses continuing
// competence units (CCUs, 1 contact hour = 1 CCU), Michigan uses PDR credits
// (1 contact hour = 1 credit), and North Carolina uses points (1 contact hour =
// 1 point). contactHours holds the PT figure; the PTA figure is in `details`.

import type { StateRequirement } from "./types";

export const PT_REQUIREMENTS: StateRequirement[] = [
  {
    state: "Alabama", stateCode: "AL", slug: "alabama", discipline: "pt",
    requirementType: "hours", contactHours: 10, cycleYears: 1,
    summary: "Alabama physical therapists must complete 10 contact hours of continuing education every 1 year.",
    details: "UNVERIFIED DRAFT. verify current hours, cycle, PTA figure, mandatory topics, any cap on online/self-paced hours, and — most important — whether the board accepts CE approved by another state's PT board or APTA chapter (our courses carry a TPTA/CCAP approval).",
    acceptsNationalAccreditation: false,
    boardName: "Alabama Board of Physical Therapy",
    sourceUrl: "https://pt.alabama.gov/",
    lastVerified: null,
  },
  {
    state: "Alaska", stateCode: "AK", slug: "alaska", discipline: "pt",
    requirementType: "hours", contactHours: 24, cycleYears: 2,
    summary: "Alaska physical therapists must complete 24 contact hours of continuing education every 2 years.",
    details: "UNVERIFIED DRAFT. verify current hours, cycle, PTA figure, mandatory topics, any cap on online/self-paced hours, and — most important — whether the board accepts CE approved by another state's PT board or APTA chapter (our courses carry a TPTA/CCAP approval).",
    acceptsNationalAccreditation: false,
    boardName: "Alaska State Physical Therapy and Occupational Therapy Board",
    sourceUrl: "https://www.commerce.alaska.gov/web/cbpl/professionallicensing/physicaltherapyoccupationaltherapy.aspx",
    lastVerified: null,
  },
  {
    state: "Arizona", stateCode: "AZ", slug: "arizona", discipline: "pt",
    requirementType: "hours", contactHours: 20, cycleYears: 2,
    summary: "Arizona physical therapists must complete 20 contact hours of continuing education every 2 years.",
    details: "UNVERIFIED DRAFT. verify current hours, cycle, PTA figure, mandatory topics, any cap on online/self-paced hours, and — most important — whether the board accepts CE approved by another state's PT board or APTA chapter (our courses carry a TPTA/CCAP approval).",
    acceptsNationalAccreditation: false,
    boardName: "Arizona Board of Physical Therapy",
    sourceUrl: "https://ptboard.az.gov/",
    lastVerified: null,
  },
  {
    state: "Arkansas", stateCode: "AR", slug: "arkansas", discipline: "pt",
    requirementType: "hours", contactHours: 20, cycleYears: 2,
    summary: "Arkansas physical therapists must complete 20 contact hours of continuing education every 2 years.",
    details: "UNVERIFIED DRAFT. verify current hours, cycle, PTA figure, mandatory topics, any cap on online/self-paced hours, and — most important — whether the board accepts CE approved by another state's PT board or APTA chapter (our courses carry a TPTA/CCAP approval).",
    acceptsNationalAccreditation: false,
    boardName: "Arkansas State Board of Physical Therapy",
    sourceUrl: "https://www.arptb.org/",
    lastVerified: null,
  },
  {
    state: "Colorado", stateCode: "CO", slug: "colorado", discipline: "pt",
    requirementType: "hours", contactHours: 30, cycleYears: 2,
    summary: "Colorado physical therapists must complete 30 contact hours of continuing education every 2 years.",
    details: "UNVERIFIED DRAFT. verify current hours, cycle, PTA figure, mandatory topics, any cap on online/self-paced hours, and — most important — whether the board accepts CE approved by another state's PT board or APTA chapter (our courses carry a TPTA/CCAP approval).",
    acceptsNationalAccreditation: false,
    boardName: "Colorado Physical Therapy Board (DORA)",
    sourceUrl: "https://dpo.colorado.gov/PhysicalTherapy",
    lastVerified: null,
  },
  {
    state: "Connecticut", stateCode: "CT", slug: "connecticut", discipline: "pt",
    requirementType: "hours", contactHours: 20, cycleYears: 2,
    summary: "Connecticut physical therapists must complete 20 contact hours of continuing education every 2 years.",
    details: "UNVERIFIED DRAFT. verify current hours, cycle, PTA figure, mandatory topics, any cap on online/self-paced hours, and — most important — whether the board accepts CE approved by another state's PT board or APTA chapter (our courses carry a TPTA/CCAP approval).",
    acceptsNationalAccreditation: false,
    boardName: "Connecticut Department of Public Health",
    sourceUrl: "https://portal.ct.gov/dph",
    lastVerified: null,
  },
  {
    state: "Delaware", stateCode: "DE", slug: "delaware", discipline: "pt",
    requirementType: "hours", contactHours: 24, cycleYears: 2,
    summary: "Delaware physical therapists must complete 24 contact hours of continuing education every 2 years.",
    details: "UNVERIFIED DRAFT. verify current hours, cycle, PTA figure, mandatory topics, any cap on online/self-paced hours, and — most important — whether the board accepts CE approved by another state's PT board or APTA chapter (our courses carry a TPTA/CCAP approval).",
    acceptsNationalAccreditation: false,
    boardName: "Delaware Examining Board of Physical Therapists and Athletic Trainers",
    sourceUrl: "https://dpr.delaware.gov/boards/physicaltherapy/",
    lastVerified: null,
  },
  {
    state: "Florida", stateCode: "FL", slug: "florida", discipline: "pt",
    requirementType: "hours", contactHours: 24, cycleYears: 2,
    summary: "Florida physical therapists and PTAs must complete 24 contact hours each biennium ending November 30 of odd-numbered years, and at least 12 of those hours must be live or real-time interactive webinar rather than self-paced.",
    mandatoryTopics: [
      { topic: "Prevention of medical errors", hours: 2, frequency: "every renewal; counts within the 24" },
      { topic: "HIV/AIDS", hours: 1, frequency: "no later than first renewal; counts within the 24" },
      { topic: "Human trafficking", hours: 1, frequency: "one-time; absorbed into the 22 general hours" },
    ],
    details: "Fla. Admin. Code r. 64B17-9.001 (effective 8/14/2025) and Fla. Stat. §486.109. Requirements are identical for PTs and PTAs — the rule applies to \"every person licensed pursuant to Chapter 486.\" A Florida contact hour is 50 minutes and 1 CEU equals 10 contact hours, so certificates must be labeled in contact hours or credit is misstated tenfold. Bienniums run 12/1 of an odd year through 11/30 of the next odd year (current: 12/1/2025–11/30/2027). Licensees issued in the second half of a biennium owe only the 2 medical-error hours plus 1 HIV/AIDS hour at first renewal. Sub-limits in subsection (3): no more than 5 risk-management hours per biennium, up to 3 HIV/AIDS hours countable, up to 3 medical-error hours countable. Florida has NO domestic violence requirement for PTs or PTAs — ch. 486 is absent from the list in Fla. Stat. §456.031(1)(a), a point many CE vendors get wrong. The Florida laws and rules examination is optional and worth 2 hours, not a mandate. THE FORMAT RULE IS THE BINDING CONSTRAINT: r. 64B17-9.001(1)(b) accepts a maximum of 12 contact hours by self-paced format per biennium, and self-paced courses must include both a certificate of completion and an examination; r. 64B17-9.001(1)(a) requires a minimum of 12 hours of formal live lecture or approved webinar, where a webinar counts as live only if it is real-time, has learning objectives, is interactive, has a post-course assessment, and the provider verifies attendance. Pre-recorded video is expressly self-paced, not live. CE Broker reporting is mandatory (Fla. Stat. §456.025(7)) and DOH reviews every licensee's record electronically at renewal, so there is no audit percentage to quote. Retain documentation 4 years.",
    acceptsNationalAccreditation: false,
    accreditationNote: "Florida will not accept our Texas approval. Fla. Stat. §486.109(2) says the board \"shall approve only\" courses sponsored by an accredited college or university PT/PTA program, or sponsored or approved by the Florida Physical Therapy Association or the American Physical Therapy Association — a closed list, and TPTA is none of the three. The structure of the rule confirms chapter approval is not APTA approval: Florida had to name its own APTA chapter (FPTA) separately from APTA, which would be surplusage if chapters were already covered. Selling into Florida requires FPTA or APTA course approval, or accredited-university sponsorship, plus CE Broker provider registration.",
    boardName: "Florida Board of Physical Therapy Practice (Department of Health, Division of Medical Quality Assurance)",
    sourceUrl: "https://floridasphysicaltherapy.gov/physical-therapist/",
    lastVerified: "2026-08-04",
  },
  {
    state: "Georgia", stateCode: "GA", slug: "georgia", discipline: "pt",
    requirementType: "hours", contactHours: 30, cycleYears: 2,
    summary: "Georgia physical therapists and PTAs must complete 30 clock hours of continuing competence each biennium ending December 31 of odd-numbered years, including 4 hours of Georgia Ethics and Jurisprudence, and no more than 10 hours may be claimed in a single calendar day.",
    mandatoryTopics: [
      { topic: "Georgia Ethics and Jurisprudence (restricted providers — see caveat)", hours: 4, frequency: "every renewal; counts within the 30; may instead be satisfied by passing the Georgia Ethics and Jurisprudence Examination" },
    ],
    details: "Ga. Comp. R. & Regs. ch. 490-4. Requirements are identical for PTs and PTAs. Rule 490-4-.02(1) caps credit at 10 clock hours per calendar day, so a 30-hour weekend is not compliant. Renewal is biennial by December 31 of odd years (490-4-.01), the window opens October 1, a late fee applies January 1–31, and the license lapses February 1. The current cycle runs 1/1/2026–12/31/2027. Licensees who graduate, pass the NPTE, and are licensed during the current biennium are exempt from continuing competence for that biennium. There is NO cap on online, self-paced, home-study, or asynchronous hours and no live minimum — a full keyword sweep of ch. 490-4 and the board's policy document found no such language, home study is expressly listed as acceptable audit documentation at 490-4-.02(9)(b), and the only related limit is 3 hours for self-instruction from reading professional literature. Georgia expressly does NOT accept orientation and in-service programs, policy or committee meetings, non-educational association meetings, entertainment, officeholding or delegate service, visiting exhibits, or CPR. CE Broker is mandatory under 490-4-.02(6), and beginning January 1, 2026 (O.C.G.A. 43-1-4.1) a licensee cannot even submit a renewal application unless activities and certificates are already recorded in CE Broker — so our certificates must be CE-Broker-reportable to be usable here. Retain original documents 5 years. Audits may occur before, during, or after renewal; no percentage is published.",
    acceptsNationalAccreditation: true,
    accreditationNote: "Georgia accepts our Texas approval for 26 of the 30 hours but NOT for the 4 ethics hours. Rule 490-4-.02(3)(b) recognizes \"programs approved by the Physical Therapy Association of Georgia or any other state chapters,\" and the board's Policy #7 separately lists \"programs approved by another state board\" — TPTA qualifies under both. But the introductory verb is permissive (\"may be considered for approval\"), Georgia runs no pre-approval registry, and acceptance is determined at audit, so never label a course \"Georgia Board Approved.\" Separately, Rule 490-4-.02(2)(a) restricts the 4 Georgia Ethics and Jurisprudence hours to a Georgia college or university with an accredited PT education program, or a provider holding a current Physical Therapy Association of Georgia (APTA Georgia) Approval Certificate for that course. We cannot supply those 4 hours without that certificate.",
    boardName: "Georgia State Board of Physical Therapy (Professional Licensing Boards Division, Georgia Secretary of State)",
    sourceUrl: "https://rules.sos.ga.gov/gac/490-4",
    lastVerified: "2026-08-04",
  },
  {
    state: "Hawaii", stateCode: "HI", slug: "hawaii", discipline: "pt",
    requirementType: "hours", contactHours: 30, cycleYears: 2,
    summary: "Hawaii physical therapists must complete 30 contact hours of continuing education every 2 years.",
    details: "UNVERIFIED DRAFT. verify current hours, cycle, PTA figure, mandatory topics, any cap on online/self-paced hours, and — most important — whether the board accepts CE approved by another state's PT board or APTA chapter (our courses carry a TPTA/CCAP approval).",
    acceptsNationalAccreditation: false,
    boardName: "Hawaii Board of Physical Therapy (DCCA)",
    sourceUrl: "https://cca.hawaii.gov/pvl/boards/physical/",
    lastVerified: null,
  },
  {
    state: "Idaho", stateCode: "ID", slug: "idaho", discipline: "pt",
    requirementType: "hours", contactHours: 20, cycleYears: 2,
    summary: "Idaho physical therapists must complete 20 contact hours of continuing education every 2 years.",
    details: "UNVERIFIED DRAFT. verify current hours, cycle, PTA figure, mandatory topics, any cap on online/self-paced hours, and — most important — whether the board accepts CE approved by another state's PT board or APTA chapter (our courses carry a TPTA/CCAP approval).",
    acceptsNationalAccreditation: false,
    boardName: "Idaho Physical Therapy Licensure Board",
    sourceUrl: "https://dopl.idaho.gov/physical-therapy/",
    lastVerified: null,
  },
  // HOLD — do NOT set lastVerified until a human resolves the out-of-state question.
  // Hours, cycle, renewal dates, mandatory topics and the 75% self-study cap are all
  // verified from quoted rule text and are safe. What is NOT safe is claiming Illinois
  // accepts our Texas approval. Illinois defines approved SPONSORS (who runs the course),
  // not "approved by" bodies, and §1340.61(b)(2) bars credit "for courses taken in
  // Illinois from unapproved sponsors" — with no rule defining where an asynchronous
  // online course is "taken." The exact statutory board name under 225 ILCS 90 is also
  // unconfirmed (ilga.gov statute URL 404s).
  // Open these three, and ideally get IDFPR's answer in writing, then decide:
  //   https://www.ilga.gov/commission/jcar/admincode/068/068013400000610R.html
  //   https://idfpr.illinois.gov/content/dam/soi/en/web/idfpr/renewals/apply/forms/f1915pt.pdf
  //   https://www.ilga.gov/legislation/ilcs/ilcs3.asp?ActID=1319&ChapterID=24
  {
    state: "Illinois", stateCode: "IL", slug: "illinois", discipline: "pt",
    requirementType: "hours", contactHours: 40, cycleYears: 2,
    summary: "Illinois physical therapists must complete 40 hours of continuing education per 24-month prerenewal period and physical therapist assistants 20, and no more than 75% of those hours may come from pre-recorded or self-paced courses.",
    mandatoryTopics: [
      { topic: "Ethical practice of physical therapy, including jurisprudence", hours: 3, frequency: "every renewal; counts within the total" },
      { topic: "Sexual harassment prevention", hours: 1, frequency: "every renewal; counts within the total" },
      { topic: "Implicit bias awareness", hours: 1, frequency: "every renewal; counts within the total" },
      { topic: "Cultural competency", hours: 1, frequency: "every 6 years; counts within the total" },
      { topic: "Alzheimer's disease and other dementias", hours: 1, frequency: "every 6 years; counts within the total" },
    ],
    details: "225 ILCS 90; 68 Ill. Adm. Code pt. 1340 (§1340.61 amended effective April 5, 2024) plus the IDFPR-wide mandates in pt. 1130. A CE hour is 50 minutes. PTs need 40 hours and PTAs 20 per 24-month prerenewal period. IMPORTANT: PTs and PTAs renew in DIFFERENT years — §1340.55 expires PT licenses September 30 of each EVEN-numbered year (next 9/30/2026) and PTA licenses September 30 of each ODD-numbered year (next 9/30/2027) — so Illinois needs two separate campaigns, not one. No CE is required for the first renewal, and Illinois licensees residing and practicing in other states still owe Illinois CE. All four pt. 1130 mandates count toward, not on top of, the total and may all be delivered online, which makes a 4-hour Illinois compliance bundle a clean product once the sponsor question is resolved. IDFPR's public CE page dates the dementia requirement to 1/1/2025 while the rule and 20 ILCS 2105/2105-365 both say 1/1/2023 — publish the rule's date or none. THE FORMAT CAP IS BINDING: §1340.61(b)(3)(E)(i) allows only 75% of total credit from correspondence or web-based courses including pre-recorded presentations and webinars, so a PT may take at most 30 of 40 hours and a PTA 15 of 20 that way, leaving 10 and 5 hours that must be live. §1340.61(b)(3)(F) treats real-time virtual attendance with two-way communication as LIVE rather than self-study, which is the unlock for that remainder. Self-attestation at renewal; retain evidence 5 years; no audit percentage published. Waivers exist for armed-forces service and documented extreme hardship.",
    acceptsNationalAccreditation: false,
    accreditationNote: "Treat Illinois as not accepting our Texas approval until IDFPR says otherwise in writing. §1340.61(c)(1)(A) approves \"APTA and its components, including programs, courses and activities approved by the IPTA,\" but the only chapter it illustrates is the Illinois one, and IDFPR's own sponsor form likewise names only IPTA. More decisively, Illinois approves SPONSORS — the entity running the course — and has no clause blessing courses merely APPROVED BY an APTA component, unlike Pennsylvania. A vendor course carrying a TPTA stamp is arguably still an unapproved sponsor. The two defensible routes are IDFPR CE sponsor licensure ($500 initial, $250 biennial, renewed by September 30 of even years) or telling each licensee to file the §1340.61(d) $20 pre-approval before taking the course — friction that will kill conversion.",
    boardName: "Illinois Department of Financial and Professional Regulation, Division of Professional Regulation",
    sourceUrl: "https://idfpr.illinois.gov/profs/pt.html",
    lastVerified: null,
  },
  {
    state: "Indiana", stateCode: "IN", slug: "indiana", discipline: "pt",
    requirementType: "hours", contactHours: 22, cycleYears: 2,
    summary: "Indiana physical therapists must complete 22 contact hours of continuing education every 2 years.",
    details: "UNVERIFIED DRAFT. verify current hours, cycle, PTA figure, mandatory topics, any cap on online/self-paced hours, and — most important — whether the board accepts CE approved by another state's PT board or APTA chapter (our courses carry a TPTA/CCAP approval).",
    acceptsNationalAccreditation: false,
    boardName: "Indiana Physical Therapy Committee",
    sourceUrl: "https://www.in.gov/pla/professions/physical-therapy-home/",
    lastVerified: null,
  },
  {
    state: "Iowa", stateCode: "IA", slug: "iowa", discipline: "pt",
    requirementType: "hours", contactHours: 40, cycleYears: 2,
    summary: "Iowa physical therapists must complete 40 contact hours of continuing education every 2 years.",
    details: "UNVERIFIED DRAFT. verify current hours, cycle, PTA figure, mandatory topics, any cap on online/self-paced hours, and — most important — whether the board accepts CE approved by another state's PT board or APTA chapter (our courses carry a TPTA/CCAP approval).",
    acceptsNationalAccreditation: false,
    boardName: "Iowa Board of Physical and Occupational Therapy",
    sourceUrl: "https://hhs.iowa.gov/licensure",
    lastVerified: null,
  },
  {
    state: "Kansas", stateCode: "KS", slug: "kansas", discipline: "pt",
    requirementType: "hours", contactHours: 40, cycleYears: 2,
    summary: "Kansas physical therapists must complete 40 contact hours and certified physical therapist assistants 20 in each 2-year period, reported only at odd-numbered-year renewals even though the license itself renews annually.",
    mandatoryTopics: [
      { topic: "Kansas physical therapy jurisprudence assessment module (FSBPT-administered)", hours: 1, frequency: "every CE cycle; PHYSICAL THERAPISTS ONLY — not required of PTAs; counts within the 40" },
    ],
    details: "K.A.R. 100-29-9 (last amended September 16, 2022) and K.S.A. 65-2910. Kansas has NO standalone physical therapy board — PTs and PTAs are regulated by the Kansas State Board of Healing Arts, and the terminology differs from most states: a PT holds a LICENSE while a PTA holds a CERTIFICATE (\"certified physical therapist assistant\"). A Kansas contact hour is 60 minutes. Renewal is annual, with the window running November 15 to January 31, but CE evidence is submitted only as a condition of renewal in ODD-numbered years; K.A.R. 100-29-9(a)(1)(B) expressly excuses submission in even-numbered years. Proration under (c): initially licensed or certified less than one year before an odd-year renewal means no CE is owed for that first renewal; between one and two years means half (20 hours PT, 10 PTA). A hardship extension of up to 6 months is available under (b). Kansas has NO mandated ethics hours and NO opioid or pain-management mandate — ethics is merely one of eight permitted content areas under (e). There is NO cap on internet, correspondence, audio, or video courses; the 2-hour limit in (f)(9)(A) applies only to reading professional literature, and there is no live-hour minimum. Kansas is a submit-at-renewal jurisdiction rather than an attest-and-audit one: (h) requires the licensee to file documented evidence of completion with the board, so no random-audit percentage and no separate retention period appear in the rule — do not publish either. One open item: K.A.R. 100-29-8, which sets the exact expiration-date mechanics, was not read verbatim; the November 15 / December 31 / January 31 reading comes from the board's published renewal-dates table plus the 30-day grace period in K.S.A. 65-2910.",
    acceptsNationalAccreditation: true,
    accreditationNote: "Kansas is the lowest-friction state in this batch, but for an unusual reason: the regulation contains no approving-agency requirement at all. K.A.R. 100-29-9 has no approved-provider list, no board pre-approval process, and no sponsor registry — acceptability turns only on the activity being related to physical therapy practice, falling within one of the eight content areas in subsection (e), and matching a listed activity type. Our courses qualify under (f)(9)(B), \"completion of a correspondence, audio, video, or internet course for which a printed verification of successful completion is provided.\" So the TPTA approval is neither required nor disqualifying here — it is simply irrelevant. The only build requirement is a printable completion certificate. This reading rests on the absence of an approval requirement across the complete rule rather than on an affirmative acceptance clause, so a confirming call to the board (785-296-7413) would be worth making before leaning on Kansas heavily.",
    boardName: "Kansas State Board of Healing Arts",
    sourceUrl: "https://www.ksbha.ks.gov/departments/licensing/licensure-types-designations/physical-therapist",
    lastVerified: "2026-08-04",
  },
  {
    state: "Kentucky", stateCode: "KY", slug: "kentucky", discipline: "pt",
    requirementType: "hours", contactHours: 30, cycleYears: 2,
    summary: "Kentucky physical therapists must complete 30 contact hours of continuing education every 2 years.",
    details: "UNVERIFIED DRAFT. verify current hours, cycle, PTA figure, mandatory topics, any cap on online/self-paced hours, and — most important — whether the board accepts CE approved by another state's PT board or APTA chapter (our courses carry a TPTA/CCAP approval).",
    acceptsNationalAccreditation: false,
    boardName: "Kentucky Board of Physical Therapy",
    sourceUrl: "https://pt.ky.gov/",
    lastVerified: null,
  },
  // HOLD — do NOT set lastVerified until §193.D is read in an official publication.
  // Hours, cycle, topics and the absence of an online cap all come from official
  // laptboard.org pages that quote §194 and §198 directly, and are sound. The gap is
  // the KEY field: LAC 46:LIV §193.D was never retrieved from an official Louisiana
  // source. The board's Practice Act PDF truncates before the rules, doa.la.gov
  // publishes Title 46:LIV only as a .docx no tool could decode, and the August 2021
  // Louisiana Register PDF truncates before the rules text. The "not accepted" verdict
  // is the CONSERVATIVE one and rests on three official board pages that consistently
  // restate §193.D, corroborated by two non-official legal databases.
  // WARNING for whoever picks this up: an earlier fetch of the Practice Act PDF using a
  // "#page=41" anchor returned fluent but PARTLY FABRICATED text for §§191-195. It was
  // discarded. Do not treat that kind of output as rule text.
  // To close: curl https://www.doa.la.gov/media/vyon0ngc/46v54.docx and unzip
  // word/document.xml, or read pp. 40-43 of
  // https://www.laptboard.org/assets/docs/Practice-Act-and-Rules_09-01-2025.pdf,
  // or call the board at 337-262-1043 and get §193.D's scope in writing.
  {
    state: "Louisiana", stateCode: "LA", slug: "louisiana", discipline: "pt",
    requirementType: "hours", contactHours: 30, cycleYears: 2,
    summary: "Louisiana physical therapists and PTAs must complete 30 hours of board-approved continuing education every 2 years, including 2 hours of jurisprudence and 2 hours of ethics or professionalism.",
    mandatoryTopics: [
      { topic: "Jurisprudence (board-delivered seminar, webinar, or online exam)", hours: 2, frequency: "every renewal; counts within the 30" },
      { topic: "Ethics or professionalism", hours: 2, frequency: "every renewal; counts within the 30" },
      { topic: "Clinical and/or administrative content", hours: 26, frequency: "every renewal; the balance of the 30" },
    ],
    details: "LAC 46:LIV §§191-199. Louisiana is BIENNIAL, not annual, and the same 30-hour requirement applies to PTs and PTAs alike — §194.A speaks only of \"licensees,\" with no PT/PTA split. Renewal is staggered by BIRTH-YEAR PARITY: licensees born in odd-numbered years renew in odd years, even in even years. The renewal window runs February 1 to March 31, late renewal is possible through April 30 with a $120 penalty, and a renewed license expires April 30 two years later. No carryover of hours between periods. Proration is generous: graduates are exempt for the calendar year in which they graduate, and prior-year graduates plus reciprocity and reinstatement licensees owe 15 hours. §198 additionally waives or prorates for extended active military service, illness, natural disaster, and personal hardship, on a written request mailed at least 45 days before the end of the renewal period. There is NO cap on online or self-paced hours and NO live minimum — the board removed live-hour requirements in 2021 and states the change is not temporary, and its CE resource centre confirms \"there is no maximum or minimum requirement for any of these types.\" Be aware the board recalculates claimed credit: text-based courses are valued using the Mergener Formula and video courses by presentation time. The 2 jurisprudence hours are board-delivered (live seminar, two one-hour webinars, or the online exam) and cannot be supplied by a third party; the 2 ethics hours can. Random audits of renewers; certificates are uploaded to the licensee dashboard; retain records 4 years; 30 days to respond. No audit percentage is published.",
    acceptsNationalAccreditation: false,
    accreditationNote: "Louisiana runs a genuine pre-approval regime and our Texas approval does not carry over. §193.D automatically approves only courses SPONSORED BY the APTA, APTA Louisiana, and Louisiana CAPTE-accredited programs — note that the operative verb is \"sponsored by,\" not \"approved by,\" so even a generous reading of the entity list would not reach a third-party course merely carrying a TPTA approval. The fact that the rule names the Louisiana chapter separately from the APTA is strong evidence that chapters generally are not included. Two legal routes exist: the sponsor submits the course to the board ($100 under 8 hours, $150 for 9 or more, 45-day review, APTA and CAPTE waived), or each licensee self-submits under §193.F for $20 by February 28 of their renewal year and not within the last 60 days of their license term. Sponsor approval is the scalable path.",
    boardName: "Louisiana Physical Therapy Board",
    sourceUrl: "https://www.laptboard.org/index.cfm/page/130",
    lastVerified: null,
  },
  {
    state: "Maine", stateCode: "ME", slug: "maine", discipline: "pt",
    requirementType: "hours", contactHours: 30, cycleYears: 2,
    summary: "Maine physical therapists must complete 30 contact hours of continuing education every 2 years.",
    details: "UNVERIFIED DRAFT. verify current hours, cycle, PTA figure, mandatory topics, any cap on online/self-paced hours, and — most important — whether the board accepts CE approved by another state's PT board or APTA chapter (our courses carry a TPTA/CCAP approval).",
    acceptsNationalAccreditation: false,
    boardName: "Maine Board of Examiners in Physical Therapy",
    sourceUrl: "https://www.maine.gov/pfr/professionallicensing/professions/physical-therapists",
    lastVerified: null,
  },
  {
    state: "Maryland", stateCode: "MD", slug: "maryland", discipline: "pt",
    requirementType: "hours", contactHours: 30, cycleYears: 2,
    summary: "Maryland physical therapists must complete 30 contact hours of continuing education every 2 years.",
    details: "UNVERIFIED DRAFT. verify current hours, cycle, PTA figure, mandatory topics, any cap on online/self-paced hours, and — most important — whether the board accepts CE approved by another state's PT board or APTA chapter (our courses carry a TPTA/CCAP approval).",
    acceptsNationalAccreditation: false,
    boardName: "Maryland Board of Physical Therapy Examiners",
    sourceUrl: "https://health.maryland.gov/bphte/",
    lastVerified: null,
  },
  {
    state: "Massachusetts", stateCode: "MA", slug: "massachusetts", discipline: "pt",
    requirementType: "hours", contactHours: 30, cycleYears: 2,
    summary: "Massachusetts physical therapists must complete 30 contact hours of continuing education every 2 years.",
    details: "UNVERIFIED DRAFT. verify current hours, cycle, PTA figure, mandatory topics, any cap on online/self-paced hours, and — most important — whether the board accepts CE approved by another state's PT board or APTA chapter (our courses carry a TPTA/CCAP approval).",
    acceptsNationalAccreditation: false,
    boardName: "Massachusetts Board of Registration of Allied Health Professionals",
    sourceUrl: "https://www.mass.gov/orgs/board-of-registration-of-allied-health-professionals",
    lastVerified: null,
  },
  {
    state: "Michigan", stateCode: "MI", slug: "michigan", discipline: "pt",
    requirementType: "hours", contactHours: 36, cycleYears: 3,
    summary: "Michigan physical therapists must earn 36 professional development (PDR) credits every 3 years and physical therapist assistants 24, on a cycle that runs from each licensee's own issue-date anniversary rather than a statewide date.",
    mandatoryTopics: [
      { topic: "Pain and symptom management", hours: 1, frequency: "every renewal; counts within the total" },
      { topic: "Implicit bias training", hours: 3, frequency: "1 hour per year of the 3-year cycle; counts within the total; no carryover" },
      { topic: "Human trafficking identification", frequency: "one-time" },
    ],
    details: "Mich. Admin. Code R 338.7161 and R 338.7163, as amended by rule set 2023-53 LR, FILED AND EFFECTIVE MARCH 5, 2026 — any Michigan PT CE guidance dated before then is stale, including the old 2-year/24-credit structure. One contact hour equals 1 PDR credit. R 338.7002(3) puts physical therapy on a triennial cycle keyed to the licensee's issue date, so Michigan has no statewide renewal season and demand is continuous; renewals open 90 days before expiration. TWO LIMITS MATTER COMMERCIALLY. First, R 338.7163(1)(a) allows no more than 12 PDR credits from online programs completed in any one 24-hour period — an anti-cramming pace limit, not a ceiling, but a bundle over 12 credits must not be completable in one sitting. Second, and more important, purchased CE courses are capped: R 338.7163(4)(a) allows a maximum of 30 credits for PTs and (5)(a) a maximum of 20 for PTAs, so courses alone can never satisfy the full 36 or 24. The remaining 6 (PT) or 4 (PTA) must come from other enumerated activities such as reading journal articles (max 9) or viewing professional education media (max 9), both of which are self-directed. Do not market a Michigan bundle as covering an entire renewal. Michigan requires no jurisprudence exam. Self-attestation at renewal through MiPLUS; LARA partners with CE Broker for tracking, which is a convenience rather than an approval gate. Retain records 4 years, but 6 years for implicit bias documentation under R 338.7004 — advise licensees to keep everything 6. No audit percentage is published. Two open items a human should still confirm: whether the one-time human trafficking training applies to PTAs (LARA's shared guidance lists PTs while LARA's own PTA licensing guide tells PTAs they need it), and the explicit first-cycle exemption sentence in the March 2026 text.",
    acceptsNationalAccreditation: true,
    accreditationNote: "Michigan accepts our Texas approval outright, with no Michigan filing, fee, or approval number. R 338.7163(4)(a) and (5)(a) approve a program \"regardless of the format that it is offered\" if it is approved or offered for CE credit by, among others, \"another state board of physical therapy\" or \"the APTA or its components,\" and the rule then defines components to include \"the APTA Michigan and other APTA chapters\" — TPTA is squarely inside that. One build requirement: the rule's documentation column requires the certificate to show the licensee's name, credits earned, completion date, and the name of the organization that approved the program. A Michigan certificate that omits \"Texas Physical Therapy Association\" fails an audit even though the course itself qualifies.",
    boardName: "Michigan Board of Physical Therapy (LARA, Bureau of Professional Licensing)",
    sourceUrl: "https://www.michigan.gov/lara/bureau-list/bpl/health/hp-lic-health-prof/pt",
    lastVerified: "2026-08-04",
  },
  {
    state: "Minnesota", stateCode: "MN", slug: "minnesota", discipline: "pt",
    requirementType: "hours", contactHours: 40, cycleYears: 2,
    summary: "Minnesota physical therapists must complete 40 contact hours of continuing education every 2 years.",
    details: "UNVERIFIED DRAFT. verify current hours, cycle, PTA figure, mandatory topics, any cap on online/self-paced hours, and — most important — whether the board accepts CE approved by another state's PT board or APTA chapter (our courses carry a TPTA/CCAP approval).",
    acceptsNationalAccreditation: false,
    boardName: "Minnesota Board of Physical Therapy",
    sourceUrl: "https://mn.gov/boards/physical-therapy/",
    lastVerified: null,
  },
  {
    state: "Mississippi", stateCode: "MS", slug: "mississippi", discipline: "pt",
    requirementType: "hours", contactHours: 20, cycleYears: 2,
    summary: "Mississippi physical therapists must complete 20 contact hours of continuing education every 2 years.",
    details: "UNVERIFIED DRAFT. verify current hours, cycle, PTA figure, mandatory topics, any cap on online/self-paced hours, and — most important — whether the board accepts CE approved by another state's PT board or APTA chapter (our courses carry a TPTA/CCAP approval).",
    acceptsNationalAccreditation: false,
    boardName: "Mississippi State Board of Physical Therapy",
    sourceUrl: "https://www.msbpt.ms.gov/",
    lastVerified: null,
  },
  {
    state: "Missouri", stateCode: "MO", slug: "missouri", discipline: "pt",
    requirementType: "hours", contactHours: 30, cycleYears: 2,
    summary: "Missouri physical therapists must complete 30 contact hours of continuing education every 2 years.",
    details: "UNVERIFIED DRAFT. verify current hours, cycle, PTA figure, mandatory topics, any cap on online/self-paced hours, and — most important — whether the board accepts CE approved by another state's PT board or APTA chapter (our courses carry a TPTA/CCAP approval).",
    acceptsNationalAccreditation: false,
    boardName: "Missouri Advisory Commission for Physical Therapists",
    sourceUrl: "https://pr.mo.gov/physicaltherapists.asp",
    lastVerified: null,
  },
  {
    state: "Montana", stateCode: "MT", slug: "montana", discipline: "pt",
    requirementType: "hours", contactHours: 30, cycleYears: 2,
    summary: "Montana physical therapists must complete 30 contact hours of continuing education every 2 years.",
    details: "UNVERIFIED DRAFT. verify current hours, cycle, PTA figure, mandatory topics, any cap on online/self-paced hours, and — most important — whether the board accepts CE approved by another state's PT board or APTA chapter (our courses carry a TPTA/CCAP approval).",
    acceptsNationalAccreditation: false,
    boardName: "Montana Board of Physical Therapy Examiners",
    sourceUrl: "https://boards.bsd.dli.mt.gov/physical-therapy",
    lastVerified: null,
  },
  {
    state: "Nebraska", stateCode: "NE", slug: "nebraska", discipline: "pt",
    requirementType: "hours", contactHours: 24, cycleYears: 2,
    summary: "Nebraska physical therapists must complete 24 contact hours of continuing education every 2 years.",
    details: "UNVERIFIED DRAFT. verify current hours, cycle, PTA figure, mandatory topics, any cap on online/self-paced hours, and — most important — whether the board accepts CE approved by another state's PT board or APTA chapter (our courses carry a TPTA/CCAP approval).",
    acceptsNationalAccreditation: false,
    boardName: "Nebraska Board of Physical Therapy (DHHS Licensure Unit)",
    sourceUrl: "https://dhhs.ne.gov/licensure/Pages/Physical-Therapy.aspx",
    lastVerified: null,
  },
  {
    state: "Nevada", stateCode: "NV", slug: "nevada", discipline: "pt",
    requirementType: "hours", contactHours: 15, cycleYears: 1,
    summary: "Nevada physical therapists must complete 15 contact hours of continuing education every 1 year.",
    details: "UNVERIFIED DRAFT. verify current hours, cycle, PTA figure, mandatory topics, any cap on online/self-paced hours, and — most important — whether the board accepts CE approved by another state's PT board or APTA chapter (our courses carry a TPTA/CCAP approval).",
    acceptsNationalAccreditation: false,
    boardName: "Nevada Physical Therapy Board",
    sourceUrl: "https://ptboard.nv.gov/",
    lastVerified: null,
  },
  {
    state: "New Hampshire", stateCode: "NH", slug: "new-hampshire", discipline: "pt",
    requirementType: "hours", contactHours: 30, cycleYears: 2,
    summary: "New Hampshire physical therapists must complete 30 contact hours of continuing education every 2 years.",
    details: "UNVERIFIED DRAFT. verify current hours, cycle, PTA figure, mandatory topics, any cap on online/self-paced hours, and — most important — whether the board accepts CE approved by another state's PT board or APTA chapter (our courses carry a TPTA/CCAP approval).",
    acceptsNationalAccreditation: false,
    boardName: "New Hampshire Governor's Board of Physical Therapy (OPLC)",
    sourceUrl: "https://www.oplc.nh.gov/physical-therapy",
    lastVerified: null,
  },
  {
    state: "New Jersey", stateCode: "NJ", slug: "new-jersey", discipline: "pt",
    requirementType: "hours", contactHours: 30, cycleYears: 2,
    summary: "New Jersey physical therapists must complete 30 contact hours of continuing education every 2 years.",
    details: "UNVERIFIED DRAFT. verify current hours, cycle, PTA figure, mandatory topics, any cap on online/self-paced hours, and — most important — whether the board accepts CE approved by another state's PT board or APTA chapter (our courses carry a TPTA/CCAP approval). NOTE: njconsumeraffairs.gov blocks automated fetching — this one must be checked by hand in a browser, same as the RN dataset's NJ entry.",
    acceptsNationalAccreditation: false,
    boardName: "New Jersey State Board of Physical Therapy Examiners",
    sourceUrl: "https://www.njconsumeraffairs.gov/pt",
    lastVerified: null,
  },
  {
    state: "New Mexico", stateCode: "NM", slug: "new-mexico", discipline: "pt",
    requirementType: "hours", contactHours: 30, cycleYears: 2,
    summary: "New Mexico physical therapists must complete 30 contact hours of continuing education every 2 years.",
    details: "UNVERIFIED DRAFT. verify current hours, cycle, PTA figure, mandatory topics, any cap on online/self-paced hours, and — most important — whether the board accepts CE approved by another state's PT board or APTA chapter (our courses carry a TPTA/CCAP approval).",
    acceptsNationalAccreditation: false,
    boardName: "New Mexico Physical Therapy Board",
    sourceUrl: "https://www.rld.nm.gov/boards-and-commissions/individual-boards-and-commissions/physical-therapy/",
    lastVerified: null,
  },
  {
    state: "North Carolina", stateCode: "NC", slug: "north-carolina", discipline: "pt",
    requirementType: "hours", contactHours: 30, cycleYears: 2,
    summary: "North Carolina physical therapists must accumulate 30 continuing competence points and physical therapist assistants 20 in each 25-month reporting period, while renewing the license itself every January — and no more than 10 of those points may come from on-demand, self-paced courses.",
    mandatoryTopics: [
      { topic: "Board's online Jurisprudence Exercise (free, at ncptboard.org)", hours: 1, frequency: "every reporting period; counts within the total; cannot be carried forward" },
    ],
    details: "21 NCAC 48G; N.C. Gen. Stat. ch. 90 art. 18E. North Carolina counts POINTS, not hours: PTs need 30 and PTAs 20 per 25-month reporting period (48G .0106, .0105(12)), with one contact hour — defined as 50 consecutive minutes — equal to one point. Up to 10 points carry forward, except Jurisprudence Exercise, Clinical Practice, and Self-Assessment points. TWO STRUCTURAL POINTS THAT ARE EASY TO GET WRONG. First, NC does NOT renew by birth month: G.S. 90-270.99(a) and 48G .0104 require renewal during January each year, expiring January 31, while the CE reporting period is a separate, per-licensee, staggered 25-month cycle beginning January 1 — so any reminder logic keyed to birth month will be wrong for every NC licensee, and there is no single statewide CE rush. Second, the delivery-format caps are severe: 48G .0109(a)(4) allows a maximum of 10 points for non-interactive recorded or electronic media and (a)(8) a maximum of 10 points for approved-provider home study, while live real-time interactive electronic courses are capped at 15 and live in-person at 29. An on-demand catalog therefore tops out at 10 points — one third of a PT's requirement and half of a PTA's — and that ceiling should be stated plainly on the page. Rule 48G .0107(3) expressly permits delivery via \"a computer website accessed via the Internet,\" and .0107(5) requires written materials or at least a written agenda, objectives, or outline be distributed, so build a downloadable handout into NC-facing courses. Certificates must carry all six elements of 48G .0110(c), including the name of the accrediting organization. Approved providers must report activity codes and completing licensees to the board within 90 days (48G .0108(g)). Self-entry at renewal with documents produced only on audit; random post-period audits with a 30-day response; retain evidence 4 years; deficiencies of 10 points or fewer may be cured within 90 days. No audit percentage is published. Rules have been stable since 2020.",
    acceptsNationalAccreditation: true,
    accreditationNote: "North Carolina accepts our Texas approval automatically — no application, no fee, no waiting period. 21 NCAC 48G .0108(c)(3) lists \"State Chapters of APTA\" as approved providers, and (c)(1) plus (c)(6) independently approve any provider approved by an agency or board that licenses physical therapists in the US or Canada. That has real value: a non-approved provider pays $150 per activity with a 60-day lead time, or the licensee pays $25. Two caveats to keep visible: certificates must name the approving organization (Texas Physical Therapy Association), not just our brand, and self-paced on-demand courses are capped at 10 points per 25-month period regardless of approval.",
    boardName: "North Carolina Board of Physical Therapy Examiners",
    sourceUrl: "https://www2.ncptboard.org/app/ContinuingCompetence/ContinuingCompetenceHome.php",
    lastVerified: "2026-08-04",
  },
  {
    state: "North Dakota", stateCode: "ND", slug: "north-dakota", discipline: "pt",
    requirementType: "hours", contactHours: 24, cycleYears: 2,
    summary: "North Dakota physical therapists must complete 24 contact hours of continuing education every 2 years.",
    details: "UNVERIFIED DRAFT. verify current hours, cycle, PTA figure, mandatory topics, any cap on online/self-paced hours, and — most important — whether the board accepts CE approved by another state's PT board or APTA chapter (our courses carry a TPTA/CCAP approval).",
    acceptsNationalAccreditation: false,
    boardName: "North Dakota Board of Physical Therapy",
    sourceUrl: "https://www.ndbpt.org/",
    lastVerified: null,
  },
  {
    state: "Ohio", stateCode: "OH", slug: "ohio", discipline: "pt",
    requirementType: "hours", contactHours: 24, cycleYears: 2,
    summary: "Ohio physical therapists must complete 24 continuing education units every 2-year renewal cycle and physical therapist assistants 12, including 2 hours of ethics earned through the board's own jurisprudence assessment module.",
    mandatoryTopics: [
      { topic: "Ethics via the Ohio Jurisprudence Assessment Module (JAM)", hours: 2, frequency: "every renewal except the first; counts within the total; $48 through FSBPT" },
    ],
    details: "OAC 4755:2-3-01, effective April 3, 2026. Note the renumbering — these rules moved from the old 4755-23-xx series to 4755:2-x-xx, and stale citations still circulate widely. PTs need 24 units per cycle, PTAs 12, with no carryover (4755:2-3-01(B)). Renewal is biennial by January 31 under OAC 4755:2-1-05, with PTs renewing in EVEN years and PTAs in ODD years — next deadlines are PTAs 1/31/2027 and PTs 1/31/2028. No CE is required for the first renewal. The 2 ethics hours can only be satisfied by the board's own Jurisprudence Assessment Module, delivered through FSBPT for $48, with the score reported directly to the board — no third party can supply it. That leaves 22 hours (PT) or 10 (PTA) of open general CE. Ohio has NO implicit bias, human trafficking, opioid, or cultural competency mandate for PT. There is NO cap on self-study, online, or home-study hours and no live minimum; ORC 4755.52(B)(3) affirmatively authorizes \"other methods of instruction, including the use of self-study materials.\" Category caps apply only to non-course activities (clinical instruction 12/6, mentorship 12, volunteer service 6/3, Healthy Practice Resource modules 4/2). Self-attestation at renewal through eLicense Ohio; the section audits a number of licensees it sets each renewal year, so no audit percentage exists to publish. The rule does not state a record-retention period — do not invent one.",
    acceptsNationalAccreditation: false,
    accreditationNote: "Ohio will not accept our Texas approval, but it is reachable. OAC 4755:2-3-01(D) requires that completed activities \"have a current Ohio approval number,\" issued by the Ohio Physical Therapy Association under contract to the board. The APTA carve-out at (G)(12) covers content \"exclusively developed and delivered by the APTA or APTA academies and sections\" — chapters are conspicuously absent, and TPTA is a chapter. ORC 4755.52(C) lets the section recognize CE approved by another state's licensing AGENCY, but that is discretionary, there is no published list, and TPTA is a private association rather than an agency. The practical path is submitting each course to OPTA for an Ohio approval number (ceapps@ohiopt.org).",
    boardName: "Ohio Occupational Therapy, Physical Therapy, and Athletic Trainers Board (Physical Therapy Section)",
    sourceUrl: "https://otptat.ohio.gov/physical-therapy/continuing-education",
    lastVerified: "2026-08-04",
  },
  {
    state: "Oklahoma", stateCode: "OK", slug: "oklahoma", discipline: "pt",
    requirementType: "hours", contactHours: 20, cycleYears: 2,
    summary: "Oklahoma physical therapists must complete 20 contact hours of continuing education every 2 years.",
    details: "UNVERIFIED DRAFT. verify current hours, cycle, PTA figure, mandatory topics, any cap on online/self-paced hours, and — most important — whether the board accepts CE approved by another state's PT board or APTA chapter (our courses carry a TPTA/CCAP approval).",
    acceptsNationalAccreditation: false,
    boardName: "Oklahoma Board of Medical Licensure and Supervision",
    sourceUrl: "https://www.okmedicalboard.org/physical_therapist",
    lastVerified: null,
  },
  {
    state: "Oregon", stateCode: "OR", slug: "oregon", discipline: "pt",
    requirementType: "hours", contactHours: 24, cycleYears: 2,
    summary: "Oregon physical therapists must complete 24 contact hours of continuing education every 2 years.",
    details: "UNVERIFIED DRAFT. verify current hours, cycle, PTA figure, mandatory topics, any cap on online/self-paced hours, and — most important — whether the board accepts CE approved by another state's PT board or APTA chapter (our courses carry a TPTA/CCAP approval).",
    acceptsNationalAccreditation: false,
    boardName: "Oregon Physical Therapist Licensing Board",
    sourceUrl: "https://www.oregon.gov/ptlb/",
    lastVerified: null,
  },
  // HOLD RESOLVED IN SUBSTANCE — lastVerified stays null for one last glance.
  // Batch-1's blocker (a possible unread 2022-2025 amendment) is closed: §40.67 and
  // §40.192 were both amended July 3, 2025, effective July 5, 2025 — 55 Pa.B. 4542.
  // The official pacodeandbulletin.gov display (current through Feb 2026) confirms the
  // post-amendment (a)(1) text: 30 hours biennial + 2 law/ethics + 2 child abuse.
  // REMAINING GLANCE ITEM: the full section text was read via the Cornell LII mirror,
  // whose amendment notes stop at the 2021 amendment — so its subsection (d) could in
  // theory predate 7/5/2025. Skim 55 Pa.B. 4542 (Pennsylvania Bulletin, July 5, 2025
  // issue, at pacodeandbulletin.gov — robots-blocked to tools, fine in a browser) and
  // confirm TWO things in the one read, since BOTH sections were amended that same day:
  //   (1) §40.67(d)(1)(i)(A)/(H) — the preapproved-provider list (the TPTA basis) — is
  //       unchanged; and
  //   (2) §40.192's PTA mandates survived — specifically the PTA-only 4-hour emergency
  //       health conditions requirement in the topics below.
  // Then flip lastVerified.
  {
    state: "Pennsylvania", stateCode: "PA", slug: "pennsylvania", discipline: "pt",
    requirementType: "hours", contactHours: 30, cycleYears: 2,
    summary: "Pennsylvania PTs and PTAs must complete 30 contact hours of continuing education each biennial renewal period.",
    details: "There is no cap on online or distance learning. New licensees are exempt during the biennium in which they were first licensed. Holders of a Direct Access certificate must take 10 of the 30 hours in evaluative procedures for treating without a referral (§40.63). No contact hour may satisfy the law/ethics requirement in more than one biennium. The Act 31 child abuse hours run on a separate approval track — the provider must appear on the Commonwealth's DHS-approved child-abuse-training list, which cannot be self-declared, though online delivery qualifies. Keep proof of completion for 5 years; the Board audits with a 30-day response window. Courses in office management or practice building do not qualify. Pennsylvania preapproves providers including APTA and its components — and any provider whose course is approved by APTA or its components — which is how Texas-board-approved (TPTA / APTA Texas) CE is accepted.",
    mandatoryTopics: [
      { topic: "Law or ethics applicable to physical therapy practice", hours: 2, frequency: "every renewal" },
      { topic: "Child abuse recognition and reporting (§ 40.208(b))", hours: 2, frequency: "every renewal" },
      { topic: "Identifying and responding to emergency health conditions (PTAs only)", hours: 4, frequency: "every renewal; counts within the 30" },
    ],
    acceptsNationalAccreditation: true,
    accreditationNote: "Our therapy courses are approved through the Texas Physical Therapy Association (APTA Texas), an APTA component. Pennsylvania preapproves providers whose courses are approved by APTA or its components (49 Pa. Code § 40.67(d)(1)(i)), which covers TPTA-approved CE.",
    boardName: "Pennsylvania State Board of Physical Therapy",
    sourceUrl: "https://www.pacodeandbulletin.gov/Display/pacode?file=%2Fsecure%2Fpacode%2Fdata%2F049%2Fchapter40%2Fs40.67.html",
    lastVerified: null, // ← flip after 55 Pa.B. 4542 confirms BOTH §40.67(d) and §40.192
  },
  {
    state: "Rhode Island", stateCode: "RI", slug: "rhode-island", discipline: "pt",
    requirementType: "hours", contactHours: 24, cycleYears: 2,
    summary: "Rhode Island physical therapists must complete 24 contact hours of continuing education every 2 years.",
    details: "UNVERIFIED DRAFT. verify current hours, cycle, PTA figure, mandatory topics, any cap on online/self-paced hours, and — most important — whether the board accepts CE approved by another state's PT board or APTA chapter (our courses carry a TPTA/CCAP approval).",
    acceptsNationalAccreditation: false,
    boardName: "Rhode Island Department of Health",
    sourceUrl: "https://health.ri.gov/licenses/detail.php?id=239",
    lastVerified: null,
  },
  {
    state: "South Carolina", stateCode: "SC", slug: "south-carolina", discipline: "pt",
    requirementType: "hours", contactHours: 30, cycleYears: 2,
    summary: "South Carolina physical therapists must complete 30 contact hours of continuing education every 2 years.",
    details: "UNVERIFIED DRAFT. verify current hours, cycle, PTA figure, mandatory topics, any cap on online/self-paced hours, and — most important — whether the board accepts CE approved by another state's PT board or APTA chapter (our courses carry a TPTA/CCAP approval).",
    acceptsNationalAccreditation: false,
    boardName: "South Carolina Board of Physical Therapy Examiners (LLR)",
    sourceUrl: "https://llr.sc.gov/pt/",
    lastVerified: null,
  },
  {
    state: "South Dakota", stateCode: "SD", slug: "south-dakota", discipline: "pt",
    requirementType: "hours", contactHours: 24, cycleYears: 2,
    summary: "South Dakota physical therapists must complete 24 contact hours of continuing education every 2 years.",
    details: "UNVERIFIED DRAFT. verify current hours, cycle, PTA figure, mandatory topics, any cap on online/self-paced hours, and — most important — whether the board accepts CE approved by another state's PT board or APTA chapter (our courses carry a TPTA/CCAP approval).",
    acceptsNationalAccreditation: false,
    boardName: "South Dakota Board of Medical and Osteopathic Examiners",
    sourceUrl: "https://sdbmoe.gov/",
    lastVerified: null,
  },
  {
    state: "Tennessee", stateCode: "TN", slug: "tennessee", discipline: "pt",
    requirementType: "hours", contactHours: 30, cycleYears: 2,
    summary: "Tennessee physical therapists must complete 30 contact hours of continuing education every 2 years.",
    details: "UNVERIFIED DRAFT. verify current hours, cycle, PTA figure, mandatory topics, any cap on online/self-paced hours, and — most important — whether the board accepts CE approved by another state's PT board or APTA chapter (our courses carry a TPTA/CCAP approval).",
    acceptsNationalAccreditation: false,
    boardName: "Tennessee Board of Physical Therapy",
    sourceUrl: "https://www.tn.gov/health/health-program-areas/health-professional-boards/pt-board.html",
    lastVerified: null,
  },
  {
    state: "Texas", stateCode: "TX", slug: "texas", discipline: "pt",
    requirementType: "hours", contactHours: 30, cycleYears: 2,
    summary: "Texas physical therapists must complete 30 continuing competence units (CCUs) every 2 years, renewing by the end of their birth month; physical therapist assistants must complete 20 CCUs.",
    mandatoryTopics: [
      { topic: "Texas jurisprudence assessment module (TX JAM)", hours: 2, frequency: "every renewal; counts within the total; $48 through FSBPT" },
      { topic: "Human trafficking prevention (HHSC-approved course)", hours: 1, frequency: "every renewal; counts within the total" },
    ],
    details: "22 TAC ch. 341. §341.2(c): 30 CCUs for PTs, 20 for PTAs each biennium. One contact hour equals 1 CCU for both live and self-study programs (§341.3(1)(B)(i)-(ii)). Renewal is biennial by the end of the licensee's birth month (§341.1(a)) and activities must be completed within the 24 months before expiration (§341.2(d)). After the mandatory jurisprudence module and human trafficking course, 27 CCUs (PT) or 17 CCUs (PTA) are open for elective coursework. There is NO cap on self-study, online, or self-paced hours and no live-hour minimum — the board's own category chart marks continuing education courses \"1 CCU per contact hour, no limit.\" Texas does cap other categories (professional membership/service 15 CCUs PT / 10 PTA; charity care 15/10), which shows the board caps deliberately and chose not to cap self-study. Licensees self-report approval numbers at renewal; there is no CE Broker equivalent. Records must be kept 4 years after the license expiration date (§341.2(e)), and CE sponsors must keep participant records 4 years (§341.3(1)(A)(vii)). The executive council audits a random sample at least quarterly with a 30-day response window (§341.2(g)) — no audit percentage is published. Note §341.3(1)(A)(v) prohibits self-promotion of products or services during a program. No first-renewal exemption or proration appears anywhere in ch. 341.",
    acceptsNationalAccreditation: true,
    accreditationNote: "Texas is the one state where our approval originates. All CE used for a Texas renewal must carry a Continuing Competence Approval Program (CCAP) approval number from the Texas Physical Therapy Association — the organization the board selected to review and approve courses (22 TAC §341.2(b), §341.3(1)(A)) — or come from a TPTA Accredited Provider. The reverse is also true and worth knowing: Texas accepts nothing on the strength of another state's board or APTA chapter approval. A course may be submitted to TPTA for approval after a licensee takes it, as long as approval lands before their renewal date.",
    boardName: "Texas Board of Physical Therapy Examiners (Executive Council of Physical Therapy and Occupational Therapy Examiners)",
    sourceUrl: "https://ptot.texas.gov/cc-ce/",
    lastVerified: "2026-08-04",
  },
  {
    state: "Utah", stateCode: "UT", slug: "utah", discipline: "pt",
    requirementType: "hours", contactHours: 40, cycleYears: 2,
    summary: "Utah physical therapists must complete 40 contact hours of continuing education every 2 years.",
    details: "UNVERIFIED DRAFT. verify current hours, cycle, PTA figure, mandatory topics, any cap on online/self-paced hours, and — most important — whether the board accepts CE approved by another state's PT board or APTA chapter (our courses carry a TPTA/CCAP approval).",
    acceptsNationalAccreditation: false,
    boardName: "Utah Physical Therapy Licensing Board (DOPL)",
    sourceUrl: "https://dopl.utah.gov/pt/",
    lastVerified: null,
  },
  {
    state: "Vermont", stateCode: "VT", slug: "vermont", discipline: "pt",
    requirementType: "hours", contactHours: 24, cycleYears: 2,
    summary: "Vermont physical therapists must complete 24 contact hours of continuing education every 2 years.",
    details: "UNVERIFIED DRAFT. verify current hours, cycle, PTA figure, mandatory topics, any cap on online/self-paced hours, and — most important — whether the board accepts CE approved by another state's PT board or APTA chapter (our courses carry a TPTA/CCAP approval).",
    acceptsNationalAccreditation: false,
    boardName: "Vermont Board of Allied Health (Office of Professional Regulation)",
    sourceUrl: "https://sos.vermont.gov/physical-therapy/",
    lastVerified: null,
  },
  {
    state: "Virginia", stateCode: "VA", slug: "virginia", discipline: "pt",
    requirementType: "hours", contactHours: 30, cycleYears: 2,
    summary: "Virginia physical therapists must complete 30 contact hours of continuing education every 2 years.",
    details: "UNVERIFIED DRAFT. verify current hours, cycle, PTA figure, mandatory topics, any cap on online/self-paced hours, and — most important — whether the board accepts CE approved by another state's PT board or APTA chapter (our courses carry a TPTA/CCAP approval). Virginia uses a Type 1 / Type 2 continued-competency structure plus an active-practice-hours element — the flat hours figure here is almost certainly the wrong shape and needs a careful read.",
    acceptsNationalAccreditation: false,
    boardName: "Virginia Board of Physical Therapy",
    sourceUrl: "https://www.dhp.virginia.gov/Boards/PhysicalTherapy/",
    lastVerified: null,
  },
  {
    state: "Washington", stateCode: "WA", slug: "washington", discipline: "pt",
    requirementType: "hours", contactHours: 30, cycleYears: 2,
    summary: "Washington physical therapists must complete 30 contact hours of continuing education every 2 years.",
    details: "UNVERIFIED DRAFT. verify current hours, cycle, PTA figure, mandatory topics, any cap on online/self-paced hours, and — most important — whether the board accepts CE approved by another state's PT board or APTA chapter (our courses carry a TPTA/CCAP approval).",
    acceptsNationalAccreditation: false,
    boardName: "Washington State Physical Therapy Board (DOH)",
    sourceUrl: "https://doh.wa.gov/licenses-permits-and-certificates/professions-new-renew-or-update/physical-therapist",
    lastVerified: null,
  },
  {
    state: "West Virginia", stateCode: "WV", slug: "west-virginia", discipline: "pt",
    requirementType: "hours", contactHours: 24, cycleYears: 2,
    summary: "West Virginia physical therapists must complete 24 contact hours of continuing education every 2 years.",
    details: "UNVERIFIED DRAFT. verify current hours, cycle, PTA figure, mandatory topics, any cap on online/self-paced hours, and — most important — whether the board accepts CE approved by another state's PT board or APTA chapter (our courses carry a TPTA/CCAP approval).",
    acceptsNationalAccreditation: false,
    boardName: "West Virginia Board of Physical Therapy",
    sourceUrl: "https://wvbopt.com/",
    lastVerified: null,
  },
  {
    state: "Wisconsin", stateCode: "WI", slug: "wisconsin", discipline: "pt",
    requirementType: "hours", contactHours: 30, cycleYears: 2,
    summary: "Wisconsin physical therapists must complete 30 contact hours of continuing education every 2 years.",
    details: "UNVERIFIED DRAFT. verify current hours, cycle, PTA figure, mandatory topics, any cap on online/self-paced hours, and — most important — whether the board accepts CE approved by another state's PT board or APTA chapter (our courses carry a TPTA/CCAP approval).",
    acceptsNationalAccreditation: false,
    boardName: "Wisconsin Physical Therapy Examining Board",
    sourceUrl: "https://dsps.wi.gov/Pages/Professions/PhysicalTherapist/Default.aspx",
    lastVerified: null,
  },
  {
    state: "Wyoming", stateCode: "WY", slug: "wyoming", discipline: "pt",
    requirementType: "hours", contactHours: 20, cycleYears: 2,
    summary: "Wyoming physical therapists must complete 20 contact hours of continuing education every 2 years.",
    details: "UNVERIFIED DRAFT. verify current hours, cycle, PTA figure, mandatory topics, any cap on online/self-paced hours, and — most important — whether the board accepts CE approved by another state's PT board or APTA chapter (our courses carry a TPTA/CCAP approval).",
    acceptsNationalAccreditation: false,
    boardName: "Wyoming Board of Physical Therapy",
    sourceUrl: "https://health.wyo.gov/aging/hls/pt/",
    lastVerified: null,
  },
  {
    state: "Washington, D.C.", stateCode: "DC", slug: "washington-dc", discipline: "pt",
    requirementType: "hours", contactHours: 30, cycleYears: 2,
    summary: "Washington, D.C. physical therapists must complete 30 contact hours of continuing education every 2 years.",
    details: "UNVERIFIED DRAFT. verify current hours, cycle, PTA figure, mandatory topics, any cap on online/self-paced hours, and — most important — whether the board accepts CE approved by another state's PT board or APTA chapter (our courses carry a TPTA/CCAP approval).",
    acceptsNationalAccreditation: false,
    boardName: "District of Columbia Board of Physical Therapy",
    sourceUrl: "https://dchealth.dc.gov/service/physical-therapy-licensing",
    lastVerified: null,
  },
];
