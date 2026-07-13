import Link from "next/link";
import LandingNav from "@/components/landing/LandingNav";
import Footer from "@/components/landing/Footer";
import { LANDINGS, type LandingConfig } from "@/lib/seo/landing";
import { cleanCourseName, type SeoCourse } from "@/lib/seo/courses";

const CSS = `
.seo-wrap{font-family:'DM Sans',system-ui,sans-serif;color:#0b1222;background:#f6f5f0}
.seo-hero{max-width:900px;margin:0 auto;padding:56px 24px 8px}
.seo-hero h1{font-family:'Fraunces',Georgia,serif;font-size:clamp(30px,5vw,44px);font-weight:900;letter-spacing:-1px;line-height:1.12;margin:0}
.seo-sub{font-size:18px;color:#3b4963;line-height:1.55;margin:14px 0 0;font-weight:600}
.seo-lead{font-size:16px;color:#3b4963;line-height:1.7;margin:16px 0 0}
.seo-note{font-size:14px;color:#3b4963;line-height:1.6;margin:18px 0 0;padding:12px 16px;background:#fff;border:1px solid rgba(11,18,34,0.08);border-left:3px solid #e8604c;border-radius:8px}
.seo-cta-row{display:flex;flex-wrap:wrap;gap:12px;margin:26px 0 0}
.seo-btn-primary{display:inline-block;background:#2455ff;color:#fff;text-decoration:none;font-weight:700;font-size:15px;padding:13px 26px;border-radius:10px}
.seo-btn-secondary{display:inline-block;background:#fff;color:#0b1222;text-decoration:none;font-weight:700;font-size:15px;padding:13px 26px;border-radius:10px;border:1px solid rgba(11,18,34,0.14)}
.seo-section{max-width:900px;margin:46px auto;padding:0 24px}
.seo-section h2{font-family:'Fraunces',Georgia,serif;font-size:26px;font-weight:800;letter-spacing:-0.5px;margin:0 0 6px}
.seo-section p.seo-body{font-size:15px;color:#3b4963;line-height:1.7;margin:10px 0 0}
.seo-courses{display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:14px;margin-top:20px}
.seo-course{background:#fff;border:1px solid rgba(11,18,34,0.08);border-radius:12px;padding:16px}
.seo-course .n{font-size:15px;font-weight:700;color:#0b1222;line-height:1.35}
.seo-course .m{font-size:13px;color:#7a8ba8;margin-top:8px}
.seo-course .m b{color:#0d9488;font-weight:700}
.seo-fallback{background:#fff;border:1px dashed rgba(11,18,34,0.18);border-radius:12px;padding:24px;color:#3b4963;font-size:15px;line-height:1.6;margin-top:20px}
.seo-faq{margin-top:8px}
.seo-faq .q{font-size:17px;font-weight:700;color:#0b1222;margin:22px 0 0}
.seo-faq .a{font-size:15px;color:#3b4963;line-height:1.7;margin:8px 0 0}
.seo-cross{display:flex;flex-wrap:wrap;gap:12px;margin-top:16px}
.seo-cross a{display:inline-block;background:#fff;border:1px solid rgba(11,18,34,0.08);border-radius:10px;padding:12px 18px;font-weight:700;font-size:14px;color:#2455ff;text-decoration:none}
.seo-finalcta{background:linear-gradient(135deg,#0f766e,#0d9488);color:#fff;padding:48px 24px;text-align:center;margin-top:52px}
.seo-finalcta h2{font-family:'Fraunces',Georgia,serif;font-size:clamp(24px,4vw,30px);font-weight:800;margin:0}
.seo-finalcta p{font-size:16px;opacity:0.95;margin:12px auto 0;max-width:560px;line-height:1.55}
.seo-finalcta a{display:inline-block;margin-top:22px;background:#fff;color:#0f766e;text-decoration:none;font-weight:700;font-size:15px;padding:13px 28px;border-radius:10px}
.seo-trust{max-width:900px;margin:26px auto;padding:0 24px 44px;color:#7a8ba8;font-size:13px;line-height:1.65;text-align:center}
`;

export function DisciplineLanding({ config, courses }: { config: LandingConfig; courses: SeoCourse[] }) {
  const others = Object.values(LANDINGS).filter((c) => c.slug !== config.slug);
  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: config.faqs.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };

  return (
    <div className="seo-wrap">
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />

      <LandingNav />

      <header className="seo-hero">
        <h1>{config.h1}</h1>
        <p className="seo-sub">{config.subhead}</p>
        <p className="seo-lead">{config.firstParagraph}</p>
        <div className="seo-cta-row">
          <Link href="/signup?type=hcp" className="seo-btn-primary">Get free CE — create your account</Link>
          <a href="#courses" className="seo-btn-secondary">Browse courses</a>
        </div>
        {config.note && <p className="seo-note">{config.note}</p>}
      </header>

      <section className="seo-section" id="courses">
        <h2>Available courses for {config.disciplineLabel}</h2>
        {courses.length > 0 ? (
          <div className="seo-courses">
            {courses.map((c) => (
              <div className="seo-course" key={c.id}>
                <div className="n">{cleanCourseName(c.name)}</div>
                <div className="m">
                  <b>{c.hours} CE hr{c.hours !== 1 ? "s" : ""}</b>
                  {c.topic ? ` · ${c.topic}` : ""}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="seo-fallback">
            New nationally accredited courses for {config.disciplineLabel} are added regularly.{" "}
            <Link href="/signup?type=hcp" style={{ color: "#2455ff", fontWeight: 700 }}>Create your free account</Link>{" "}
            to browse the current catalog.
          </div>
        )}
      </section>

      <section className="seo-section">
        <h2>{config.accreditationTitle}</h2>
        <p className="seo-body">{config.accreditationBody}</p>
      </section>

      <section className="seo-section">
        <h2>Frequently asked questions</h2>
        <div className="seo-faq">
          {config.faqs.map((f) => (
            <div key={f.q}>
              <h3 className="q">{f.q}</h3>
              <p className="a">{f.a}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="seo-section">
        <h2>Free CE for other disciplines</h2>
        <div className="seo-cross">
          {others.map((o) => (
            <Link key={o.slug} href={`/${o.slug}`}>{o.h1}</Link>
          ))}
          <Link href="/">Pulse home</Link>
        </div>
      </section>

      <div className="seo-finalcta">
        <h2>Start your free CE in under a minute</h2>
        <p>No credit card, no trial — create your account and complete nationally accredited continuing education for free.</p>
        <Link href="/signup?type=hcp">Create your free account</Link>
      </div>

      <div className="seo-trust">
        All CE is provided by H.I.S. Cornerstone Continuing Education — ANCC-accredited provider, ASWB ACE provider #2082, serving healthcare professionals since 2007.
      </div>

      <Footer />
    </div>
  );
}
