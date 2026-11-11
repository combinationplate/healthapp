import Link from "next/link";
import LandingNav from "@/components/landing/LandingNav";
import Footer from "@/components/landing/Footer";
import { cleanCourseName, getCoursesForProfessions, type SeoCourse } from "@/lib/seo/courses";
import { getAudience, type InServiceTopic } from "@/lib/seo/in-service";
import {
  SPONSOR_BASE,
  SPONSOR_GUIDES,
  SPONSOR_HUB,
  SPONSOR_HUB_PATH,
  SPONSOR_INDUSTRIES,
  SPONSOR_PROFESSIONS,
  type SponsorPage,
} from "@/lib/seo/sponsorship";

// Plain CSS string (same pattern as InServiceLanding) — avoids Tailwind purge issues.
const CSS = `
.sps-wrap{font-family:'DM Sans',system-ui,sans-serif;color:#0b1222;background:#f6f5f0}
.sps-hero{max-width:900px;margin:0 auto;padding:56px 24px 8px}
.sps-crumb{font-size:13px;font-weight:700;color:#7a8ba8;margin:0 0 14px}
.sps-crumb a{color:#2455ff;text-decoration:none}
.sps-hero h1{font-family:'Fraunces',Georgia,serif;font-size:clamp(30px,5vw,44px);font-weight:900;letter-spacing:-1px;line-height:1.12;margin:0}
.sps-answer{background:#fff;border:1px solid rgba(11,18,34,0.08);border-left:3px solid #0d9488;border-radius:10px;padding:18px 20px;margin:22px 0 0;font-size:17px;color:#0b1222;line-height:1.65;font-weight:500}
.sps-lead{font-size:16px;color:#3b4963;line-height:1.7;margin:16px 0 0}
.sps-cta-row{display:flex;flex-wrap:wrap;gap:12px;margin:26px 0 0}
.sps-btn-primary{display:inline-block;background:#2455ff;color:#fff;text-decoration:none;font-weight:700;font-size:15px;padding:13px 26px;border-radius:10px}
.sps-btn-secondary{display:inline-block;background:#fff;color:#0b1222;text-decoration:none;font-weight:700;font-size:15px;padding:13px 26px;border-radius:10px;border:1px solid rgba(11,18,34,0.14)}
.sps-section{max-width:900px;margin:46px auto;padding:0 24px}
.sps-section h2{font-family:'Fraunces',Georgia,serif;font-size:26px;font-weight:800;letter-spacing:-0.5px;margin:0 0 6px}
.sps-body{font-size:16px;color:#3b4963;line-height:1.7;margin:10px 0 0}
.sps-list{list-style:disc;margin:12px 0 0;padding:0 0 0 22px}
.sps-list li{font-size:16px;color:#3b4963;line-height:1.7;margin:8px 0 0}
.sps-steps{counter-reset:s;list-style:none;padding:0;margin:18px 0 0}
.sps-steps li{position:relative;padding:0 0 18px 48px}
.sps-steps li:before{counter-increment:s;content:counter(s);position:absolute;left:0;top:0;width:32px;height:32px;border-radius:9px;background:#2455ff;color:#fff;font-weight:800;font-size:15px;display:flex;align-items:center;justify-content:center}
.sps-steps b{display:block;font-size:16px}
.sps-steps span{display:block;font-size:15px;color:#3b4963;line-height:1.65;margin-top:3px}
.sps-topics{display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:14px;margin-top:18px}
.sps-topic{background:#fff;border:1px solid rgba(11,18,34,0.08);border-radius:12px;padding:16px 18px}
.sps-topic h3{font-size:16px;font-weight:700;line-height:1.35;margin:0}
.sps-topic p{font-size:14px;color:#3b4963;line-height:1.6;margin:8px 0 0}
.sps-course{font-size:12.5px;color:#7a8ba8;line-height:1.5;margin-top:10px;padding-top:10px;border-top:1px solid rgba(11,18,34,0.06)}
.sps-course b{color:#0d9488;font-weight:700}
.sps-cards{display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:12px;margin-top:16px}
.sps-cards a{display:block;background:#fff;border:1px solid rgba(11,18,34,0.08);border-radius:10px;padding:14px 18px;font-weight:700;font-size:15px;color:#2455ff;text-decoration:none}
.sps-faq h3{font-size:17px;font-weight:700;margin:22px 0 0}
.sps-faq p{font-size:15px;color:#3b4963;line-height:1.7;margin:8px 0 0}
.sps-final{background:linear-gradient(135deg,#1d44d8,#2455ff);color:#fff;padding:48px 24px;text-align:center;margin-top:52px}
.sps-final h2{font-family:'Fraunces',Georgia,serif;font-size:clamp(24px,4vw,30px);font-weight:800;margin:0}
.sps-final p{font-size:16px;opacity:0.95;margin:12px auto 0;max-width:580px;line-height:1.55}
.sps-final a{display:inline-block;margin-top:22px;background:#fff;color:#1d44d8;text-decoration:none;font-weight:700;font-size:15px;padding:13px 28px;border-radius:10px}
.sps-trust{max-width:900px;margin:26px auto;padding:0 24px 44px;color:#7a8ba8;font-size:13px;line-height:1.65;text-align:center}
`;

/** Find the live course whose cleaned name contains the topic's match string. */
function findCourse(courses: SeoCourse[], match: string): SeoCourse | undefined {
  const norm = (x: string) => x.toLowerCase().replace(/[‘’]/g, "'");
  const m = norm(match);
  return courses.find((c) => norm(cleanCourseName(c.name)).includes(m));
}

