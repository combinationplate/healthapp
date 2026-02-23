import { createClient } from "@/lib/supabase/server";
import { AppDashboard } from "@/components/app/AppDashboard";
import { getProfile } from "@/lib/supabase/getProfile";
import type { ProfileRole } from "@/lib/supabase/getProfile";

function roleFromMetadata(metadata: Record<string, unknown> | undefined): ProfileRole {
  const role = metadata?.role as string | undefined;
  if (role === "manager" || role === "rep" || role === "professional") return role;
  const accountType = (metadata?.account_type as string) ?? "";
  if (accountType.toLowerCase() === "sales") return "rep";
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

  return (
    <AppDashboard
      userEmail={user.email ?? ""}
      userDisplayName={displayName ?? null}
      initialRole={profile.role}
    />
  );
}
