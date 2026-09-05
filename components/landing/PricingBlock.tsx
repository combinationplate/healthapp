import Link from "next/link";
import Container from "@/components/ui/Container";

/**
 * Single source of truth for Pulse pricing copy.
 * Rendered on /pricing, /for-sales-teams, /how-it-works, and linked from the homepage.
 * If the pricing model changes, change it HERE (and the short lines in Hero/FinalCTA).
 */
export const PRICING = {
  perHour: "$15",
  perHourLabel: "per credit hour",
  ctaLabel: "Start Free — First CE On Us",
  ctaHref: "/signup?type=sales",
};

const tiles = [
  {
    label: "Healthcare Professionals",
    price: "$0",
    sub: "Always free. No card, no catch.",
    tone: "teal",
  },
  {
    label: "Sales Team Platform",
    price: "Free",
    sub: "Unlimited reps. No per-seat fees, no setup fee, no credit card to sign up.",
    tone: "ink",
  },
  {
    label: "Sponsored CE",
    price: PRICING.perHour,
    sub: `${PRICING.perHourLabel} — billed only when a professional opens the course.`,
    badge: "Your first CE is on us",
    tone: "blue",
  },
];

const billingRules = [
  {
    title: "Sending is always free.",
    desc: "Send a CE, generate a QR code, print a flyer, bulk-send after an event — none of it costs anything.",
  },
  {
    title: "You pay only when a professional opens the course.",
    desc: "Send 50 CEs and 30 get opened? You pay for 30. Unopened sends are never billed.",
  },
  {
    title: "Every rep's first opened CE is free.",
    desc: "See the whole loop work — send, open, thank-you — before your company spends a dollar.",
  },
  {
    title: "One monthly invoice for actual usage.",
    desc: `A 1-hour course is ${PRICING.perHour}; multi-hour courses are priced per credit hour. Invoiced monthly — to your company, or to each rep individually. Your choice at setup.`,
  },
];

const included = [
  "Unlimited rep accounts — no per-seat fees",
  "Direct send, QR codes, branded flyers, bulk send",
  "Network management & CSV import",
  "Touchpoint tracking (calls, visits, CEs, events)",
  "Professional discovery & the CE demand map",
  "Manager dashboard & team visibility",
  "Delivery, open, and redemption tracking per send",
];

const toneClasses: Record<string, { box: string; price: string }> = {
  teal: { box: "bg-[var(--teal-glow)]", price: "text-teal" },
  ink: { box: "bg-cream", price: "text-ink" },
  blue: { box: "bg-[var(--blue-glow)]", price: "text-blue" },
};

export default function PricingBlock({
  showHeading = true,
  id = "pricing",
}: {
  showHeading?: boolean;
  id?: string;
}) {
  return (
    <section id={id} className="bg-white py-[100px]">
      <Container>
        {showHeading && (
          <div className="mx-auto mb-12 max-w-[640px] text-center">
            <p className="text-[13px] font-bold uppercase tracking-[.12em] text-teal">Pricing</p>
            <h2 className="mt-3 font-serif text-[clamp(30px,4vw,44px)] font-extrabold tracking-[-.02em]">
              Simple Pricing. No Surprises.
            </h2>
            <p className="mt-4 text-[17px] leading-[1.7] text-ink-soft">
              Free for professionals, always. Free for sales teams to join. Your company pays{" "}
              <strong className="text-ink">{PRICING.perHour} per CE credit hour</strong> — and only when a
              professional actually opens the course.
            </p>
          </div>
        )}

        <div className="mx-auto max-w-[900px]">
          <div className="grid gap-4 sm:grid-cols-3">
            {tiles.map((t) => (
              <div key={t.label} className={`rounded-[var(--r-lg)] p-6 ${toneClasses[t.tone].box}`}>
                <div className="text-[12px] font-bold uppercase tracking-[.06em] text-ink-muted">{t.label}</div>
                <div className={`mt-2 font-serif text-[40px] font-black leading-none ${toneClasses[t.tone].price}`}>
                  {t.price}
                </div>
                <div className="mt-2 text-[13px] leading-[1.55] text-ink-soft">{t.sub}</div>
                {t.badge && (
                  <div className="mt-3 inline-block rounded-[20px] bg-white px-3 py-1 text-[12px] font-bold text-teal">
                    {t.badge}
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="mt-8 rounded-[var(--r-xl)] border border-[var(--border)] bg-white p-8 shadow-[0_4px_24px_rgba(0,0,0,.04)] sm:p-10">
            <h3 className="text-[16px] font-bold">How billing works</h3>
            <ul className="mt-4 grid list-none gap-4 sm:grid-cols-2">
              {billingRules.map((r) => (
                <li key={r.title} className="flex gap-3">
                  <span className="mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-teal text-[12px] font-bold text-white">
                    ✓
                  </span>
                  <div>
                    <div className="text-[15px] font-bold">{r.title}</div>
                    <div className="mt-0.5 text-[14px] leading-[1.6] text-ink-soft">{r.desc}</div>
                  </div>
                </li>
              ))}
            </ul>

            <div className="mt-8 border-t border-[var(--border)] pt-7">
              <h3 className="text-[16px] font-bold">Everything is included</h3>
              <ul className="mt-3 grid list-none gap-2 sm:grid-cols-2">
                {included.map((item) => (
                  <li key={item} className="flex items-center gap-2.5 text-[14px] text-ink-soft">
                    <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-[var(--teal-glow)] text-[11px] font-extrabold text-teal">
                      ✓
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-8 flex flex-col items-center gap-3 border-t border-[var(--border)] pt-7 text-center">
              <Link
                href={PRICING.ctaHref}
                className="inline-flex items-center justify-center rounded-[var(--r)] bg-blue px-9 py-4 text-base font-bold text-white shadow-glow transition-all hover:bg-blue-dark hover:-translate-y-0.5"
              >
                {PRICING.ctaLabel}
              </Link>
              <p className="text-[13px] text-ink-muted">
                No credit card to sign up. Professionals never pay anything.{" "}
                <Link href="/contact" className="font-semibold text-blue hover:underline">
                  Larger team? Ask about volume pricing →
                </Link>
              </p>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
