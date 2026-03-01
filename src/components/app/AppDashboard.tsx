"use client";

import { useState } from "react";
import { ManagerDashboard } from "./ManagerDashboard";
import { ProDashboard } from "./ProDashboard";
import { RepDashboard } from "./RepDashboard";
import { RoleSelector } from "./RoleSelector";
import { AppHeader } from "./AppHeader";

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

  const roleLabel = role === "manager" ? "Manager" : role === "rep" ? "Rep" : "Professional";
  const displayName = userDisplayName?.trim() || userEmail || "";

  if (role === "manager") {
    return (
      <>
        <AppHeader displayName={displayName} roleLabel={roleLabel} onSwitchRole={() => setRole(null)} />
        <ManagerDashboard userName={userDisplayName || userEmail} managerId={userId} />
      </>
    );
  }
  if (role === "rep") {
    return (
      <>
        <AppHeader displayName={displayName} roleLabel={roleLabel} onSwitchRole={() => setRole(null)} />
        <RepDashboard repId={userId} />
      </>
    );
  }
  return (
    <>
      <AppHeader displayName={displayName} roleLabel={roleLabel} onSwitchRole={() => setRole(null)} />
      <ProDashboard userName={userDisplayName ?? userEmail} />
    </>
  );
}
