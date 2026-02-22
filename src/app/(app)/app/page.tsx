import { createClient } from "@/lib/supabase/server";
import { AppDashboard } from "@/components/app/AppDashboard";

export default async function AppPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const displayName = user.user_metadata?.full_name as string | undefined;

  return (
    <AppDashboard
      userEmail={user.email ?? ""}
      userDisplayName={displayName ?? null}
    />
  );
}
