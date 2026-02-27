"use client";

import React, { ReactNode } from "react";

interface StatCardProps {
  label: string;
  value: string | number;
  note: string;
  noteClass?: string;
}

export function StatCard({ label, value, note, noteClass = "text-[var(--blue)]" }: StatCardProps) {
  return (
    <div className="rounded-xl border border-[var(--border)] bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.08)]">
      <div className="mb-1 text-xs font-semibold uppercase tracking-wider text-[var(--ink-muted)]">{label}</div>
      <div className="font-[family-name:var(--font-fraunces)] text-[36px] font-bold text-[var(--ink)] leading-none my-2">{value}</div>
      <div className={`text-[13px] font-medium ${noteClass}`}>{note}</div>
    </div>
  );
}

export function StatsGrid({ children }: { children: ReactNode }) {
  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4 mb-6">
      {children}
    </div>
  );
}

export function PageShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <div className="mx-auto max-w-[1200px] px-8 py-8">
        {children}
      </div>
    </div>
  );
}

export function SectionCard({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`rounded-xl border border-[var(--border)] bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.08)] ${className}`}>
      {children}
    </div>
  );
}

export function TabBar({ tabs, active, onChange }: {
  tabs: { id: string; label: string }[];
  active: string;
  onChange: (id: string) => void;
}) {
  return (
    <div className="flex gap-2 border-b border-[var(--border)] mb-6 overflow-x-auto">
      {tabs.map(tab => (
        <button
          key={tab.id}
          type="button"
          onClick={() => onChange(tab.id)}
          className={`px-5 py-2.5 mr-1 text-sm font-semibold rounded-t-lg transition-colors border-b-2 ${
            active === tab.id
              ? "border-[var(--blue)] text-[var(--blue)]"
              : "border-transparent text-[var(--ink-muted)] hover:text-[var(--ink-soft)]"
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
