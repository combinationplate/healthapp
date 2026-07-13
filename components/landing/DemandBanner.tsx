import Link from "next/link";

export default function DemandBanner() {
  return (
    <section
      style={{
        background: "linear-gradient(135deg,#0f766e,#0d9488)",
        color: "#fff",
        padding: "48px 24px",
      }}
    >
      <div style={{ maxWidth: 1060, margin: "0 auto", textAlign: "center" }}>
        <h2
          style={{
            fontFamily: "'Fraunces', Georgia, serif",
            fontSize: "clamp(24px,4vw,32px)",
            fontWeight: 800,
            letterSpacing: "-0.5px",
            margin: 0,
          }}
        >
          See who&apos;s asking for CE in your market
        </h2>
        <p style={{ fontSize: 16, lineHeight: 1.55, margin: "12px auto 0", maxWidth: 620, opacity: 0.95 }}>
          Licensed nurses, social workers, and case managers request free accredited CE. Sponsor
          one and earn the introduction — no account needed to look.
        </p>
        <Link
          href="/demand"
          style={{
            display: "inline-block",
            marginTop: 22,
            background: "#fff",
            color: "#0f766e",
            textDecoration: "none",
            fontWeight: 700,
            fontSize: 15,
            padding: "12px 24px",
            borderRadius: 10,
          }}
        >
          Explore the CE Demand Map &rarr;
        </Link>
      </div>
    </section>
  );
}
