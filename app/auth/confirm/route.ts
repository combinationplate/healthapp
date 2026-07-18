import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";

/**
 * GET /auth/confirm?token_hash=...&type=recovery&next=/reset-password
 *
 * Server-side verification for Supabase email links (password recovery,
 * email change, etc.) using token_hash + verifyOtp. Unlike the PKCE
 * ?code= flow, this works no matter which browser or device the user
 * opens the email in — there is no code-verifier requirement.
 *
 * Requires the Supabase email template to link here, e.g. the
 * "Reset password" template body:
 *   {{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=recovery&next=/reset-password
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const next = searchParams.get("next") ?? "/app";

  if (token_hash && type) {
    const supabase = await createClient();
    const { error } = await supabase.auth.verifyOtp({ type, token_hash });
    if (!error) {
      // Session cookies are now set — send them on (e.g. to /reset-password).
      return NextResponse.redirect(`${origin}${next}`);
    }
    console.warn("[auth/confirm] verifyOtp failed:", error.message);
  }

  return NextResponse.redirect(`${origin}/login?error=link-expired`);
}
