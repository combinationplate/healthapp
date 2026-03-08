"use client";
import React, { ReactNode } from "react";

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Design tokens — single source of truth, mirrors landing page :root
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
export const ds = {
  ink: "#0b1222",
  inkSoft: "#3b4963",
  inkMuted: "#7a8ba8",
  white: "#ffffff",
  cream: "#f6f5f0",
  creamDark: "#eae9e4",
  blue: "#2455ff",
  blueDark: "#1a3fcc",
  blueGlow: "rgba(36,85,255,0.10)",
  teal: "#0d9488",
  tealDark: "#0f766e",
  tealGlow: "rgba(13,148,136,0.10)",
  green: "#10B981",
  greenGlow: "rgba(16,185,129,0.10)",
  coral: "#e8604c",
  coralGlow: "rgba(232,96,76,0.10)",
  gold: "#92670A",
  goldGlow: "rgba(217,119,6,0.10)",
  border: "rgba(11,18,34,0.08)",
  borderHover: "rgba(11,18,34,0.14)",
  r: "10px",
  rLg: "16px",
  rXl: "24px",
  fontBody: "'DM Sans', system-ui, sans-serif",
  fontDisplay: "'Fraunces', Georgia, serif",
  shadow: "0 1px 3px rgba(0,0,0,0.04)",
  shadowHover: "0 4px 16px rgba(0,0,0,0.08)",
  shadowLg: "0 20px 60px rgba(0,0,0,0.15)",
} as const;

// ── Exported button style objects (use with style={}) ───────────
export const btnPrimary: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "6px",
  background: ds.blue,
  color: ds.white,
  fontWeight: 700,
  padding: "10px 20px",
  borderRadius: ds.r,
  border: "none",
  fontSize: "13px",
  cursor: "pointer",
  fontFamily: ds.fontBody,
  boxShadow: "0 2px 10px rgba(36,85,255,0.18)",
  transition: "background 0.2s, transform 0.15s, box-shadow 0.2s",
};

export const btnSecondary: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "6px",
  background: ds.white,
  color: ds.inkSoft,
  fontWeight: 600,
  padding: "10px 20px",
  borderRadius: ds.r,
  border: `1px solid ${ds.border}`,
  fontSize: "13px",
  cursor: "pointer",
  fontFamily: ds.fontBody,
  transition: "all 0.2s",
};

export const btnSm: React.CSSProperties = {
  padding: "6px 14px",
  fontSize: "12px",
};

// ── StatCard ─────────────────────────────────────────────────────

interface StatCardProps {
  label: string;
  value: string | number;
  note: string;
  /** Pass a CSS color string, e.g. ds.blue or ds.teal */
  noteColor?: string;
  /** @deprecated — use noteColor instead. Kept for backward compat. */
  noteClass?: string;
  icon?: string;
}

export function StatCard({ label, value, note, noteColor, noteClass, icon }: StatCardProps) {
  // Backward compat: parse old noteClass like "text-[var(--blue)]"
  let resolvedColor = noteColor ?? ds.blue;
  if (!noteColor && noteClass) {
    if (noteClass.includes("blue")) resolvedColor = ds.blue;
    else if (noteClass.includes("green")) resolvedColor = ds.teal;
    else if (noteClass.includes("coral")) resolvedColor = ds.coral;
  }

  return (
    <div
      style={{
        position: "relative",
        overflow: "hidden",
        borderRadius: ds.rLg,
        border: `1px solid ${ds.border}`,
        background: ds.white,
        padding: "22px",
        boxShadow: ds.shadow,
        transition: "box-shadow 0.25s, transform 0.25s",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = ds.shadowHover;
        e.currentTarget.style.transform = "translateY(-2px)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = ds.shadow;
        e.currentTarget.style.transform = "translateY(0)";
      }}
    >
      {/* Subtle top accent line */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: "3px",
          background: `linear-gradient(90deg, ${ds.blue}, ${ds.teal})`,
          opacity: 0.5,
          borderRadius: `${ds.rLg} ${ds.rLg} 0 0`,
        }}
      />
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: "8px",
          marginBottom: "10px",
        }}
      >
        <span
          style={{
            fontSize: "11px",
            fontWeight: 600,
            textTransform: "uppercase",
            letterSpacing: "0.06em",
            color: ds.inkMuted,
          }}
        >
          {label}
        </span>
        {icon && <span style={{ fontSize: "16px", opacity: 0.5 }}>{icon}</span>}
      </div>
      <div
        style={{
          fontFamily: ds.fontDisplay,
          fontSize: "36px",
          fontWeight: 800,
          lineHeight: 1,
          letterSpacing: "-0.02em",
          color: ds.ink,
          marginBottom: "6px",
        }}
      >
        {value}
      </div>
      <div style={{ fontSize: "12px", fontWeight: 600, color: resolvedColor }}>
        {note}
      </div>
    </div>
  );
}

// ── StatsGrid ────────────────────────────────────────────────────

