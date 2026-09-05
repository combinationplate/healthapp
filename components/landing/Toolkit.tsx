import Link from "next/link";
import Container from "@/components/ui/Container";

const cards = [
  {
    accent: "teal",
    icon: "🎓",
    title: "Free, Accredited CEs",
    desc: "Accredited continuing education courses in ethics, palliative care, mental health, chronic disease management, and more — free for nurses, social workers, case managers, PTs, OTs, and SLPs. National accreditation where it exists, state approval and reciprocity where it doesn't.",
    tag: "Core Feature",
    tagClass: "bg-[var(--teal-glow)] text-teal",
  },
  {
    accent: "blue",
    icon: "📚",
    title: "CE Distribution Tools",
    desc: "Sales reps sponsor CE courses for professionals via email, QR code, or bulk send — with one click. Delivery tracking and pay-only-when-opened billing built in.",
    tag: "Most Popular",
    tagClass: "bg-[rgba(232,96,76,.08)] text-coral",
  },
  {
    accent: "teal",
    icon: "📱",
    title: "QR Codes & Flyers",
    desc: "Generate branded QR codes and print-ready flyers with your company name. Leave them at facilities — nurses scan and get their sponsored CE instantly. No app needed.",
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
        <p className="section-sub mx-auto mb-10 max-w-[640px] text-center text-[18px] text-ink-soft">
          Nurses, social workers, case managers, and therapists get free,
          accredited CEs. Sales teams sponsor them — and get the referral
          relationships that come with it. Everybody wins.
        </p>
        <div className="mx-auto mb-16 grid max-w-[860px] gap-4 sm:grid-cols-2">
          <div className="rounded-[var(--r-lg)] border border-[rgba(13,148,136,.15)] bg-[var(--teal-glow)] p-6">
            <div className="text-[12px] font-bold uppercase tracking-[.08em] text-teal">If you&apos;re a healthcare professional</div>
            <p className="mt-2 text-[15px] leading-[1.6] text-ink">
              Every course is <strong>100% free to you</strong>, sponsored by a local hospice, home health, or rehab
              team. No credit card, no catch, no account needed to start.
            </p>
          </div>
          <div className="rounded-[var(--r-lg)] border border-[rgba(36,85,255,.15)] bg-[var(--blue-glow)] p-6">
            <div className="text-[12px] font-bold uppercase tracking-[.08em] text-blue">If you&apos;re on a sales team</div>
            <p className="mt-2 text-[15px] leading-[1.6] text-ink">
              The platform is free. You pay <strong>$15 per CE credit hour</strong> — only when a professional
              opens the course, never on send. Your first one is on us.{" "}
              <Link href="/pricing" className="font-bold text-blue hover:underline">See pricing →</Link>
            </p>
          </div>
        </div>
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
