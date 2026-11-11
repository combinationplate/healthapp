import Link from "next/link";

/**
 * Small cross-sell shown on the professional-facing SEO pages. Liaisons search
 * for "free CE for nurses / case managers" looking for something to hand out,
 * and land on pages written for the professional. This points them to the
 * sponsor side. Inline styles only (no Tailwind) so nothing gets purged.
 */
export function LiaisonCallout() {
  return (
    <aside
      style={{
        maxWidth: 860,
        margin: "44px auto 0",
        padding: "0 24px",
        fontFamily: "'DM Sans', system-ui, sans-serif",
      }}
    >
      <div
        style={{
          background: "#fff",
          border: "1px solid rgba(36,85,255,0.22)",
          borderLeft: "3px solid #2455ff",
          borderRadius: 12,
          padding: "20px 22px",
        }}
      >
        <h2
          style={{
            fontFamily: "'Fraunces', Georgia, serif",
            fontSize: 20,
            fontWeight: 800,
            letterSpacing: "-0.3px",
            color: "#0b1222",
            margin: 0,
          }}
        >
          Hospice, home health or senior care liaison?
        </h2>
        <p style={{ fontSize: 15, color: "#3b4963", lineHeight: 1.65, margin: "8px 0 0" }}>
          You can sponsor these same accredited courses for the nurses, social workers and case managers you
          call on, one at a time or with a QR flyer at your next in-service. It costs $15 per CE credit hour,
          billed only when a course is opened, and your first one is free.
        </p>
        <Link
          href="/ceu-sponsorship"
          style={{
            display: "inline-block",
            marginTop: 12,
            color: "#2455ff",
            fontWeight: 700,
            fontSize: 15,
            textDecoration: "none",
          }}
        >
          See how CEU sponsorship works →
        </Link>
      </div>
    </aside>
  );
}
