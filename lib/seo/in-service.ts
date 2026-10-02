/**
 * In-service SEO pages (rep-side organic acquisition).
 * Routes: /in-service-ideas (hub) and /in-service-ideas/[audience] (spokes).
 *
 * Each topic carries a `match` string — a lowercase substring of a real
 * course name in the courses table. The page looks up the live course and
 * shows its name + hours. If a course is renamed or removed, the topic still
 * renders (just without the course badge), so nothing breaks.
 *
 * ACCURACY RULES (keep these when editing):
 *  - Never say the rep's in-service itself earns CE credit. The credit comes
 *    from the companion online course from H.I.S. Cornerstone.
 *  - Accreditation claims stay within standing policy (ANCC; ASWB ACE #2082,
 *    not NY; Texas board approval for PT/OT/SLP).
 *  - No "earns referrals" language on these pages — education framing only.
 */
import type { Faq } from "@/lib/seo/landing";

export type InServiceTopic = { match: string; title: string; why: string };

export type InServiceAudience = {
  slug: string; // path segment under /in-service-ideas
  cardLabel: string; // short label for cross-links
  title: string; // <title>, <= 60 chars
  description: string; // meta description, ~150-160 chars
  h1: string;
  subhead: string;
  intro: string[];
  topicsHeading: string;
  topics: InServiceTopic[];
  tip: { heading: string; body: string };
  faqs: Faq[];
};

export type InServiceCategory = { heading: string; blurb: string; topics: InServiceTopic[] };

/** Professions to pull live courses for (course_professions labels). */
export const IN_SERVICE_PROFESSIONS = ["Nursing", "Social Work", "Case Management", "Case Mgmt"];

/* ------------------------------------------------------------------ */
/* Shared copy                                                         */
/* ------------------------------------------------------------------ */

export const SHARED_FAQS: Faq[] = [
  {
    q: "Does the in-service itself earn CE credit?",
    a: "No. The presentation is yours, and it stays educational. The CE credit comes from the accredited online course paired with it — provided by H.I.S. Cornerstone Continuing Education — which each professional completes on their own time and gets a certificate for. That keeps the education independent and the accreditation clean.",
  },
  {
    q: "How do attendees get the CE course?",
    a: "The presenter sponsors it through Pulse. Print the course QR flyer and put it on the table — each attendee who scans gets the course by email. Or collect a sign-in sheet and bulk-send the course afterward. Professionals complete it online and receive a certificate as soon as they finish.",
  },
  {
    q: "What does it cost?",
    a: "Nothing for the professional. The sponsoring rep pays $15 per credit hour, billed only when someone actually opens the course, and every rep's first opened course is free. There is no subscription and no credit card to sign up.",
  },
];

export const RUN_STEPS: { title: string; body: string }[] = [
  {
    title: "Ask what's on fire this month",
    body: "Call the staff development coordinator, director of nursing, or department director and offer two or three topics. The one they pick tells you what the team is struggling with right now.",
  },
  {
    title: "Keep it educational",
    body: "Plan 20–30 minutes of practical content and no pitch. Your brochure can sit by the door. Staff remember the presenter who taught them something useful.",
  },
  {
    title: "Pair it with an accredited course",
    body: "In Pulse, pick the accredited course on the same topic. Licensed attendees leave with contact hours toward their license renewal, not just a handout.",
  },
  {
    title: "Put the QR flyer on the table",
    body: "Print the course QR flyer from your dashboard. Attendees scan, and the course arrives in their inbox with your name and company on it. Missed someone? Send it to the sign-in sheet afterward.",
  },
  {
    title: "Follow up when they open it",
    body: "Your dashboard shows who opened the course and when. A short check-in a few days later lands while the session is still fresh.",
  },
];

/* ------------------------------------------------------------------ */
/* Hub                                                                 */
/* ------------------------------------------------------------------ */

