import { redirect } from "next/navigation";
import { createClient as createServiceClient } from "@supabase/supabase-js";

export default async function InvitePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;

  const admin = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Validate token
  const { data: invite } = await admin
    .from("invites")
    .select("id, manager_id, org_id, used_at")
    .eq("token", token)
    .single();

  if (!invite || invite.used_at) {
    redirect("/invite-invalid");
  }

  // Store token in cookie so signup can use it
  redirect(`/signup?invite=${token}`);
}
