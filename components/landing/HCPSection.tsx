"use client";

import Container from "@/components/ui/Container";
import { showModal } from "./LandingModals";

const benefits = [
  {
    title: "Free CE Courses",
    desc: "Access accredited courses in ethics, palliative care, mental health, and more — completely free, matched to your state licensing requirements and discipline.",
  },
  {
    title: "Local Events & Lunch-and-Learns",
    desc: "Get notified about educational events, in-services, and lunch-and-learns near you. RSVP directly through Pulse — many include free CE credit.",
  },
  {
    title: "Career Opportunities",
    desc: "Discover open positions at hospice, home health, and rehab companies in your area. Reps share opportunities directly — often before they're posted publicly.",
  },
  {
    title: "Network with Local Reps",
    desc: "Connect with representatives who can provide resources, CE courses, and support for your patients. You control your visibility and privacy.",
  },
  {
    title: "Request What You Need",
    desc: "Need specific CE hours before your deadline? Submit a request and get matched with a rep who can provide the right course.",
  },
];

const disciplines = ["RN / LPN", "MSW / LCSW", "Case Managers", "PT / OT / SLP"];

export default function HCPSection() {
  return (
    <section id="professionals" className="bg-cream py-[100px]">
      <Container>
        <p className="section-label text-center text-[13px] font-bold uppercase tracking-[.12em] text-teal">
          For Healthcare Professionals
        </p>
        <h2 className="section-title mt-3 text-center font-serif text-[clamp(30px,4vw,44px)] font-extrabold tracking-[-.02em]">
          Free CEs, Events, Career Opportunities &amp; More
        </h2>
        <p className="section-sub mx-auto mb-16 max-w-[640px] text-center text-[18px] text-ink-soft">
          Pulse isn&apos;t just for sales teams. Register and get direct access
          to free continuing education, local events, career opportunities, and
          connections with reps who want to help.
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
              Register and start getting free CE courses, event invites, career
              opportunities, and rep connections in your area.
            </p>
            <button
              type="button"
              onClick={() => showModal("hcp")}
              className="inline-flex items-center justify-center rounded-[var(--r)] bg-teal px-9 py-4 text-base font-bold text-white shadow-glow-teal transition-all hover:bg-teal-dark hover:-translate-y-0.5"
            >
              Create My Free Account
            </button>
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
