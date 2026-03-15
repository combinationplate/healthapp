"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { AccreditationInline } from "@/src/components/AccreditationStrip";

const DISCIPLINES = ["Nursing", "Social Work", "Case Management", "PT", "OT", "ST"];

type Course = {
  id: string;
  name: string;
  hours: number;
  topic: string | null;
};

type RepInfo = {
  name: string;
  company: string;
};

/* ── Design tokens (same as DashboardShell.ts) ───────────────── */
const ds = {
  ink: "#0b1222",
  inkSoft: "#3b4963",
  inkMuted: "#7a8ba8",
  white: "#ffffff",
  cream: "#f6f5f0",
  blue: "#2455ff",
  blueDark: "#1a3fcc",
  blueGlow: "rgba(36,85,255,0.10)",
  teal: "#0d9488",
  tealGlow: "rgba(13,148,136,0.10)",
  coral: "#e8604c",
  border: "rgba(11,18,34,0.08)",
  r: "10px",
  rLg: "16px",
  fontBody: "'DM Sans', system-ui, sans-serif",
  fontDisplay: "'Fraunces', Georgia, serif",
  shadow: "0 4px 24px rgba(0,0,0,0.06)",
} as const;

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "12px 14px",
  borderRadius: ds.r,
  border: `1.5px solid ${ds.border}`,
  fontSize: "14px",
  fontFamily: ds.fontBody,
  boxSizing: "border-box",
  color: ds.ink,
  background: ds.white,
  transition: "border-color 0.15s, box-shadow 0.15s",
};

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: "12px",
  fontWeight: 600,
  color: ds.inkMuted,
  marginBottom: "6px",
  letterSpacing: "0.02em",
};

