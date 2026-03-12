import Container from "@/components/ui/Container";

const cards = [
  {
    accent: "teal",
    icon: "🎓",
    title: "Free, Nationally Accredited CEs",
    desc: "Accredited continuing education courses in ethics, palliative care, mental health, chronic disease management, and more — free for nurses, social workers, case managers, PTs, OTs, and SLPs. Approved across all 50 states.",
    tag: "Core Feature",
    tagClass: "bg-[var(--teal-glow)] text-teal",
  },
  {
    accent: "blue",
    icon: "📚",
    title: "CE Distribution Tools",
    desc: "Sales reps send CE courses to professionals via email, QR code, or bulk send — with one click. Auto-generated coupon codes, tracking, and billing built in.",
    tag: "Most Popular",
    tagClass: "bg-[rgba(232,96,76,.08)] text-coral",
  },
  {
    accent: "teal",
    icon: "📱",
    title: "QR Codes & Flyers",
    desc: "Generate branded QR codes and print-ready flyers with your company name. Leave them at facilities — nurses scan and get a free CE instantly. No app needed.",
  },
  {
    accent: "blue",
    icon: "🔍",
    title: "Professional Discovery",
    desc: "Find nurses, social workers, case managers, and therapists in your territory who are actively requesting CE courses. Connect before your competitors do.",
  },
  {
    accent: "coral",
    icon: "📅",
    title: "Event Management",
    desc: "Invite professionals in your network to lunch-and-learns, in-services, and CE workshops. Manage RSVPs, send reminders, and pair events with free CE courses.",
  },
  {
    accent: "coral",
    icon: "👥",
    title: "Network & Touchpoint Tracking",
    desc: "Build your referral network. Import contacts via CSV or add them one by one. Log calls, visits, and CE sends. See exactly who to follow up with and when.",
  },
  {
    accent: "blue",
    icon: "📊",
    title: "Manager Dashboard",
    desc: "See how many CEs each rep is distributing, their network size, redemption rates, and last activity. Invite new reps with a link. Full team visibility.",
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
    <section id="how-it-works" className="bg-white py-[100px]">
      <Container>
        <p className="section-label text-center text-[13px] font-bold uppercase tracking-[.12em] text-teal">
          How It Works
        </p>
        <h2 className="section-title mt-3 text-center font-serif text-[clamp(30px,4vw,44px)] font-extrabold tracking-[-.02em]">
          Two Audiences. One Platform.
        </h2>
        <p className="section-sub mx-auto mb-16 max-w-[640px] text-center text-[18px] text-ink-soft">
          Professionals get free, nationally accredited CEs. Sales teams get the
          referral relationships that come from providing them. Everybody wins.
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
