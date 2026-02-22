import Container from "@/components/ui/Container";

const cards = [
  {
    accent: "blue",
    icon: "📚",
    title: "CE Course Distribution",
    desc: "Browse a unified catalog from multiple CE providers. State-compliant, discipline-specific. Send complimentary or discounted courses with one click — auto-tracked, auto-billed.",
    tag: "Most Popular",
    tagClass: "bg-[rgba(232,96,76,.08)] text-coral",
  },
  {
    accent: "teal",
    icon: "📷",
    title: "QR Codes & Field Tools",
    desc: "Generate QR codes for events, courses, or your personal rep page. Professionals scan, sign up, and claim CE access in 30 seconds. Auto-generated flyers included.",
    tag: "New",
    tagClass: "bg-[var(--teal-glow)] text-teal",
  },
  {
    accent: "coral",
    icon: "📅",
    title: "Event & Lunch Management",
    desc: "Plan lunch-and-learns, in-services, and CE workshops. Manage RSVPs, send reminders, pair events with CE courses, and target by discipline and location.",
  },
  {
    accent: "teal",
    icon: "🔍",
    title: "Professional Discovery",
    desc: "Find nurses, social workers, case managers, and therapists in your territory who are actively looking for CE courses, events, and rep connections.",
  },
  {
    accent: "blue",
    icon: "📊",
    title: "Relationship Tracking",
    desc: "Log every touchpoint — calls, visits, CEs sent, events. See full contact history and engagement scores. Know exactly when to follow up.",
  },
  {
    accent: "coral",
    icon: "🏆",
    title: "Team Gamification",
    desc: "Points for every touchpoint. Weekly leaderboards. Team goals. Managers get full visibility into rep activity, CE distribution, and event performance.",
  },
  {
    accent: "blue",
    icon: "📈",
    title: "Analytics & Reporting",
    desc: "Track CE engagement, event attendance, touchpoint frequency, and network growth. See what's driving referrals and where to double down.",
  },
];

const accentBorder: Record<string, string> = {
  blue: "bg-gradient-to-r from-blue to-[#6B8AFF]",
  teal: "bg-gradient-to-r from-teal to-[#5EEAD4]",
  coral: "bg-gradient-to-r from-coral to-[#FCA5A5]",
};

const iconBg: Record<string, string> = {
  blue: "bg-[var(--blue-glow)]",
  teal: "bg-[var(--teal-glow)]",
  coral: "bg-[rgba(232,96,76,.08)]",
};

export default function Toolkit() {
  return (
    <section id="toolkit" className="bg-white py-[100px]">
      <Container>
        <p className="section-label text-center text-[13px] font-bold uppercase tracking-[.12em] text-blue">
          Your Toolkit
        </p>
        <h2 className="section-title mt-3 text-center font-serif text-[clamp(30px,4vw,44px)] font-extrabold tracking-[-.02em]">
          Seven Tools. One Platform. More Referrals.
        </h2>
        <p className="section-sub mx-auto mb-16 max-w-[640px] text-center text-[18px] text-ink-soft">
          Stop juggling spreadsheets, emails, and catalogs. Pulse gives your
          sales team every tool they need to build and maintain referral
          relationships.
        </p>
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {cards.map((c) => (
            <div
              key={c.title}
              className="group relative overflow-hidden rounded-[var(--r-xl)] border border-[var(--border)] bg-white p-9 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_12px_40px_rgba(0,0,0,.06)]"
            >
              <div
                className="absolute left-0 right-0 top-0 h-[3px] opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                style={{
                  background:
                    c.accent === "blue"
                      ? "linear-gradient(90deg,#2455FF,#6B8AFF)"
                      : c.accent === "teal"
                        ? "linear-gradient(90deg,#0D9488,#5EEAD4)"
                        : "linear-gradient(90deg,#E8604C,#FCA5A5)",
                }}
              />
              <div
                className={`mb-5 flex h-[52px] w-[52px] items-center justify-center rounded-[14px] text-[26px] ${iconBg[c.accent]}`}
              >
                {c.icon}
              </div>
              <h3 className="mb-2.5 text-[20px] font-bold">{c.title}</h3>
              <p className="text-[14px] leading-[1.7] text-ink-soft">{c.desc}</p>
              {c.tag && (
                <span
                  className={`mt-3.5 inline-block rounded-[20px] px-3 py-1 text-[11px] font-bold ${c.tagClass}`}
                >
                  {c.tag}
                </span>
              )}
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}
