/**
 * CEU-sponsorship SEO pages (rep-side organic acquisition, buying intent).
 *
 * Routes:
 *   /ceu-sponsorship                 hub
 *   /ceu-sponsorship/[industry]      hospice, home-health, home-care, senior-living, rehab-hospitals
 *   /how-to-offer-ceus
 *   /lunch-and-learn-ceus
 *   /ceu-sponsorship-cost
 *
 * Each page opens with `answer`: a direct, two- or three-sentence answer to the
 * question the page targets. Search engines and AI assistants quote that block,
 * and AI assistants already send a real share of Pulse signups.
 *
 * ACCURACY RULES (keep these when editing):
 *  - Never say the rep's own presentation earns CE credit. Credit comes from
 *    the accredited online course from H.I.S. Cornerstone.
 *  - Accreditation claims stay within standing policy: ANCC (most state
 *    boards); ASWB ACE #2082 (most states, not New York); case management via
 *    the ACMA-CCMC reciprocity agreement; PT/OT/SLP through the Texas boards,
 *    other states by reciprocity only.
 *  - Price facts must match /pricing: $15 per CE credit hour, billed only when
 *    a professional opens the course, each rep's first opened course free, no
 *    platform or per-seat fees.
 *  - Education framing. No "earns referrals" or "in exchange for" language.
 *  - No competitor names or competitor prices.
 */
import type { Metadata } from "next";
import type { Faq } from "@/lib/seo/landing";

export type SponsorSection = {
  heading: string;
  body?: string[];
  bullets?: string[];
  steps?: { title: string; body: string }[];
};

export type SponsorPage = {
  path: string; // "/ceu-sponsorship/hospice"
  crumb: string; // short label for breadcrumbs and cross-links
  title: string; // <title>, about 60 chars
  description: string; // meta description, about 155 chars
  h1: string;
  answer: string; // the direct answer, shown first in a highlighted box
  intro: string[];
  sections: SponsorSection[];
  topicsFrom?: string; // in-service audience slug whose topic list to show
  topicsHeading?: string;
  faqs: Faq[];
};

export const SPONSOR_BASE = "https://pulsereferrals.com";
export const SPONSOR_HUB_PATH = "/ceu-sponsorship";
/** Bump when these pages meaningfully change (used by the sitemap). */
export const SPONSOR_LAST_MODIFIED = "2026-11-11";
/** Professions to pull live courses for (course_professions labels). */
export const SPONSOR_PROFESSIONS = ["Nursing", "Social Work", "Case Management", "Case Mgmt"];

/* ------------------------------------------------------------------ */
/* Shared answers                                                      */
/* ------------------------------------------------------------------ */

const FAQ_PRICE: Faq = {
  q: "What does it cost to sponsor a CEU?",
  a: "$15 per CE credit hour, billed only when a professional opens the course. A one-hour course is $15 and a two-hour course is $30. Sending, QR flyers and bulk sends are free, there is no subscription or per-seat fee, and each rep's first opened course is free.",
};

const FAQ_CREDIT: Faq = {
  q: "Does my presentation or lunch-and-learn earn CE credit?",
  a: "No. Your presentation stays yours. The credit comes from the accredited online course you sponsor, which each professional completes on their own time and receives a certificate for. That keeps the education independent of the sponsor.",
};

const FAQ_WHO: Faq = {
  q: "Which professionals can get credit?",
  a: "Nursing courses are ANCC-accredited, which most state boards accept. Social work courses are approved through ASWB ACE (provider #2082), which most states accept; New York is the exception. Case managers can apply the courses to ACM and CCM renewal under the ACMA and CCMC reciprocity agreement. Some courses are also approved for physical therapy, occupational therapy and speech-language pathology through the Texas boards, which other state boards may accept by reciprocity. Each professional's licensing board has the final say.",
};

const FAQ_COMPLIANCE: Faq = {
  q: "Will our compliance team allow it?",
  a: "That is their decision, so bring them in early. Pulse keeps a per-rep record of every course sponsored: who received it, when, and whether it was opened. The course is independent education from an accredited provider, and accepting one does not commit a professional to anything.",
};

