"use client";

import Container from "@/components/ui/Container";
import { showModal } from "./LandingModals";

export default function Hero() {
  return (
    <section className="relative overflow-x-hidden bg-cream pb-20 pt-[100px] [background:radial-gradient(ellipse_70%_55%_at_25%_15%,var(--blue-glow),transparent),radial-gradient(ellipse_55%_45%_at_80%_75%,var(--teal-glow),transparent),var(--cream)]">
      <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-[100px] bg-gradient-to-b from-transparent to-white" />
      <Container className="relative z-10">
        <div className="mx-auto max-w-[860px] text-center">
          <div className="mb-7 inline-flex items-center gap-2 rounded-[40px] border border-[var(--border)] bg-white px-5 py-2 text-[13px] font-semibold text-ink-soft shadow-[0_2px_12px_rgba(0,0,0,.04)]">
            <span className="font-bold text-teal">Free</span> Nationally accredited CE courses for nurses, social workers &amp; therapists
          </div>
          <h1 className="mb-6 font-serif text-[clamp(38px,5.5vw,68px)] font-black leading-[1.08] tracking-[-.03em]">
            Free CEs for Professionals.<br /><em className="italic text-teal">Referrals</em> for Sales Teams.
          </h1>
          <p className="mx-auto mb-10 max-w-[680px] text-[19px] leading-[1.7] text-ink-soft">
            Every nurse, social worker, and case manager needs continuing education — but most facilities don&apos;t pay for it. Pulse gives healthcare professionals free, nationally accredited CE courses, and gives hospice, home health, and rehab sales teams the referral relationships that come with providing them.
          </p>
          <div className="flex flex-wrap justify-center gap-3.5">
            <button
              type="button"
              onClick={() => showModal("hcp")}
              className="inline-flex items-center gap-2 rounded-[var(--r)] bg-teal px-9 py-4 text-base font-bold text-white shadow-glow-teal transition-all hover:bg-teal-dark hover:shadow-[0_8px_32px_rgba(13,148,136,.3)] hover:-translate-y-0.5"
            >
              Get Free CE Courses
            </button>
            <button
              type="button"
              onClick={() => showModal("sales")}
              className="inline-flex items-center gap-2 rounded-[var(--r)] border-2 border-[var(--border)] bg-white px-9 py-4 text-base font-bold text-ink transition-colors hover:border-blue hover:text-blue"
            >
              I&apos;m a Sales Rep →
            </button>
          </div>
        </div>
      </Container>
    </section>
  );
}
