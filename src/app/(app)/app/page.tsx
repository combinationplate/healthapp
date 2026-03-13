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
  let isNewUser = false;

  if (!profile) {
    isNewUser = true;
    const role = roleFromMetadata(user.user_metadata);
    const fullName = (user.user_metadata?.full_name as string) ?? "";
    const meta = user.user_metadata ?? {};
    await supabase.from("profiles").upsert(
      {
        id: user.id,
        role,
        full_name: fullName,
        city: (meta.city as string) ?? null,
        state: (meta.state as string) ?? null,
        discipline: (meta.discipline as string) ?? null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "id" }
    );
    profile = { id: user.id, role, full_name: fullName };
  }

  // Notify + enroll in drip (runs on every login, but the upsert
  // with onConflict in the enroll route means it only enrolls once)
  const origin = process.env.NEXT_PUBLIC_APP_URL || "https://pulsereferrals.com";
  fetch(`${origin}/api/drip/enroll`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      userId: user.id,
      email: user.email,
      fullName: profile.full_name ?? "",
      role: profile.role,
    }),
  }).catch(() => {});

  const displayName = profile.full_name ?? (user.user_metadata?.full_name as string | undefined);
  const role = profile.role;
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