"use client";

import React, { useState } from "react";
import { AccreditationStrip } from "../AccreditationStrip";

/* ── Design tokens ──────────────────────────────────────────── */
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
  tealDark: "#0f766e",
  tealGlow: "rgba(13,148,136,0.10)",
  border: "rgba(11,18,34,0.08)",
  r: "10px",
  rLg: "16px",
  rXl: "24px",
  fontBody: "'DM Sans', system-ui, sans-serif",
  fontDisplay: "'Fraunces', Georgia, serif",
} as const;

/* ── Logo SVG (V3 — glow version) ───────────────────────────── */
function PulseLogo({ size = 36, id = "nav" }: { size?: number; id?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 56 56" fill="none">
      <rect width="56" height="56" rx="14" fill={ds.ink} />
      <path
        d="M10 28 L17 28 L21 16 L26 40 L31 22 L35 32 L38 28 L46 28"
        stroke={`url(#${id}-glow)`}
        strokeWidth="8"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.3"
      />
      <path
        d="M10 28 L17 28 L21 16 L26 40 L31 22 L35 32 L38 28 L46 28"
        stroke={`url(#${id}-line)`}
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <defs>
        <linearGradient id={`${id}-line`} x1="10" y1="28" x2="46" y2="28">
          <stop offset="0%" stopColor="#6B8AFF" />
          <stop offset="100%" stopColor="#5EEAD4" />
        </linearGradient>
        <linearGradient id={`${id}-glow`} x1="10" y1="28" x2="46" y2="28">
          <stop offset="0%" stopColor="#2455ff" />
          <stop offset="100%" stopColor="#0d9488" />
        </linearGradient>
      </defs>
    </svg>
  );
}

/* ── FAQ Accordion Item ──────────────────────────────────────── */
function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ borderBottom: `1px solid ${ds.border}`, padding: "24px 0" }}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "16px",
          width: "100%",
          background: "none",
          border: "none",
          cursor: "pointer",
          fontFamily: ds.fontBody,
          fontSize: "16px",
          fontWeight: 700,
          color: ds.ink,
          textAlign: "left",
          padding: 0,
        }}
      >
        {q}
        <span
          style={{
            fontSize: "22px",
            color: ds.inkMuted,
            flexShrink: 0,
            transition: "transform 0.2s",
            transform: open ? "rotate(45deg)" : "none",
          }}
        >
          +
        </span>
      </button>
      <div
        style={{
          maxHeight: open ? "300px" : "0",
          overflow: "hidden",
          transition: "max-height 0.3s, margin 0.3s",
          marginTop: open ? "12px" : "0",
          fontSize: "15px",
          lineHeight: 1.7,
          color: ds.inkSoft,
        }}
      >
        {a}
      </div>
    </div>
  );
}

/* ── Step Card ───────────────────────────────────────────────── */
function StepCard({
  num,
  color,
  title,
  desc,
}: {
  num: number;
  color: string;
  title: string;
  desc: string;
}) {
  return (
    <div
      style={{
        borderRadius: ds.rXl,
        border: `1px solid ${ds.border}`,
        background: ds.white,
        padding: "36px",
        textAlign: "center",
        transition: "transform 0.3s, box-shadow 0.3s",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "translateY(-4px)";
        e.currentTarget.style.boxShadow = "0 12px 40px rgba(0,0,0,0.06)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.boxShadow = "none";
      }}
    >
      <div
        style={{
          width: "44px",
          height: "44px",
          borderRadius: "12px",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "20px",
          fontWeight: 800,
          color: ds.white,
          background: color,
          marginBottom: "20px",
        }}
      >
        {num}
      </div>
      <h3 style={{ fontSize: "18px", fontWeight: 700, marginBottom: "8px", color: ds.ink }}>
        {title}
      </h3>
      <p style={{ fontSize: "14px", lineHeight: 1.7, color: ds.inkSoft, margin: 0 }}>
        {desc}
      </p>
    </div>
  );
}

