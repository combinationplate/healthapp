import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import LandingNav from "@/components/landing/LandingNav";
import Footer from "@/components/landing/Footer";
import { STATE_REQUIREMENTS, ALL_STATE_SLUGS } from "@/lib/seo/state-requirements";
import { getCoursesForProfessions, cleanCourseName } from "@/lib/seo/courses";

type Props = { params: Promise<{ slug: string }> };

export const revalidate = 3600;

export function generateStaticParams() {
  return ALL_STATE_SLUGS.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const r = STATE_REQUIREMENTS[slug];
  if (!r) return { title: "Not Found" };
  const title = `${r.state} ${r.discipline} CE Requirements | Pulse`;
  const description = `Continuing education requirements for ${r.discipline.toLowerCase()} license renewal in ${r.state}: renewal cycle, total hours, mandated topics, and reporting — plus free accredited CE.`;
  // Unverified pages stay OUT of the index until the owner flips `verified`.
  if (!r.verified) {
    return { title, description, robots: { index: false, follow: false } };
  }
  return {
    title,
    description,
    alternates: { canonical: `https://pulsereferrals.com/ce-requirements/${slug}` },
    openGraph: { title, description, url: `https://pulsereferrals.com/ce-requirements/${slug}`, siteName: "Pulse", type: "website" },
  };
}

const S = {
  wrap: { fontFamily: "'DM Sans',system-ui,sans-serif", color: "#0b1222", background: "#f6f5f0" } as const,
  section: { maxWidth: 860, margin: "0 auto", padding: "0 24px" } as const,
  h2: { fontFamily: "'Fraunces',Georgia,serif", fontSize: 22, fontWeight: 800, letterSpacing: "-0.4px", margin: "36px 0 8px" } as const,
  body: { fontSize: 15, color: "#3b4963", lineHeight: 1.7 } as const,
  card: { background: "#fff", border: "1px solid rgba(11,18,34,0.08)", borderRadius: 12, padding: "16px 18px", marginTop: 8 } as const,
};

