export type Faq = { q: string; a: string };

export type LandingConfig = {
  slug: string;
  disciplineLabel: string; // "nurses"
  professions: string[]; // course_professions labels to match
  title: string; // <title> 50-60 chars
  description: string; // meta description 150-160 chars
  h1: string;
  subhead: string;
  firstParagraph: string; // keyword-rich opening, exact-match query
  accreditationTitle: string;
  accreditationBody: string;
  note?: string; // e.g. New York exclusion for social work
  faqs: Faq[];
};

const WHO_PAYS =
  "The courses are sponsored by hospice, home health, and rehab sales teams. Providing you with free continuing education is how they build genuine relationships with the professionals they work alongside — it costs you nothing and never expires into a paid upsell.";
const CERT_SPEED =
  "Your certificate of completion is issued immediately online once you finish the course and its short evaluation. You can download and print it right away for your records or license renewal.";
const LEGIT =
  "Yes. All courses are provided by H.I.S. Cornerstone Continuing Education, a nationally accredited provider serving healthcare professionals since 2007. Free simply means a sponsor covers the cost — the accreditation and certificate are identical to paid CE.";

export const LANDINGS: Record<string, LandingConfig> = {
  nurses: {
    slug: "free-ce-for-nurses",
    disciplineLabel: "nurses",
    professions: ["Nursing"],
    title: "Free CE for Nurses — Nationally Accredited | Pulse",
    description:
      "Free, nationally accredited continuing education for nurses. No credit card, certificate issued instantly, available in all 50 states. ANCC-accredited courses, sponsored for you.",
    h1: "Free CE for Nurses",
    subhead:
      "Nationally accredited nursing continuing education — no credit card, certificate issued instantly, available in all 50 states.",
    firstParagraph:
      "Get free CE for nurses that actually counts. Every course on Pulse is nationally accredited nursing continuing education, provided by an ANCC-accredited provider, with your certificate of completion issued the moment you finish. There is no credit card, no trial, and no catch — a local healthcare sponsor covers the cost so you can complete your CE hours for free.",
    accreditationTitle: "Accredited for nursing",
    accreditationBody:
      "Nursing courses are provided by H.I.S. Cornerstone Continuing Education, an ANCC-accredited provider (Accreditation Commission of the American Nurses Credentialing Center), serving healthcare professionals since 2007. Contact hours are recognized by most state boards of nursing that accept ANCC-accredited CE. Always confirm acceptance with your own state board of nursing.",
    faqs: [
      { q: "Are free nursing CEUs legitimate?", a: LEGIT },
      { q: "Do these courses count for nursing license renewal?", a: "Courses are ANCC-accredited and are accepted by most state boards of nursing that recognize ANCC contact hours. Requirements vary by state, so confirm your board accepts ANCC-accredited CE before you rely on it for renewal." },
      { q: "Who pays for the courses, and why?", a: WHO_PAYS },
      { q: "How fast do I get my certificate?", a: CERT_SPEED },
      { q: "Do I need a credit card to sign up?", a: "No. There is no credit card required and no payment information collected. Create a free account and start a course." },
      { q: "Which states are covered?", a: "Nursing CE is available to nurses in all 50 states. Acceptance for renewal follows your individual state board's rules for ANCC-accredited contact hours." },
    ],
  },
  "social-workers": {
    slug: "free-ce-for-social-workers",
    disciplineLabel: "social workers",
    professions: ["Social Work"],
    title: "Free CE for Social Workers — ASWB ACE | Pulse",
    description:
      "Free, nationally accredited continuing education for social workers. ASWB ACE provider #2082, certificate issued instantly, no credit card. Available in 49 states (excludes New York).",
    h1: "Free CE for Social Workers",
    subhead:
      "ASWB ACE-approved social work continuing education — no credit card, certificate issued instantly, available across the country.",
    firstParagraph:
      "Get free CE for social workers from an ASWB ACE-approved provider. Every course on Pulse is nationally accredited social work continuing education with your certificate of completion issued the moment you finish. There is no credit card and no catch — a local healthcare sponsor covers the cost so you can complete your continuing education hours for free.",
    accreditationTitle: "Accredited for social work",
    accreditationBody:
      "Social work courses are provided by H.I.S. Cornerstone Continuing Education, an approved provider with the Association of Social Work Boards (ASWB) Approved Continuing Education (ACE) program, provider #2082, serving professionals since 2007. ASWB ACE approval is recognized by most state social work boards. Always confirm acceptance with your own state board.",
    note:
      "New York does not accept ASWB ACE approval for social work CE, so these courses are offered in the other 49 states. New York social workers should use a New York State Education Department-approved provider.",
    faqs: [
      { q: "Are free social work CEUs legitimate?", a: LEGIT },
      { q: "Do these courses count for social work license renewal?", a: "Courses are ASWB ACE-approved (provider #2082) and are accepted by most state social work boards that recognize ACE. New York is the exception. Confirm your board accepts ASWB ACE approval before relying on it for renewal." },
      { q: "Are these available in New York?", a: "No. New York does not accept ASWB ACE approval for social work continuing education, so Pulse social work courses are available in the other 49 states." },
      { q: "Who pays for the courses, and why?", a: WHO_PAYS },
      { q: "How fast do I get my certificate?", a: CERT_SPEED },
      { q: "Do I need a credit card to sign up?", a: "No. There is no credit card required and no payment information collected." },
    ],
  },
  "case-managers": {
    slug: "free-ce-for-case-managers",
    disciplineLabel: "case managers",
    professions: ["Case Management", "Case Mgmt"],
    title: "Free CE for Case Managers — Accredited | Pulse",
    description:
      "Free, nationally accredited continuing education for case managers. ANCC-accredited courses, certificate issued instantly, no credit card, available in all 50 states.",
    h1: "Free CE for Case Managers",
    subhead:
      "Nationally accredited continuing education for case managers — no credit card, certificate issued instantly, available in all 50 states.",
    firstParagraph:
      "Get free CE for case managers that supports your certification. Every course on Pulse is nationally accredited continuing education, provided by an ANCC-accredited provider, with your certificate of completion issued the moment you finish. There is no credit card and no catch — a local healthcare sponsor covers the cost so you can complete your continuing education hours for free.",
    accreditationTitle: "Accredited for case managers",
    accreditationBody:
      "Courses are provided by H.I.S. Cornerstone Continuing Education, an ANCC-accredited provider, serving healthcare professionals since 2007. Case managers who hold the CCM (Commission for Case Manager Certification) or ACM credential can typically apply ANCC-accredited continuing education toward recertification. Certification rules vary — always confirm accepted CE types with the CCMC or your certifying body before you rely on a course for recertification.",
    faqs: [
      { q: "Are free case manager CEUs legitimate?", a: LEGIT },
      { q: "Do these count toward CCM or ACM recertification?", a: "Courses are ANCC-accredited, and CCM and ACM certificants can typically apply ANCC-accredited CE toward recertification. Confirm accepted CE types with the CCMC or your certifying body before relying on a course for recertification." },
      { q: "Who pays for the courses, and why?", a: WHO_PAYS },
      { q: "How fast do I get my certificate?", a: CERT_SPEED },
      { q: "Do I need a credit card to sign up?", a: "No. There is no credit card required and no payment information collected." },
      { q: "Which states are covered?", a: "Continuing education for case managers is available in all 50 states. Acceptance for recertification follows your certifying body's rules for ANCC-accredited CE." },
    ],
  },
};

export const LANDING_SLUGS = Object.values(LANDINGS).map((c) => c.slug);