/* ── Distribution Method Card ────────────────────────────────── */
function DistCard({ icon, title, desc }: { icon: string; title: string; desc: string }) {
  return (
    <div
      style={{
        borderRadius: ds.rXl,
        border: `1px solid ${ds.border}`,
        background: ds.cream,
        padding: "32px",
        textAlign: "center",
        transition: "transform 0.2s, box-shadow 0.2s",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "translateY(-3px)";
        e.currentTarget.style.boxShadow = "0 8px 32px rgba(0,0,0,0.06)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.boxShadow = "none";
      }}
    >
      <span style={{ fontSize: "36px", display: "block", marginBottom: "14px" }}>{icon}</span>
      <h4 style={{ fontSize: "16px", fontWeight: 700, marginBottom: "6px", color: ds.ink }}>{title}</h4>
      <p style={{ fontSize: "13px", lineHeight: 1.6, color: ds.inkSoft, margin: 0 }}>{desc}</p>
    </div>
  );
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
/* MAIN COMPONENT                                                 */
/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

export default function HowItWorksPage() {
  const container: React.CSSProperties = {
    maxWidth: "1200px",
    margin: "0 auto",
    padding: "0 28px",
  };

  const sectionLabel: React.CSSProperties = {
    fontSize: "13px",
    fontWeight: 700,
    letterSpacing: "0.12em",
    textTransform: "uppercase",
  };

  const sectionTitle: React.CSSProperties = {
    fontFamily: ds.fontDisplay,
    fontSize: "clamp(28px, 3.5vw, 42px)",
    fontWeight: 800,
    letterSpacing: "-0.02em",
    marginTop: "12px",
    color: ds.ink,
  };

  return (
    <div style={{ fontFamily: ds.fontBody, color: ds.ink, background: ds.white }}>
      {/* ══════════════ NAV ══════════════ */}
      <nav
        style={{
          position: "sticky",
          top: 0,
          zIndex: 200,
          background: "rgba(255,255,255,0.92)",
          backdropFilter: "blur(16px)",
          borderBottom: `1px solid ${ds.border}`,
        }}
      >
        <div style={{ ...container, display: "flex", alignItems: "center", justifyContent: "space-between", height: "64px" }}>
          <a href="/" style={{ display: "flex", alignItems: "center", gap: "10px", textDecoration: "none" }}>
            <PulseLogo size={36} id="hiw-nav" />
            <span style={{ fontFamily: ds.fontDisplay, fontSize: "26px", fontWeight: 900, color: ds.ink }}>
              Pulse
            </span>
          </a>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <a
              href="/"
              style={{
                padding: "8px 20px",
                borderRadius: ds.r,
                border: `1px solid ${ds.border}`,
                background: "transparent",
                fontSize: "13px",
                fontWeight: 600,
                color: ds.inkSoft,
                textDecoration: "none",
              }}
            >
              ← Home
            </a>
            <a
              href="/accreditation"
              style={{
                padding: "8px 20px",
                borderRadius: ds.r,
                border: `1px solid ${ds.border}`,
                background: "transparent",
                fontSize: "13px",
                fontWeight: 600,
                color: ds.inkSoft,
                textDecoration: "none",
              }}
            >
              Accreditation
            </a>
            <a
              href="/login"
              style={{
                padding: "8px 20px",
                borderRadius: ds.r,
                background: ds.ink,
                color: ds.white,
                fontSize: "13px",
                fontWeight: 600,
                textDecoration: "none",
              }}
            >
              Log In
            </a>
          </div>
        </div>
      </nav>

      {/* ══════════════ HERO ══════════════ */}
      <section
        style={{
          position: "relative",
          overflow: "hidden",
          background: `radial-gradient(ellipse 70% 55% at 25% 15%, ${ds.blueGlow}, transparent), radial-gradient(ellipse 55% 45% at 80% 75%, ${ds.tealGlow}, transparent), ${ds.cream}`,
          padding: "80px 0 60px",
          textAlign: "center",
        }}
      >
        <div style={container}>
          <h1
            style={{
              fontFamily: ds.fontDisplay,
              fontSize: "clamp(36px, 5vw, 60px)",
              fontWeight: 900,
              lineHeight: 1.1,
              letterSpacing: "-0.03em",
              marginBottom: "16px",
            }}
          >
            How <em style={{ color: ds.blue, fontStyle: "italic" }}>Pulse</em> Works
          </h1>
          <p
            style={{
              fontSize: "19px",
              lineHeight: 1.7,
              color: ds.inkSoft,
              maxWidth: "640px",
              margin: "0 auto 36px",
            }}
          >
            Pulse connects healthcare professionals who need CE credits with the hospice, home
            health, and rehab sales teams who can provide them — for free.
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "14px" }}>
            <a
              href="#for-professionals"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                background: ds.teal,
                color: ds.white,
                fontWeight: 700,
                padding: "16px 36px",
                borderRadius: ds.r,
                fontSize: "16px",
                textDecoration: "none",
                boxShadow: "0 4px 20px rgba(13,148,136,0.2)",
              }}
            >
              I&apos;m a Healthcare Pro
            </a>
            <a
              href="#for-sales-teams"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                background: ds.blue,
                color: ds.white,
                fontWeight: 700,
                padding: "16px 36px",
                borderRadius: ds.r,
                fontSize: "16px",
                textDecoration: "none",
                boxShadow: "0 4px 24px rgba(36,85,255,0.25)",
              }}
            >
              I&apos;m a Sales Rep
            </a>
          </div>
        </div>
      </section>

      {/* ══════════════ THE EXCHANGE ══════════════ */}
      <section style={{ padding: "100px 0", background: ds.white }}>
        <div style={container}>
          <div style={{ textAlign: "center", maxWidth: "600px", margin: "0 auto 56px" }}>
            <p style={{ ...sectionLabel, color: ds.inkMuted }}>The Core Idea</p>
            <h2 style={sectionTitle}>Everyone Wins</h2>
            <p style={{ fontSize: "16px", color: ds.inkSoft, marginTop: "12px", lineHeight: 1.7 }}>
              Every licensed nurse, social worker, and therapist needs continuing education. Most
              facilities don&apos;t pay for it. Sales teams at hospice, home health, and rehab companies
              can provide it — and build the referral relationships that grow their business.
            </p>
          </div>

          <div
            style={{
              display: "grid",
              gap: "32px",
              maxWidth: "960px",
              margin: "0 auto",
              gridTemplateColumns: "1fr auto 1fr",
              alignItems: "stretch",
            }}
          >
            {/* Professional card */}
            <div
              style={{
                borderRadius: ds.rXl,
                padding: "44px 36px",
                textAlign: "center",
                border: "1px solid rgba(13,148,136,0.12)",
                background: "linear-gradient(135deg, rgba(13,148,136,0.04), rgba(13,148,136,0.08))",
              }}
            >
              <span style={{ fontSize: "48px", display: "block", marginBottom: "16px" }}>🧑‍⚕️</span>
              <h3 style={{ fontSize: "22px", fontWeight: 800, color: ds.teal, marginBottom: "8px" }}>
                Healthcare Professionals
              </h3>
              <p style={{ fontSize: "15px", color: ds.inkSoft, lineHeight: 1.6, margin: 0 }}>
                Get free, nationally accredited CE courses in ethics, palliative care, mental health,
                and more. Matched to your discipline and state. No cost, no catch.
              </p>
            </div>

            {/* Connector — Pulse logo */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "20px 0" }}>
              <svg width="60" height="60" viewBox="0 0 60 60" fill="none">
                <circle cx="30" cy="30" r="29" stroke={ds.border} strokeWidth="1.5" fill="white" />
                <path
                  d="M14 30 L20 30 L23 22 L27 38 L31 26 L34 33 L37 30 L46 30"
                  stroke="url(#ex-glow)"
                  strokeWidth="6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  opacity="0.2"
                />
                <path
                  d="M14 30 L20 30 L23 22 L27 38 L31 26 L34 33 L37 30 L46 30"
                  stroke="url(#ex-line)"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <defs>
                  <linearGradient id="ex-line" x1="14" y1="30" x2="46" y2="30">
                    <stop offset="0%" stopColor="#6B8AFF" />
                    <stop offset="100%" stopColor="#5EEAD4" />
                  </linearGradient>
                  <linearGradient id="ex-glow" x1="14" y1="30" x2="46" y2="30">
                    <stop offset="0%" stopColor="#2455ff" />
                    <stop offset="100%" stopColor="#0d9488" />
                  </linearGradient>
                </defs>
              </svg>
            </div>

            {/* Sales team card */}
            <div
              style={{
                borderRadius: ds.rXl,
                padding: "44px 36px",
                textAlign: "center",
                border: "1px solid rgba(36,85,255,0.12)",
                background: "linear-gradient(135deg, rgba(36,85,255,0.04), rgba(36,85,255,0.08))",
              }}
            >
              <span style={{ fontSize: "48px", display: "block", marginBottom: "16px" }}>💼</span>
              <h3 style={{ fontSize: "22px", fontWeight: 800, color: ds.blue, marginBottom: "8px" }}>
                Sales Teams
              </h3>
              <p style={{ fontSize: "15px", color: ds.inkSoft, lineHeight: 1.6, margin: 0 }}>
                Distribute free CEs to nurses, social workers, and case managers in your territory.
                Build real referral relationships — not just lunches.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════ FOR PROFESSIONALS ══════════════ */}
      <section id="for-professionals" style={{ padding: "100px 0", background: ds.cream }}>
        <div style={container}>
          <div style={{ textAlign: "center", maxWidth: "640px", margin: "0 auto 64px" }}>
            <p style={{ ...sectionLabel, color: ds.teal }}>
              For Nurses, Social Workers &amp; Therapists
            </p>
            <h2 style={sectionTitle}>Get Free CEs in 3 Steps</h2>
            <p style={{ fontSize: "17px", color: ds.inkSoft, marginTop: "14px" }}>
              No cost. No app. No account required to start.
            </p>
          </div>
          <div
            style={{
              display: "grid",
              gap: "32px",
              maxWidth: "960px",
              margin: "0 auto",
              gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
            }}
          >
            <StepCard
              num={1}
              color={ds.teal}
              title="Receive or Scan"
              desc="A rep sends you a CE course link by email — or you scan a QR code on a flyer at your facility. Either way, it takes 10 seconds."
            />
            <StepCard
              num={2}
              color={ds.teal}
              title="Complete Your Course"
              desc="Access your accredited CE course online. Self-paced, any device, any time. Ethics, palliative care, mental health, and more."
            />
            <StepCard
              num={3}
              color={ds.teal}
              title="Get More Free CEs"
              desc="Register for a free account to request specific courses, connect with local reps, and manage your CE history. No cost to you — ever."
            />
          </div>
          <div style={{ textAlign: "center", marginTop: "48px" }}>
            <p style={{ fontSize: "14px", color: ds.inkMuted, marginBottom: "20px" }}>
              RN · LPN · MSW · LCSW · Case Managers · PT · OT · SLP
            </p>
            <a
              href="/register"
              style={{
                display: "inline-flex",
                alignItems: "center",
                background: ds.teal,
                color: ds.white,
                fontWeight: 700,
                padding: "16px 36px",
                borderRadius: ds.r,
                fontSize: "16px",
                textDecoration: "none",
                boxShadow: "0 4px 20px rgba(13,148,136,0.2)",
              }}
            >
              Create My Free Account
            </a>
          </div>
        </div>
      </section>

      {/* ══════════════ ACCREDITATION STRIP ══════════════ */}
      <AccreditationStrip />

      {/* ══════════════ FOR SALES TEAMS ══════════════ */}
      <section id="for-sales-teams" style={{ padding: "100px 0", background: ds.white }}>
        <div style={container}>
          <div style={{ textAlign: "center", maxWidth: "640px", margin: "0 auto 64px" }}>
            <p style={{ ...sectionLabel, color: ds.blue }}>
              For Hospice, Home Health &amp; Rehab Sales Teams
            </p>
            <h2 style={sectionTitle}>Build Referral Relationships with Free CEs</h2>
            <p style={{ fontSize: "17px", color: ds.inkSoft, marginTop: "14px" }}>
              Every CE you distribute is a touchpoint with a potential referral source.
            </p>
          </div>
          <div
            style={{
              display: "grid",
              gap: "32px",
              maxWidth: "960px",
              margin: "0 auto",
              gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
            }}
          >
            <StepCard
              num={1}
              color={ds.blue}
              title="Build Your Network"
              desc="Add professionals one by one, import a CSV, or let them find you through Pulse's discovery feature. Case managers, social workers, nurses — all in one place."
            />
            <StepCard
              num={2}
              color={ds.blue}
              title="Send Free CEs"
              desc="Pick a course, pick a professional, hit send. Or generate a branded QR code and flyer to leave at facilities. One click. Their inbox. Done."
            />
            <StepCard
              num={3}
              color={ds.blue}
              title="Track & Grow"
              desc="See who opened their course. Log calls and visits. Watch your referral network grow. Managers see the whole team's activity in one dashboard."
            />
          </div>
          <div style={{ textAlign: "center", marginTop: "48px" }}>
            <a
              href="/login"
              style={{
                display: "inline-flex",
                alignItems: "center",
                background: ds.blue,
                color: ds.white,
                fontWeight: 700,
                padding: "16px 36px",
                borderRadius: ds.r,
                fontSize: "16px",
                textDecoration: "none",
                boxShadow: "0 4px 24px rgba(36,85,255,0.25)",
              }}
            >
              Get Started Free
            </a>
          </div>
        </div>
      </section>

      {/* ══════════════ DISTRIBUTION METHODS ══════════════ */}
      <section style={{ padding: "100px 0", background: ds.cream }}>
        <div style={container}>
          <div style={{ textAlign: "center", maxWidth: "640px", margin: "0 auto 64px" }}>
            <p style={{ ...sectionLabel, color: ds.blue }}>Distribution Tools</p>
            <h2 style={sectionTitle}>Four Ways to Distribute Free CEs</h2>
          </div>
          <div
            style={{
              display: "grid",
              gap: "20px",
              gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
              maxWidth: "1040px",
              margin: "0 auto",
            }}
          >
            <DistCard
              icon="📧"
              title="Direct Send"
              desc="Pick a professional, select a course, send. They get an email with an instant access link."
            />
            <DistCard
              icon="📱"
              title="QR Code"
              desc="Show a QR code on your phone or leave a flyer. Professional scans, enters email, gets their CE."
            />
            <DistCard
              icon="📄"
              title="Branded Flyers"
              desc="Auto-generated print-ready flyers with your company name, QR code, and course details."
            />
            <DistCard
              icon="👥"
              title="Bulk Send"
              desc="Send courses to 5 or 50 people at once — from your network, a CSV, or manual entry."
            />
          </div>
        </div>
      </section>

      {/* ══════════════ PRICING ══════════════ */}
      <section style={{ padding: "100px 0", background: ds.white }}>
        <div style={container}>
          <div style={{ textAlign: "center", maxWidth: "600px", margin: "0 auto 48px" }}>
            <p style={{ ...sectionLabel, color: ds.teal }}>Pricing</p>
            <h2 style={sectionTitle}>Simple Pricing. No Surprises.</h2>
            <p style={{ fontSize: "16px", color: ds.inkSoft, marginTop: "12px" }}>
              Get started free. CE courses are priced per course, per send — the same rates you&apos;d
              pay on HISCornerstone.com. Professionals never pay a thing.
            </p>
          </div>

          <div
            style={{
              maxWidth: "640px",
              margin: "0 auto",
              borderRadius: ds.rXl,
              border: `1px solid ${ds.border}`,
              background: ds.white,
              padding: "48px",
              boxShadow: "0 4px 24px rgba(0,0,0,0.04)",
            }}
          >
            {/* Two-box pricing summary */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px", marginBottom: "28px" }}>
              <div style={{ borderRadius: ds.rLg, background: ds.cream, padding: "24px" }}>
                <div
                  style={{
                    fontSize: "13px",
                    fontWeight: 700,
                    color: ds.inkMuted,
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                    marginBottom: "8px",
                  }}
                >
                  Platform
                </div>
                <div style={{ fontFamily: ds.fontDisplay, fontSize: "36px", fontWeight: 900, color: ds.ink }}>
                  Free
                </div>
                <div style={{ fontSize: "13px", color: ds.inkSoft, marginTop: "4px" }}>to get started</div>
              </div>
              <div style={{ borderRadius: ds.rLg, background: "rgba(36,85,255,0.05)", padding: "24px" }}>
                <div
                  style={{
                    fontSize: "13px",
                    fontWeight: 700,
                    color: ds.inkMuted,
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                    marginBottom: "8px",
                  }}
                >
                  CE Courses
                </div>
                <div style={{ fontFamily: ds.fontDisplay, fontSize: "36px", fontWeight: 900, color: ds.blue }}>
                  Per Send
                </div>
                <div style={{ fontSize: "13px", color: ds.inkSoft, marginTop: "4px" }}>standard course pricing</div>
              </div>
            </div>

            {/* Feature list */}
            <p style={{ fontSize: "14px", fontWeight: 700, color: ds.ink, marginBottom: "12px" }}>
              What&apos;s included:
            </p>
            <ul style={{ listStyle: "none", padding: 0, margin: "0 0 24px", display: "grid", gap: "12px" }}>
              {[
                "Unlimited rep accounts — no per-seat fees",
                "Network management & CSV import",
                "Touchpoint tracking (calls, visits, CEs, events)",
                "QR codes & branded flyers",
                "Professional discovery",
                "Manager dashboard & team visibility",
                "Bulk send & CE history tracking",
              ].map((item) => (
                <li key={item} style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "15px" }}>
                  <span
                    style={{
                      flexShrink: 0,
                      width: "24px",
                      height: "24px",
                      borderRadius: "50%",
                      background: ds.tealGlow,
                      color: ds.teal,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "12px",
                      fontWeight: 800,
                    }}
                  >
                    ✓
                  </span>
                  {item}
                </li>
              ))}
            </ul>

            {/* Course pricing note */}
            <div style={{ borderTop: `1px solid ${ds.border}`, paddingTop: "24px", marginBottom: "24px" }}>
              <p style={{ fontSize: "14px", color: ds.inkSoft, lineHeight: 1.7 }}>
                CE courses are priced individually based on credit hours — same pricing as{" "}
                <a
                  href="https://hiscornerstone.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: ds.blue, textDecoration: "none", fontWeight: 600 }}
                >
                  HISCornerstone.com
                </a>
                . Your company is invoiced monthly based on usage. Professionals always receive
                courses at no cost to them.
              </p>
            </div>

            {/* Early access badge */}
            <div style={{ textAlign: "center" }}>
              <span
                style={{
                  display: "inline-block",
                  background: "rgba(36,85,255,0.08)",
                  color: ds.blue,
                  padding: "8px 20px",
                  borderRadius: "20px",
                  fontSize: "13px",
                  fontWeight: 700,
                }}
              >
                🚀 Early access — get started with complimentary CE sends
              </span>
              <div style={{ marginTop: "28px" }}>
                <a
                  href="/login"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    background: ds.blue,
                    color: ds.white,
                    fontWeight: 700,
                    padding: "16px 36px",
                    borderRadius: ds.r,
                    fontSize: "16px",
                    textDecoration: "none",
                    boxShadow: "0 4px 24px rgba(36,85,255,0.25)",
                  }}
                >
                  Get Started Free
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════ FAQ ══════════════ */}
      <section style={{ padding: "100px 0", background: ds.cream }}>
        <div style={container}>
          <div style={{ textAlign: "center", marginBottom: "48px" }}>
            <p style={{ ...sectionLabel, color: ds.inkMuted }}>FAQ</p>
            <h2 style={sectionTitle}>Common Questions</h2>
          </div>
          <div style={{ maxWidth: "780px", margin: "0 auto" }}>
            <FaqItem
              q="Is this really free for healthcare professionals?"
              a="Yes. CE courses are provided at no cost to nurses, social workers, case managers, and therapists. You will never be charged. The cost is covered by the sales teams who distribute them."
            />
            <FaqItem
              q="What disciplines are supported?"
              a="Nursing (RN, LPN, LVN), Social Work (MSW, LCSW), Case Management, Physical Therapy, Occupational Therapy, and Speech-Language Pathology. Courses are matched to your discipline and state licensing requirements."
            />
            <FaqItem
              q="Are the courses nationally accredited?"
              a="Yes. All CE courses on Pulse are nationally accredited and approved across all 50 states. Courses are provided through HISCornerstone.com, an established CE provider."
            />
            <FaqItem
              q="Do I need to create an account?"
              a="Not to receive your first CE course. When a rep sends you a course or you scan a QR code, you just enter your email. Create a free account later to manage your courses, make requests, and connect with more reps."
            />
            <FaqItem
              q="How do sales teams pay?"
              a="The platform is free to get started — no per-seat fees. CE courses are priced per send based on credit hours, the same rates as HISCornerstone.com. Your company receives a monthly invoice based on usage. During early access, we're offering complimentary CE sends to help you get started."
            />
            <FaqItem
              q="Can I use this for my whole team?"
              a="Yes. Managers can invite reps with a single link. The manager dashboard shows team-wide metrics — CEs distributed, network sizes, redemption rates, and rep activity. No per-seat fees."
            />
            <FaqItem
              q="Who are the sales teams that use Pulse?"
              a="Business development and community liaison teams at hospice agencies, home health companies, rehab facilities, skilled nursing facilities, and similar healthcare organizations that rely on professional referrals."
            />
          </div>
        </div>
      </section>

      {/* ══════════════ FINAL CTA ══════════════ */}
      <section
        style={{
          padding: "100px 0",
          background: `radial-gradient(ellipse 50% 80% at 30% 50%, rgba(36,85,255,0.06), transparent), radial-gradient(ellipse 50% 60% at 80% 40%, ${ds.tealGlow}, transparent), ${ds.white}`,
          textAlign: "center",
        }}
      >
        <div style={container}>
          <h2
            style={{
              fontFamily: ds.fontDisplay,
              fontSize: "clamp(28px, 4vw, 44px)",
              fontWeight: 900,
              letterSpacing: "-0.02em",
              marginBottom: "16px",
            }}
          >
            Ready to Get Started?
          </h2>
          <p style={{ fontSize: "17px", color: ds.inkSoft, maxWidth: "520px", margin: "0 auto 36px" }}>
            Whether you need free CEs for your license or a better way to build referral
            relationships — Pulse is free to get started.
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "14px" }}>
            <a
              href="/register"
              style={{
                display: "inline-flex",
                alignItems: "center",
                background: ds.teal,
                color: ds.white,
                fontWeight: 700,
                padding: "16px 36px",
                borderRadius: ds.r,
                fontSize: "16px",
                textDecoration: "none",
                boxShadow: "0 4px 20px rgba(13,148,136,0.2)",
              }}
            >
              Get Free CEs
            </a>
            <a
              href="/login"
              style={{
                display: "inline-flex",
                alignItems: "center",
                background: ds.blue,
                color: ds.white,
                fontWeight: 700,
                padding: "16px 36px",
                borderRadius: ds.r,
                fontSize: "16px",
                textDecoration: "none",
                boxShadow: "0 4px 24px rgba(36,85,255,0.25)",
              }}
            >
              I&apos;m a Sales Rep
            </a>
          </div>
        </div>
      </section>

      {/* ══════════════ FOOTER ══════════════ */}
      <footer
        style={{
          background: ds.ink,
          padding: "40px 0",
          textAlign: "center",
          fontSize: "13px",
          color: "rgba(255,255,255,0.35)",
        }}
      >
        <div style={container}>
          <p>
            © 2026 Pulse. All rights reserved. ·{" "}
            <a href="/" style={{ color: "rgba(255,255,255,0.5)", textDecoration: "none" }}>
              Home
            </a>{" "}
            ·{" "}
            <a href="/how-it-works" style={{ color: "rgba(255,255,255,0.5)", textDecoration: "none" }}>
              How It Works
            </a>{" "}
            ·{" "}
            <a href="/accreditation" style={{ color: "rgba(255,255,255,0.5)", textDecoration: "none" }}>
              Accreditation
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
}