const FAQ_PROVIDER: Faq = {
  q: "Who provides the courses?",
  a: "H.I.S. Cornerstone Continuing Education, an ANCC-accredited provider and ASWB ACE provider (#2082) that has served healthcare professionals since 2007.",
};

const FAQ_ACCOUNT: Faq = {
  q: "Do attendees need an account?",
  a: "No. They scan the code, enter their name and email, and the course arrives by email. They can register later if they want to keep their courses in one place.",
};

/* ------------------------------------------------------------------ */
/* Hub                                                                 */
/* ------------------------------------------------------------------ */

export const SPONSOR_HUB: SponsorPage = {
  path: SPONSOR_HUB_PATH,
  crumb: "CEU Sponsorship",
  title: "CEU Sponsorship for Healthcare Sales Teams | Pulse",
  description:
    "Sponsor accredited CEUs for the nurses, social workers and case managers you call on. $15 per CE credit hour, billed only when opened. Your first one is free.",
  h1: "Sponsor CEUs for the Nurses, Social Workers and Case Managers You Call On",
  answer:
    "CEU sponsorship means your company pays for an accredited continuing education course and a licensed professional takes it free, with your name on it as the sponsor. On Pulse it costs $15 per CE credit hour, you are billed only when the professional opens the course, and your first one is free.",
  intro: [
    "Licensed professionals need CE hours to renew, and most employers do not pay for them. Hospice, home health, senior care and rehab teams have filled that gap for years with take-home CEUs at lunch-and-learns and in-services. Pulse does the same job without order forms, coupon codes or sign-in sheets to reconcile.",
  ],
  sections: [
    {
      heading: "How CEU sponsorship works on Pulse",
      steps: [
        {
          title: "Pick a course",
          body: "Choose from more than 50 accredited online courses and filter by the discipline of the people you are sending to. Almost all of them are one credit hour.",
        },
        {
          title: "Send it, or put it on a flyer",
          body: "Email a course to one professional, bulk-send it to a sign-in sheet, or print a QR flyer for a whole room. The course arrives with your name and company on it.",
        },
        {
          title: "See who opened it",
          body: "Your dashboard shows each course you sent and whether it was opened, so you know when a follow-up call will land. Managers see the same for every rep on the team.",
        },
        {
          title: "Pay for what was used",
          body: "You get one invoice a month for the courses that were opened. A course that was sent and never opened costs nothing.",
        },
      ],
    },
    {
      heading: "What you can sponsor",
      body: [
        "The catalog covers ethics, dementia and Alzheimer's care, palliative and hospice care, care transitions, stroke and brain injury rehabilitation, fall prevention and chronic disease management. Nearly every course is approved for nurses, social workers and case managers, and more than twenty are also approved for one or more therapy disciplines.",
      ],
    },
    {
      heading: "Four ways teams use it",
      bullets: [
        "At an in-service or lunch-and-learn: put the QR flyer on the table and everyone in the room can claim the course from their phone.",
        "After a facility visit: send one course to the case manager or nurse you just met.",
        "After an event: bulk-send the course to the sign-in sheet, up to 100 people at a time.",
        "For someone who asked: the CE demand map shows professionals who have requested a course in your area and are waiting for a sponsor.",
      ],
    },
  ],
  faqs: [FAQ_PRICE, FAQ_CREDIT, FAQ_WHO, FAQ_COMPLIANCE, FAQ_PROVIDER],
};

/* ------------------------------------------------------------------ */
/* Standalone guides                                                   */
/* ------------------------------------------------------------------ */

