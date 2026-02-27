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
    <div style={{background:"white",borderRadius:"12px",border:"1px solid var(--border)",padding:"20px",boxShadow:"0 1px 3px rgba(0,0,0,0.08)"}}>
      <div style={{fontSize:"11px",fontWeight:600,textTransform:"uppercase",letterSpacing:"0.05em",color:"var(--ink-muted)",marginBottom:"8px"}}>{label}</div>
      <div style={{fontSize:"36px",fontWeight:700,color:"var(--ink)",lineHeight:1,margin:"8px 0"}}>{value}</div>
      <div className={`text-[13px] font-medium ${noteClass}`}>{note}</div>
    </div>
  );
}

export function StatsGrid({ children }: { children: ReactNode }) {
  return (
    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit, minmax(180px, 1fr))",gap:"16px",marginBottom:"24px"}}>
      {children}
    </div>
  );
}

export function PageShell({ children }: { children: ReactNode }) {
  return (
    <div style={{minHeight:"100vh",background:"#F8FAFC"}}>
      <div style={{maxWidth:"1200px",margin:"0 auto",paddingLeft:"32px",paddingRight:"32px",paddingTop:"32px",paddingBottom:"80px"}}>
        {children}
      </div>
    </div>
  );
}

export function SectionCard({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={className} style={{background:"white",borderRadius:"12px",border:"1px solid var(--border)",padding:"20px",boxShadow:"0 1px 3px rgba(0,0,0,0.08)"}}>
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
    <div style={{display:"flex",gap:"4px",borderBottom:"1px solid var(--border)",marginBottom:"24px",overflowX:"auto"}}>
      {tabs.map(tab => (
        <button
          key={tab.id}
          type="button"
          onClick={() => onChange(tab.id)}
          style={{
            padding:"10px 20px",
            fontSize:"14px",
            fontWeight:600,
            borderRadius:"8px 8px 0 0",
            border:"none",
            borderBottom: active === tab.id ? "2px solid var(--blue)" : "2px solid transparent",
            background:"transparent",
            color: active === tab.id ? "var(--blue)" : "var(--ink-muted)",
            cursor:"pointer",
            whiteSpace:"nowrap",
            transition:"color 0.15s",
          }}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
