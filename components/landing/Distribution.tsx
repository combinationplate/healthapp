import Container from "@/components/ui/Container";

const methods = [
  { icon: "📱", title: "QR Code Scan", desc: "Show a QR code on your phone, flyer, or table tent. Professional scans, enters info, has CE access instantly." },
  { icon: "📧", title: "Direct Send", desc: "Pick a professional, select a course, send. They get an email with a direct link — no codes to type." },
  { icon: "📄", title: "Event Flyers", desc: "Auto-generated print-ready flyers with QR codes. Download PDF, print, distribute." },
  { icon: "👥", title: "Bulk Send", desc: "After an event, send courses to everyone who signed up — all at once." },
];

export default function Distribution() {
  return (
    <section id="distribution" className="bg-cream py-[100px]">
      <Container>
        <div className="grid items-center gap-16 lg:grid-cols-2">
          <div>
            <p className="text-[13px] font-bold uppercase tracking-[.12em] text-blue">
              Distribution Made Easy
            </p>
            <h2 className="mt-3 font-serif text-[clamp(28px,3.5vw,40px)] font-extrabold leading-tight tracking-[-.02em]">
              Four Ways to Get CE Courses Into Professionals&apos; Hands
            </h2>
            <p className="mb-7 text-[16px] leading-[1.8] text-ink-soft">
              Whether you&apos;re at a lunch-and-learn, visiting a facility, or
              following up from your desk — Pulse gives you the right tool for
              every situation.
            </p>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {methods.map((m) => (
                <div
                  key={m.title}
                  className="rounded-[var(--r-lg)] border border-[var(--border)] bg-white p-6 transition-all hover:-translate-y-0.5 hover:shadow-[0_4px_20px_rgba(0,0,0,.06)]"
                >
                  <span className="mb-2.5 block text-[28px]">{m.icon}</span>
                  <h4 className="text-[15px] font-bold">{m.title}</h4>
                  <p className="mt-1.5 text-[13px] leading-[1.6] text-ink-soft">
                    {m.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-[var(--r-xl)] border border-[var(--border)] bg-white p-10">
            <div className="mx-auto w-[260px] rounded-[28px] border-2 border-[var(--border)] bg-cream p-4 shadow-[0_20px_60px_rgba(0,0,0,.08)]">
              <div className="mx-auto mb-4 h-1.5 w-[120px] rounded-[3px] bg-[var(--border)]" />
              <div className="rounded-[16px] bg-white p-6 text-center">
                <div className="mx-auto mb-4 flex h-[140px] w-[140px] items-center justify-center rounded-xl bg-ink text-[11px] font-semibold text-white">
                  QR CODE
                </div>
                <h4 className="text-[14px] font-bold">Free Ethics CE</h4>
                <p className="text-[11px] text-ink-muted">
                  2 hours · Approved for RNs in TX
                </p>
                <p className="mt-2 text-[10px] font-bold text-teal">
                  From Marcus Johnson
                </p>
                <button
                  type="button"
                  className="mt-3 block w-full rounded-[var(--r)] bg-teal py-2.5 text-[12px] font-bold text-white"
                >
                  Claim Free Course
                </button>
              </div>
            </div>
            <p className="mt-5 text-center text-[12px] text-ink-muted">
              Scan → register → access course
              <br />
              All in under 30 seconds
            </p>
          </div>
        </div>
      </Container>
    </section>
  );
}