export const SPONSOR_HOW_TO: SponsorPage = {
  path: "/how-to-offer-ceus",
  crumb: "How to offer CEUs",
  title: "How to Offer CEUs at an In-Service or Lunch-and-Learn",
  description:
    "You do not need to become an accredited provider to offer CEUs. Pair your in-service with an accredited online course and hand out a QR flyer. Here is how.",
  h1: "How to Offer CEUs at Your In-Service Without Becoming an Accredited Provider",
  answer:
    "You do not need your own accreditation to offer CEUs. You sponsor a course from a provider that is already accredited, and your attendees take that course online for credit. Your talk itself does not earn credit, and you should not tell the room that it does.",
  intro: [
    "Becoming an accredited continuing education provider means applications, fees, qualified course planners, evaluations, certificates and records kept for audit. A few national companies do all of that in-house. Everyone else offers CEUs by sponsoring courses from a provider that already holds the accreditation.",
  ],
  sections: [
    {
      heading: "The two ways to offer CEUs",
      bullets: [
        "Get your own presentation approved. An accredited provider or a licensing board reviews the session ahead of time, and you keep sign-in records and evaluations afterward. This suits a signature talk you give all year. It is slow for a one-off event.",
        "Sponsor an accredited online course. The course already carries the credit. You present on the same topic, hand out the course, and each attendee completes it later and downloads a certificate. Nothing needs approving, because you are not the education provider.",
      ],
    },
    {
      heading: "Step by step",
      steps: [
        {
          title: "Choose a topic the room asked for",
          body: "Ask the department director or staff educator what the team is dealing with this month, and offer two or three topics.",
        },
        {
          title: "Match it to a course approved for the people attending",
          body: "A mixed room of nurses, social workers and case managers needs a course approved for all three. In Pulse you can filter the catalog by discipline before you choose.",
        },
        {
          title: "Print the QR flyer",
          body: "Download the course flyer from your dashboard, with your company name on it, and put a copy on each table or at the sign-in.",
        },
        {
          title: "Describe it accurately",
          body: "Tell the room there is a free accredited course on today's topic and they can scan the code to get it. Do not say the session itself counts for credit.",
        },
        {
          title: "Follow up",
          body: "Your dashboard shows who opened the course. Anyone who missed the flyer can be sent the course by email afterward.",
        },
      ],
    },
    {
      heading: "What to say, and what not to say",
      bullets: [
        "Say: \"There is a free accredited course on this topic. Scan the code and it will be in your inbox.\"",
        "Do not say: \"This lunch counts for one CEU.\" The lunch does not. The course does.",
        "Do not promise that a particular board will accept the course. The courses are accepted by most boards for the disciplines listed, and each professional's board has the final say.",
        "People say \"CEUs\" loosely. Licensing boards count contact hours, and that is what each certificate shows.",
      ],
    },
  ],
  faqs: [
    FAQ_CREDIT,
    FAQ_ACCOUNT,
    FAQ_WHO,
    FAQ_PRICE,
    {
      q: "Can I get my own talk accredited instead?",
      a: "Sometimes. That is a separate process run by an accredited provider or a board, and it takes planning time before the event. Sponsoring an existing course is the quick route, and nothing stops you from doing both.",
    },
  ],
};

