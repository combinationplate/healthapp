import Link from "next/link";
import { LandingNav } from "@/components/landing/LandingNav";

export default function HomePage() {
  return (
    <>
      <LandingNav />
      {/* Hero */}
      <section className="relative bg-[var(--cream)] px-7 pb-20 pt-[100px] before:absolute before:bottom-0 before:left-0 before:right-0 before:h-[100px] before:bg-gradient-to-b before:from-transparent before:to-white">
        <div className="relative z-10 mx-auto max-w-[860px] text-center">
          <div className="animate-fade-up mb-7 inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-white px-5 py-2 text-[13px] font-semibold text-[var(--ink-soft)] shadow-[0_2px_12px_rgba(0,0,0,.04)]">
            <span className="font-bold text-[var(--blue)]">New</span> For hospice, home health & rehab sales teams
          </div>
          <h1 className="font-[family-name:var(--font-fraunces)] text-[clamp(38px,5.5vw,68px)] font-black leading-[1.08] tracking-tight text-[var(--ink)] mb-6 animate-fade-up-d1">
            The Marketing Toolkit That <em className="italic text-[var(--blue)]">Wins</em> Referrals
          </h1>
          <p className="animate-fade-up-d2 mx-auto mb-10 max-w-[680px] text-[19px] text-[var(--ink-soft)] leading-[1.7]">
            CE course distribution, event management, QR-powered field tools, relationship tracking, and professional discovery — everything your sales team needs in one platform.
          </p>
          <div className="animate-fade-up-d3 flex flex-wrap justify-center gap-3.5">
            <Link
              href="/signup?type=sales"
              className="inline-flex items-center gap-2 rounded-[var(--r)] bg-[var(--blue)] px-9 py-4 text-base font-bold text-white shadow-[0_4px_24px_rgba(36,85,255,.25)] transition-all hover:bg-[var(--blue-dark)] hover:-translate-y-0.5 hover:shadow-[0_8px_32px_rgba(36,85,255,.3)]"
            >
              Request a Demo
            </Link>
            <Link
              href="/#professionals"
              className="inline-flex items-center gap-2 rounded-[var(--r)] border-2 border-[var(--border)] bg-white px-9 py-4 text-base font-bold text-[var(--ink)] transition-colors hover:border-[var(--teal)] hover:text-[var(--teal)]"
            >
              I&apos;m a Healthcare Professional
            </Link>
          </div>
        </div>
      </section>

      {/* Toolkit */}
      <section id="toolkit" className="bg-white px-7 py-[100px]">
        <div className="mx-auto max-w-[1200px]">
          <div className="text-center text-[13px] font-bold uppercase tracking-widest text-[var(--blue)] mb-3">Your Toolkit</div>
          <h2 className="font-[family-name:var(--font-fraunces)] text-center text-[clamp(30px,4vw,44px)] font-extrabold tracking-tight text-[var(--ink)] mb-4">
            Seven Tools. One Platform. More Referrals.
          </h2>
          <p className="mx-auto mb-16 max-w-[640px] text-center text-lg text-[var(--ink-soft)]">
            Stop juggling spreadsheets, emails, and catalogs. Pulse gives your sales team every tool they need to build and maintain referral relationships.
          </p>
          <div className="grid gap-6 md:grid-cols-3">
            {[
              { icon: "📚", title: "CE Course Distribution", desc: "Browse a unified catalog from multiple CE providers. State-compliant, discipline-specific. Send complimentary or discounted courses with one click — auto-tracked, auto-billed.", tag: "Most Popular", accent: "blue" },
              { icon: "📷", title: "QR Codes & Field Tools", desc: "Generate QR codes for events, courses, or your personal rep page. Professionals scan, sign up, and claim CE access in 30 seconds. Auto-generated flyers included.", tag: "New", accent: "teal" },
              { icon: "📅", title: "Event & Lunch Management", desc: "Plan lunch-and-learns, in-services, and CE workshops. Manage RSVPs, send reminders, pair events with CE courses, and target by discipline and location.", tag: null, accent: "coral" },
              { icon: "🔍", title: "Professional Discovery", desc: "Find nurses, social workers, case managers, and therapists in your territory who are actively looking for CE courses, events, and rep connections.", tag: null, accent: "teal" },
              { icon: "📊", title: "Relationship Tracking", desc: "Log every touchpoint — calls, visits, CEs sent, events. See full contact history and engagement scores. Know exactly when to follow up.", tag: null, accent: "blue" },
              { icon: "🏆", title: "Team Gamification", desc: "Points for every touchpoint. Weekly leaderboards. Team goals. Managers get full visibility into rep activity, CE distribution, and event performance.", tag: null, accent: "coral" },
              { icon: "📈", title: "Analytics & Reporting", desc: "Track CE engagement, event attendance, touchpoint frequency, and network growth. See what's driving referrals and where to double down.", tag: null, accent: "blue" },
            ].map((card) => (
              <div
                key={card.title}
                className={`relative overflow-hidden rounded-[var(--r-xl)] border border-[var(--border)] bg-white p-9 transition-all hover:-translate-y-1 hover:shadow-[0_12px_40px_rgba(0,0,0,.06)] before:absolute before:left-0 before:right-0 before:top-0 before:h-1 before:opacity-0 before:transition-opacity hover:before:opacity-100 ${
                  card.accent === "blue" ? "before:bg-gradient-to-r before:from-[var(--blue)] before:to-[#6B8AFF]" :
                  card.accent === "teal" ? "before:bg-gradient-to-r before:from-[var(--teal)] before:to-[#5EEAD4]" :
                  "before:bg-gradient-to-r before:from-[var(--coral)] before:to-[#FCA5A5]"
                }`}
              >
                <div className={`mb-5 flex h-[52px] w-[52px] items-center justify-center rounded-[14px] text-[26px] ${
                  card.accent === "blue" ? "bg-[var(--blue-glow)]" : card.accent === "teal" ? "bg-[var(--teal-glow)]" : "bg-[rgba(232,96,76,.08)]"
                }`}>
                  {card.icon}
                </div>
                <h3 className="mb-2.5 text-xl font-bold text-[var(--ink)]">{card.title}</h3>
                <p className="text-sm leading-[1.7] text-[var(--ink-soft)]">{card.desc}</p>
                {card.tag && (
                  <span className={`mt-3.5 inline-block rounded-full px-3 py-1 text-[11px] font-bold ${
                    card.tag === "Most Popular" ? "bg-[rgba(232,96,76,.08)] text-[var(--coral)]" : "bg-[var(--teal-glow)] text-[var(--teal)]"
                  }`}>
                    {card.tag}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Distribution */}
      <section id="distribution" className="bg-[var(--cream)] px-7 py-[100px]">
        <div className="mx-auto max-w-[1200px]">
          <div className="grid gap-16 items-center max-md:grid-cols-1 md:grid-cols-2">
            <div>
              <div className="text-left text-[13px] font-bold uppercase tracking-widest text-[var(--blue)] mb-3">Distribution Made Easy</div>
              <h2 className="font-[family-name:var(--font-fraunces)] text-[clamp(28px,3.5vw,40px)] font-extrabold leading-tight tracking-tight text-[var(--ink)] mb-5">
                Four Ways to Get CE Courses Into Professionals&apos; Hands
              </h2>
              <p className="text-base text-[var(--ink-soft)] leading-relaxed mb-7">
                Whether you&apos;re at a lunch-and-learn, visiting a facility, or following up from your desk — Pulse gives you the right tool for every situation.
              </p>
              <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
                {[
                  { icon: "📱", title: "QR Code Scan", desc: "Show a QR code on your phone, flyer, or table tent. Professional scans, enters info, has CE access instantly." },
                  { icon: "📧", title: "Direct Send", desc: "Pick a professional, select a course, send. They get an email with a direct link — no codes to type." },
                  { icon: "📄", title: "Event Flyers", desc: "Auto-generated print-ready flyers with QR codes. Download PDF, print, distribute." },
                  { icon: "👥", title: "Bulk Send", desc: "After an event, send courses to everyone who signed up — all at once." },
                ].map((d) => (
                  <div key={d.title} className="rounded-[var(--r-lg)] border border-[var(--border)] bg-white p-6 transition-all hover:shadow-[0_4px_20px_rgba(0,0,0,.06)] hover:-translate-y-0.5">
                    <span className="text-[28px] block mb-2.5">{d.icon}</span>
                    <h4 className="text-[15px] font-bold text-[var(--ink)] mb-1.5">{d.title}</h4>
                    <p className="text-[13px] text-[var(--ink-soft)] leading-relaxed m-0">{d.desc}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-[var(--r-xl)] border border-[var(--border)] bg-white p-10 overflow-hidden">
              <div className="w-[260px] mx-auto bg-[var(--cream)] rounded-[28px] p-4 border-2 border-[var(--border)] shadow-[0_20px_60px_rgba(0,0,0,.08)]">
                <div className="w-[120px] h-1.5 bg-[var(--border)] rounded-full mx-auto mb-4" />
                <div className="rounded-2xl bg-white p-6 text-center">
                  <div className="w-[140px] h-[140px] mx-auto mb-4 rounded-xl bg-[var(--ink)] flex items-center justify-center text-white text-[11px] font-semibold">QR CODE</div>
                  <h4 className="text-sm font-bold text-[var(--ink)] mb-1">Free Ethics CE</h4>
                  <p className="text-[11px] text-[var(--ink-muted)]">2 hours · Approved for RNs in TX</p>
                  <p className="mt-2 text-[10px] text-[var(--teal)] font-bold">From Marcus Johnson</p>
                  <button type="button" className="block w-full mt-3 mx-auto bg-[var(--teal)] text-white border-none py-2.5 px-5 rounded-[var(--r)] text-xs font-bold font-sans">Claim Free Course</button>
                </div>
              </div>
              <p className="text-center text-xs text-[var(--ink-muted)] mt-5">Scan → register → access course<br />All in under 30 seconds</p>
            </div>
          </div>
        </div>
      </section>

      {/* Problem / Solution */}
      <section className="bg-white px-7 py-[100px]">
        <div className="mx-auto max-w-[1200px]">
          <div className="grid gap-[72px] items-center mb-20 max-md:grid-cols-1 md:grid-cols-2">
            <div>
              <div className="text-left text-[13px] font-bold uppercase tracking-widest text-[var(--blue)] mb-3">The Problem</div>
              <h2 className="font-[family-name:var(--font-fraunces)] text-[clamp(28px,3.5vw,40px)] font-extrabold leading-tight tracking-tight text-[var(--ink)] mb-5">
                Healthcare Marketing Is Manual, Fragmented, and Hard to Track
              </h2>
              <p className="text-[17px] text-[var(--ink-soft)] leading-relaxed mb-7">
                Your team is searching CE catalogs manually, managing events in spreadsheets, and hoping people remember your lunches. There&apos;s no single system — and no visibility into what&apos;s working.
              </p>
              <ul className="list-none mb-7">
                {["Finding the right CE course for each discipline & state takes forever", "Event planning is scattered across email, phone, and paper", "No way to discover new professionals seeking resources", "Managers can't see what the team is actually doing"].map((item) => (
                  <li key={item} className="py-2.5 text-[15px] flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-[var(--teal)] text-white flex items-center justify-center font-bold text-[13px] shrink-0">✓</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-[var(--r-xl)] border border-[var(--border)] bg-[var(--cream)] p-12 min-h-[340px] flex items-center justify-center">
              <div className="text-center">
                <span className="text-[72px] block mb-4">⏰</span>
                <h4 className="text-[22px] font-bold text-[var(--ink-muted)] mb-2">Hours Wasted Every Week</h4>
                <p className="text-[var(--ink-muted)] text-base">Searching · Copying · Emailing · Guessing</p>
              </div>
            </div>
          </div>
          <div className="grid gap-[72px] items-center max-md:grid-cols-1 md:grid-cols-2 md:direction-rtl">
            <div className="md:direction-ltr rounded-[var(--r-xl)] border border-[var(--border)] bg-[var(--cream)] p-12 min-h-[340px] flex items-center justify-center">
              <div className="text-center">
                <span className="text-[72px] block mb-4">⚡</span>
                <h4 className="text-[22px] font-bold text-[var(--teal)] mb-2">One Platform. Every Tool.</h4>
                <p className="text-[var(--ink-muted)] text-base">CEs · Events · QR Codes · Tracking · Discovery</p>
              </div>
            </div>
            <div className="md:direction-ltr">
              <div className="text-left text-[13px] font-bold uppercase tracking-widest text-[var(--teal)] mb-3">The Solution</div>
              <h2 className="font-[family-name:var(--font-fraunces)] text-[clamp(28px,3.5vw,40px)] font-extrabold leading-tight tracking-tight text-[var(--ink)] mb-5">
                Pulse Puts Everything Your Sales Team Needs in One Place
              </h2>
              <p className="text-[17px] text-[var(--ink-soft)] leading-relaxed mb-7">
                Distribute CE courses in seconds — via QR, email, or in bulk. Plan and promote events. Discover professionals in your territory. Track every touchpoint. All state and discipline-aware.
              </p>
              <ul className="list-none mb-7">
                {["Unified CE catalog with one-click sending and QR distribution", "Built-in event management with RSVP tracking", "Discover professionals actively seeking resources", "Gamified team performance with manager dashboards"].map((item) => (
                  <li key={item} className="py-2.5 text-[15px] flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-[var(--teal)] text-white flex items-center justify-center font-bold text-[13px] shrink-0">✓</span>
                    {item}
                  </li>
                ))}
              </ul>
              <Link href="/signup?type=sales" className="inline-flex items-center gap-2 rounded-[var(--r)] bg-[var(--blue)] px-9 py-4 text-base font-bold text-white shadow-[0_4px_24px_rgba(36,85,255,.25)] hover:bg-[var(--blue-dark)] hover:-translate-y-0.5">Request a Demo</Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="bg-[var(--ink)] px-7 py-14 text-white">
        <div className="mx-auto max-w-[1200px]">
          <div className="grid gap-8 text-center max-md:grid-cols-2 md:grid-cols-4">
            <div><div className="font-[family-name:var(--font-fraunces)] text-[44px] font-black mb-1 text-[#6B8AFF]">100%</div><div className="text-sm font-medium text-white/55">Of licensed professionals need CE credits</div></div>
            <div><div className="font-[family-name:var(--font-fraunces)] text-[44px] font-black mb-1 text-[#5EEAD4]">20–30</div><div className="text-sm font-medium text-white/55">Avg CE hours required per renewal</div></div>
            <div><div className="font-[family-name:var(--font-fraunces)] text-[44px] font-black mb-1 text-[#FCA5A5]">$0</div><div className="text-sm font-medium text-white/55">What most facilities budget for staff CEs</div></div>
            <div><div className="font-[family-name:var(--font-fraunces)] text-[44px] font-black mb-1 text-[#FCD34D]">30s</div><div className="text-sm font-medium text-white/55">To distribute a CE via QR scan</div></div>
          </div>
        </div>
      </section>

      {/* For Healthcare Professionals */}
      <section id="professionals" className="bg-[var(--cream)] px-7 py-[100px]">
        <div className="mx-auto max-w-[1200px]">
          <div className="text-center text-[13px] font-bold uppercase tracking-widest text-[var(--teal)] mb-3">For Healthcare Professionals</div>
          <h2 className="font-[family-name:var(--font-fraunces)] text-center text-[clamp(30px,4vw,44px)] font-extrabold tracking-tight text-[var(--ink)] mb-4">
            Free CEs, Events, Career Opportunities & More
          </h2>
          <p className="mx-auto mb-16 max-w-[640px] text-center text-lg text-[var(--ink-soft)]">
            Pulse isn&apos;t just for sales teams. Register and get direct access to free continuing education, local events, career opportunities, and connections with reps who want to help.
          </p>
          <div className="grid gap-14 items-start max-md:grid-cols-1 md:grid-cols-2">
            <ul className="list-none">
              {[
                { title: "Free CE Courses", desc: "Access accredited courses in ethics, palliative care, mental health, and more — completely free, matched to your state licensing requirements and discipline." },
                { title: "Local Events & Lunch-and-Learns", desc: "Get notified about educational events, in-services, and lunch-and-learns near you. RSVP directly through Pulse — many include free CE credit." },
                { title: "Career Opportunities", desc: "Discover open positions at hospice, home health, and rehab companies in your area. Reps share opportunities directly — often before they're posted publicly." },
                { title: "Network with Local Reps", desc: "Connect with representatives who can provide resources, CE courses, and support for your patients. You control your visibility and privacy." },
                { title: "Request What You Need", desc: "Need specific CE hours before your deadline? Submit a request and get matched with a rep who can provide the right course." },
              ].map((item) => (
                <li key={item.title} className="py-4 border-b border-[var(--border)] flex gap-4 items-start last:border-0">
                  <span className="w-7 h-7 rounded-full bg-[var(--teal-glow)] text-[var(--teal)] flex items-center justify-center font-extrabold text-sm shrink-0 mt-0.5">✓</span>
                  <div>
                    <h4 className="font-bold text-[15px] text-[var(--ink)] mb-0.5">{item.title}</h4>
                    <p className="text-[14px] text-[var(--ink-soft)] leading-relaxed">{item.desc}</p>
                  </div>
                </li>
              ))}
            </ul>
            <div className="rounded-[var(--r-xl)] border border-[rgba(13,148,136,.15)] bg-gradient-to-br from-[#F0FDF4] to-[#ECFDF5] p-11 text-center">
              <div className="text-[52px] mb-3.5">🎓</div>
              <h3 className="font-[family-name:var(--font-fraunces)] text-[26px] font-extrabold text-[var(--ink)] mb-2.5">100% Free. Always.</h3>
              <p className="text-[15px] text-[var(--ink-soft)] leading-relaxed mb-6">
                Register and start getting free CE courses, event invites, career opportunities, and rep connections in your area.
              </p>
              <Link href="/signup?type=hcp" className="inline-flex items-center justify-center gap-2 rounded-[var(--r)] bg-[var(--teal)] px-9 py-4 text-base font-bold text-white shadow-[0_4px_24px_rgba(13,148,136,.25)] hover:bg-[var(--teal-dark)] hover:-translate-y-0.5">
                Create My Free Account
              </Link>
              <div className="flex flex-wrap gap-2 justify-center mt-5">
                {["RN / LPN", "MSW / LCSW", "Case Managers", "PT / OT / SLP"].map((tag) => (
                  <span key={tag} className="rounded-full px-3.5 py-1.5 text-xs font-semibold bg-[rgba(13,148,136,.08)] text-[var(--teal)] border border-[rgba(13,148,136,.12)]">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="bg-white px-7 py-[120px] text-center bg-[radial-gradient(ellipse_50%_80%_at_30%_50%,rgba(36,85,255,.06),transparent),radial-gradient(ellipse_50%_60%_at_80%_40%,var(--teal-glow),transparent)]">
        <div className="mx-auto max-w-[1200px]">
          <h2 className="font-[family-name:var(--font-fraunces)] text-[clamp(30px,4.5vw,48px)] font-black tracking-tight text-[var(--ink)] mb-3.5">
            Ready to Get Started?
          </h2>
          <p className="mx-auto mb-12 max-w-[560px] text-lg text-[var(--ink-soft)]">
            Whether you&apos;re building referral relationships or looking for free CEs, events, and career opportunities — Pulse is free to join.
          </p>
          <div className="mx-auto grid max-w-[780px] gap-6 md:grid-cols-2">
            <div className="rounded-[var(--r-xl)] border border-[var(--border)] bg-white p-10 text-center transition-all hover:-translate-y-1 hover:shadow-[0_12px_40px_rgba(0,0,0,.06)]">
              <span className="mb-3 block text-[40px]">💼</span>
              <h3 className="text-xl font-extrabold text-[var(--ink)] mb-2">Sales Teams & Managers</h3>
              <p className="mb-6 text-sm text-[var(--ink-soft)] leading-relaxed">The complete marketing toolkit — CE distribution, QR field tools, events, tracking, discovery, gamification, and analytics.</p>
              <Link href="/signup?type=sales" className="inline-flex w-full justify-center rounded-[var(--r)] bg-[var(--blue)] px-9 py-4 text-base font-bold text-white transition-all hover:bg-[var(--blue-dark)]">Request a Demo</Link>
            </div>
            <div className="rounded-[var(--r-xl)] border border-[var(--border)] bg-white p-10 text-center transition-all hover:-translate-y-1 hover:shadow-[0_12px_40px_rgba(0,0,0,.06)]">
              <span className="mb-3 block text-[40px]">🧑‍⚕️</span>
              <h3 className="text-xl font-extrabold text-[var(--ink)] mb-2">Healthcare Professionals</h3>
              <p className="mb-6 text-sm text-[var(--ink-soft)] leading-relaxed">Free CE courses, local event notifications, career opportunities, and connections with reps in your area.</p>
              <Link href="/signup?type=hcp" className="inline-flex w-full justify-center rounded-[var(--r)] bg-[var(--teal)] px-9 py-4 text-base font-bold text-white transition-all hover:bg-[var(--teal-dark)]">Register Free</Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[var(--ink)] px-7 py-14 text-white">
        <div className="mx-auto max-w-[1200px]">
          <div className="mb-10 grid gap-12 max-md:grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
            <div className="lg:col-span-2">
              <div className="mb-2.5 flex items-center gap-2 font-[family-name:var(--font-fraunces)] text-[26px] font-extrabold">
                <svg width={28} height={18} viewBox="0 0 36 24"><path d="M0 12 L8 12 L11 4 L15 20 L19 8 L22 14 L25 12 L36 12" fill="none" stroke="#6B8AFF" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"/></svg>
                Pulse
              </div>
              <p className="text-sm leading-[1.7] text-white/45">The marketing toolkit for hospice, home health, and rehab sales teams — and the healthcare professionals they serve.</p>
            </div>
            <div><h4 className="mb-3.5 text-xs font-bold uppercase tracking-widest text-white/35">Product</h4><ul className="list-none"><li className="mb-2"><Link href="/#toolkit" className="text-sm text-white/65 no-underline hover:text-white">Toolkit</Link></li><li className="mb-2"><Link href="/#distribution" className="text-sm text-white/65 no-underline hover:text-white">Distribution</Link></li><li className="mb-2"><Link href="/#professionals" className="text-sm text-white/65 no-underline hover:text-white">For Professionals</Link></li></ul></div>
            <div><h4 className="mb-3.5 text-xs font-bold uppercase tracking-widest text-white/35">Company</h4><ul className="list-none"><li className="mb-2"><Link href="#" className="text-sm text-white/65 no-underline hover:text-white">About</Link></li><li className="mb-2"><Link href="#" className="text-sm text-white/65 no-underline hover:text-white">Contact</Link></li><li className="mb-2"><Link href="#" className="text-sm text-white/65 no-underline hover:text-white">Blog</Link></li></ul></div>
            <div><h4 className="mb-3.5 text-xs font-bold uppercase tracking-widest text-white/35">Legal</h4><ul className="list-none"><li className="mb-2"><Link href="#" className="text-sm text-white/65 no-underline hover:text-white">Privacy</Link></li><li className="mb-2"><Link href="#" className="text-sm text-white/65 no-underline hover:text-white">Terms</Link></li></ul></div>
          </div>
          <div className="border-t border-white/10 pt-5 text-center text-xs text-white/25">© 2026 Pulse. All rights reserved.</div>
        </div>
      </footer>
    </>
  );
}
