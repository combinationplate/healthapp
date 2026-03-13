"use client";

import Container from "@/components/ui/Container";
import Link from "next/link";

const problemItems = [
  "Finding the right CE for each discipline & state takes forever",
  "Sending courses means manually copying coupon codes into emails",
  "No way to discover new professionals seeking CEs in your territory",
  "Managers have zero visibility into rep CE activity or engagement",
];

const solutionItems = [
  "Unified CE catalog — one-click send, QR distribution, or bulk send",
  "Branded flyers with your company name and QR code",
  "Discover professionals actively requesting CEs in your territory",
  "Manager dashboard with per-rep CE tracking and redemption rates",
];

export default function ProblemSolution() {
  return (
    <section className="bg-white py-[100px]">
      <Container>
        <div className="mb-20 grid items-center gap-[72px] lg:grid-cols-2">
          <div>
            <p className="text-[13px] font-bold uppercase tracking-[.12em] text-blue">
              The Problem
            </p>
            <h2 className="mt-5 font-serif text-[clamp(28px,3.5vw,40px)] font-extrabold leading-tight tracking-[-.02em]">
              Your Reps Spend $500 per Lunch. What Do They Get Back?
            </h2>
            <p className="mt-5 text-[17px] leading-[1.8] text-ink-soft">
              Your reps know that providing free CEs builds referral relationships
              — but the logistics are a nightmare. Finding the right course,
              generating codes, emailing individuals, tracking who used what.
              There&apos;s no single system, and no visibility into what&apos;s
              actually working.
            </p>
            <ul className="mt-7 list-none">
              {problemItems.map((item) => (
                <li
                  key={item}
                  className="flex items-center gap-3 border-b border-[var(--border)] py-2.5 text-[15px] [&:last-child]:border-0"
                >
                  <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-teal text-[13px] font-bold text-white">
                    ✓
                  </span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div className="flex min-h-[340px] items-center justify-center rounded-[var(--r-xl)] border border-[var(--border)] bg-cream p-12">
            <div className="text-center">
              <span className="mb-4 block text-[72px]">⏰</span>
              <h4 className="text-[22px] font-bold text-ink-muted">
                Hours Wasted Every Week
              </h4>
              <p className="text-[16px] text-ink-muted">
                Searching · Copying · Emailing · Guessing
              </p>
            </div>
          </div>
        </div>
        <div className="grid items-center gap-[72px] lg:grid-cols-2 lg:flex-row-reverse" style={{ direction: "rtl" }}>
          <div className="flex min-h-[340px] items-center justify-center rounded-[var(--r-xl)] border border-[var(--border)] bg-cream p-12" style={{ direction: "ltr" }}>
            <div className="text-center">
              <span className="mb-4 block text-[72px]">⚡</span>
              <h4 className="text-[22px] font-bold text-teal">
                One Platform. Every Tool.
              </h4>
              <p className="text-[16px] text-ink-muted">
                CEs · Events · QR Codes · Tracking · Discovery
              </p>
            </div>
          </div>
          <div style={{ direction: "ltr" }}>
            <p className="text-[13px] font-bold uppercase tracking-[.12em] text-teal">
              The Solution
            </p>
            <h2 className="mt-5 font-serif text-[clamp(28px,3.5vw,40px)] font-extrabold leading-tight tracking-[-.02em]">
              Pulse Puts Everything Your Sales Team Needs in One Place
            </h2>
            <p className="mt-5 text-[17px] leading-[1.8] text-ink-soft">
              Send free, nationally accredited CE courses in seconds — via email,
              QR code, or bulk send. Build your referral network, discover
              professionals seeking CEs, track every touchpoint, and give
              managers full team visibility.
            </p>
            <ul className="mt-7 list-none">
              {solutionItems.map((item) => (
                <li
                  key={item}
                  className="flex items-center gap-3 border-b border-[var(--border)] py-2.5 text-[15px] [&:last-child]:border-0"
                >
                  <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-teal text-[13px] font-bold text-white">
                    ✓
                  </span>
                  {item}
                </li>
              ))}
            </ul>
            <Link
              href="/signup?type=sales"
              className="mt-7 inline-flex items-center gap-2 rounded-[var(--r)] bg-blue px-9 py-4 text-base font-bold text-white shadow-glow transition-all hover:bg-blue-dark hover:-translate-y-0.5"
            >
              Get Started Free
            </Link>
          </div>
        </div>
      </Container>
    </section>
  );
}
