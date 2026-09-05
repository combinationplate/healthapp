import type { Metadata } from "next";
import Link from "next/link";
import LandingNav from "@/components/landing/LandingNav";
import Footer from "@/components/landing/Footer";
import PricingBlock, { PRICING } from "@/components/landing/PricingBlock";
import Container from "@/components/ui/Container";

export const metadata: Metadata = {
  title: "Pricing — Free for Professionals, $15 per Sponsored CE | Pulse",
  description:
    "Pulse is free for nurses, social workers, case managers, and therapists. Hospice, home health, and rehab sales teams join free and pay $15 per CE credit hour — only when a professional opens the course. First CE on us.",
  alternates: { canonical: "https://pulsereferrals.com/pricing" },
  openGraph: {
    title: "Pulse Pricing — Free for Professionals, $15 per Sponsored CE",
    description:
      "Free platform for sales teams. $15 per CE credit hour, billed only when a professional opens the course. Professionals never pay.",
    url: "https://pulsereferrals.com/pricing",
    siteName: "Pulse",
    type: "website",
  },
};

const faqs = [
  {
    q: "Who pays for the CE?",
    a: "The sales team that sponsors it. Nurses, social workers, case managers, and therapists never pay anything — the course is a gift from a local hospice, home health, or rehab team that wants to earn the introduction.",
  },
  {
    q: "When exactly am I charged?",
    a: `Only when a professional opens the course you sent. Sending, QR codes, flyers, and bulk sends are free. If a professional never opens their CE, you're never billed for it.`,
  },
  {
    q: "How much is a multi-hour course?",
    a: `${PRICING.perHour} per credit hour. A 1-hour ethics course is ${PRICING.perHour}; a 2-hour course is $30. The credit hours are shown next to every course before you send it.`,
  },
  {
    q: "What does \"first CE on us\" mean?",
    a: "Every rep's first opened CE is free. You'll see the full loop — send, open, thank-you email — before anyone spends a dollar. Every rep on your team gets their own.",
  },
  {
    q: "Do I need a credit card to sign up?",
    a: "No. Create a rep or manager account, add your company, and start sending. Billing is set up afterward, in the dashboard: invoices go to your company, or to each rep individually — whichever your team prefers.",
  },
  {
    q: "Are there per-seat or platform fees?",
    a: "No. Add your whole team — unlimited reps, manager dashboard, discovery, flyers, tracking — at no charge. The only thing you ever pay for is a CE that a professional actually opened.",
  },
  {
    q: "Are the courses accredited?",
    a: "Yes. Courses are provided by H.I.S. Cornerstone Continuing Education — an ANCC-accredited provider and ASWB ACE provider (#2082) — with state approval and reciprocity for therapy disciplines. See the Accreditation page for the details by discipline.",
  },
  {
    q: "We send a lot of CEs. Is there volume pricing?",
    a: "Yes — larger teams can move to a group package. Reach out through the contact page and we'll put together a quote based on your usage.",
  },
];

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faqs.map((f) => ({
    "@type": "Question",
    name: f.q,
    acceptedAnswer: { "@type": "Answer", text: f.a },
  })),
};

export default function PricingPage() {
  return (
    <>
      <LandingNav />
      <main>
        <section className="bg-cream pb-14 pt-[88px] [background:radial-gradient(ellipse_70%_55%_at_25%_15%,var(--blue-glow),transparent),radial-gradient(ellipse_55%_45%_at_80%_75%,var(--teal-glow),transparent),var(--cream)]">
          <Container>
            <div className="mx-auto max-w-[760px] text-center">
              <p className="text-[13px] font-bold uppercase tracking-[.12em] text-blue">Pricing</p>
              <h1 className="mt-3 font-serif text-[clamp(36px,5vw,60px)] font-black leading-[1.08] tracking-[-.03em]">
                Professionals never pay.
                <br />
                Sales teams pay <em className="italic text-blue">{PRICING.perHour}</em> per CE — only when it&apos;s opened.
              </h1>
              <p className="mx-auto mt-6 max-w-[620px] text-[18px] leading-[1.7] text-ink-soft">
                No platform fee, no per-seat fee, no credit card to sign up. Every rep&apos;s first
                opened CE is free.
              </p>
            </div>
            <div className="mx-auto mt-10 flex max-w-[720px] flex-wrap items-center justify-center gap-3 rounded-[var(--r-lg)] border border-[rgba(13,148,136,.15)] bg-white px-6 py-4 text-[14px] text-ink-soft">
              <span>🧑‍⚕️ Nurse, social worker, case manager, or therapist? Pulse is 100% free for you.</span>
              <Link href="/signup?type=hcp" className="font-bold text-teal hover:underline">
                Get free CEs →
              </Link>
            </div>
          </Container>
        </section>

        <PricingBlock showHeading={false} />

        <section className="bg-cream py-[100px]">
          <Container>
            <div className="mx-auto max-w-[780px]">
              <p className="text-center text-[13px] font-bold uppercase tracking-[.12em] text-ink-muted">FAQ</p>
              <h2 className="mt-3 text-center font-serif text-[clamp(28px,3.5vw,40px)] font-extrabold tracking-[-.02em]">
                Billing Questions
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

        <section className="bg-white py-[100px] text-center">
          <Container>
            <h2 className="font-serif text-[clamp(28px,4vw,44px)] font-black tracking-[-.02em]">
              Send your first CE on us.
            </h2>
            <p className="mx-auto mb-9 mt-3 max-w-[520px] text-[17px] text-ink-soft">
              Create your rep account, pick a professional, hit send. You won&apos;t be billed until
              a professional opens a course — and the first one is free.
            </p>
            <div className="flex flex-wrap justify-center gap-3.5">
              <Link
                href={PRICING.ctaHref}
                className="inline-flex items-center rounded-[var(--r)] bg-blue px-9 py-4 text-base font-bold text-white shadow-glow transition-all hover:bg-blue-dark hover:-translate-y-0.5"
              >
                {PRICING.ctaLabel}
              </Link>
              <Link
                href="/for-sales-teams"
                className="inline-flex items-center rounded-[var(--r)] border-2 border-[var(--border)] bg-white px-9 py-4 text-base font-bold text-ink transition-colors hover:border-blue hover:text-blue"
              >
                See how it works for sales teams →
              </Link>
            </div>
          </Container>
        </section>
      </main>
      <Footer />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
    </>
  );
}
