import type { Metadata } from "next";
import Link from "next/link";
import LandingNav from "@/components/landing/LandingNav";
import Footer from "@/components/landing/Footer";
import ProblemSolution from "@/components/landing/ProblemSolution";
import Distribution from "@/components/landing/Distribution";
import DemandBanner from "@/components/landing/DemandBanner";
import PricingBlock, { PRICING } from "@/components/landing/PricingBlock";
import Container from "@/components/ui/Container";

export const metadata: Metadata = {
  title: "Pulse for Hospice, Home Health & Rehab Sales Teams — Sponsored CE That Earns Referrals",
  description:
    "Sponsor accredited CE for the nurses, social workers, and case managers who send you referrals. Free platform, $15 per CE credit hour billed only when the course is opened, first CE on us. Delivery, open, and redemption tracking per rep.",
  alternates: { canonical: "https://pulsereferrals.com/for-sales-teams" },
  openGraph: {
    title: "Pulse for Sales Teams — Sponsored CE That Earns Referrals",
    description:
      "A $15 sponsored CE, tracked and attributed to your rep, instead of a $500 lunch nobody remembers. Free platform. First CE on us.",
    url: "https://pulsereferrals.com/for-sales-teams",
    siteName: "Pulse",
    type: "website",
  },
};

const steps = [
  {
    num: 1,
    title: "Build your network",
    desc: "Add the case managers, social workers, and nurses you already call on — one at a time or from a CSV — or find new ones actively requesting CE in your territory.",
  },
  {
    num: 2,
    title: "Sponsor a CE",
    desc: "Pick a course, pick a professional, hit send. Or hand them a branded QR flyer. The course arrives in their inbox with your name and company on it.",
  },
  {
    num: 3,
    title: "Track and follow up",
    desc: "See who opened their course and when. Log the call or visit that follows. Managers see every rep's activity in one dashboard.",
  },
];

const faqs = [
  {
    q: "What does a sponsored CE cost?",
    a: `${PRICING.perHour} per credit hour, billed only when the professional opens the course. Sending, QR codes, flyers, and bulk sends are free, and every rep's first opened CE is free.`,
  },
  {
    q: "What does the professional see?",
    a: "An email from your rep — name and company up top — with a one-click link into an accredited course. No account, no coupon code, no checkout. The course is theirs the moment they click.",
  },
  {
    q: "Is this really an introduction, or just a gift?",
    a: "Both. The professional knows exactly who sponsored their CE, your rep sees when it was opened, and the follow-up call lands while the goodwill is fresh. Reps can also claim professionals who are actively requesting CE on the demand map — that one is a warm introduction to someone you've never met.",
  },
  {
    q: "Can my whole team use it?",
    a: "Yes. Unlimited reps, no per-seat fees. Managers invite reps with a link and get team-wide visibility: CEs sponsored, opens, network size, last activity per rep.",
  },
  {
    q: "Who provides the courses?",
    a: "H.I.S. Cornerstone Continuing Education — an ANCC-accredited provider and ASWB ACE provider (#2082), with Texas board approval for PT, OT, and SLP. Courses are matched to each professional's discipline and state; the Accreditation page lists what's recognized where.",
  },
];