export const SPONSOR_LUNCH: SponsorPage = {
  path: "/lunch-and-learn-ceus",
  crumb: "Lunch-and-learn CEUs",
  title: "Lunch-and-Learn CEUs for Case Managers and Nurses | Pulse",
  description:
    "Add accredited CEUs to your lunch-and-learn with a QR flyer. Attendees take the course online and you pay $15 per CE credit hour only for the ones who open it.",
  h1: "CEUs for Your Lunch-and-Learn",
  answer:
    "Put a QR flyer for an accredited course on the table at your lunch-and-learn. Attendees scan it and take the course online, and you pay $15 per CE credit hour only for the people who open it. Your first one is free.",
  intro: [
    "Lunch gets people into the room. A CEU gives the licensed people in that room something they need for their renewal, and gives you a reason to follow up afterward.",
  ],
  sections: [
    {
      heading: "What it costs for a typical lunch",
      body: [
        "Say 20 people attend and 12 of them scan the flyer and open a one-hour course. That is 12 courses at $15, or $180. If your first course is still free, it is $165. The eight people who never opened it cost nothing.",
      ],
    },
    {
      heading: "Before, during and after",
      steps: [
        {
          title: "Before",
          body: "Pick a course on the same subject as your talk and download the QR flyer from your dashboard. The flyer carries your company name, and your logo if you upload one.",
        },
        {
          title: "During",
          body: "Put a flyer on each table and one at the sign-in. Mention it at the start and again at the end, when people are deciding whether to take a copy.",
        },
        {
          title: "After",
          body: "Bulk-send the course to anyone on your sign-in sheet who did not scan, then check your dashboard to see who opened it.",
        },
      ],
    },
    {
      heading: "Who in the room gets credit",
      body: [
        "Nearly every course is approved for nurses, social workers and case managers, so a typical case management department is covered by a single flyer. More than twenty courses are also approved for one or more therapy disciplines through the Texas boards, so check the course before promising credit to a therapist, especially one licensed in another state.",
      ],
    },
  ],
  topicsFrom: "case-managers",
  topicsHeading: "Topics that suit a room of case managers",
  faqs: [
    FAQ_PRICE,
    FAQ_CREDIT,
    {
      q: "What if fewer people show up than I planned for?",
      a: "It costs you nothing. You are billed only for courses that are opened, so an empty seat or an unscanned flyer is free.",
    },
    {
      q: "Do I need a sign-in sheet?",
      a: "Not for billing. Pulse records each course that is claimed and opened. Keep a sign-in sheet if your company wants one for its own records, and use it to send the course to anyone who missed the flyer.",
    },
    FAQ_ACCOUNT,
    FAQ_COMPLIANCE,
  ],
};

export const SPONSOR_COST: SponsorPage = {
  path: "/ceu-sponsorship-cost",
  crumb: "What CEU sponsorship costs",
  title: "What Does It Cost to Sponsor CEUs? Pricing Explained | Pulse",
  description:
    "CEU sponsorship pricing explained: per course, annual package or per live session. On Pulse it is $15 per CE credit hour, billed only when a course is opened.",
  h1: "What It Costs to Sponsor CEUs",
  answer:
    "On Pulse a sponsored CEU costs $15 per CE credit hour, billed only when the professional opens the course. There is no subscription, setup fee or per-seat fee, and each rep's first opened course is free.",
  intro: [
    "CE sponsorship is sold three ways: per course, as an annual package, or per live session. What you end up paying depends less on the listed price than on how many of the courses you hand out are ever used.",
  ],
  sections: [
    {
      heading: "The three pricing models",
      bullets: [
        "Per course, billed on use. You pay for a course only when someone opens it, so the cost follows what was used. This is how Pulse works.",
        "Annual packages. You pay up front for a year of coupons or a set number of events. The cost is predictable, and you pay it whether or not the courses are redeemed.",
        "Per live session. A flat fee for an accredited live presentation, sometimes with a per-person charge above a set headcount. This suits a signature event.",
      ],
    },
    {
      heading: "Worked examples at $15 per credit hour",
      bullets: [
        "One one-hour course sent to a case manager after a visit: $15, and only if they open it.",
        "A lunch-and-learn where 12 of 20 attendees open a one-hour course: $180.",
        "A two-hour course opened by 10 social workers: $300.",
        "Fifty one-hour courses sent after a conference, 30 of them opened: $450.",
      ],
    },
    {
      heading: "What is included at no charge",
      bullets: [
        "Unlimited rep accounts, with no per-seat fee.",
        "QR codes and flyers with your company name.",
        "Bulk send to a sign-in sheet.",
        "A record of every course sent and whether it was opened.",
        "A manager view of each rep's activity.",
      ],
    },
    {
      heading: "How billing works",
      body: [
        "You receive one invoice a month for the courses that were opened, addressed to your company or to each rep. No credit card is needed to sign up. Larger teams can ask about a group package through the contact page.",
      ],
    },
  ],
  faqs: [
    FAQ_PRICE,
    {
      q: "When exactly am I charged?",
      a: "Only when a professional opens the course you sent. If they never open it, you are never billed for it.",
    },
    {
      q: "Is there a minimum?",
      a: "No. One course for one professional is fine, and there is no contract.",
    },
    {
      q: "What does \"first one free\" mean?",
      a: "Each rep's first opened course is free, so everyone on your team can see the whole process work before the company spends anything.",
    },
    {
      q: "Is there volume pricing?",
      a: "Yes. Larger teams can ask about a group package through the contact page.",
    },
  ],
};

