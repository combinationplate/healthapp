import Link from "next/link";

const LINKS = [
  { href: "/free-ce-for-nurses", label: "Free CE for Nurses" },
  { href: "/free-ce-for-social-workers", label: "Free CE for Social Workers" },
  { href: "/free-ce-for-case-managers", label: "Free CE for Case Managers" },
];

export default function DisciplineLinks() {
  return (
    <section style={{ background: "#f6f5f0", padding: "44px 24px", borderTop: "1px solid rgba(11,18,34,0.08)" }}>
      <div style={{ maxWidth: 1000, margin: "0 auto", textAlign: "center" }}>
        <h2 style={{ fontFamily: "'Fraunces', Georgia, serif", fontSize: 24, fontWeight: 800, color: "#0b1222", margin: 0 }}>
          Free CE by profession
        </h2>
        <p style={{ fontSize: 15, color: "#3b4963", margin: "8px auto 0", maxWidth: 560, lineHeight: 1.55 }}>
          Nationally accredited continuing education, sponsored for you — no credit card, all 50 states.
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 12, justifyContent: "center", marginTop: 22 }}>
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              style={{ background: "#fff", border: "1px solid rgba(11,18,34,0.08)", borderRadius: 12, padding: "14px 22px", fontWeight: 700, fontSize: 15, color: "#2455ff", textDecoration: "none" }}
            >
              {l.label} &rarr;
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
