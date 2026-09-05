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
              Your reps know that sponsoring CEs builds referral relationships
              — but the logistics are a nightmare. Finding the right course,
              generating codes, emailing individuals, tracking who used what.
              There&apos;s no single system, and no visibility into what&apos;s
              actually working.
            </p>
            <p className="mt-4 text-[17px] leading-[1.8] text-ink-soft">
              On Pulse a sponsored CE is <strong className="text-ink">$15</strong>, and you pay only
              when the professional actually opens it — a tracked, attributed
              touchpoint for less than the tip on that lunch.
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
          <div className="flex min-h-[340px] flex-col justify-center gap-4 rounded-[var(--r-xl)] border border-[var(--border)] bg-cream p-8 sm:p-10">
            <div className="rounded-[var(--r-lg)] border border-[var(--border)] bg-white p-6">
              <div className="flex items-baseline justify-between gap-4">
                <span className="font-serif text-[40px] font-black leading-none text-ink-muted">$500</span>
                <span className="text-[12px] font-bold uppercase tracking-[.08em] text-ink-muted">One lunch-and-learn</span>
              </div>
              <p className="mt-3 text-[14px] leading-[1.6] text-ink-soft">
                Whoever showed up. No record of who it reached, no follow-up trigger, nothing your manager can see.
              </p>
            </div>
            <div className="rounded-[var(--r-lg)] border border-[rgba(36,85,255,.2)] bg-white p-6 shadow-[0_8px_30px_rgba(36,85,255,.08)]">
              <div className="flex items-baseline justify-between gap-4">
                <span className="font-serif text-[40px] font-black leading-none text-blue">$15</span>
                <span className="text-[12px] font-bold uppercase tracking-[.08em] text-blue">One sponsored CE</span>
              </div>
              <p className="mt-3 text-[14px] leading-[1.6] text-ink-soft">
                Delivered with your rep&apos;s name on it. You see when it was opened. Billed only if it is — and the first one is free.
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
              Sponsor accredited CE courses in seconds — via email,
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
            <div className="mt-7 flex flex-wrap items-center gap-4">
              <Link
                href="/signup?type=sales"
                className="inline-flex items-center gap-2 rounded-[var(--r)] bg-blue px-9 py-4 text-base font-bold text-white shadow-glow transition-all hover:bg-blue-dark hover:-translate-y-0.5"
              >
                Start Free — First CE On Us
              </Link>
              <Link href="/pricing" className="text-[15px] font-semibold text-blue hover:underline">
                See pricing →
              </Link>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