export const HUB = {
  slug: "in-service-ideas",
  title: "30+ In-Service Topics for Healthcare Staff (With CE) | Pulse",
  description:
    "In-service ideas for nursing homes, case managers, assisted living, hospice, and home health, each paired with an accredited CE course for license renewal.",
  h1: "In-Service Topics for Healthcare Staff — With Accredited CE Attached",
  subhead:
    "Topic ideas nurses, social workers, and case managers actually show up for, each matched to an accredited online course they can use toward license renewal.",
  intro: [
    "The hardest part of an in-service isn't the presentation — it's getting a room of busy staff to care. The topics below are the ones facility educators keep asking for: dementia behaviors, falls, transitions of care, end-of-life conversations, ethics. Each one is matched to an accredited online CE course from H.I.S. Cornerstone Continuing Education, so licensed attendees leave with contact hours, not just a handout.",
    "Whether you're a hospice or home health liaison presenting to a referral partner or a staff development coordinator planning the month's education, use this list to pick a topic, then pair it with the course.",
  ],
  faqs: [
    {
      q: "What makes a good in-service topic?",
      a: "Narrow, practical, and tied to something staff are dealing with this month. 'Responding to dementia behaviors at mealtime' beats 'Dementia overview.' Topics that line up with required training — abuse prevention, resident rights, dementia management in nursing homes — are the easiest to get on the calendar.",
    },
    {
      q: "How long should an in-service be?",
      a: "20–30 minutes for a shift-change or department-huddle slot, up to an hour for a scheduled education day. Shorter sessions get better attendance; the accredited course carries the depth.",
    },
    ...SHARED_FAQS,
    {
      q: "I'm a staff educator, not a rep. Can my staff take these courses?",
      a: "Yes. Licensed staff can create a free Pulse account, browse the catalog, and request the courses they need. Local healthcare sponsors cover the cost, so it's free for your team.",
    },
  ] as Faq[],
  categories: [
    {
      heading: "Dementia & Alzheimer's",
      blurb: "The most-requested subject in senior care. Run these as a series rather than one overview.",
      topics: [
        { match: "dementia and behaviors", title: "Responding to dementia behaviors", why: "Staff face behaviors every shift; a practical framework is the most useful thing you can teach." },
        { match: "keep the ball going", title: "Communicating through every stage of dementia", why: "Simple communication techniques staff can use the same afternoon." },
        { match: "take one bite at a time", title: "Mealtime and dining with dementia", why: "Weight loss and refusals at meals are a constant worry in memory care." },
        { match: "music, memory", title: "Music, memory, and dementia", why: "Low-cost, high-impact engagement ideas — an easy, upbeat session." },
        { match: "disease: the latest research", title: "What's new in Alzheimer's prevention and treatment", why: "A research update that works well for nurse- and social-worker-heavy audiences." },
      ],
    },
    {
      heading: "End-of-life, hospice & palliative care",
      blurb: "Conversations staff handle constantly with little training.",
      topics: [
        { match: "palliative and hospice care", title: "Helping patients navigate end-of-life decisions", why: "Clarifies palliative vs. hospice care for staff who field family questions." },
        { match: "advance care planning", title: "Advance care planning and ethical end-of-life issues", why: "Directly useful for anyone who has to start the goals-of-care conversation." },
        { match: "always good news", title: "Delivering bad news through crucial conversations", why: "Nurses deliver hard news on every shift; few were ever taught how." },
        { match: "good grief", title: "Helping families cope after a loss", why: "Gives staff language for the family meeting after a death." },
        { match: "pediatric palliative", title: "Pediatric palliative care team roles", why: "A strong fit for hospital and pediatric audiences." },
      ],
    },
    {
      heading: "Falls, safety & rehab",
      blurb: "The safety topics every unit tracks.",
      topics: [
        { match: "senior falls", title: "Senior falls: risk, prevention, and cost", why: "Falls are tracked everywhere — this one gets booked fast." },
        { match: "think fast", title: "Stroke recognition and rehabilitation essentials", why: "A quick, memorable refresher on stroke response." },
        { match: "stroke to strength", title: "Unlocking stroke recovery potential", why: "Pairs well with rehab and home health audiences." },
        { match: "when a wound is not just a wound", title: "Recognizing common chronic wounds", why: "Wound red flags are a daily concern in SNFs and home care." },
        { match: "hydration and the elderly", title: "Hydration and older adults", why: "Simple, practical, and tied to falls, UTIs, and confusion." },
        { match: "healing from the inside out", title: "Nutrition for rehabilitation", why: "Connects nutrition to recovery outcomes staff care about." },
      ],
    },
    {
      heading: "Transitions of care & readmissions",
      blurb: "What hospital case management departments are measured on.",
      topics: [
        { match: "hospital to home", title: "Hospital to home: a successful transition", why: "Speaks directly to discharge planners and home health teams." },
        { match: "transitions of care", title: "Matching patients to the right care setting", why: "Helps staff understand when each level of care fits." },
        { match: "chronic disease management", title: "The case manager's role in preventing rehospitalizations", why: "Ties directly to readmission goals." },
        { match: "caregiver stress on hospital", title: "Caregiver stress and hospital readmissions", why: "A factor in readmissions that often goes unaddressed." },
        { match: "health literacy", title: "Health literacy: do patients understand their plan?", why: "A root cause behind missed follow-ups and medication errors." },
      ],
    },
    {
      heading: "Ethics & resident rights",
      blurb: "Required-training topics that also satisfy ethics CE requirements.",
      topics: [
        { match: "developing dignified care", title: "Preventing abuse and neglect of older adults", why: "Abuse and neglect prevention is required training in nursing homes." },
        { match: "staying on track", title: "Protecting elderly patient rights", why: "Resident rights training is a nursing home requirement too." },
        { match: "substance abuse in the elderly", title: "Substance use in older adults", why: "A hidden problem staff rarely get trained on." },
        { match: "mental health and the elderly", title: "Mental health in older adults: a team approach", why: "Strong fit for social workers and interdisciplinary teams." },
        { match: "human trafficking", title: "Identifying and responding to human trafficking", why: "Some states require it for license renewal — check your audience's state." },
      ],
    },
    {
      heading: "Communication, teamwork & staff wellbeing",
      blurb: "Topics for the whole team, not just one discipline.",
      topics: [
        { match: "finding common ground", title: "Conflict management in healthcare", why: "Every team has friction; practical tools are always welcome." },
        { match: "art of active listening", title: "Active listening with patients", why: "Short, practical, and useful to every discipline." },
        { match: "generational differences", title: "Bridging generational differences on the team", why: "A reliable favorite for mixed-age staff." },
        { match: "motivational interviewing", title: "Motivational interviewing basics", why: "Helps staff get patients to follow through on care plans." },
        { match: "mindfulness in medicine", title: "Mindfulness for patient care", why: "A lighter session that still carries contact hours." },
      ],
    },
  ] as InServiceCategory[],
};

