import Link from "next/link";
import LandingNav from "@/components/landing/LandingNav";
import Footer from "@/components/landing/Footer";
import { cleanCourseName, type SeoCourse } from "@/lib/seo/courses";
import type { Faq } from "@/lib/seo/landing";
import {
  AUDIENCES,
  HUB,
  RUN_STEPS,
  type InServiceCategory,
  type InServiceTopic,
} from "@/lib/seo/in-service";

// Plain CSS string (same pattern as DisciplineLanding) — avoids Tailwind purge issues.
const CSS = `
.isv-wrap{font-family:'DM Sans',system-ui,sans-serif;color:#0b1222;background:#f6f5f0}
.isv-hero{max-width:900px;margin:0 auto;padding:56px 24px 8px}
.isv-crumb{font-size:13px;font-weight:700;color:#7a8ba8;margin:0 0 14px}
.isv-crumb a{color:#2455ff;text-decoration:none}
.isv-hero h1{font-family:'Fraunces',Georgia,serif;font-size:clamp(30px,5vw,44px);font-weight:900;letter-spacing:-1px;line-height:1.12;margin:0}
.isv-sub{font-size:18px;color:#3b4963;line-height:1.55;margin:14px 0 0;font-weight:600}
.isv-lead{font-size:16px;color:#3b4963;line-height:1.7;margin:16px 0 0}
.isv-cta-row{display:flex;flex-wrap:wrap;gap:12px;margin:26px 0 0}
.isv-btn-primary{display:inline-block;background:#2455ff;color:#fff;text-decoration:none;font-weight:700;font-size:15px;padding:13px 26px;border-radius:10px}
.isv-btn-secondary{display:inline-block;background:#fff;color:#0b1222;text-decoration:none;font-weight:700;font-size:15px;padding:13px 26px;border-radius:10px;border:1px solid rgba(11,18,34,0.14)}
.isv-section{max-width:900px;margin:46px auto;padding:0 24px}
.isv-section h2{font-family:'Fraunces',Georgia,serif;font-size:26px;font-weight:800;letter-spacing:-0.5px;margin:0 0 6px}
.isv-blurb{font-size:15px;color:#3b4963;line-height:1.6;margin:4px 0 0}
.isv-topics{display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:14px;margin-top:18px}
.isv-topic{background:#fff;border:1px solid rgba(11,18,34,0.08);border-radius:12px;padding:16px 18px}
.isv-topic h3{font-size:16px;font-weight:700;line-height:1.35;margin:0}
.isv-topic p{font-size:14px;color:#3b4963;line-height:1.6;margin:8px 0 0}
.isv-course{font-size:12.5px;color:#7a8ba8;line-height:1.5;margin-top:10px;padding-top:10px;border-top:1px solid rgba(11,18,34,0.06)}
.isv-course b{color:#0d9488;font-weight:700}
.isv-tip{background:#fff;border:1px solid rgba(11,18,34,0.08);border-left:3px solid #2455ff;border-radius:10px;padding:18px 20px}
.isv-tip h2{font-size:20px}
.isv-tip p{font-size:15px;color:#3b4963;line-height:1.7;margin:6px 0 0}
.isv-steps{counter-reset:s;list-style:none;padding:0;margin:18px 0 0}
.isv-steps li{position:relative;padding:0 0 18px 48px}
.isv-steps li:before{counter-increment:s;content:counter(s);position:absolute;left:0;top:0;width:32px;height:32px;border-radius:9px;background:#2455ff;color:#fff;font-weight:800;font-size:15px;display:flex;align-items:center;justify-content:center}
.isv-steps b{display:block;font-size:16px}
.isv-steps span{display:block;font-size:15px;color:#3b4963;line-height:1.65;margin-top:3px}
.isv-edu{background:#fff;border:1px solid rgba(13,148,136,0.25);border-radius:12px;padding:20px 22px}
.isv-edu h2{font-size:20px}
.isv-edu p{font-size:15px;color:#3b4963;line-height:1.65;margin:6px 0 0}
.isv-edu a{display:inline-block;margin-top:12px;color:#0d9488;font-weight:700;text-decoration:none}
.isv-cards{display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:12px;margin-top:16px}
.isv-cards a{display:block;background:#fff;border:1px solid rgba(11,18,34,0.08);border-radius:10px;padding:14px 18px;font-weight:700;font-size:15px;color:#2455ff;text-decoration:none}
.isv-faq h3{font-size:17px;font-weight:700;margin:22px 0 0}
.isv-faq p{font-size:15px;color:#3b4963;line-height:1.7;margin:8px 0 0}
.isv-final{background:linear-gradient(135deg,#1d44d8,#2455ff);color:#fff;padding:48px 24px;text-align:center;margin-top:52px}
.isv-final h2{font-family:'Fraunces',Georgia,serif;font-size:clamp(24px,4vw,30px);font-weight:800;margin:0}
.isv-final p{font-size:16px;opacity:0.95;margin:12px auto 0;max-width:580px;line-height:1.55}
.isv-final a{display:inline-block;margin-top:22px;background:#fff;color:#1d44d8;text-decoration:none;font-weight:700;font-size:15px;padding:13px 28px;border-radius:10px}
.isv-trust{max-width:900px;margin:26px auto;padding:0 24px 44px;color:#7a8ba8;font-size:13px;line-height:1.65;text-align:center}
`;

