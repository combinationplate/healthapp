/**
 * Copy for /about, /privacy and /terms.
 *
 * DRAFTED 2026-11-11 FROM THE CODE AS IT BEHAVES TODAY — NOT REVIEWED BY AN
 * ATTORNEY. Before relying on /privacy or /terms, have a lawyer read them, and
 * confirm the business name and the governing-law state in TERMS.
 *
 * Keep these in step with the product. If what reps can see about a
 * professional changes (app/api/rep/discover), or a new vendor is added,
 * update PRIVACY the same day.
 */
import type { SimpleSection } from "@/components/seo/SimplePage";

export const LEGAL_UPDATED = "November 11, 2026";
const CONTACT = "hello@pulsereferrals.com";

/* ------------------------------------------------------------------ */
/* About                                                               */
/* ------------------------------------------------------------------ */

export const ABOUT_INTRO: string[] = [
  "Pulse gives nurses, social workers, case managers and therapists free, accredited continuing education. The hospice, home health, senior care and rehab teams who work alongside them pay for it.",
  "Most licensed professionals need CE hours to renew, and most employers don't cover them. Sales and outreach teams already spend money on lunches and in-services for the same people. Pulse lets that spending go toward something a professional needs.",
];

export const ABOUT_SECTIONS: SimpleSection[] = [
  {
    heading: "How it works for professionals",
    body: [
      "Create a free account, tell us your discipline and state, and ask for the CE you need. When a local team sponsors a course for you, it arrives by email with a one-click link. You take it online at your own pace and download your certificate when you finish. You never pay, and accepting a course does not commit you to anything.",
    ],
  },
  {
    heading: "How it works for sales teams",
    body: [
      "Pick an accredited course, then send it to one professional, to a sign-in sheet, or to a whole room with a QR flyer. The course arrives with your name and company on it, and you can see when it was opened. It costs $15 per CE credit hour, billed only when a professional opens the course. Each rep's first opened course is free, and there are no platform or per-seat fees.",
    ],
  },
  {
    heading: "Who provides the courses",
    body: [
      "Every course on Pulse is provided by H.I.S. Cornerstone Continuing Education, which has served healthcare professionals since 2007. H.I.S. Cornerstone is accredited as a provider of nursing continuing professional development by the American Nurses Credentialing Center's Commission on Accreditation, and is an approved ASWB ACE provider (#2082) for social work continuing education.",
      "Case managers can apply the courses toward ACM and CCM renewal under the ACMA and CCMC reciprocity agreement. Physical therapy, occupational therapy and speech-language pathology courses are approved through the Texas boards, and other state boards may accept them through reciprocity. Your licensing board is always the final authority on what counts, and the Accreditation page has the details by discipline.",
    ],
  },
  {
    heading: "Contact",
    body: [`Questions, feedback or a topic you want to see: ${CONTACT}.`],
  },
];

/* ------------------------------------------------------------------ */
/* Privacy                                                             */
/* ------------------------------------------------------------------ */

export const PRIVACY_INTRO: string[] = [
  "Pulse (pulsereferrals.com) connects healthcare professionals who need continuing education with the sales and outreach teams who sponsor it. This page explains what information we collect, what we do with it, and who can see it.",
  `If anything here is unclear, email ${CONTACT}.`,
];

export const PRIVACY_SECTIONS: SimpleSection[] = [
  {
    heading: "What we collect",
    bullets: [
      "Account details: your name, email address and password, and whether you are a healthcare professional, a sales rep or a sales manager. Passwords are handled by our sign-in provider and are not readable by us.",
      "If you are a healthcare professional: your discipline, facility or work setting, city and state, and the CE you request. You can also choose to give us your license renewal date and the number of CE hours you need.",
      "If you are on a sales team: your company name and territory, the contacts you add or upload (name, email address and, if you enter them, phone, facility, discipline and location), the messages and courses you send, the visits and calls you log, the events you create, and your billing contact and invoice history.",
      "Course activity: which courses were sent to you, when the email was delivered and opened, whether you started the course, and whether you completed it.",
      "Site usage: page-view analytics that do not use cookies, and your answer to \"How did you hear about us?\"",
    ],
    body: [
      "Pulse is not a place for patient information. Please do not enter anything about a patient in a note, message or any other field.",
    ],
  },
  {
    heading: "How we use it",
    bullets: [
      "To deliver courses and certificates.",
      "To match CE requests with teams who can sponsor them.",
      "To show a sponsoring rep whether the course they sent was opened.",
      "To send account and course emails, such as welcome messages, course links and reminders.",
      "To invoice sales teams for the courses that were opened.",
      "To prevent spam and abuse, and to fix and improve the product.",
    ],
  },
  {
    heading: "What sales reps can see about professionals",
    body: [
      "This is the part most people want to know, so here it is plainly.",
    ],
    bullets: [
      "If you have an open CE request, or you have chosen to be visible to local reps, signed-in reps who cover your state can see your name, discipline, facility, work setting, city and state, and what you asked for. If you gave us a license renewal date or the CE hours you need, they can see those too.",
      "Reps cannot see your email address in that list. A rep sees your email only after sponsoring a course for you, or if they already had it in their own contacts.",
      "When a rep sends you a course, they can see when the email was delivered and opened and whether you started the course. Reps and their managers are not shown whether you finished it.",
      "If a rep claims your request and you start the course, we introduce the two of you by email.",
      "The public CE demand map never shows who you are. It shows only a discipline, a metro area, a topic, the hours requested and a deadline.",
      "A rep can also add you as a contact using details they already have, in order to send you a course. If you would rather not hear from a rep, tell them, or email us and we will remove you.",
    ],
  },
  {
    heading: "The course provider",
    body: [
      "Courses are provided by H.I.S. Cornerstone Continuing Education. When you start a course, an account is created or matched for you on hiscornerstone.com using your name and email address, so the course and your certificate can be delivered. As an accredited provider, H.I.S. Cornerstone keeps its own record of who completed each course.",
    ],
  },
  {
    heading: "Companies that process data for us",
    body: [
      "We use a small number of service providers to run Pulse: Supabase (database and sign-in), Vercel (hosting and page-view analytics), Resend (email), Stripe (invoices and payments for sales teams), and Cloudflare (bot protection on our sign-up and sign-in forms). Card details go straight to Stripe and are never stored by Pulse.",
      "We also share information when the law requires it.",
    ],
  },
  {
    heading: "Your choices",
    bullets: [
      "You can update your profile from your dashboard at any time.",
      "Professionals can delete their account from the dashboard. Doing so removes your profile and your CE requests.",
      "You can ask us for a copy of your information, or ask us to correct or delete it, by emailing us.",
      "You can stop non-essential emails by replying to one and asking, or by emailing us.",
    ],
  },
  {
    heading: "How long we keep it",
    body: [
      "We keep account information for as long as the account is open. After an account is deleted, we keep the records we need for accounting, such as which courses a sales team was billed for. Course completion records are kept by H.I.S. Cornerstone as its accreditation requires.",
    ],
  },
  {
    heading: "Security and children",
    body: [
      "We protect information with access controls and encrypted connections, though no online service can promise perfect security. Pulse is for working professionals and is not intended for anyone under 18.",
    ],
  },
  {
    heading: "Changes and contact",
    body: [
      `If we change this policy we will post the new version here and update the date at the top. Questions and requests go to ${CONTACT}.`,
    ],
  },
];