/* ------------------------------------------------------------------ */
/* Spokes                                                              */
/* ------------------------------------------------------------------ */

export const AUDIENCES: InServiceAudience[] = [
  {
    slug: "nursing-homes",
    cardLabel: "Nursing homes & SNFs",
    title: "In-Service Topics for Nursing Home Staff (With CE) | Pulse",
    description:
      "Nursing home in-service ideas — dementia, falls, abuse prevention, wounds, hydration — each paired with an accredited CE course for licensed staff.",
    h1: "In-Service Topics for Nursing Home & SNF Staff",
    subhead:
      "Topics that line up with what skilled nursing staff already have to train on — each paired with an accredited CE course for licensed nurses and social workers.",
    intro: [
      "Nursing homes run on in-services. Federal rules require ongoing training for nursing home staff — including abuse, neglect, and exploitation prevention for all staff, and at least 12 hours a year of in-service education for nurse aides that covers dementia management and abuse prevention (42 CFR §483.95). The staff development coordinator is always looking for good topics and good presenters.",
      "For hospice, home health, and rehab liaisons, that's the opening. Bring a topic the building needs, keep it educational, and leave every licensed nurse and social worker in the room with an accredited CE course on the same subject.",
    ],
    topicsHeading: "Topics nursing home staff ask for",
    topics: [
      { match: "dementia and behaviors", title: "Responding to dementia behaviors", why: "Lines up with required dementia management training and helps on every shift." },
      { match: "developing dignified care", title: "Preventing abuse and neglect of older adults", why: "Abuse, neglect, and exploitation prevention is required training for all nursing home staff." },
      { match: "staying on track", title: "Protecting resident rights", why: "Resident rights is another federally required training area." },
      { match: "senior falls", title: "Senior falls: prevention and cost", why: "Falls are tracked closely in every building — this topic gets booked fast." },
      { match: "when a wound is not just a wound", title: "Recognizing common chronic wounds", why: "Early wound recognition matters to every nurse on the floor." },
      { match: "hydration and the elderly", title: "Hydration and older adults", why: "Practical and tied to falls, infections, and confusion." },
      { match: "take one bite at a time", title: "Mealtime with dementia", why: "Weight loss and meal refusals are a constant concern." },
      { match: "sleeping well as we age", title: "Sleep and older adults", why: "Helps staff address nighttime wandering and daytime fatigue." },
      { match: "music, memory", title: "Music, memory, and dementia", why: "An upbeat session with ideas staff can try that week." },
    ],
    tip: {
      heading: "Who to call",
      body: "Ask for the staff development coordinator or director of nursing, not the front desk. Offer two or three topics and let them pick. Ask whether a slot near shift change works — it can catch two shifts at once.",
    },
    faqs: [
      {
        q: "What are nursing homes required to train staff on?",
        a: "Federal requirements (42 CFR §483.95) cover areas including communication, resident rights, abuse/neglect/exploitation prevention, infection control, compliance and ethics, and — for nurse aides — at least 12 hours of annual in-service that includes dementia management and abuse prevention. Many states add their own. Topics that line up with these requirements are the easiest to schedule.",
      },
      {
        q: "Do these courses count toward CNA in-service hours?",
        a: "The courses are accredited for licensed professionals — ANCC contact hours for nurses and ASWB ACE approval (provider #2082) for social workers. Whether a course also counts toward a nurse aide's annual in-service hours is up to the facility's training program and state rules, so check with the staff development coordinator.",
      },
      ...SHARED_FAQS,
    ],
  },
  {
    slug: "case-managers",
    cardLabel: "Hospital case managers",
    title: "In-Service Ideas for Hospital Case Managers | Pulse",
    description:
      "In-service topics for hospital case managers and discharge planners — transitions of care, readmissions, advance care planning — each paired with accredited CE.",
    h1: "In-Service Ideas for Hospital Case Managers & Discharge Planners",
    subhead:
      "Topics built around what case management departments own — readmissions, safe discharges, and hard conversations — each paired with an accredited CE course.",
    intro: [
      "Case managers and discharge planners decide where patients go next, which makes them some of the most-called-on people in the hospital — and some of the hardest to get time with. A useful in-service at the department meeting earns a kind of attention a drop-in visit never will.",
      "The topics that land are tied to what the department is measured on: readmissions, length of stay, and discharges that hold. Pair each with an accredited course so the case managers and social workers in the room earn contact hours toward their license or certification.",
    ],
    topicsHeading: "Topics case management teams want",
    topics: [
      { match: "hospital to home", title: "Hospital to home: a successful transition", why: "The core of a discharge planner's job, from the receiving side." },
      { match: "transitions of care", title: "Matching patients to the right care setting", why: "Helps the team weigh home health, SNF, hospice, and other options." },
      { match: "chronic disease management", title: "The case manager's role in preventing rehospitalizations", why: "Ties straight to readmission goals." },
      { match: "caregiver stress on hospital", title: "Caregiver stress and readmissions", why: "An overlooked driver of bounce-backs." },
      { match: "health literacy", title: "Health literacy and the discharge plan", why: "Patients who don't understand the plan come back." },
      { match: "palliative and hospice care", title: "Helping patients navigate end-of-life decisions", why: "Clarifies palliative vs. hospice care for the team making the referral." },
      { match: "advance care planning", title: "Advance care planning and ethical end-of-life issues", why: "Supports goals-of-care conversations before discharge." },
      { match: "long-term care insurance", title: "Long-term care insurance basics", why: "Families ask case managers about coverage constantly." },
      { match: "motivational interviewing", title: "Motivational interviewing", why: "Helps patients commit to follow-up care after they leave." },
    ],
    tip: {
      heading: "Get on the department meeting",
      body: "Most case management departments hold a regular huddle or staff meeting. Ask the director for 20 minutes on that agenda instead of a separate event — attendance is built in, and the director sees you as a resource.",
    },
    faqs: [
      {
        q: "Do these courses count toward CCM recertification?",
        a: "Courses are ANCC-accredited, and CCM and ACM certificants can typically apply ANCC-accredited CE toward recertification. Rules vary, so confirm accepted CE types with the CCMC or your certifying body before relying on a course.",
      },
      {
        q: "Can the social workers in the department use these courses?",
        a: "Yes, for courses approved for social work. Those carry H.I.S. Cornerstone's ASWB ACE approval (provider #2082), which most state social work boards recognize. New York does not accept ASWB ACE approval.",
      },
      ...SHARED_FAQS,
    ],
  },
  {
    slug: "assisted-living",
    cardLabel: "Assisted living & memory care",
    title: "In-Service Topics for Assisted Living Staff (With CE) | Pulse",
    description:
      "Assisted living in-service ideas — aging in place, dementia communication, resident independence, hydration — each paired with an accredited CE course.",
    h1: "In-Service Topics for Assisted Living & Memory Care Staff",
    subhead:
      "Resident-centered topics assisted living teams can use the next day — each paired with an accredited CE course for the nurses and social workers on staff.",
    intro: [
      "In assisted living and memory care, the wellness director and executive director are usually the ones who notice a resident declining and talk with the family about what comes next. Being the presenter they trust matters.",
      "Most assisted living staff are caregivers rather than licensed clinicians, so the best in-services are practical: what to do, what to watch for, what to say to families. The licensed nurses in the building — often the wellness or health services director — can earn accredited CE on the same topic.",
    ],
    topicsHeading: "Topics assisted living teams ask for",
    topics: [
      { match: "aging in place", title: "Aging in place", why: "The whole philosophy of assisted living, made practical." },
      { match: "promoting senior independence", title: "Promoting resident independence", why: "Helps staff support residents without doing everything for them." },
      { match: "keep the ball going", title: "Communicating through every stage of dementia", why: "The most useful skill in memory care." },
      { match: "reminiscence therapy", title: "Reminiscence therapy and life review", why: "Engagement ideas staff can use in activities right away." },
      { match: "pet therapy", title: "The benefits of pet therapy", why: "A popular, upbeat session." },
      { match: "hydration and the elderly", title: "Hydration and older adults", why: "Simple prevention that reduces falls and confusion." },
      { match: "caregiver personality types", title: "Caregiver personality types", why: "Helps staff work with each other and with families." },
      { match: "caregiving for seniors during the holidays", title: "Caregiving during the holidays", why: "A timely Q4 topic that also works for family nights." },
      { match: "catch the wave", title: "Exceptional customer service in senior care", why: "Executive directors love this one for resident and family satisfaction." },
    ],
    tip: {
      heading: "Bring something for families too",
      body: "Ask whether you can follow the staff in-service with a short family night on the same subject — caregiver guilt and dementia communication are favorites. You meet the people on both sides of the decision.",
    },
    faqs: [
      {
        q: "Can non-licensed caregivers use these courses?",
        a: "Anyone can learn from them, but the accreditation is for licensed professionals — nurses (ANCC contact hours), social workers (ASWB ACE), and some therapy disciplines. For caregivers, the in-service itself is the training; check your state's assisted living rules for what counts toward required hours.",
      },
      {
        q: "Which dementia topics work best in memory care?",
        a: "Communication and behaviors first, because staff use them every shift. Dementia communication, dementia behaviors, and mealtime with dementia are all practical and pair with accredited courses.",
      },
      ...SHARED_FAQS,
    ],
  },
  {
    slug: "hospice",
    cardLabel: "Hospice liaisons",
    title: "Hospice In-Service Topics for Referral Partners | Pulse",
    description:
      "Hospice in-service ideas for liaisons — end-of-life conversations, advance care planning, grief, dementia at end of life — each paired with accredited CE.",
    h1: "Hospice In-Service Topics Facility Staff Actually Want",
    subhead:
      "For hospice liaisons and community educators: end-of-life topics facility staff find useful, each paired with an accredited CE course.",
    intro: [
      "The default hospice in-service is eligibility 101, and facility staff have sat through it many times. It's also the one most easily read as a sales pitch. The in-services that get you invited back teach something staff struggle with: the family meeting that goes sideways, the resident with dementia who is declining slowly, the nurse who has to deliver bad news on night shift.",
      "Those topics build trust and raise end-of-life care naturally. Pair each with an accredited course, and the nurses, social workers, and case managers in the room get contact hours from an independent accredited provider — not from your brochure.",
    ],
    topicsHeading: "End-of-life topics that land",
    topics: [
      { match: "palliative and hospice care", title: "Helping patients navigate end-of-life decisions", why: "Clarifies palliative vs. hospice care for staff fielding family questions." },
      { match: "advance care planning", title: "Advance care planning and ethical end-of-life issues", why: "The conversation every SNF and hospital team has to start." },
      { match: "always good news", title: "Delivering bad news through crucial conversations", why: "Most nurses were never taught how — and they do it constantly." },
      { match: "good grief", title: "Helping families cope after a loss", why: "Gives staff language for the hardest family meetings." },
      { match: "ethical issues with alzheimer", title: "End-of-life considerations in Alzheimer's disease", why: "A perfect fit for memory care and long-term care audiences." },
      { match: "pediatric palliative", title: "Pediatric palliative care team roles", why: "For pediatric hospital and specialty audiences." },
      { match: "caregiver guilt", title: "Caregiver guilt", why: "Works for staff and as a family-night companion session." },
      { match: "mental health and the elderly", title: "Mental health in older adults: a team approach", why: "Strong for social workers and interdisciplinary teams." },
    ],
    tip: {
      heading: "Keep eligibility out of the slides",
      body: "If staff want eligibility criteria, leave a one-page handout and offer to answer questions afterward. The in-service should stand on its own as education — that's what gets you invited back, and it keeps the session clearly educational.",
    },
    faqs: [
      {
        q: "What's a good hospice in-service topic for nursing homes?",
        a: "Advance care planning and end-of-life conversations consistently land, because SNF staff handle them constantly with little training. Dementia at end of life is a close second in memory care settings.",
      },
      {
        q: "Can I cover hospice eligibility in the same session?",
        a: "Keep it separate from the accredited course. The CE course stands on its own from an independent accredited provider; your eligibility material is yours. Check your organization's compliance guidance on what to include in facility presentations.",
      },
      ...SHARED_FAQS,
    ],
  },
  {
    slug: "home-health",
    cardLabel: "Home health liaisons",
    title: "Home Health In-Service Ideas for Referral Partners | Pulse",
    description:
      "Home health in-service ideas — falls, stroke recovery, safe transitions home, wounds, driving safety — each paired with an accredited CE course.",
    h1: "Home Health In-Service Ideas for Referral Partners",
    subhead:
      "Topics about getting patients home and keeping them there — for home health liaisons presenting to hospitals, physician offices, and senior living.",
    intro: [
      "Behind most home health referrals is one question: will this patient be safe at home? In-services that help staff answer it — fall risk, stroke recovery, wound red flags, when an older driver should stop — put your agency where that decision gets made.",
      "These topics also work in physician offices and senior living, where staff see patients between hospital stays. Pair each with an accredited course so licensed staff walk away with contact hours.",
    ],
    topicsHeading: "Topics that fit home health",
    topics: [
      { match: "hospital to home", title: "Hospital to home: a successful transition", why: "Exactly the handoff home health owns." },
      { match: "senior falls", title: "Senior falls: prevention and cost", why: "The number-one safety question for patients going home." },
      { match: "stroke to strength", title: "Unlocking stroke recovery potential", why: "Shows what recovery at home can look like." },
      { match: "think fast", title: "Stroke recognition and rehabilitation essentials", why: "A fast, memorable refresher." },
      { match: "when a wound is not just a wound", title: "Recognizing common chronic wounds", why: "Wound care is a core home health service." },
      { match: "behind the wheel", title: "Older drivers: to drive or not to drive?", why: "A question families bring to every discipline." },
      { match: "healing from the inside out", title: "Nutrition for rehabilitation", why: "Connects nutrition to recovery at home." },
      { match: "traumatic brain injury", title: "Traumatic brain injury overview", why: "Useful for rehab and neuro-focused audiences." },
      { match: "aging in place", title: "Aging in place", why: "Fits senior living and community audiences." },
    ],
    tip: {
      heading: "Physician offices: go short",
      body: "Office staff rarely get an hour. Offer a 15-minute lunch-hour version and leave the QR flyer for the accredited course — the nurses who can't stay can scan it later.",
    },
    faqs: [
      {
        q: "Who should attend a home health in-service at a hospital?",
        a: "Case managers, discharge planners, and floor nurses — the people deciding who needs services at home. A 20-minute slot at a case management huddle usually beats a standalone event.",
      },
      {
        q: "Do therapists get CE credit too?",
        a: "Some courses are approved for PT, OT, and SLP. H.I.S. Cornerstone holds Texas board approval for those disciplines; acceptance in other states depends on each board's rules. See the Accreditation page for details.",
      },
      ...SHARED_FAQS,
    ],
  },
  {
    slug: "dementia",
    cardLabel: "Dementia topics",
    title: "Dementia In-Service Topics for Healthcare Staff | Pulse",
    description:
      "Dementia in-service ideas — behaviors, communication, dining, music and memory, end-of-life — each paired with an accredited CE course for licensed staff.",
    h1: "Dementia In-Service Topics for Healthcare Staff",
    subhead:
      "The most-requested in-service subject in senior care, broken into practical topics — each paired with an accredited CE course.",
    intro: [
      "Dementia care is the subject facility educators ask for most, because it touches every shift. Nursing homes must include dementia management in nurse aides' annual in-service training, and memory care communities live it daily.",
      "One broad dementia overview won't hold a room. Pick one narrow, practical topic per in-service — behaviors, communication, mealtime — and run them as a series. Each pairs with an accredited course, so licensed staff earn contact hours every time you come back.",
    ],
    topicsHeading: "Dementia topics to run as a series",
    topics: [
      { match: "dementia and behaviors", title: "Responding to dementia behaviors", why: "Start here — it's what staff struggle with most." },
      { match: "keep the ball going", title: "Communicating through every stage of dementia", why: "Techniques staff can use the same day." },
      { match: "take one bite at a time", title: "Mealtime and dining with dementia", why: "Addresses weight loss and refusals at meals." },
      { match: "music, memory", title: "Music, memory, and dementia", why: "An upbeat session with easy engagement ideas." },
      { match: "a day in the life of an alzheimer", title: "A day in the life of a person with Alzheimer's", why: "Builds empathy and practical activity modifications." },
      { match: "disease: the latest research", title: "What's new in Alzheimer's research", why: "Best for nurse- and social-worker-heavy audiences." },
      { match: "ethical issues with alzheimer", title: "End-of-life considerations in Alzheimer's disease", why: "Bridges dementia care and end-of-life planning." },
      { match: "everything i wish", title: "Caring for a loved one with dementia", why: "A two-hour course — good for a longer education day or family night." },
      { match: "caregiver guilt", title: "Caregiver guilt", why: "Resonates with staff and family caregivers alike." },
    ],
    tip: {
      heading: "Run it as a series",
      body: "Offer a monthly dementia series instead of one session. Each visit brings a new topic, a new accredited course, and a new reason to be in the building — and staff start expecting you.",
    },
    faqs: [
      {
        q: "How often do nursing homes need dementia training?",
        a: "Federal rules require nurse aides to receive at least 12 hours of in-service training each year, including dementia management (42 CFR §483.95(g)). Many states add requirements for memory care staff, which makes dementia topics among the easiest in-services to schedule.",
      },
      {
        q: "Which dementia topics fit a 30-minute in-service?",
        a: "Behaviors, communication, and mealtime are practical and fit in 30 minutes. Save research updates and end-of-life ethics for nurse- and social-worker-heavy audiences or a longer session.",
      },
      ...SHARED_FAQS,
    ],
  },
];

export function getAudience(slug: string): InServiceAudience | undefined {
  return AUDIENCES.find((a) => a.slug === slug);
}