export function StatsGrid({ children }: { children: ReactNode }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
        gap: "16px",
      }}
    >
      {children}
    </div>
  );
}

// ── PageShell ────────────────────────────────────────────────────

export function PageShell({ children }: { children: ReactNode }) {
  return (
    <div style={{ minHeight: "100vh", background: ds.cream }}>
      <div
        style={{
          maxWidth: "1200px",
          margin: "0 auto",
          padding: "32px 28px 80px",
        }}
      >
        {children}
      </div>
    </div>
  );
}

// ── SectionCard ──────────────────────────────────────────────────

export function SectionCard({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={className}
      style={{
        borderRadius: ds.rLg,
        border: `1px solid ${ds.border}`,
        background: ds.white,
        boxShadow: ds.shadow,
        padding: "24px",
      }}
    >
      {children}
    </div>
  );
}

// ── SectionHeader ────────────────────────────────────────────────

export function SectionHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        alignItems: "flex-start",
        justifyContent: "space-between",
        gap: "12px",
        borderBottom: `1px solid ${ds.border}`,
        paddingBottom: "16px",
        marginBottom: "20px",
      }}
    >
      <div>
        <h2
          style={{
            fontFamily: ds.fontDisplay,
            fontSize: "15px",
            fontWeight: 800,
            color: ds.ink,
            lineHeight: 1.3,
            margin: 0,
          }}
        >
          {title}
        </h2>
        {subtitle && (
          <p style={{ marginTop: "3px", fontSize: "11px", color: ds.inkMuted }}>
            {subtitle}
          </p>
        )}
      </div>
      {action && <div style={{ flexShrink: 0 }}>{action}</div>}
    </div>
  );
}

// ── TabBar ───────────────────────────────────────────────────────

export function TabBar({
  tabs,
  active,
  onChange,
}: {
  tabs: { id: string; label: string }[];
  active: string;
  onChange: (id: string) => void;
}) {
  return (
    <div
      style={{
        display: "flex",
        gap: "2px",
        overflowX: "auto",
        marginBottom: "24px",
        borderBottom: `1px solid ${ds.border}`,
      }}
    >
      {tabs.map((tab) => {
        const isActive = active === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            style={{
              flexShrink: 0,
              padding: "10px 22px",
              fontSize: "13px",
              fontWeight: isActive ? 700 : 500,
              fontFamily: ds.fontBody,
              borderRadius: `${ds.r} ${ds.r} 0 0`,
              border: "none",
              borderBottom: `2px solid ${isActive ? ds.blue : "transparent"}`,
              background: isActive ? ds.blueGlow : "transparent",
              color: isActive ? ds.blue : ds.inkMuted,
              cursor: "pointer",
              whiteSpace: "nowrap",
              transition: "all 0.15s",
            }}
            onMouseEnter={(e) => {
              if (!isActive) {
                e.currentTarget.style.color = ds.ink;
                e.currentTarget.style.background = ds.cream;
              }
            }}
            onMouseLeave={(e) => {
              if (!isActive) {
                e.currentTarget.style.color = ds.inkMuted;
                e.currentTarget.style.background = "transparent";
              }
            }}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}

// ── Badge ────────────────────────────────────────────────────────

export function Badge({
  children,
  variant = "default",
}: {
  children: ReactNode;
  variant?: "default" | "success" | "warning" | "danger" | "blue";
}) {
  const colorMap = {
    default: { bg: ds.cream, color: ds.inkSoft, border: "none" },
    success: { bg: ds.greenGlow, color: ds.teal, border: "none" },
    warning: { bg: ds.goldGlow, color: ds.gold, border: "none" },
    danger: { bg: ds.coralGlow, color: ds.coral, border: `1px solid rgba(232,96,76,0.2)` },
    blue: { bg: ds.blueGlow, color: ds.blue, border: "none" },
  };
  const c = colorMap[variant];

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        borderRadius: "999px",
        padding: "3px 10px",
        fontSize: "10px",
        fontWeight: 700,
        background: c.bg,
        color: c.color,
        border: c.border,
      }}
    >
      {children}
    </span>
  );
}

// ── Tailwind class-based button constants (kept for backward compat) ──
// These are still used by existing className= references in dashboards.
// Over time, migrate callers to use the style objects above instead.
export const BTN_PRIMARY =
  "rounded-xl bg-[var(--blue)] px-5 py-2.5 text-[13px] font-semibold text-white hover:bg-[var(--blue-dark)] active:scale-[0.98] transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed";
export const BTN_SECONDARY =
  "rounded-xl border border-[var(--border)] bg-white px-5 py-2.5 text-[13px] font-semibold text-[var(--ink-soft)] hover:bg-[var(--cream)] active:scale-[0.98] transition-all disabled:opacity-50";
export const BTN_GHOST =
  "rounded-xl px-4 py-2 text-[13px] font-semibold text-[var(--ink-muted)] hover:bg-[var(--border)] transition-all";