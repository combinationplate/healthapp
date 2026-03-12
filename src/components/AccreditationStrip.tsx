"use client";

import React, { useState } from "react";

/* ── Accreditation badge data ─────────────────────────────────── */
const BADGES = [
  {
    abbr: "ANCC",
    full: "American Nurses Credentialing Center",
    discipline: "Nursing",
    color: "#2455ff",
    bg: "rgba(36,85,255,0.08)",
    logo: "/logos/ancc.png",
  },
  {
    abbr: "ASWB/ACE",
    full: "Approved Continuing Education — Assoc. of Social Work Boards",
    discipline: "Social Work",
    color: "#0d9488",
    bg: "rgba(13,148,136,0.08)",
    logo: "/logos/aswb.png",
  },
  {
    abbr: "CCMC",
    full: "Commission for Case Manager Certification",
    discipline: "Case Mgmt",
    color: "#92670A",
    bg: "rgba(146,103,10,0.08)",
  },
  {
    abbr: "TPTA",
    full: "Texas Physical Therapy Association",
    discipline: "PT (TX)",
    color: "#e8604c",
    bg: "rgba(232,96,76,0.08)",
  },
  {
    abbr: "AOTA",
    full: "American Occupational Therapy Association",
    discipline: "OT",
    color: "#7c3aed",
    bg: "rgba(139,92,246,0.08)",
  },
  {
    abbr: "ASHA",
    full: "American Speech-Language-Hearing Association",
    discipline: "SLP",
    color: "#059669",
    bg: "rgba(16,185,129,0.08)",
  },
] as const;

/* ── Badge pill (shared by both components) ─────────────────────── */
function BadgePill({
  abbr,
  full,
  discipline,
  color,
  bg,
  logo,
  size = "md",
}: (typeof BADGES)[number] & { size?: "sm" | "md" }) {
  const [imgFailed, setImgFailed] = useState(false);
  const showLogo = logo && !imgFailed;

  return (
    <div
      title={full}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: size === "sm" ? "5px" : "7px",
        padding: size === "sm" ? "4px 10px" : "6px 12px",
        borderRadius: "999px",
        background: bg,
        border: `1px solid ${color}22`,
        flexShrink: 0,
        cursor: "default",
      }}
    >
      {showLogo ? (
        <img
          src={logo}
          alt={abbr}
          onError={() => setImgFailed(true)}
          style={{
            height: size === "sm" ? "14px" : "18px",
            width: "auto",
            objectFit: "contain",
          }}
        />
      ) : (
        <span
          style={{
            fontSize: size === "sm" ? "10px" : "11px",
            fontWeight: 800,
            color,
            letterSpacing: "0.03em",
            fontFamily: "'DM Sans', system-ui, sans-serif",
          }}
        >
          {abbr}
        </span>
      )}
      <span
        style={{
          fontSize: size === "sm" ? "10px" : "11px",
          fontWeight: 600,
          color: "#3b4963",
          fontFamily: "'DM Sans', system-ui, sans-serif",
        }}
      >
        {discipline}
      </span>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   AccreditationStrip — boxed section, embed on landing pages
══════════════════════════════════════════════════════════════════ */
export function AccreditationStrip() {
  return (
    <section
      style={{
        background: "#f6f5f0",
        borderTop: "1px solid rgba(11,18,34,0.08)",
        borderBottom: "1px solid rgba(11,18,34,0.08)",
        padding: "40px 24px",
      }}
    >
      <div
        style={{
          maxWidth: "900px",
          margin: "0 auto",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "20px",
          textAlign: "center",
        }}
      >
        {/* Label */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <span
            style={{
              display: "inline-block",
              width: "20px",
              height: "2px",
              background: "rgba(11,18,34,0.2)",
              borderRadius: "999px",
            }}
          />
          <span
            style={{
              fontSize: "11px",
              fontWeight: 700,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: "#7a8ba8",
              fontFamily: "'DM Sans', system-ui, sans-serif",
            }}
          >
            CE Credits Approved By
          </span>
          <span
            style={{
              display: "inline-block",
              width: "20px",
              height: "2px",
              background: "rgba(11,18,34,0.2)",
              borderRadius: "999px",
            }}
          />
        </div>

        {/* Badge row */}
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "8px",
            justifyContent: "center",
          }}
        >
          {BADGES.map((b) => (
            <BadgePill key={b.abbr} {...b} size="md" />
          ))}
        </div>

        {/* Sub-text + link */}
        <p
          style={{
            fontSize: "13px",
            color: "#7a8ba8",
            margin: 0,
            lineHeight: 1.6,
            fontFamily: "'DM Sans', system-ui, sans-serif",
          }}
        >
          Nationally accredited for Nursing, Social Work, Case Management, PT, OT &amp; SLP.{" "}
          <a
            href="/accreditation"
            style={{
              color: "#2455ff",
              fontWeight: 600,
              textDecoration: "none",
            }}
          >
            View state approvals →
          </a>
        </p>
      </div>
    </section>
  );
}

/* ══════════════════════════════════════════════════════════════════
   AccreditationInline — compact single-line, embed in forms/cards
══════════════════════════════════════════════════════════════════ */
export function AccreditationInline() {
  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        alignItems: "center",
        gap: "6px",
        justifyContent: "center",
      }}
    >
      <span
        style={{
          fontSize: "11px",
          color: "#7a8ba8",
          fontWeight: 600,
          fontFamily: "'DM Sans', system-ui, sans-serif",
          whiteSpace: "nowrap",
        }}
      >
        CE credits approved by:
      </span>
      {BADGES.map((b) => (
        <BadgePill key={b.abbr} {...b} size="sm" />
      ))}
      <a
        href="/accreditation"
        style={{
          fontSize: "11px",
          color: "#2455ff",
          fontWeight: 600,
          textDecoration: "none",
          whiteSpace: "nowrap",
          fontFamily: "'DM Sans', system-ui, sans-serif",
        }}
      >
        Full list →
      </a>
    </div>
  );
}