/**
 * One template for every CEU-sponsorship page (hub, guides, industry spokes).
 * Server component: pulls the live course list only when the page shows topics.
 */
export async function SponsorshipLanding({ page }: { page: SponsorPage }) {
  const isHub = page.path === SPONSOR_HUB_PATH;
  const isIndustry = page.path.startsWith(`${SPONSOR_HUB_PATH}/`);
  const url = `${SPONSOR_BASE}${page.path}`;

  const topics: InServiceTopic[] = page.topicsFrom ? getAudience(page.topicsFrom)?.topics ?? [] : [];
  const courses: SeoCourse[] = topics.length > 0 ? await getCoursesForProfessions(SPONSOR_PROFESSIONS) : [];

  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: page.faqs.map((f) => ({
        "@type": "Question",
        name: f.q,
        acceptedAnswer: { "@type": "Answer", text: f.a },
      })),
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Pulse", item: SPONSOR_BASE },
        { "@type": "ListItem", position: 2, name: SPONSOR_HUB.crumb, item: `${SPONSOR_BASE}${SPONSOR_HUB_PATH}` },
        ...(isHub ? [] : [{ "@type": "ListItem", position: 3, name: page.crumb, item: url }]),
      ],
    },
  ];

  const otherIndustries = SPONSOR_INDUSTRIES.filter((i) => i.path !== page.path);
  const otherGuides = SPONSOR_GUIDES.filter((g) => g.path !== page.path);

  return (
    <div className="sps-wrap">
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <LandingNav />

      <header className="sps-hero">
        <p className="sps-crumb">
          {isHub ? (
            SPONSOR_HUB.crumb
          ) : (
            <>
              <Link href={SPONSOR_HUB_PATH}>{SPONSOR_HUB.crumb}</Link> / {page.crumb}
            </>
          )}
        </p>
        <h1>{page.h1}</h1>
        <p className="sps-answer">{page.answer}</p>
        {page.intro.map((para, i) => (
          <p className="sps-lead" key={i}>{para}</p>
        ))}
        <div className="sps-cta-row">
          <Link href="/signup?type=sales" className="sps-btn-primary">Start free — first CE on us</Link>
          <Link href="/pricing" className="sps-btn-secondary">See pricing →</Link>
        </div>
      </header>

      {page.sections.map((sec) => (
        <section className="sps-section" key={sec.heading}>
          <h2>{sec.heading}</h2>
          {sec.body?.map((para, i) => (
            <p className="sps-body" key={i}>{para}</p>
          ))}
          {sec.bullets && (
            <ul className="sps-list">
              {sec.bullets.map((b, i) => (
                <li key={i}>{b}</li>
              ))}
            </ul>
          )}
          {sec.steps && (
            <ol className="sps-steps">
              {sec.steps.map((st) => (
                <li key={st.title}>
                  <b>{st.title}</b>
                  <span>{st.body}</span>
                </li>
              ))}
            </ol>
          )}
        </section>
      ))}

      {topics.length > 0 && (
        <section className="sps-section">
          <h2>{page.topicsHeading ?? "Courses to sponsor"}</h2>
          <div className="sps-topics">
            {topics.map((t) => {
              const c = findCourse(courses, t.match);
              return (
                <div className="sps-topic" key={t.match}>
                  <h3>{t.title}</h3>
                  <p>{t.why}</p>
                  {c && (
                    <div className="sps-course">
                      <b>Accredited course · {c.hours} CE hr{c.hours !== 1 ? "s" : ""}</b>
                      <br />
                      {cleanCourseName(c.name)}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}

      {isHub && (
        <section className="sps-section">
          <h2>CEU sponsorship by industry</h2>
          <div className="sps-cards">
            {SPONSOR_INDUSTRIES.map((i) => (
              <Link key={i.path} href={i.path}>{i.cardLabel} →</Link>
            ))}
          </div>
        </section>
      )}

      <section className="sps-section sps-faq">
        <h2>Frequently asked questions</h2>
        {page.faqs.map((f) => (
          <div key={f.q}>
            <h3>{f.q}</h3>
            <p>{f.a}</p>
          </div>
        ))}
      </section>

      <section className="sps-section">
        <h2>{isHub ? "Guides for sales teams" : "More on sponsoring CEUs"}</h2>
        <div className="sps-cards">
          {!isHub && <Link href={SPONSOR_HUB_PATH}>CEU sponsorship overview →</Link>}
          {otherGuides.map((g) => (
            <Link key={g.path} href={g.path}>{g.crumb} →</Link>
          ))}
          {isIndustry &&
            otherIndustries.map((i) => (
              <Link key={i.path} href={i.path}>{i.cardLabel} →</Link>
            ))}
          <Link href="/in-service-ideas">In-service topic ideas →</Link>
          <Link href="/for-sales-teams">Pulse for sales teams →</Link>
        </div>
      </section>

      <div className="sps-final">
        <h2>Your first sponsored CE is on us.</h2>
        <p>
          Create a free rep account and send one course to a professional you already know. After that it is $15 per
          credit hour, billed only when a course is opened.
        </p>
        <Link href="/signup?type=sales">Create your free rep account</Link>
      </div>

      <div className="sps-trust">
        All CE is provided by H.I.S. Cornerstone Continuing Education — ANCC-accredited provider, ASWB ACE provider
        #2082, serving healthcare professionals since 2007. Always confirm acceptance with your own licensing board.
      </div>

      <Footer />
    </div>
  );
}
