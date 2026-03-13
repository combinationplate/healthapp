"use client";

import Link from "next/link";
import Container from "@/components/ui/Container";

const benefits = [
  {
    title: "Nationally Accredited CE Courses — Free",
    desc: "Access accredited courses in ethics, palliative care, mental health, chronic disease management, and more. Approved for RNs, LPNs, MSWs, LCSWs, case managers, PTs, OTs, and SLPs across all 50 states. Completely free.",
  },
  {
    title: "100% Online, Self-Paced",
    desc: "Complete your CE courses on any device, anytime. No classroom, no travel, no scheduling. Start and finish when it works for you.",
  },
  {
    title: "Request the CEs You Need",
    desc: "Need specific CE hours before your license renewal deadline? Submit a request through Pulse and get matched with a local rep who can provide the right course — for free.",
  },
  {
    title: "Connect with Local Reps",
    desc: "Reps at hospice, home health, and rehab companies in your area want to provide you with free CEs. You control your visibility — your contact info is only shared if you accept.",
  },
  {
    title: "No Account Needed to Start",
    desc: "Scan a QR code or click a link from a rep and you'll receive your free CE course by email instantly. Register later to manage your courses, make requests, and connect with more reps.",
  },
];

const disciplines = ["RN / LPN", "MSW / LCSW", "Case Managers", "PT / OT / SLP"];

export default function HCPSection() {
  return (
    <section id="professionals" className="bg-cream py-[100px]">
      <Container>
        <p className="section-label text-center text-[13px] font-bold uppercase tracking-[.12em] text-teal">
          For Nurses, Social Workers, Case Managers &amp; Therapists
        </p>
        <h2 className="section-title mt-3 text-center font-serif text-[clamp(30px,4vw,44px)] font-extrabold tracking-[-.02em]">
          Free, Nationally Accredited CE Courses
        </h2>
        <p className="section-sub mx-auto mb-16 max-w-[640px] text-center text-[18px] text-ink-soft">
          Every licensed healthcare professional needs continuing education credits
          — and most facilities don&apos;t pay for them. Register for Pulse and
          get free, accredited CE courses delivered to your inbox. No catch.
        </p>
        <div className="grid gap-14 lg:grid-cols-2 lg:items-start">
          <ul className="list-none">
            {benefits.map((b) => (
              <li
                key={b.title}
                className="flex gap-4 border-b border-[var(--border)] py-[18px] [&:last-child]:border-0"
              >
                <span className="mt-0.5 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-[var(--teal-glow)] text-[14px] font-extrabold text-teal">
                  ✓
                </span>
                <div>
                  <h4 className="text-[15px] font-bold">{b.title}</h4>
                  <p className="mt-1 text-[14px] leading-[1.6] text-ink-soft">
                    {b.desc}
                  </p>
                </div>
              </li>
            ))}
          </ul>
          <div className="rounded-[var(--r-xl)] border border-[rgba(13,148,136,.15)] bg-gradient-to-br from-[#F0FDF4] to-[#ECFDF5] p-11 text-center">
            <div className="mb-3.5 text-[52px]">🎓</div>
            <h3 className="text-[26px] font-extrabold">100% Free. Always.</h3>
            <p className="mt-2.5 mb-6 text-[15px] leading-[1.6] text-ink-soft">
              Register and start getting free, nationally accredited CE courses
              matched to your discipline and state.
            </p>
            <Link
              href="/signup?type=hcp"
              className="inline-flex items-center justify-center rounded-[var(--r)] bg-teal px-9 py-4 text-base font-bold text-white shadow-glow-teal transition-all hover:bg-teal-dark hover:-translate-y-0.5"
            >
              Create My Free Account
            </Link>
            <div className="mt-5 flex flex-wrap justify-center gap-2">
              {disciplines.map((d) => (
                <span
                  key={d}
                  className="rounded-[20px] border border-[rgba(13,148,136,.12)] bg-[rgba(13,148,136,.08)] px-3.5 py-1.5 text-[12px] font-semibold text-teal"
                >
                  {d}
                </span>
              ))}
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
