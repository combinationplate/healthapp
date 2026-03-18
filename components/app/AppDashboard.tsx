"use client";

import { useState } from "react";
import { ManagerDashboard } from "./ManagerDashboard";
import { ProDashboard } from "./ProDashboard";
import { RepDashboard } from "./RepDashboard";
import { RoleSelector } from "./RoleSelector";
import { AppHeader } from "./AppHeader";

type Role = "manager" | "rep" | "professional";

const ADMIN_EMAILS = ["hello@pulsereferrals.com"];

type Props = {
  userId?: string;
  userEmail: string;
  userDisplayName?: string | null;
  initialRole?: Role | null;
};

export function AppDashboard({ userId, userEmail, userDisplayName, initialRole = null }: Props) {
  const isAdmin = ADMIN_EMAILS.includes(userEmail.toLowerCase());
  const [role, setRole] = useState<Role | null>(initialRole ?? null);

  if (role === null) {
    return <RoleSelector onSelect={setRole} />;
  }

  const roleLabel = role === "manager" ? "Manager" : role === "rep" ? "Rep" : "Professional";
  const displayName = userDisplayName?.trim() || userEmail || "";

  if (role === "manager") {
    return (
      <>
        <AppHeader
          displayName={displayName}
          roleLabel={roleLabel}
          onSwitchRole={isAdmin ? () => setRole(null) : undefined}
        />
        <ManagerDashboard userName={userDisplayName || userEmail} managerId={userId} />
      </>
    );
  }
  if (role === "rep") {
    return (
      <>
        <AppHeader
          displayName={displayName}
          roleLabel={roleLabel}
          onSwitchRole={isAdmin ? () => setRole(null) : undefined}
        />
        <RepDashboard repId={userId} />
      </>
    );
  }
  return (
    <>
      <AppHeader
        displayName={displayName}
        roleLabel={roleLabel}
        onSwitchRole={isAdmin ? () => setRole(null) : undefined}
      />
      <ProDashboard userName={userDisplayName ?? userEmail} userId={userId} />
    </>
  );
}
