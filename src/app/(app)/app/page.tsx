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

  // Enroll in drip + notify (inline, no fetch needed)
  try {
    const { createClient: createAdmin } = await import("@supabase/supabase-js");
    const admin = createAdmin(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    const dripSequence =
      profile.role === "rep"
        ? "rep_welcome"
        : profile.role === "manager"
        ? "rep_welcome"
        : "pro_welcome";
    const { data: existingDrip } = await admin
      .from("drip_enrollments")
      .select("id")
      .eq("user_id", user.id)
      .eq("sequence", dripSequence)
      .maybeSingle();

    if (!existingDrip) {
      // New user — notify you
      const { Resend } = await import("resend");
      const resend = new Resend(process.env.RESEND_API_KEY);
      const roleLabel =
        profile.role === "rep"
          ? "Sales Rep"
          : profile.role === "manager"
          ? "Manager"
          : "Healthcare Professional";
      await resend.emails.send({
        from: "Pulse Alerts <noreply@pulsereferrals.com>",
        to: "ztaylor120@gmail.com",
        subject: `New signup: ${profile.full_name || user.email} (${roleLabel})`,
        html: `
          <div style="font-family:'DM Sans',system-ui,sans-serif;max-width:480px;padding:24px;">
            <h2 style="margin:0 0 12px;font-size:18px;color:#0b1222;">New Pulse Signup</h2>
            <table style="font-size:14px;color:#3b4963;border-collapse:collapse;">
              <tr><td style="padding:4px 16px 4px 0;font-weight:600;color:#7a8ba8;">Name</td><td>${profile.full_name || "—"}</td></tr>
              <tr><td style="padding:4px 16px 4px 0;font-weight:600;color:#7a8ba8;">Email</td><td>${user.email}</td></tr>
              <tr><td style="padding:4px 16px 4px 0;font-weight:600;color:#7a8ba8;">Role</td><td>${roleLabel}</td></tr>
              <tr><td style="padding:4px 16px 4px 0;font-weight:600;color:#7a8ba8;">Time</td><td>${new Date().toLocaleString(
                "en-US",
                { timeZone: "America/Chicago" }
              )}</td></tr>
            </table>
          </div>
        `,
      });

      // Enroll in drip
      await admin.from("drip_enrollments").insert({
        user_id: user.id,
        sequence: dripSequence,
        current_step: 0,
        next_send_at: new Date().toISOString(),
        completed: false,
      });
    }
  } catch (e) {
    console.error("Drip enrollment error:", e);
  }

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