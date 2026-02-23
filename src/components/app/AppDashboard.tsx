"use client";

import { useState } from "react";
import { ManagerDashboard } from "./ManagerDashboard";
import { ProDashboard } from "./ProDashboard";
import { RepDashboard } from "./RepDashboard";
import { RoleSelector } from "./RoleSelector";

type Role = "manager" | "rep" | "professional";

type Props = {
  userId?: string;
  userEmail: string;
  userDisplayName?: string | null;
  /** Role from profile: user is redirected to this dashboard after login */
  initialRole?: Role | null;
};

export function AppDashboard({ userId, userEmail, userDisplayName, initialRole = null }: Props) {
  const [role, setRole] = useState<Role | null>(initialRole ?? null);

  if (role === null) {
    return <RoleSelector onSelect={setRole} />;
  }

  const switchRole = (
    <p className="mb-4 text-sm text-[var(--ink-muted)]">
      <button type="button" onClick={() => setRole(null)} className="underline hover:text-[var(--ink-soft)]">Switch role</button>
    </p>
  );

  if (role === "manager") {
    return (
      <>
        {switchRole}
        <ManagerDashboard userName={userDisplayName || userEmail} />
      </>
    );
  }
  if (role === "rep") {
    return (
      <>
        {switchRole}
        <RepDashboard repId={userId} />
      </>
    );
  }
  return (
    <>
      {switchRole}
      <ProDashboard userName={userDisplayName ?? userEmail} />
    </>
  );
}
