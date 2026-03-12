import { StateApprovals } from "@/src/components/StateApprovals";

export const metadata = {
  title: "Accreditation & CE Approvals — Pulse",
  description:
    "Pulse CE courses are accredited for Nursing, Social Work, Case Management, PT, OT, and SLP. Browse state-by-state approvals for each discipline.",
};

/* ── Design tokens (server-safe inline styles) ──────────────────── */
const ds = {
  ink: "#0b1222",
  inkSoft: "#3b4963",
  inkMuted: "#7a8ba8",
  cream: "#f6f5f0",
  blue: "#2455ff",
  teal: "#0d9488",
  border: "rgba(11,18,34,0.08)",
  fontBody: "'DM Sans', system-ui, sans-serif",
  fontDisplay: "'Fraunces', Georgia, serif",
};

/* ── Discipline card data ───────────────────────────────────────── */
const DISCIPLINES = [
  {
    name: "Nursing",
    shortName: "RN / LPN",
    accreditor: "ANCC",
    accreditorFull: "American Nurses Credentialing Center",
    hours: "CE Hours",
    color: "#2455ff",
    bg: "rgba(36,85,255,0.07)",
    icon: "🏥",
    detail: "Courses meet ANCC standards and are accepted by all state boards of nursing for license renewal.",
  },
  {
    name: "Social Work",
    shortName: "MSW / LCSW",
    accreditor: "ACE/ASWB",
    accreditorFull: "Approved Continuing Education — Association of Social Work Boards",
    hours: "CE Hours",
    color: "#0d9488",
    bg: "rgba(13,148,136,0.07)",
    icon: "🤝",
    detail: "Approved for ACE/ASWB CE credit, accepted by social work licensing boards in all 50 states.",
  },
  {
    name: "Case Management",
    shortName: "CCM / ACM",
    accreditor: "CCMC",
    accreditorFull: "Commission for Case Manager Certification",
    hours: "CE Hours",
    color: "#92670A",
    bg: "rgba(146,103,10,0.07)",
    icon: "📋",
    detail: "Approved for CCM re-certification. Accepted by ACMA and NAHC case management boards.",
  },
  {
    name: "Physical Therapy",
    shortName: "PT / PTA",
    accreditor: "APTA",
    accreditorFull: "American Physical Therapy Association",
    hours: "CE Hours",
    color: "#e8604c",
    bg: "rgba(232,96,76,0.07)",
    icon: "💪",
    detail: "Texas-approved through TPTA (Texas Physical Therapy Association). Expanding to additional states via reciprocity.",
  },
  {
    name: "Occupational Therapy",
    shortName: "OT / COTA",
    accreditor: "AOTA",
    accreditorFull: "American Occupational Therapy Association",
    hours: "PDUs",
    color: "#7c3aed",
    bg: "rgba(139,92,246,0.07)",
    icon: "✋",
    detail: "Texas-approved through the Texas OT Board. PDUs accepted for NBCOT re-certification.",
  },
  {
    name: "Speech-Language Pathology",
    shortName: "SLP / SLPA",
    accreditor: "ASHA",
    accreditorFull: "American Speech-Language-Hearing Association",
    hours: "CEUs",
    color: "#059669",
    bg: "rgba(16,185,129,0.07)",
    icon: "🗣️",
    detail: "Texas-approved through the Texas SLP Board. CEUs accepted for ASHA certification maintenance.",
  },
];

/* ── PulseLogo (static — no SVG gradient IDs conflict) ─────────── */
function PulseLogo() {
  return (
    <svg width="36" height="36" viewBox="0 0 56 56" fill="none">
      <rect width="56" height="56" rx="14" fill="#0b1222" />
      <path
        d="M10 28 L17 28 L21 16 L26 40 L31 22 L35 32 L38 28 L46 28"
        stroke="url(#accr-glow)"
        strokeWidth="8"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.3"
      />
      <path
        d="M10 28 L17 28 L21 16 L26 40 L31 22 L35 32 L38 28 L46 28"
        stroke="url(#accr-line)"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <defs>
        <linearGradient id="accr-line" x1="10" y1="28" x2="46" y2="28">
          <stop offset="0%" stopColor="#6B8AFF" />
          <stop offset="100%" stopColor="#5EEAD4" />
        </linearGradient>
        <linearGradient id="accr-glow" x1="10" y1="28" x2="46" y2="28">
          <stop offset="0%" stopColor="#2455ff" />
          <stop offset="100%" stopColor="#0d9488" />
        </linearGradient>
      </defs>
    </svg>
  );
}

