import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import LandingNav from "@/components/landing/LandingNav";
import Footer from "@/components/landing/Footer";
import {
  DISCIPLINE_LABELS,
  getLiveDisciplines,
  getPublishableRequirements,
  getRequirement,
  type Discipline,
} from "@/lib/ce-requirements";
import { getCoursesForProfessions, cleanCourseName } from "@/lib/seo/courses";

type Props = { params: Promise<{ discipline: string; state: string }> };

export const revalidate = 3600;
// Only verified states get pages. Anything else 404s — a state goes live by
// setting lastVerified in lib/ce-requirements/rn-data.ts and redeploying.
export const dynamicParams = false;

export function generateStaticParams() {
  return getLiveDisciplines().flatMap((discipline) =>
    getPublishableRequirements(discipline).map((r) => ({ discipline, state: r.slug }))
  );
}

/** course_professions labels per discipline (matches lib/seo/landing.ts). */
const PROFESSIONS: Record<Discipline, string[]> = {
  rn: ["Nursing"],
  "social-work": ["Social Work"],
  "case-management": ["Case Management", "Case Mgmt"],
  therapy: [],
};

/** Short credential label used in headings/titles ("RN" reads better than "Nurse"). */
function shortLabel(discipline: Discipline): string {
  return discipline === "rn" ? "RN" : DISCIPLINE_LABELS[discipline].singular;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { discipline, state } = await params;
  const r = getRequirement(discipline as Discipline, state);
  if (!r) return { title: "Not Found" };
  const label = shortLabel(r.discipline);
  const title = `${r.state} ${label} CE Requirements (${new Date().getFullYear()}) — Free Accredited CE | Pulse`;
  const description = `${r.summary} See mandatory topics, the official board source, and free accredited CE courses that count toward renewal.`;
  const url = `https://pulsereferrals.com/free-ce/${r.discipline}/${r.slug}`;
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: { title, description, url, siteName: "Pulse", type: "website" },
    twitter: { card: "summary_large_image", title, description },
  };
}

const S = {
  wrap: { fontFamily: "'DM Sans',system-ui,sans-serif", color: "#0b1222", background: "#f6f5f0" } as const,
  section: { maxWidth: 860, margin: "0 auto", padding: "0 24px" } as const,
  h2: { fontFamily: "'Fraunces',Georgia,serif", fontSize: 22, fontWeight: 800, letterSpacing: "-0.4px", margin: "36px 0 8px" } as const,
  body: { fontSize: 15, color: "#3b4963", lineHeight: 1.7 } as const,
  card: { background: "#fff", border: "1px solid rgba(11,18,34,0.08)", borderRadius: 12, padding: "16px 18px", marginTop: 8 } as const,
};

