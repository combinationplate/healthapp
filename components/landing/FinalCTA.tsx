"use client";

import Container from "@/components/ui/Container";
import { showModal } from "./LandingModals";

export default function FinalCTA() {
  return (
    <section className="bg-white py-[120px] [background:radial-gradient(ellipse_50%_80%_at_30%_50%,rgba(36,85,255,.06),transparent),radial-gradient(ellipse_50%_60%_at_80%_40%,var(--teal-glow),transparent),var(--white)] text-center">
      <Container>
        <h2 className="font-serif text-[clamp(30px,4.5vw,48px)] font-black tracking-[-.02em]">
          Ready to Get Started?
        </h2>
        <p className="mx-auto mb-12 max-w-[560px] text-[18px] text-ink-soft">
          Whether you&apos;re building referral relationships or looking for free
          CEs, events, and career opportunities — Pulse is free to join.
        </p>
        <div className="mx-auto grid max-w-[780px] gap-6 sm:grid-cols-2">
          <div className="rounded-[var(--r-xl)] border border-[var(--border)] bg-white p-10 text-center transition-all hover:-translate-y-1 hover:shadow-[0_12px_40px_rgba(0,0,0,.06)]">
            <span className="mb-3 block text-[40px]">💼</span>
            <h3 className="text-[20px] font-extrabold">
              Sales Teams &amp; Managers
            </h3>
            <p className="mb-6 text-[14px] leading-[1.6] text-ink-soft">
              The complete marketing toolkit — CE distribution, QR field tools,
              events, tracking, discovery, gamification, and analytics.
            </p>
            <button
              type="button"
              onClick={() => showModal("sales")}
              className="w-full justify-center rounded-[var(--r)] bg-blue px-9 py-4 text-base font-bold text-white shadow-glow"
            >
              Request a Demo
            </button>
          </div>
          <div className="rounded-[var(--r-xl)] border border-[var(--border)] bg-white p-10 text-center transition-all hover:-translate-y-1 hover:shadow-[0_12px_40px_rgba(0,0,0,.06)]">
            <span className="mb-3 block text-[40px]">🧑‍⚕️</span>
            <h3 className="text-[20px] font-extrabold">
              Healthcare Professionals
            </h3>
            <p className="mb-6 text-[14px] leading-[1.6] text-ink-soft">
              Free CE courses, local event notifications, career opportunities,
              and connections with reps in your area.
            </p>
            <button
              type="button"
              onClick={() => showModal("hcp")}
              className="w-full justify-center rounded-[var(--r)] bg-teal px-9 py-4 text-base font-bold text-white"
            >
              Register Free
            </button>
          </div>
        </div>
      </Container>
    </section>
  );
}
