import { createClient } from "@/lib/supabase/server";
import { AppDashboard } from "@/components/app/AppDashboard";
import { getProfile } from "@/lib/supabase/getProfile";
import type { ProfileRole } from "@/lib/supabase/getProfile";

function roleFromMetadata(metadata: Record<string, unknown> | undefined): ProfileRole {
  const role = metadata?.role as string | undefined;
  if (role === "manager" || role === "rep" || role === "professional") return role;
  const accountType = (metadata?.account_type as string) ?? "";
  if (accountType.toLowerCase() === "sales") return "rep";
  if (accountType.toLowerCase() === "manager") return "manager";
  return "professional";
}

export default async function AppPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  let profile = await getProfile(user.id);
  if (!profile) {
    const role = roleFromMetadata(user.user_metadata);
    const fullName = (user.user_metadata?.full_name as string) ?? "";
    await supabase.from("profiles").upsert(
      { id: user.id, role, full_name: fullName, updated_at: new Date().toISOString() },
      { onConflict: "id" }
    );
    profile = { id: user.id, role, full_name: fullName };
  }

  const displayName = profile.full_name ?? (user.user_metadata?.full_name as string | undefined);
  const role = profile.role;
  // users.role accepts only manager | rep | professional
  const userTableRole = role === "manager" || role === "rep" || role === "professional" ? role : "manager";
  await supabase.from("users").upsert(
    { id: user.id, email: user.email ?? "", role: userTableRole, name: displayName ?? "" },
    { onConflict: "id" }
  );

  return (
    <AppDashboard
      userId={user.id}
      userEmail={user.email ?? ""}
      userDisplayName={displayName ?? null}
      initialRole={profile.role}
    />
  );
}