export default function ForSalesTeamsPage() {
  return (
    <>
      <LandingNav />
      <main>
        {/* HERO — pricing above the fold, on purpose */}
        <section className="relative overflow-x-hidden bg-cream pb-16 pt-[96px] [background:radial-gradient(ellipse_70%_55%_at_25%_15%,var(--blue-glow),transparent),radial-gradient(ellipse_55%_45%_at_80%_75%,var(--teal-glow),transparent),var(--cream)]">
          <Container className="relative z-10">
            <div className="mx-auto max-w-[860px] text-center">
              <p className="text-[13px] font-bold uppercase tracking-[.12em] text-blue">
                For Hospice, Home Health &amp; Rehab Sales Teams
              </p>
              <h1 className="mt-4 font-serif text-[clamp(36px,5.5vw,64px)] font-black leading-[1.08] tracking-[-.03em]">
                A $500 lunch buys a meeting.
                <br />
                A <em className="italic text-blue">{PRICING.perHour} sponsored CE</em> buys a reason to call back.
              </h1>
              <p className="mx-auto mt-6 max-w-[680px] text-[19px] leading-[1.7] text-ink-soft">
                Every nurse, social worker, and case manager who refers to you needs continuing
                education — and most facilities don&apos;t pay for it. Pulse lets your reps sponsor an
                accredited CE in seconds, delivered with their name on it, and shows you who opened it.
              </p>
              <div className="mt-9 flex flex-wrap justify-center gap-3.5">
                <Link
                  href={PRICING.ctaHref}
                  className="inline-flex items-center rounded-[var(--r)] bg-blue px-9 py-4 text-base font-bold text-white shadow-glow transition-all hover:bg-blue-dark hover:-translate-y-0.5"
                >
                  {PRICING.ctaLabel}
                </Link>
                <Link
                  href="/demand"
                  className="inline-flex items-center rounded-[var(--r)] border-2 border-[var(--border)] bg-white px-9 py-4 text-base font-bold text-ink transition-colors hover:border-blue hover:text-blue"
                >
                  See CE demand in your market →
                </Link>
              </div>
              <ul className="mx-auto mt-8 flex max-w-[720px] flex-wrap justify-center gap-x-6 gap-y-2 text-[14px] font-semibold text-ink-soft">
                <li>✓ Free platform, unlimited reps</li>
                <li>✓ {PRICING.perHour} per CE credit hour, billed only when opened</li>
                <li>✓ First CE on us</li>
                <li>✓ No credit card to sign up</li>
              </ul>
            </div>
          </Container>
        </section>

        {/* 3 STEPS */}
        <section className="bg-white py-[100px]">
          <Container>
            <p className="text-center text-[13px] font-bold uppercase tracking-[.12em] text-blue">How It Works</p>
            <h2 className="mt-3 text-center font-serif text-[clamp(30px,4vw,44px)] font-extrabold tracking-[-.02em]">
              Send, Track, Follow Up.
            </h2>
            <p className="mx-auto mb-14 mt-4 max-w-[600px] text-center text-[17px] text-ink-soft">
              The flyer program you already run — with a record of who actually used it.
            </p>
            <div className="mx-auto grid max-w-[1000px] gap-6 md:grid-cols-3">
              {steps.map((s) => (
                <div
                  key={s.num}
                  className="rounded-[var(--r-xl)] border border-[var(--border)] bg-white p-9 text-center transition-all hover:-translate-y-1 hover:shadow-[0_12px_40px_rgba(0,0,0,.06)]"
                >
                  <div className="mx-auto mb-5 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-blue text-[20px] font-extrabold text-white">
                    {s.num}
                  </div>
                  <h3 className="text-[18px] font-bold">{s.title}</h3>
                  <p className="mt-2 text-[14px] leading-[1.7] text-ink-soft">{s.desc}</p>
                </div>
              ))}
            </div>
          </Container>
        </section>

        <ProblemSolution />
        <Distribution />
        <DemandBanner />
        <PricingBlock />

        {/* FAQ */}
        <section className="bg-cream py-[100px]">
          <Container>
            <div className="mx-auto max-w-[780px]">
              <p className="text-center text-[13px] font-bold uppercase tracking-[.12em] text-ink-muted">FAQ</p>
              <h2 className="mt-3 text-center font-serif text-[clamp(28px,3.5vw,40px)] font-extrabold tracking-[-.02em]">
                Questions Sales Managers Ask
              </h2>
              <div className="mt-10">
                {faqs.map((f) => (
                  <details key={f.q} className="group border-b border-[var(--border)] py-5">
                    <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-[16px] font-bold text-ink [&::-webkit-details-marker]:hidden">
                      {f.q}
                      <span className="text-[22px] text-ink-muted transition-transform group-open:rotate-45">+</span>
                    </summary>
                    <p className="mt-3 text-[15px] leading-[1.7] text-ink-soft">{f.a}</p>
                  </details>
                ))}
              </div>
            </div>
          </Container>
        </section>

        {/* FINAL CTA */}
        <section className="bg-white py-[110px] text-center [background:radial-gradient(ellipse_50%_80%_at_30%_50%,rgba(36,85,255,.06),transparent),radial-gradient(ellipse_50%_60%_at_80%_40%,var(--teal-glow),transparent),var(--white)]">
          <Container>
            <h2 className="font-serif text-[clamp(30px,4.5vw,48px)] font-black tracking-[-.02em]">
              Your first sponsored CE is on us.
            </h2>
            <p className="mx-auto mb-9 mt-3 max-w-[540px] text-[18px] text-ink-soft">
              Create a rep account, send one CE to a professional you already know, and watch
              the loop close. No card, no commitment — you&apos;re billed only when a course is opened.
            </p>
            <div className="flex flex-wrap justify-center gap-3.5">
              <Link
                href={PRICING.ctaHref}
                className="inline-flex items-center rounded-[var(--r)] bg-blue px-9 py-4 text-base font-bold text-white shadow-glow transition-all hover:bg-blue-dark hover:-translate-y-0.5"
              >
                {PRICING.ctaLabel}
              </Link>
              <Link
                href="/signup?type=manager"
                className="inline-flex items-center rounded-[var(--r)] border-2 border-[var(--border)] bg-white px-9 py-4 text-base font-bold text-ink transition-colors hover:border-blue hover:text-blue"
              >
                I manage a team →
              </Link>
            </div>
            <p className="mt-6 text-[13px] text-ink-muted">
              Full pricing details on the <Link href="/pricing" className="font-semibold text-blue hover:underline">pricing page</Link>.
            </p>
          </Container>
        </section>
      </main>
      <Footer />
    </>
  );
}
