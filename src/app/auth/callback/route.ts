import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

function roleFromMetadata(metadata: Record<string, unknown> | undefined): "manager" | "rep" | "professional" {
  const role = metadata?.role as string | undefined;
  if (role === "manager" || role === "rep" || role === "professional") return role;
  const accountType = (metadata?.account_type as string) ?? "";
  if (accountType.toLowerCase() === "sales") return "rep";
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
      await supabase.from("profiles").upsert(
        { id: data.user.id, role, full_name: fullName, updated_at: new Date().toISOString() },
        { onConflict: "id" }
      );
      await supabase.from("users").upsert(
        { id: data.user.id, email: data.user.email ?? "", role, name: fullName },
        { onConflict: "id" }
      );
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth`);
}
