"use client";
import React, { ReactNode } from "react";

interface StatCardProps {
  label: string;
  value: string | number;
  note: string;
  noteClass?: string;
  icon?: string;
}

export function StatCard({ label, value, note, noteClass = "text-[var(--blue)]", icon }: StatCardProps) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-[var(--border)] bg-white p-5 shadow-[0_1px_4px_rgba(0,0,0,0.06)] transition-shadow hover:shadow-[0_4px_16px_rgba(0,0,0,0.10)]">
      <div className="flex items-start justify-between gap-2 mb-3">
        <span className="text-[11px] font-semibold uppercase tracking-widest text-[var(--ink-muted)]">{label}</span>
        {icon && <span className="text-base opacity-60">{icon}</span>}
      </div>
      <div className="text-[40px] font-extrabold leading-none tracking-tight text-[var(--ink)] mb-2">{value}</div>
      <div className={`text-[12px] font-semibold ${noteClass}`}>{note}</div>
    </div>
  );
}

export function StatsGrid({ children }: { children: ReactNode }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
      {children}
    </div>
  );
}

export function PageShell({ children }: { children: ReactNode }) {
  return (
    <div style={{ minHeight: '100vh', background: '#F8FAFC' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', paddingLeft: '32px', paddingRight: '32px', paddingTop: '32px', paddingBottom: '80px' }}>
        {children}
      </div>
    </div>
  );
}

export function SectionCard({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={`rounded-2xl border border-[var(--border)] bg-white shadow-[0_1px_4px_rgba(0,0,0,0.06)] ${className}`}
      style={{ padding: "24px" }}
    >
      {children}
    </div>
  );
}

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
    <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[var(--border)] pb-4 mb-5">
      <div>
        <h2 className="font-[family-name:var(--font-fraunces)] text-[15px] font-extrabold text-[var(--ink)] leading-tight">
          {title}
        </h2>
        {subtitle && (
          <p className="mt-0.5 text-[11px] text-[var(--ink-muted)]">{subtitle}</p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

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
    <div className="flex gap-1 overflow-x-auto pb-0 mb-6 border-b border-[var(--border)] scrollbar-none">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          onClick={() => onChange(tab.id)}
          className={`shrink-0 px-4 py-2.5 text-[13px] font-semibold rounded-t-lg border-b-2 transition-colors whitespace-nowrap
            ${
              active === tab.id
                ? "border-[var(--blue)] text-[var(--blue)] bg-[var(--blue-glow)]"
                : "border-transparent text-[var(--ink-muted)] hover:text-[var(--ink)] hover:bg-[var(--border)]"
            }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}

export function Badge({
  children,
  variant = "default",
}: {
  children: ReactNode;
  variant?: "default" | "success" | "warning" | "danger" | "blue";
}) {
  const styles = {
    default: "bg-[var(--border)] text-[var(--ink-soft)]",
    success: "bg-[var(--green-glow)] text-[var(--green)]",
    warning: "bg-[var(--gold-glow)] text-[#92670A]",
    danger: "bg-red-50 text-red-600 border border-red-200",
    blue: "bg-[var(--blue-glow)] text-[var(--blue)]",
  };
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold ${styles[variant]}`}>
      {children}
    </span>
  );
}

export const BTN_PRIMARY =
  "rounded-xl bg-[var(--blue)] px-5 py-2.5 text-[13px] font-semibold text-white hover:bg-[var(--blue-dark)] active:scale-[0.98] transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed";
export const BTN_SECONDARY =
  "rounded-xl border border-[var(--border)] bg-white px-5 py-2.5 text-[13px] font-semibold text-[var(--ink-soft)] hover:bg-[#F1F3F8] active:scale-[0.98] transition-all disabled:opacity-50";
export const BTN_GHOST =
  "rounded-xl px-4 py-2 text-[13px] font-semibold text-[var(--ink-muted)] hover:bg-[var(--border)] transition-all";