export default function CELandingPage() {
  const params = useParams();
  const repId = params.repId as string;
  const courseId = params.courseId as string | undefined;

  const [repInfo, setRepInfo] = useState<RepInfo | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<string>("");
  const [discipline, setDiscipline] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [name, setName] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [capReached, setCapReached] = useState(false);

  useEffect(() => {
    fetch(`/api/ce/landing?repId=${repId}${courseId ? `&courseId=${courseId}` : ""}`)
      .then(r => r.json())
      .then(data => {
        setRepInfo(data.rep);
        setCourses(data.courses ?? []);
        if (data.preselectedCourse) setSelectedCourse(data.preselectedCourse);
        if (data.capReached) setCapReached(true);
        setLoading(false);
      });
  }, [repId, courseId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedCourse && courses.length > 1) {
      setError("Please select a course.");
      return;
    }
    setSubmitting(true);
    setError(null);
    const res = await fetch("/api/ce/landing", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        repId,
        courseId: selectedCourse || courses[0]?.id,
        email,
        name,
        discipline,
      }),
    });
    const data = await res.json();
    setSubmitting(false);
    if (!res.ok) {
      if (data.error === "cap_reached") {
        setError("This QR code has reached its scan limit. Please contact your representative directly.");
      } else if (data.error === "already_sent") {
        setError("You've already received a course from this representative. Check your email for your previous course link.");
      } else {
        setError(data.error ?? "Something went wrong.");
      }
      return;
    }
    setSuccess(true);
  }

  /* ── Loading state ─────────────────────────────────────────── */
  if (loading) {
    return (
      <div style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: ds.cream,
        fontFamily: ds.fontBody,
      }}>
        <div style={{ textAlign: "center" }}>
          <svg width="36" height="36" viewBox="0 0 56 56" fill="none" style={{ marginBottom: "16px" }}>
            <rect width="56" height="56" rx="14" fill="#0b1222" />
            <path d="M10 28 L17 28 L21 16 L26 40 L31 22 L35 32 L38 28 L46 28"
              stroke="url(#qr-load-glow)" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" opacity="0.3" />
            <path d="M10 28 L17 28 L21 16 L26 40 L31 22 L35 32 L38 28 L46 28"
              stroke="url(#qr-load-line)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
            <defs>
              <linearGradient id="qr-load-line" x1="10" y1="28" x2="46" y2="28">
                <stop offset="0%" stopColor="#6B8AFF" />
                <stop offset="100%" stopColor="#5EEAD4" />
              </linearGradient>
              <linearGradient id="qr-load-glow" x1="10" y1="28" x2="46" y2="28">
                <stop offset="0%" stopColor="#2455ff" />
                <stop offset="100%" stopColor="#0d9488" />
              </linearGradient>
            </defs>
          </svg>
          <p style={{ color: ds.inkMuted, fontSize: "14px" }}>Loading…</p>
        </div>
      </div>
    );
  }

  /* ── Success state ─────────────────────────────────────────── */
  if (success) {
    return (
      <div style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: ds.cream,
        fontFamily: ds.fontBody,
      }}>
        <div style={{ textAlign: "center", padding: "40px", maxWidth: "420px" }}>
          {/* Animated check circle */}
          <div style={{
            width: "72px", height: "72px", borderRadius: "50%",
            background: ds.tealGlow, border: `2px solid ${ds.teal}`,
            display: "inline-flex", alignItems: "center", justifyContent: "center",
            fontSize: "32px", marginBottom: "20px",
          }}>✓</div>
          <h1 style={{
            fontFamily: ds.fontDisplay,
            fontSize: "28px",
            fontWeight: 800,
            color: ds.ink,
            marginBottom: "10px",
            letterSpacing: "-0.01em",
          }}>Check your email!</h1>
          <p style={{ color: ds.inkMuted, fontSize: "15px", lineHeight: 1.6 }}>
            Your free CE course is on its way. Check your inbox for the access link and coupon code.
          </p>
          {repInfo && (
            <p style={{ color: ds.inkMuted, fontSize: "13px", marginTop: "20px" }}>
              Sent by {repInfo.name}{repInfo.company ? ` · ${repInfo.company}` : ""}
            </p>
          )}
          <div style={{ marginTop: "28px" }}>
            <AccreditationInline />
          </div>
        </div>
      </div>
    );
  }

  /* ── Cap reached state ─────────────────────────────────────── */
  if (capReached) {
    return (
      <div style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: ds.cream,
        fontFamily: ds.fontBody,
        padding: "24px",
      }}>
        <div style={{
          textAlign: "center",
          padding: "48px 32px",
          maxWidth: "420px",
          background: ds.white,
          borderRadius: ds.rLg,
          border: `1px solid ${ds.border}`,
          boxShadow: ds.shadow,
        }}>
          <div style={{ fontSize: "48px", marginBottom: "16px" }}>📋</div>
          <h1 style={{
            fontFamily: ds.fontDisplay,
            fontSize: "24px",
            fontWeight: 800,
            color: ds.ink,
            marginBottom: "10px",
          }}>This QR Code Has Reached Its Limit</h1>
          <p style={{ color: ds.inkMuted, fontSize: "15px", lineHeight: 1.6, marginBottom: "24px" }}>
            The maximum number of courses have been claimed through this link.
            {repInfo?.name ? ` Contact ${repInfo.name}${repInfo.company ? ` at ${repInfo.company}` : ""} directly to request a free CE course.` : " Contact your representative directly to request a free CE course."}
          </p>
          <a
            href="/"
            style={{
              display: "inline-flex",
              alignItems: "center",
              background: ds.teal,
              color: ds.white,
              fontWeight: 700,
              padding: "14px 28px",
              borderRadius: ds.r,
              fontSize: "15px",
              textDecoration: "none",
            }}
          >
            Learn More About Pulse
          </a>
        </div>
      </div>
    );
  }

  /* ── Main form ─────────────────────────────────────────────── */
  return (
    <div style={{
      minHeight: "100vh",
      background: ds.cream,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "24px",
      fontFamily: ds.fontBody,
      position: "relative",
    }}>
      {/* Subtle radial glow behind card — matches landing hero */}
      <div style={{
        position: "fixed", top: "-20%", left: "-10%",
        width: "60%", height: "80%",
        background: `radial-gradient(circle, ${ds.blueGlow}, transparent 70%)`,
        pointerEvents: "none",
      }} />
      <div style={{
        position: "fixed", bottom: "-20%", right: "-10%",
        width: "50%", height: "70%",
        background: `radial-gradient(circle, ${ds.tealGlow}, transparent 70%)`,
        pointerEvents: "none",
      }} />

      <div style={{
        width: "100%",
        maxWidth: "440px",
        background: ds.white,
        borderRadius: ds.rLg,
        padding: "40px",
        border: `1px solid ${ds.border}`,
        boxShadow: ds.shadow,
        position: "relative",
        zIndex: 1,
      }}>
        {/* Top accent bar */}
        <div style={{
          position: "absolute", top: 0, left: 0, right: 0, height: "3px",
          background: `linear-gradient(90deg, ${ds.blue}, ${ds.teal})`,
          borderRadius: `${ds.rLg} ${ds.rLg} 0 0`,
        }} />

        {/* Header */}
        <div style={{ marginBottom: "32px", textAlign: "center" }}>
          {/* Pulse logo mark */}
          <svg width="44" height="44" viewBox="0 0 56 56" fill="none" style={{ marginBottom: "16px" }}>
            <rect width="56" height="56" rx="14" fill="#0b1222" />
            <path d="M10 28 L17 28 L21 16 L26 40 L31 22 L35 32 L38 28 L46 28"
              stroke="url(#qr-glow)" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" opacity="0.3" />
            <path d="M10 28 L17 28 L21 16 L26 40 L31 22 L35 32 L38 28 L46 28"
              stroke="url(#qr-line)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
            <defs>
              <linearGradient id="qr-line" x1="10" y1="28" x2="46" y2="28">
                <stop offset="0%" stopColor="#6B8AFF" />
                <stop offset="100%" stopColor="#5EEAD4" />
              </linearGradient>
              <linearGradient id="qr-glow" x1="10" y1="28" x2="46" y2="28">
                <stop offset="0%" stopColor="#2455ff" />
                <stop offset="100%" stopColor="#0d9488" />
              </linearGradient>
            </defs>
          </svg>
          <h1 style={{
            fontFamily: ds.fontDisplay,
            fontSize: "26px",
            fontWeight: 800,
            color: ds.ink,
            marginBottom: "8px",
            letterSpacing: "-0.01em",
          }}>Get a Free CE Course</h1>
          {repInfo && (
            <p style={{ color: ds.inkMuted, fontSize: "14px", lineHeight: 1.5 }}>
              Compliments of <strong style={{ color: ds.ink, fontWeight: 600 }}>{repInfo.name}</strong>
              {repInfo.company ? ` · ${repInfo.company}` : ""}
            </p>
          )}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: "grid", gap: "18px" }}>
          <div>
            <label style={labelStyle}>Your Name</label>
            <input
              type="text"
              required
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Jennifer Lopez, RN"
              style={inputStyle}
            />
          </div>
          <div>
            <label style={labelStyle}>Email Address</label>
            <input
              type="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="jennifer@hospital.com"
              style={inputStyle}
            />
          </div>
          <div>
            <label style={labelStyle}>Your Discipline</label>
            <select
              required
              value={discipline}
              onChange={e => setDiscipline(e.target.value)}
              style={{ ...inputStyle, appearance: "none" as const }}
            >
              <option value="">Select…</option>
              {DISCIPLINES.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>

          {/* Multiple courses — show picker */}
          {courses.length > 1 && (
            <div>
              <label style={labelStyle}>Select a Course</label>
              <select
                required
                value={selectedCourse}
                onChange={e => setSelectedCourse(e.target.value)}
                style={{ ...inputStyle, appearance: "none" as const }}
              >
                <option value="">Choose a course…</option>
                {courses
                  .filter((c: any) => {
                    if (!discipline || !c.professions) return true;
                    const disciplineMap: Record<string, string> = {
                      "Nursing": "Nursing",
                      "Social Work": "Social Work",
                      "Case Management": "Case Management",
                      "PT": "PT",
                      "OT": "OT",
                      "ST": "ST",
                    };
                    const mapped = disciplineMap[discipline] ?? discipline;
                    return c.professions.includes(mapped);
                  })
                  .map((c: any) => (
                    <option key={c.id} value={c.id}>{c.name} ({c.hours} hrs)</option>
                  ))}
              </select>
            </div>
          )}

          {/* Single course — show card */}
          {courses.length === 1 && (
            <div style={{
              padding: "14px 16px",
              background: ds.blueGlow,
              borderRadius: ds.r,
              border: `1px solid rgba(36,85,255,0.15)`,
            }}>
              <div style={{ fontWeight: 700, fontSize: "14px", color: ds.ink }}>{courses[0].name}</div>
              <div style={{ fontSize: "12px", color: ds.inkMuted, marginTop: "3px" }}>
                {courses[0].hours} hrs{courses[0].topic ? ` · ${courses[0].topic}` : ""} · Complimentary
              </div>
            </div>
          )}

          {/* Error message */}
          {error && (
            <div style={{
              padding: "12px 14px",
              background: "rgba(232,96,76,0.08)",
              borderRadius: ds.r,
              border: "1px solid rgba(232,96,76,0.2)",
            }}>
              <p style={{ fontSize: "13px", color: ds.coral, margin: 0 }}>{error}</p>
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={submitting}
            style={{
              padding: "14px",
              borderRadius: ds.r,
              border: "none",
              background: ds.blue,
              color: ds.white,
              fontSize: "15px",
              fontWeight: 700,
              fontFamily: ds.fontBody,
              cursor: submitting ? "not-allowed" : "pointer",
              opacity: submitting ? 0.6 : 1,
              boxShadow: "0 4px 16px rgba(36,85,255,0.25)",
              transition: "background 0.2s, transform 0.15s, box-shadow 0.2s",
            }}
            onMouseEnter={(e) => {
              if (!submitting) {
                e.currentTarget.style.background = ds.blueDark;
                e.currentTarget.style.transform = "translateY(-1px)";
                e.currentTarget.style.boxShadow = "0 6px 20px rgba(36,85,255,0.3)";
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = ds.blue;
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "0 4px 16px rgba(36,85,255,0.25)";
            }}
          >
            {submitting ? "Sending…" : "Get My Free CE →"}
          </button>

          <p style={{
            fontSize: "11px",
            color: ds.inkMuted,
            textAlign: "center",
            margin: 0,
          }}>
            No account required. Course delivered by email.
          </p>

          <div style={{
            borderTop: `1px solid ${ds.border}`,
            paddingTop: "16px",
            marginTop: "4px",
          }}>
            <AccreditationInline />
          </div>
        </form>
      </div>
    </div>
  );
}