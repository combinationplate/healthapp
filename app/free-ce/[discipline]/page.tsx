import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import LandingNav from "@/components/landing/LandingNav";
import Footer from "@/components/landing/Footer";
import {
  DISCIPLINE_LABELS,
  getLiveDisciplines,
  getPublishableRequirements,
  type Discipline,
} from "@/lib/ce-requirements";

type Props = { params: Promise<{ discipline: string }> };

export const revalidate = 3600;
// Hub pages exist only for disciplines with at least one verified state.
export const dynamicParams = false;

export function generateStaticParams() {
  return getLiveDisciplines().map((discipline) => ({ discipline }));
}

function shortLabel(discipline: Discipline): string {
  return discipline === "rn" ? "RN" : DISCIPLINE_LABELS[discipline].singular;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { discipline } = await params;
  const states = getPublishableRequirements(discipline as Discipline);
  if (states.length === 0) return { title: "Not Found" };
  const labels = DISCIPLINE_LABELS[discipline as Discipline];
  const title = `${shortLabel(discipline as Discipline)} CE Requirements by State — Free Accredited CE | Pulse`;
  const description = `Continuing education requirements for ${labels.plural.toLowerCase()} in every state we've verified: hours, renewal cycles, mandatory topics, and free accredited CE courses.`;
  const url = `https://pulsereferrals.com/free-ce/${discipline}`;
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
  body: { fontSize: 15, color: "#3b4963", lineHeight: 1.7 } as const,
};

export default async function FreeCeDisciplineHub({ params }: Props) {
  const { discipline } = await params;
  const states = getPublishableRequirements(discipline as Discipline);
  if (states.length === 0) notFound();

  const labels = DISCIPLINE_LABELS[discipline as Discipline];
  const label = shortLabel(discipline as Discipline);

  return (
    <div style={S.wrap}>
      <LandingNav />

      <header style={{ ...S.section, paddingTop: 48 }}>
        <h1 style={{ fontFamily: "'Fraunces',Georgia,serif", fontSize: "clamp(28px,5vw,42px)", fontWeight: 900, letterSpacing: "-1px", lineHeight: 1.12, margin: 0 }}>
          {label} CE Requirements by State
        </h1>
        <p style={{ ...S.body, fontSize: 17, marginTop: 14 }}>
          What {labels.plural.toLowerCase()} need for license renewal, state by state — hours, cycles, and mandatory
          topics, verified against each board. Plus free accredited CE that counts toward your renewal, covered by
          local healthcare organizations.
        </p>
      </header>

      <section style={{ ...S.section, marginTop: 28, paddingBottom: 8 }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(250px,1fr))", gap: 14 }}>
          {states.map((r) => (
            <Link
              key={r.slug}
              href={`/free-ce/${r.discipline}/${r.slug}`}
              style={{ background: "#fff", border: "1px solid rgba(11,18,34,0.08)", borderRadius: 12, padding: 16, textDecoration: "none", color: "#0b1222" }}
            >
              <div style={{ fontSize: 16, fontWeight: 800 }}>{r.state}</div>
              <div style={{ fontSize: 13, color: "#3b4963", marginTop: 6, lineHeight: 1.5 }}>
                {r.requirementType === "none"
                  ? "No general CE requirement"
                  : `${r.contactHours ?? "—"} hrs / ${r.cycleYears ?? "—"} yrs${r.requirementType === "options" ? " (one option)" : ""}`}
              </div>
              <div style={{ fontSize: 13, color: "#2455ff", fontWeight: 700, marginTop: 8 }}>See requirements →</div>
            </Link>
          ))}
        </div>
        <p style={{ ...S.body, fontSize: 13, color: "#7a8ba8", marginTop: 16 }}>
          More states are added as we verify each board's current rules.
        </p>
        <div style={{ margin: "24px 0 8px" }}>
          <Link
            href="/signup?type=hcp"
            style={{ display: "inline-block", background: "#2455ff", color: "#fff", textDecoration: "none", fontWeight: 700, fontSize: 15, padding: "13px 26px", borderRadius: 10 }}
          >
            Get free CE — create your account
          </Link>
        </div>
      </section>

      <div style={{ maxWidth: 860, margin: "40px auto 0", padding: "0 24px 44px", color: "#7a8ba8", fontSize: 13, lineHeight: 1.65, textAlign: "center" }}>
        This page is informational and not legal or licensing advice. Confirm all continuing-education requirements
        with your state board before relying on them.
      </div>

      <Footer />
    </div>
  );
}
