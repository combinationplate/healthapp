import Link from "next/link";
import LandingNav from "@/components/landing/LandingNav";
import Footer from "@/components/landing/Footer";

// Plain CSS string (same pattern as the other SEO templates) — avoids Tailwind purge issues.
const CSS = `
.sp-wrap{font-family:'DM Sans',system-ui,sans-serif;color:#0b1222;background:#f6f5f0}
.sp-main{max-width:760px;margin:0 auto;padding:56px 24px 64px}
.sp-main h1{font-family:'Fraunces',Georgia,serif;font-size:clamp(30px,5vw,42px);font-weight:900;letter-spacing:-1px;line-height:1.12;margin:0}
.sp-updated{font-size:13px;color:#7a8ba8;margin:10px 0 0}
.sp-intro{font-size:17px;color:#3b4963;line-height:1.7;margin:18px 0 0}
.sp-main h2{font-family:'Fraunces',Georgia,serif;font-size:22px;font-weight:800;letter-spacing:-0.3px;margin:38px 0 0}
.sp-main p.sp-body{font-size:15.5px;color:#3b4963;line-height:1.75;margin:10px 0 0}
.sp-main ul{list-style:disc;margin:10px 0 0;padding:0 0 0 22px}
.sp-main li{font-size:15.5px;color:#3b4963;line-height:1.7;margin:6px 0 0}
.sp-links{display:flex;flex-wrap:wrap;gap:12px;margin:34px 0 0}
.sp-links a{display:inline-block;background:#fff;border:1px solid rgba(11,18,34,0.12);border-radius:10px;padding:11px 18px;font-weight:700;font-size:14.5px;color:#2455ff;text-decoration:none}
`;

export type SimpleSection = { heading: string; body?: string[]; bullets?: string[] };

type Props = {
  h1: string;
  updated?: string;
  intro: string[];
  sections: SimpleSection[];
  links?: { href: string; label: string }[];
};

/** Plain text page (About, Privacy, Terms): nav, a single readable column, footer. */
export function SimplePage({ h1, updated, intro, sections, links }: Props) {
  return (
    <div className="sp-wrap">
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <LandingNav />
      <main className="sp-main">
        <h1>{h1}</h1>
        {updated && <p className="sp-updated">Last updated {updated}</p>}
        {intro.map((para, i) => (
          <p className="sp-intro" key={i}>{para}</p>
        ))}
        {sections.map((sec) => (
          <section key={sec.heading}>
            <h2>{sec.heading}</h2>
            {sec.body?.map((para, i) => (
              <p className="sp-body" key={i}>{para}</p>
            ))}
            {sec.bullets && (
              <ul>
                {sec.bullets.map((b, i) => (
                  <li key={i}>{b}</li>
                ))}
              </ul>
            )}
          </section>
        ))}
        {links && links.length > 0 && (
          <div className="sp-links">
            {links.map((l) => (
              <Link key={l.href} href={l.href}>{l.label}</Link>
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
