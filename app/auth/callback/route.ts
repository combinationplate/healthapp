import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

/** Returns a role valid for both profiles and users tables (manager | rep | professional). */
function roleFromMetadata(metadata: Record<string, unknown> | undefined): "manager" | "rep" | "professional" {
  const role = metadata?.role as string | undefined;
  if (role === "manager" || role === "rep" || role === "professional") return role;
  const accountType = (metadata?.account_type as string) ?? "";
  if (accountType.toLowerCase() === "sales") return "rep";
  if (accountType.toLowerCase() === "manager") return "manager";
  return "professional";
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/app";

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error && data.user) {
      const role = roleFromMetadata(data.user.user_metadata);
      const fullName = (data.user.user_metadata?.full_name as string) ?? "";
      const { createClient: createServiceClient } = await import("@supabase/supabase-js");
      const admin = createServiceClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      );
      const state = (data.user.user_metadata?.state as string) ?? null;
      const city = (data.user.user_metadata?.city as string) ?? null;
      await admin.rpc("upsert_profile_safe", {
        p_id: data.user.id,
        p_role: role,
        p_full_name: fullName,
        p_state: state,
        p_city: city,
      });
      await admin
        .from("profiles")
        .update({ email: data.user.email ?? "" })
        .eq("id", data.user.id);
      await supabase.from("users").upsert(
        { id: data.user.id, email: data.user.email ?? "", role, name: fullName },
        { onConflict: "id" }
      );
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth`);
}