/* ------------------------------------------------------------------ */
/* Industry spokes                                                     */
/* ------------------------------------------------------------------ */

export type SponsorIndustry = SponsorPage & { slug: string; cardLabel: string };

export const SPONSOR_INDUSTRIES: SponsorIndustry[] = [
  {
    slug: "hospice",
    cardLabel: "Hospice",
    path: `${SPONSOR_HUB_PATH}/hospice`,
    crumb: "Hospice",
    title: "CEU Sponsorship for Hospice Liaisons and Marketers | Pulse",
    description:
      "Hospice liaisons: sponsor accredited CEUs on end-of-life care for case managers, social workers and facility nurses. $15 per CE credit hour, billed when opened.",
    h1: "CEU Sponsorship for Hospice Liaisons",
    answer:
      "Hospice liaisons use sponsored CEUs to bring real education to the case managers, social workers and facility nurses they work with. On Pulse you pick an accredited course on end-of-life care, hand it out by QR flyer or email, and pay $15 per CE credit hour only when it is opened.",
    intro: [
      "Most of the people a hospice liaison calls on are licensed, and many of them field end-of-life questions from families with little training to draw on. A course on palliative care or advance care planning is useful to them in a way a brochure is not.",
    ],
    sections: [
      {
        heading: "Where it fits in a hospice liaison's week",
        bullets: [
          "Skilled nursing and assisted living in-services: pair your talk on end-of-life conversations or advance care planning with a course on the same subject.",
          "Hospital case management and social work departments: send a course after a meeting, or leave a flyer with the department.",
          "Physician offices and clinics: the nurses there need hours too.",
          "Community events and health fairs: one flyer serves any number of licensed attendees.",
        ],
      },
    ],
    topicsFrom: "hospice",
    topicsHeading: "Courses that pair with a hospice in-service",
    faqs: [
      {
        q: "Which courses suit hospice?",
        a: "Palliative and hospice care, advance care planning, delivering difficult news, grief, and end-of-life considerations in Alzheimer's disease. Each is listed above with the matching accredited course.",
      },
      {
        q: "Can I use this at a facility that limits vendor lunches?",
        a: "Often, because nothing has to be brought in. A flyer on a break-room board or a course sent by email still gets the education to staff. Follow the facility's own rules on vendor access.",
      },
      FAQ_PRICE,
      FAQ_CREDIT,
      FAQ_COMPLIANCE,
    ],
  },
  {
    slug: "home-health",
    cardLabel: "Home health",
    path: `${SPONSOR_HUB_PATH}/home-health`,
    crumb: "Home health",
    title: "CEU Sponsorship for Home Health Liaisons | Pulse",
    description:
      "Home health liaisons: sponsor accredited CEUs on care transitions for discharge planners and case managers. $15 per CE credit hour, billed only when opened.",
    h1: "CEU Sponsorship for Home Health Liaisons",
    answer:
      "Home health liaisons sponsor CEUs for the discharge planners, case managers and facility nurses who coordinate care with them. On Pulse you choose an accredited course on care transitions, falls or chronic disease, send it or put it on a flyer, and pay $15 per CE credit hour only when it is opened.",
    intro: [
      "Discharge planners and case managers are judged on what happens after the patient leaves. Education on care transitions and preventing rehospitalization speaks to the thing they are measured on.",
    ],
    sections: [
      {
        heading: "Where it fits in a home health liaison's week",
        bullets: [
          "Hospital case management huddles and lunch-and-learns: a flyer on the table for a course on the transition from hospital to home.",
          "Skilled nursing and rehab facility in-services: fall prevention, chronic wounds and chronic disease topics.",
          "Physician offices: a course for the office nurses, sent by email after your visit.",
          "After a shared patient: a single course for the nurse or social worker you worked with.",
        ],
      },
    ],
    topicsFrom: "case-managers",
    topicsHeading: "Courses that suit discharge planners and case managers",
    faqs: [
      {
        q: "Which topics suit home health?",
        a: "Hospital-to-home transitions, preventing rehospitalizations, caregiver stress, health literacy and fall prevention. They line up with what discharge planners and facility nurses deal with every day.",
      },
      {
        q: "Can therapists get credit too?",
        a: "More than twenty courses are approved for physical therapy, occupational therapy or speech-language pathology through the Texas boards. Other state boards may accept them by reciprocity, so therapists outside Texas should check with their board first.",
      },
      FAQ_PRICE,
      FAQ_CREDIT,
      FAQ_COMPLIANCE,
    ],
  },
  {
    slug: "home-care",
    cardLabel: "Home care",
    path: `${SPONSOR_HUB_PATH}/home-care`,
    crumb: "Home care",
    title: "CEU Sponsorship for Home Care Agencies | Pulse",
    description:
      "Home care owners and marketers: sponsor accredited CEUs for social workers, discharge planners and facility nurses. $15 per CE credit hour, no annual package.",
    h1: "CEU Sponsorship for Home Care Agencies",
    answer:
      "Home care owners and marketers sponsor CEUs to bring something useful to the social workers, discharge planners and assisted living nurses they visit. On Pulse a sponsored course costs $15 per CE credit hour, billed only when it is opened, with no annual package to buy.",
    intro: [
      "A small agency cannot build its own accredited course library, and an annual sponsorship package is a lot to commit to before you know whether anyone will use it. Paying per opened course lets an owner-operator start with a single flyer.",
    ],
    sections: [
      {
        heading: "Where it fits for a home care agency",
        bullets: [
          "Skilled nursing facility social workers and discharge planners, who arrange care for people going home.",
          "Assisted living and memory care staff, where dementia topics are always relevant.",
          "Hospital case managers working with families who need help at home.",
          "Senior centers, support groups and community events with licensed attendees.",
        ],
      },
    ],
    topicsFrom: "dementia",
    topicsHeading: "Dementia courses that suit home care audiences",
    faqs: [
      {
        q: "We are a small agency. Is there a minimum?",
        a: "No. You can sponsor one course for one person. There is no contract and nothing to buy up front.",
      },
      {
        q: "Do caregivers or CNAs get credit?",
        a: "The courses are accredited for licensed nurses, social workers and case managers, and some for therapists. Training hours for CNAs and caregivers are set by each state and employer, so check before counting a course toward them.",
      },
      FAQ_PRICE,
      FAQ_CREDIT,
      FAQ_COMPLIANCE,
    ],
  },
  {
    slug: "senior-living",
    cardLabel: "Senior living",
    path: `${SPONSOR_HUB_PATH}/senior-living`,
    crumb: "Senior living",
    title: "CEU Sponsorship for Senior Living Sales Teams | Pulse",
    description:
      "Senior living sales and community relations: add accredited CEUs to professional events and hospital visits. $15 per CE credit hour, billed only when opened.",
    h1: "CEU Sponsorship for Senior Living Sales and Community Relations",
    answer:
      "Senior living sales directors and community relations teams sponsor CEUs for the hospital case managers, social workers and home health nurses who work with their residents and families. On Pulse you pay $15 per CE credit hour, and only when a course is opened.",
    intro: [
      "Communities already host professional events: breakfasts, open houses and speaker series. Adding an accredited course gives licensed guests a second reason to come, and one flyer covers the whole room.",
    ],
    sections: [
      {
        heading: "Where it fits for a senior living community",
        bullets: [
          "Professional open houses and networking breakfasts held at the community.",
          "Visits to hospital and rehab case management departments.",
          "Clinical staff at the home health and hospice agencies who serve your residents.",
          "A monthly education series, with a different course each month.",
        ],
      },
    ],
    topicsFrom: "assisted-living",
    topicsHeading: "Courses that suit senior living audiences",
    faqs: [
      {
        q: "Can we host a CE event at our community?",
        a: "Yes. Host the event, present or bring in a speaker, and put the course flyer out for licensed guests. The credit comes from the online course, so the event itself needs no approval.",
      },
      {
        q: "Does it work for memory care?",
        a: "The catalog has several dementia and Alzheimer's courses, which suit memory care communities and the professionals who work with them.",
      },
      FAQ_PRICE,
      FAQ_CREDIT,
      FAQ_COMPLIANCE,
    ],
  },
  {
    slug: "rehab-hospitals",
    cardLabel: "Rehab hospitals",
    path: `${SPONSOR_HUB_PATH}/rehab-hospitals`,
    crumb: "Rehab hospitals",
    title: "CEU Sponsorship for Rehab Hospital Liaisons | Pulse",
    description:
      "Clinical liaisons at rehab hospitals: sponsor accredited CEUs on stroke, brain injury and care transitions for acute care case managers. $15 per CE credit hour.",
    h1: "CEU Sponsorship for Rehab Hospital Clinical Liaisons",
    answer:
      "Clinical liaisons at inpatient rehabilitation hospitals sponsor CEUs for the acute care case managers, social workers and nurses who plan discharges. On Pulse you send an accredited course or hand out a QR flyer, and pay $15 per CE credit hour only when it is opened.",
    intro: [
      "Case managers in acute care see a liaison from every post-acute provider in town. Education on stroke recovery, brain injury or transitions of care makes the visit about their work.",
    ],
    sections: [
      {
        heading: "Where it fits for a rehab hospital liaison",
        bullets: [
          "Acute care case management and social work departments: a flyer at the monthly meeting.",
          "A monthly lecture series: one course a month on a rotating topic.",
          "Therapy departments: several courses are approved for PT, OT and speech-language pathology through the Texas boards.",
          "After a shared patient: a course on stroke or brain injury for the nurse or case manager you worked with.",
        ],
      },
    ],
    topicsFrom: "home-health",
    topicsHeading: "Rehabilitation and transition courses",
    faqs: [
      {
        q: "Do you have rehabilitation courses?",
        a: "Yes. The catalog includes courses on stroke care and recovery, traumatic brain injury, nutrition for rehabilitation, fall prevention and transitions of care.",
      },
      {
        q: "Can a mixed room of nurses, case managers and therapists all get credit?",
        a: "Usually, if you choose a course approved for each discipline in the room. Nearly every course covers nurses, social workers and case managers. Therapy approval runs through the Texas boards, so therapists in other states should confirm with their own board.",
      },
      FAQ_PRICE,
      FAQ_CREDIT,
      FAQ_COMPLIANCE,
    ],
  },
];

export function getSponsorIndustry(slug: string): SponsorIndustry | undefined {
  return SPONSOR_INDUSTRIES.find((i) => i.slug === slug);
}

/** The standalone guides, for cross-links and the sitemap. */
export const SPONSOR_GUIDES: SponsorPage[] = [SPONSOR_HOW_TO, SPONSOR_LUNCH, SPONSOR_COST];

/** Every sponsorship page path, hub first. */
export function allSponsorPages(): SponsorPage[] {
  return [SPONSOR_HUB, ...SPONSOR_GUIDES, ...SPONSOR_INDUSTRIES];
}

export function sponsorMetadata(page: SponsorPage): Metadata {
  const url = `${SPONSOR_BASE}${page.path}`;
  return {
    title: page.title,
    description: page.description,
    alternates: { canonical: url },
    openGraph: { title: page.title, description: page.description, url, siteName: "Pulse", type: "website" },
    twitter: { card: "summary_large_image", title: page.title, description: page.description },
  };
}