export default async function FreeCeStatePage({ params }: Props) {
  const { discipline, state } = await params;
  const r = getRequirement(discipline as Discipline, state);
  if (!r) notFound();

  const label = shortLabel(r.discipline);
  const labels = DISCIPLINE_LABELS[r.discipline];
  const courses = await getCoursesForProfessions(PROFESSIONS[r.discipline]);
  const siblings = getPublishableRequirements(r.discipline).filter((s) => s.slug !== r.slug);

  const glance: { label: string; value: string }[] = [
    {
      label: "CE hours required",
      value:
        r.requirementType === "none"
          ? "No general requirement"
          : `${r.contactHours ?? "—"} contact hours${r.requirementType === "options" ? " (one qualifying option)" : ""}`,
    },
    {
      label: "Renewal cycle",
      value: r.cycleYears ? (r.cycleYears === 1 ? "Every year" : `Every ${r.cycleYears} years`) : "See board rules",
    },
    { label: "Licensing board", value: r.boardName },
  ];

  return (
    <div style={S.wrap}>
      <LandingNav />

      <header style={{ ...S.section, paddingTop: 48 }}>
        <p style={{ fontSize: 13, fontWeight: 700, color: "#7a8ba8", margin: "0 0 10px", textTransform: "uppercase", letterSpacing: "0.08em" }}>
          <Link href={`/free-ce/${r.discipline}`} style={{ color: "#7a8ba8", textDecoration: "none" }}>
            Free CE for {labels.plural}
          </Link>{" "}
          / {r.state}
        </p>
        <h1 style={{ fontFamily: "'Fraunces',Georgia,serif", fontSize: "clamp(28px,5vw,42px)", fontWeight: 900, letterSpacing: "-1px", lineHeight: 1.12, margin: 0 }}>
          {r.state} {label} CE Requirements
        </h1>
        <p style={{ ...S.body, fontSize: 17, marginTop: 14 }}>{r.summary}</p>
        {r.lastVerified && (
          <p style={{ fontSize: 13, color: "#0d9488", fontWeight: 700, marginTop: 10 }}>
            ✓ Verified against the {r.boardName} on{" "}
            {new Date(`${r.lastVerified}T12:00:00Z`).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
          </p>
        )}
      </header>

      <section style={S.section}>
        <h2 style={S.h2}>At a glance</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 12, marginTop: 8 }}>
          {glance.map((g) => (
            <div key={g.label} style={{ ...S.card, marginTop: 0 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#7a8ba8", textTransform: "uppercase", letterSpacing: "0.06em" }}>{g.label}</div>
              <div style={{ fontSize: 16, fontWeight: 700, marginTop: 6, lineHeight: 1.4 }}>{g.value}</div>
            </div>
          ))}
        </div>

        {r.mandatoryTopics && r.mandatoryTopics.length > 0 && (
          <>
            <h2 style={S.h2}>Mandatory topics in {r.state}</h2>
            <div style={S.card}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
                <thead>
                  <tr style={{ textAlign: "left", color: "#7a8ba8" }}>
                    <th style={{ padding: "6px 10px 6px 0", fontWeight: 700 }}>Topic</th>
                    <th style={{ padding: "6px 10px 6px 0", fontWeight: 700 }}>Hours</th>
                    <th style={{ padding: "6px 0", fontWeight: 700 }}>How often</th>
                  </tr>
                </thead>
                <tbody>
                  {r.mandatoryTopics.map((t, i) => (
                    <tr key={i} style={{ borderTop: "1px solid rgba(11,18,34,0.06)" }}>
                      <td style={{ padding: "8px 10px 8px 0", color: "#0b1222", fontWeight: 600 }}>{t.topic}</td>
                      <td style={{ padding: "8px 10px 8px 0", color: "#3b4963" }}>{t.hours ?? "—"}</td>
                      <td style={{ padding: "8px 0", color: "#3b4963" }}>{t.frequency}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {r.details && (
          <>
            <h2 style={S.h2}>The fine print</h2>
            <div style={S.card}>
              <p style={S.body}>{r.details}</p>
            </div>
          </>
        )}

        <h2 style={S.h2}>Does nationally accredited CE count in {r.state}?</h2>
        <div style={S.card}>
          <p style={S.body}>
            {!r.acceptsNationalAccreditation
              ? `${r.state} has its own provider-approval rules, so national accreditation alone may not be enough. Check the board's approved-provider requirements before counting a course toward renewal.`
              : r.requirementType === "none"
                ? `${r.state} doesn't require CE contact hours for renewal, so there's no state hour total for an accredited course to count toward. Accredited CE is still what national certification boards and employers ask for.`
                : `Yes — ${r.state} accepts continuing education from nationally accredited providers, so courses from an accredited provider like the ones on Pulse count toward your renewal.`}
          </p>
          {r.accreditationNote && (
            <p style={{ ...S.body, fontSize: 14, marginTop: 10, paddingTop: 10, borderTop: "1px solid rgba(11,18,34,0.06)" }}>
              <b style={{ color: "#0b1222" }}>One caveat:</b> {r.accreditationNote}
            </p>
          )}
        </div>

        <h2 style={S.h2}>Official source</h2>
        <div style={S.card}>
          <p style={S.body}>
            {r.boardName}
            <br />
            <a href={r.sourceUrl} target="_blank" rel="noopener noreferrer" style={{ color: "#2455ff", fontWeight: 700, textDecoration: "none" }}>
              {r.sourceUrl}
            </a>
          </p>
          <p style={{ ...S.body, fontSize: 13, color: "#7a8ba8", marginTop: 8 }}>
            Requirements change. Confirm all figures on the board site above before relying on them.
          </p>
        </div>
      </section>

      <section style={{ ...S.section, marginTop: 8, paddingBottom: 8 }}>
        <h2 style={S.h2}>
          {r.requirementType === "none"
            ? `Free CE for ${r.state} ${labels.plural.toLowerCase()}`
            : `Meet part of this requirement free`}
        </h2>
        <p style={S.body}>
          {r.requirementType === "none"
            ? `Even without a state mandate, free accredited CE helps with national certifications, compact-state moves, and professional growth. On Pulse, local healthcare organizations cover the cost — you pay nothing.`
            : `Pulse offers free, accredited CE for ${labels.audience}. Local healthcare organizations cover the cost — you pay nothing, and the hours apply toward your ${r.state} requirement (subject to the board rules above).`}
        </p>
        {courses.length > 0 ? (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(240px,1fr))", gap: 14, marginTop: 18 }}>
            {courses.slice(0, 9).map((c) => (
              <div key={c.id} style={{ background: "#fff", border: "1px solid rgba(11,18,34,0.08)", borderRadius: 12, padding: 16 }}>
                <div style={{ fontSize: 15, fontWeight: 700, lineHeight: 1.35 }}>{cleanCourseName(c.name)}</div>
                <div style={{ fontSize: 13, color: "#7a8ba8", marginTop: 8 }}>
                  <b style={{ color: "#0d9488" }}>
                    {c.hours} CE hr{c.hours !== 1 ? "s" : ""}
                  </b>
                  {c.topic ? ` · ${c.topic}` : ""}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p style={{ ...S.body, marginTop: 12 }}>
            <Link href="/signup?type=hcp" style={{ color: "#2455ff", fontWeight: 700 }}>
              Create your free account
            </Link>{" "}
            to browse available courses.
          </p>
        )}
        <div style={{ marginTop: 22, paddingBottom: 8 }}>
          <Link
            href="/signup?type=hcp"
            style={{ display: "inline-block", background: "#2455ff", color: "#fff", textDecoration: "none", fontWeight: 700, fontSize: 15, padding: "13px 26px", borderRadius: 10 }}
          >
            Get free CE — create your account
          </Link>
        </div>
      </section>

      {siblings.length > 0 && (
        <section style={{ ...S.section, marginTop: 16 }}>
          <h2 style={S.h2}>{label} CE requirements in other states</h2>
          <p style={{ ...S.body, marginTop: 4 }}>
            {siblings.map((s, i) => (
              <span key={s.slug}>
                <Link href={`/free-ce/${s.discipline}/${s.slug}`} style={{ color: "#2455ff", fontWeight: 700, textDecoration: "none" }}>
                  {s.state}
                </Link>
                {i < siblings.length - 1 ? " · " : ""}
              </span>
            ))}
          </p>
        </section>
      )}

      <div style={{ maxWidth: 860, margin: "40px auto 0", padding: "0 24px 44px", color: "#7a8ba8", fontSize: 13, lineHeight: 1.65, textAlign: "center" }}>
        This page is informational and not legal or licensing advice. Confirm all continuing-education requirements with the {r.boardName} before relying on them.
      </div>

      <Footer />
    </div>
  );
}