export default function AccreditationPage() {
  const container: React.CSSProperties = {
    maxWidth: "1100px",
    margin: "0 auto",
    padding: "0 24px",
  };

  return (
    <div style={{ fontFamily: ds.fontBody, color: ds.ink, background: "#fff" }}>

      {/* ── Nav ─────────────────────────────────────────────── */}
      <nav style={{
        position: "sticky",
        top: 0,
        zIndex: 200,
        background: "rgba(255,255,255,0.92)",
        backdropFilter: "blur(16px)",
        borderBottom: `1px solid ${ds.border}`,
      }}>
        <div style={{ ...container, display: "flex", alignItems: "center", justifyContent: "space-between", height: "64px" }}>
          <a href="/" style={{ display: "flex", alignItems: "center", gap: "10px", textDecoration: "none" }}>
            <PulseLogo />
            <span style={{ fontFamily: ds.fontDisplay, fontSize: "26px", fontWeight: 900, color: ds.ink }}>
              Pulse
            </span>
          </a>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <a href="/" style={{
              padding: "8px 20px",
              borderRadius: "10px",
              border: `1px solid ${ds.border}`,
              fontSize: "13px",
              fontWeight: 600,
              color: ds.inkSoft,
              textDecoration: "none",
            }}>
              ← Home
            </a>
            <a href="/login" style={{
              padding: "8px 20px",
              borderRadius: "10px",
              background: ds.ink,
              color: "#fff",
              fontSize: "13px",
              fontWeight: 600,
              textDecoration: "none",
            }}>
              Log In
            </a>
          </div>
        </div>
      </nav>

      {/* ── Hero ────────────────────────────────────────────── */}
      <section style={{
        background: `radial-gradient(ellipse 60% 50% at 20% 10%, rgba(36,85,255,0.08), transparent),
                     radial-gradient(ellipse 50% 40% at 80% 80%, rgba(13,148,136,0.08), transparent),
                     ${ds.cream}`,
        padding: "72px 0 56px",
      }}>
        <div style={{ ...container, textAlign: "center" }}>
          <div style={{
            display: "inline-block",
            padding: "5px 14px",
            borderRadius: "999px",
            background: "rgba(36,85,255,0.08)",
            color: ds.blue,
            fontSize: "12px",
            fontWeight: 700,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            marginBottom: "20px",
          }}>
            Accreditation
          </div>
          <h1 style={{
            fontFamily: ds.fontDisplay,
            fontSize: "clamp(32px, 5vw, 54px)",
            fontWeight: 900,
            lineHeight: 1.1,
            letterSpacing: "-0.03em",
            margin: "0 0 20px",
            color: ds.ink,
          }}>
            CE Credits That Actually<br />Count Toward Your License
          </h1>
          <p style={{
            fontSize: "clamp(15px, 2vw, 18px)",
            color: ds.inkSoft,
            lineHeight: 1.7,
            maxWidth: "580px",
            margin: "0 auto 32px",
          }}>
            Every Pulse course is accredited through a nationally recognized body for each discipline.
            Free for healthcare professionals — paid for by the reps who invite them.
          </p>
          <div style={{ display: "flex", gap: "12px", justifyContent: "center", flexWrap: "wrap" }}>
            <a href="#disciplines" style={{
              padding: "13px 28px",
              borderRadius: "10px",
              background: ds.blue,
              color: "#fff",
              fontSize: "14px",
              fontWeight: 700,
              textDecoration: "none",
              boxShadow: "0 2px 14px rgba(36,85,255,0.25)",
            }}>
              View Disciplines
            </a>
            <a href="#state-approvals" style={{
              padding: "13px 28px",
              borderRadius: "10px",
              border: `1.5px solid ${ds.border}`,
              background: "white",
              color: ds.ink,
              fontSize: "14px",
              fontWeight: 700,
              textDecoration: "none",
            }}>
              State Approvals →
            </a>
          </div>
        </div>
      </section>

      {/* ── Trust bar ───────────────────────────────────────── */}
      <div style={{ borderBottom: `1px solid ${ds.border}`, background: "white" }}>
        <div style={{ ...container, padding: "20px 24px" }}>
          <div style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "24px",
            justifyContent: "center",
            alignItems: "center",
          }}>
            {[
              { label: "6 Disciplines", sub: "all major healthcare professions" },
              { label: "Free to Clinicians", sub: "paid for by sponsoring reps" },
              { label: "Instant Certificate", sub: "emailed on completion" },
              { label: "Nationally Accredited", sub: "ANCC, ACE/ASWB, CCMC & more" },
            ].map((item) => (
              <div key={item.label} style={{ textAlign: "center" }}>
                <div style={{ fontWeight: 800, fontSize: "15px", color: ds.ink }}>{item.label}</div>
                <div style={{ fontSize: "11px", color: ds.inkMuted, marginTop: "2px" }}>{item.sub}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Discipline cards ────────────────────────────────── */}
      <section id="disciplines" style={{ padding: "72px 0", scrollMarginTop: "80px" }}>
        <div style={container}>
          <div style={{ textAlign: "center", marginBottom: "48px" }}>
            <div style={{
              fontSize: "12px",
              fontWeight: 700,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: ds.teal,
              marginBottom: "12px",
            }}>
              Accredited Disciplines
            </div>
            <h2 style={{
              fontFamily: ds.fontDisplay,
              fontSize: "clamp(26px, 4vw, 38px)",
              fontWeight: 800,
              color: ds.ink,
              margin: "0 0 14px",
              letterSpacing: "-0.02em",
            }}>
              One Platform. Every Credential.
            </h2>
            <p style={{
              fontSize: "16px",
              color: ds.inkSoft,
              maxWidth: "500px",
              margin: "0 auto",
              lineHeight: 1.6,
            }}>
              Pulse courses are individually accredited for each profession — not a one-size-fits-all approach.
            </p>
          </div>

          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
            gap: "20px",
          }}>
            {DISCIPLINES.map((d) => (
              <div key={d.name} style={{
                borderRadius: "16px",
                border: `1px solid ${ds.border}`,
                background: "white",
                padding: "24px",
                boxShadow: "0 2px 10px rgba(11,18,34,0.04)",
                transition: "box-shadow 0.2s",
              }}>
                <div style={{ display: "flex", alignItems: "flex-start", gap: "14px", marginBottom: "14px" }}>
                  <div style={{
                    width: "44px",
                    height: "44px",
                    borderRadius: "12px",
                    background: d.bg,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "22px",
                    flexShrink: 0,
                  }}>
                    {d.icon}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 800, fontSize: "15px", color: ds.ink, lineHeight: 1.2 }}>
                      {d.name}
                    </div>
                    <div style={{ fontSize: "12px", color: ds.inkMuted, marginTop: "2px" }}>{d.shortName}</div>
                  </div>
                </div>

                <p style={{ fontSize: "13px", color: ds.inkSoft, lineHeight: 1.6, margin: "0 0 16px" }}>
                  {d.detail}
                </p>

                <div style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  paddingTop: "14px",
                  borderTop: `1px solid ${ds.border}`,
                }}>
                  <div>
                    <div style={{ fontSize: "10px", fontWeight: 700, color: ds.inkMuted, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                      Accreditor
                    </div>
                    <div style={{ fontSize: "13px", fontWeight: 700, color: d.color, marginTop: "2px" }}>
                      {d.accreditor}
                    </div>
                  </div>
                  <div style={{
                    padding: "5px 12px",
                    borderRadius: "999px",
                    background: d.bg,
                    fontSize: "11px",
                    fontWeight: 700,
                    color: d.color,
                  }}>
                    {d.hours}
                  </div>
                </div>

                <div style={{ marginTop: "10px", fontSize: "11px", color: ds.inkMuted, lineHeight: 1.5 }}>
                  {d.accreditorFull}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── State approvals table ───────────────────────────── */}
      <section style={{
        padding: "72px 0",
        background: ds.cream,
        borderTop: `1px solid ${ds.border}`,
        borderBottom: `1px solid ${ds.border}`,
      }}>
        <div style={container}>
          <StateApprovals />
        </div>
      </section>

      {/* ── Bottom CTA ──────────────────────────────────────── */}
      <section style={{ padding: "80px 0" }}>
        <div style={{ ...container, textAlign: "center" }}>
          <h2 style={{
            fontFamily: ds.fontDisplay,
            fontSize: "clamp(26px, 4vw, 38px)",
            fontWeight: 800,
            color: ds.ink,
            margin: "0 0 16px",
            letterSpacing: "-0.02em",
          }}>
            Ready to earn free CE credits?
          </h2>
          <p style={{
            fontSize: "16px",
            color: ds.inkSoft,
            maxWidth: "440px",
            margin: "0 auto 32px",
            lineHeight: 1.6,
          }}>
            Sign up as a professional and your rep will send you accredited courses — completely free.
          </p>
          <div style={{ display: "flex", gap: "12px", justifyContent: "center", flexWrap: "wrap" }}>
            <a href="/signup?role=pro" style={{
              padding: "14px 32px",
              borderRadius: "10px",
              background: ds.blue,
              color: "#fff",
              fontSize: "15px",
              fontWeight: 700,
              textDecoration: "none",
              boxShadow: "0 2px 14px rgba(36,85,255,0.25)",
            }}>
              Sign Up Free
            </a>
            <a href="/how-it-works" style={{
              padding: "14px 32px",
              borderRadius: "10px",
              border: `1.5px solid ${ds.border}`,
              background: "white",
              color: ds.ink,
              fontSize: "15px",
              fontWeight: 700,
              textDecoration: "none",
            }}>
              How It Works
            </a>
          </div>
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────────────── */}
      <footer style={{
        borderTop: `1px solid ${ds.border}`,
        padding: "32px 0",
        background: ds.cream,
      }}>
        <div style={{ ...container, display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "12px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <PulseLogo />
            <span style={{ fontFamily: ds.fontDisplay, fontWeight: 800, fontSize: "18px", color: ds.ink }}>Pulse</span>
          </div>
          <div style={{ fontSize: "12px", color: ds.inkMuted }}>
            © {new Date().getFullYear()} Pulse Referrals, Inc. · All CE courses are provided by accredited providers.
          </div>
        </div>
      </footer>
    </div>
  );
}