export default async function StateRequirementPage({ params }: Props) {
  const { slug } = await params;
  const r = STATE_REQUIREMENTS[slug];
  if (!r) notFound();

  const courses = await getCoursesForProfessions(r.disciplineProfessions);

  return (
    <div style={S.wrap}>
      <LandingNav />

      {!r.verified && (
        <div style={{ background: "#fff7ed", borderBottom: "1px solid #fed7aa", color: "#9a3412", fontSize: 14, lineHeight: 1.6, padding: "14px 24px" }}>
          <div style={{ maxWidth: 860, margin: "0 auto" }}>
            <strong>⚠️ Unverified draft — not published.</strong> Every requirement value on this page is a placeholder.
            This page is <strong>noindexed</strong> and excluded from the sitemap. Verify each figure against the{" "}
            <a href={r.boardUrl} target="_blank" rel="noopener noreferrer" style={{ color: "#9a3412", fontWeight: 700 }}>{r.boardName}</a>{" "}
            site, then set <code>verified: true</code> in <code>lib/seo/state-requirements.ts</code> to publish.
          </div>
        </div>
      )}

      <header style={{ ...S.section, paddingTop: 48 }}>
        <h1 style={{ fontFamily: "'Fraunces',Georgia,serif", fontSize: "clamp(28px,5vw,42px)", fontWeight: 900, letterSpacing: "-1px", lineHeight: 1.12, margin: 0 }}>
          {r.state} {r.discipline} CE Requirements
        </h1>
        <p style={{ ...S.body, fontSize: 17, marginTop: 14 }}>
          What {r.discipline.toLowerCase()}s in {r.state} need to know about continuing education for license renewal — the renewal cycle, total hours, mandated topics, and how CE is reported. Always confirm against the official board before you rely on it.
        </p>
      </header>

      <section style={S.section}>
        <h2 style={S.h2}>Renewal cycle</h2>
        <div style={S.card}><p style={S.body}>{r.renewalCycle}</p></div>

        <h2 style={S.h2}>Total CE hours required</h2>
        <div style={S.card}><p style={S.body}>{r.totalHours}</p></div>

        <h2 style={S.h2}>Mandated topics</h2>
        <div style={S.card}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
            <thead>
              <tr style={{ textAlign: "left", color: "#7a8ba8" }}>
                <th style={{ padding: "6px 10px 6px 0", fontWeight: 700 }}>Topic</th>
                <th style={{ padding: "6px 0", fontWeight: 700 }}>Required hours</th>
              </tr>
            </thead>
            <tbody>
              {r.mandatedTopics.map((t, i) => (
                <tr key={i} style={{ borderTop: "1px solid rgba(11,18,34,0.06)" }}>
                  <td style={{ padding: "8px 10px 8px 0", color: "#0b1222", fontWeight: 600 }}>{t.label}</td>
                  <td style={{ padding: "8px 0", color: "#3b4963" }}>{t.hours}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <h2 style={S.h2}>How CE is reported</h2>
        <div style={S.card}><p style={S.body}>{r.reportingSystem}</p></div>

        <h2 style={S.h2}>Official state board</h2>
        <div style={S.card}>
          <p style={S.body}>
            {r.boardName}<br />
            <a href={r.boardUrl} target="_blank" rel="noopener noreferrer" style={{ color: "#2455ff", fontWeight: 700, textDecoration: "none" }}>{r.boardUrl}</a>
          </p>
          <p style={{ ...S.body, fontSize: 13, color: "#7a8ba8", marginTop: 8 }}>
            Requirements change. Verify all figures on the board site above before relying on them.
          </p>
        </div>
      </section>

      <section style={{ ...S.section, marginTop: 8, paddingBottom: 8 }}>
        <h2 style={S.h2}>Meet part of this requirement free on Pulse</h2>
        <p style={S.body}>
          Pulse offers free, nationally accredited {r.discipline.toLowerCase()} CE. Complete these courses at no cost and apply them toward your {r.state} requirement (subject to the board rules above).
        </p>
        {courses.length > 0 ? (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(240px,1fr))", gap: 14, marginTop: 18 }}>
            {courses.slice(0, 9).map((c) => (
              <div key={c.id} style={{ background: "#fff", border: "1px solid rgba(11,18,34,0.08)", borderRadius: 12, padding: 16 }}>
                <div style={{ fontSize: 15, fontWeight: 700, lineHeight: 1.35 }}>{cleanCourseName(c.name)}</div>
                <div style={{ fontSize: 13, color: "#7a8ba8", marginTop: 8 }}>
                  <b style={{ color: "#0d9488" }}>{c.hours} CE hr{c.hours !== 1 ? "s" : ""}</b>{c.topic ? ` · ${c.topic}` : ""}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p style={{ ...S.body, marginTop: 12 }}>
            <Link href="/signup?type=hcp" style={{ color: "#2455ff", fontWeight: 700 }}>Create your free account</Link> to browse available {r.discipline.toLowerCase()} courses.
          </p>
        )}
        <div style={{ marginTop: 22, paddingBottom: 8 }}>
          <Link href="/signup?type=hcp" style={{ display: "inline-block", background: "#2455ff", color: "#fff", textDecoration: "none", fontWeight: 700, fontSize: 15, padding: "13px 26px", borderRadius: 10 }}>
            Get free CE — create your account
          </Link>
        </div>
      </section>

      <div style={{ maxWidth: 860, margin: "40px auto 0", padding: "0 24px 44px", color: "#7a8ba8", fontSize: 13, lineHeight: 1.65, textAlign: "center" }}>
        This page is informational and not legal or licensing advice. Confirm all continuing-education requirements with the {r.state} board before relying on them.
      </div>

      <Footer />
    </div>
  );
}
