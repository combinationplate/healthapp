"use client";

import Link from "next/link";
import Container from "@/components/ui/Container";

export default function FinalCTA() {
  return (
    <section className="bg-white py-[120px] [background:radial-gradient(ellipse_50%_80%_at_30%_50%,rgba(36,85,255,.06),transparent),radial-gradient(ellipse_50%_60%_at_80%_40%,var(--teal-glow),transparent),var(--white)] text-center">
      <Container>
        <h2 className="font-serif text-[clamp(30px,4.5vw,48px)] font-black tracking-[-.02em]">
          Ready to Get Started?
        </h2>
        <p className="mx-auto mb-12 max-w-[560px] text-[18px] text-ink-soft">
          Free for professionals, always. Free for sales teams to join — you
          pay $15 per CE only when a professional opens it, and your first one
          is on us.
        </p>
        <div className="mx-auto grid max-w-[780px] gap-6 sm:grid-cols-2">
          <div id="sales-teams" className="rounded-[var(--r-xl)] border border-[var(--border)] bg-white p-10 text-center transition-all hover:-translate-y-1 hover:shadow-[0_12px_40px_rgba(0,0,0,.06)]">
            <span className="mb-3 block text-[40px]">💼</span>
            <h3 className="text-[20px] font-extrabold">
              Hospice, Home Health &amp; Rehab Sales Teams
            </h3>
            <p className="mb-6 text-[14px] leading-[1.6] text-ink-soft">
              Sponsor accredited CE courses to build referral relationships. QR
              codes, branded flyers, bulk send, network management, professional
              discovery, and manager dashboards. $15 per opened CE — first one free.
            </p>
            <Link
              href="/signup?type=sales"
              className="w-full justify-center rounded-[var(--r)] bg-blue px-9 py-4 text-base font-bold text-white shadow-glow inline-flex"
            >
              Start Free — First CE On Us
            </Link>
            <p className="mt-3 text-[13px]">
              <Link href="/pricing" className="font-semibold text-blue hover:underline">See pricing →</Link>
            </p>
          </div>
          <div className="rounded-[var(--r-xl)] border border-[var(--border)] bg-white p-10 text-center transition-all hover:-translate-y-1 hover:shadow-[0_12px_40px_rgba(0,0,0,.06)]">
            <span className="mb-3 block text-[40px]">🧑‍⚕️</span>
            <h3 className="text-[20px] font-extrabold">
              Nurses, Social Workers, Case Managers &amp; Therapists
            </h3>
            <p className="mb-6 text-[14px] leading-[1.6] text-ink-soft">
              Free, accredited CE courses in ethics, palliative care,
              mental health, and more. Matched to your discipline and state. No
              cost, ever.
            </p>
            <Link
              href="/signup?type=hcp"
              className="w-full justify-center rounded-[var(--r)] bg-teal px-9 py-4 text-base font-bold text-white inline-flex"
            >
              Get Free CEs
            </Link>
          </div>
        </div>
      </Container>
    </section>
  );
}
