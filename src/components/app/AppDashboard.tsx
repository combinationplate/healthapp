"use client";

import { useState } from "react";
import { ManagerDashboard } from "./ManagerDashboard";
import { ProDashboard } from "./ProDashboard";
import { RepDashboard } from "./RepDashboard";
import { RoleSelector } from "./RoleSelector";

type Role = "manager" | "rep" | "professional";

type Props = {
  userEmail: string;
  userDisplayName?: string | null;
};

export function AppDashboard({ userEmail, userDisplayName }: Props) {
  const [role, setRole] = useState<Role | null>(null);

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
        <RepDashboard />
      </>
    );
  }
  return (
    <>
      {switchRole}
      <ProDashboard />
    </>
  );
}