/* ------------------------------------------------------------------ */
/* Terms                                                               */
/* ------------------------------------------------------------------ */

export const TERMS_INTRO: string[] = [
  "These terms cover your use of Pulse (pulsereferrals.com). By creating an account or using the site, you agree to them. If you are using Pulse for your employer, you are agreeing on your employer's behalf as well.",
];

export const TERMS_SECTIONS: SimpleSection[] = [
  {
    heading: "Your account",
    body: [
      "You must be at least 18, give accurate information, and choose the account type that matches what you do. Keep your password private. You are responsible for what happens under your account.",
    ],
  },
  {
    heading: "For healthcare professionals",
    bullets: [
      "Pulse is free for you. A sponsoring sales team pays for each course.",
      "Accepting a sponsored course does not commit you to refer patients, meet with anyone, or do anything else in return.",
      "Courses are provided by H.I.S. Cornerstone Continuing Education. Your licensing board is the final authority on whether a course counts toward your renewal, so check with your board before you rely on it.",
    ],
  },
  {
    heading: "For sales teams: pricing and billing",
    bullets: [
      "Creating an account is free. There are no platform, setup or per-seat fees.",
      "A sponsored course costs $15 per CE credit hour. You are billed only when a professional opens the course. Courses that are sent and never opened are not billed.",
      "Each rep's first opened course is free.",
      "Usage is invoiced monthly to your company or to the individual rep, depending on how billing is set up. Invoices are due as stated on the invoice.",
      "We may change prices for future sends by updating the Pricing page. A change does not affect courses already opened.",
    ],
  },
  {
    heading: "For sales teams: your responsibilities",
    bullets: [
      "You decide whether sponsoring continuing education fits the laws and company policies that apply to you, including any rules about gifts to people who refer patients. Pulse does not give legal or compliance advice.",
      "A sponsored course must never be offered in exchange for patient referrals, or made conditional on them.",
      "Only add contacts you have a real professional reason to reach, and only contact people in ways you are allowed to.",
      "Your own presentation or in-service does not earn CE credit. The credit comes from the accredited online course, and you may not tell anyone otherwise.",
      "Do not enter patient information anywhere on Pulse.",
    ],
  },
  {
    heading: "Acceptable use",
    body: [
      "Do not use Pulse to send spam, to collect information about professionals for use outside Pulse, to copy or scrape the site, to give false information, or to interfere with the service. We may suspend or close an account that does.",
    ],
  },
  {
    heading: "What we do not promise",
    body: [
      "Pulse does not guarantee referrals, introductions, replies, or that a licensing board will accept a particular course. The service is provided as is. To the extent the law allows, Pulse is not liable for indirect or consequential losses, and our total liability to you is limited to the amount you paid Pulse in the twelve months before the claim.",
    ],
  },
  {
    heading: "Ownership",
    body: [
      "The courses belong to their provider and the Pulse site belongs to Pulse. You keep ownership of the contacts and content you add, and you allow us to use them to run the service for you.",
    ],
  },
  {
    heading: "Ending your account",
    body: [
      "You can stop using Pulse at any time. Professionals can delete their account from the dashboard, and sales teams can ask us to close theirs. Amounts already invoiced remain due.",
    ],
  },
  {
    heading: "Changes, governing law and contact",
    body: [
      `We may update these terms by posting a new version here. These terms are governed by the laws of the State of Texas. Questions go to ${CONTACT}.`,
    ],
  },
];