const BASE = "https://pulsereferrals.com";

/** Find the live course whose cleaned name contains the topic's match string. */
function findCourse(courses: SeoCourse[], match: string): SeoCourse | undefined {
  const norm = (x: string) => x.toLowerCase().replace(/[\u2018\u2019]/g, "'");
  const m = norm(match);
  return courses.find((c) => norm(cleanCourseName(c.name)).includes(m));
}

function TopicGrid({ topics, courses }: { topics: InServiceTopic[]; courses: SeoCourse[] }) {
  return (
    <div className="isv-topics">
      {topics.map((t) => {
        const c = findCourse(courses, t.match);
        return (
          <div className="isv-topic" key={t.match}>
            <h3>{t.title}</h3>
            <p>{t.why}</p>
            {c && (
              <div className="isv-course">
                <b>Accredited course · {c.hours} CE hr{c.hours !== 1 ? "s" : ""}</b>
                <br />
                {cleanCourseName(c.name)}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

type Props = {
  slug: string | null; // null = hub
  h1: string;
  subhead: string;
  intro: string[];
  courses: SeoCourse[];
  faqs: Faq[];
  categories?: InServiceCategory[];
  topicsHeading?: string;
  topics?: InServiceTopic[];
  tip?: { heading: string; body: string };
};

export function InServiceLanding(p: Props) {
  const isHub = p.slug === null;
  const url = isHub ? `${BASE}/${HUB.slug}` : `${BASE}/${HUB.slug}/${p.slug}`;

  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: p.faqs.map((f) => ({
        "@type": "Question",
        name: f.q,
        acceptedAnswer: { "@type": "Answer", text: f.a },
      })),
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Pulse", item: BASE },
        { "@type": "ListItem", position: 2, name: "In-Service Ideas", item: `${BASE}/${HUB.slug}` },
        ...(isHub ? [] : [{ "@type": "ListItem", position: 3, name: p.h1, item: url }]),
      ],
    },
  ];

  const siblings = AUDIENCES.filter((a) => a.slug !== p.slug);

  return (
    <div className="isv-wrap">
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <LandingNav />

      <header className="isv-hero">
        <p className="isv-crumb">
          {isHub ? (
            "In-Service Ideas"
          ) : (
            <>
              <Link href={`/${HUB.slug}`}>In-Service Ideas</Link> / {siblingsLabel(p.slug)}
            </>
          )}
        </p>
        <h1>{p.h1}</h1>
        <p className="isv-sub">{p.subhead}</p>
        {p.intro.map((para, i) => (
          <p className="isv-lead" key={i}>{para}</p>
        ))}
        <div className="isv-cta-row">
          <Link href="/signup?type=sales" className="isv-btn-primary">Sponsor CE for your next in-service</Link>
          <Link href="/for-sales-teams" className="isv-btn-secondary">How it works for reps →</Link>
        </div>
      </header>

      {isHub ? (
        <>
          <section className="isv-section">
            <h2>Topics by setting</h2>
            <div className="isv-cards">
              {AUDIENCES.map((a) => (
                <Link key={a.slug} href={`/${HUB.slug}/${a.slug}`}>{a.cardLabel} →</Link>
              ))}
            </div>
          </section>
          {p.categories?.map((cat) => (
            <section className="isv-section" key={cat.heading}>
              <h2>{cat.heading}</h2>
              <p className="isv-blurb">{cat.blurb}</p>
              <TopicGrid topics={cat.topics} courses={p.courses} />
            </section>
          ))}
        </>
      ) : (
        <>
          <section className="isv-section">
            <h2>{p.topicsHeading}</h2>
            <TopicGrid topics={p.topics ?? []} courses={p.courses} />
          </section>
          {p.tip && (
            <section className="isv-section">
              <div className="isv-tip">
                <h2>{p.tip.heading}</h2>
                <p>{p.tip.body}</p>
              </div>
            </section>
          )}
        </>
      )}

      <section className="isv-section">
        <h2>How to run an in-service with CE attached</h2>
        <ol className="isv-steps">
          {RUN_STEPS.map((s) => (
            <li key={s.title}>
              <b>{s.title}</b>
              <span>{s.body}</span>
            </li>
          ))}
        </ol>
      </section>

      <section className="isv-section">
        <div className="isv-edu">
          <h2>Staff educator or director of nursing?</h2>
          <p>
            Your licensed staff can take these accredited courses free through Pulse — local healthcare
            sponsors cover the cost. Create a free account to browse the catalog and request the topics your
            team needs.
          </p>
          <Link href="/signup?type=hcp">Get free CE for your team →</Link>
        </div>
      </section>

      <section className="isv-section isv-faq">
        <h2>Frequently asked questions</h2>
        {p.faqs.map((f) => (
          <div key={f.q}>
            <h3>{f.q}</h3>
            <p>{f.a}</p>
          </div>
        ))}
      </section>

      <section className="isv-section">
        <h2>{isHub ? "More for sales teams" : "More in-service ideas"}</h2>
        <div className="isv-cards">
          {!isHub && <Link href={`/${HUB.slug}`}>All in-service topics →</Link>}
          {!isHub &&
            siblings.map((a) => (
              <Link key={a.slug} href={`/${HUB.slug}/${a.slug}`}>{a.cardLabel} →</Link>
            ))}
          <Link href="/for-sales-teams">Pulse for sales teams →</Link>
          <Link href="/demand">CE demand in your market →</Link>
        </div>
      </section>

      <div className="isv-final">
        <h2>Your first sponsored CE is on us.</h2>
        <p>
          Create a free rep account, pick the course that matches your next in-service, and print the QR flyer.
          $15 per credit hour after that, billed only when a course is opened.
        </p>
        <Link href="/signup?type=sales">Create your free rep account</Link>
      </div>

      <div className="isv-trust">
        All CE is provided by H.I.S. Cornerstone Continuing Education — ANCC-accredited provider, ASWB ACE provider
        #2082, serving healthcare professionals since 2007. Always confirm acceptance with your own licensing board.
      </div>

      <Footer />
    </div>
  );
}

function siblingsLabel(slug: string | null): string {
  return AUDIENCES.find((a) => a.slug === slug)?.cardLabel ?? "";
}
