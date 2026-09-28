import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { Resend } from "resend";
import { isAnyTopic } from "@/lib/ce-topics";

export async function POST(request: Request) {
  try {
    const { requestId } = (await request.json()) as { requestId?: string };
    if (!requestId) {
      return NextResponse.json({ error: "Missing requestId" }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      // Logged-out users are sent to signup/login by the client with a return URL.
      return NextResponse.json({ error: "auth_required" }, { status: 401 });
    }

    const admin = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Only reps/managers can claim.
    const { data: profile } = await admin
      .from("profiles")
      .select("id, full_name, role, org_id")
      .eq("id", user.id)
      .single();
    const role = profile?.role;
    if (role !== "rep" && role !== "manager") {
      return NextResponse.json({ error: "rep_required" }, { status: 403 });
    }

    // Race-safe: the conditional update only succeeds while the request is still
    // pending AND unassigned. A second claimer matches 0 rows -> already_claimed.
    const { data: claimed, error } = await admin
      .from("ce_requests")
      .update({ rep_id: user.id })
      .eq("id", requestId)
      .eq("status", "pending")
      .is("rep_id", null)
      .select("id, professional_id, topic, hours")
      .maybeSingle();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    if (!claimed) {
      return NextResponse.json({ error: "already_claimed" }, { status: 409 });
    }

    // Professional details are looked up server-side ONLY (never returned to the rep).
    const { data: pro } = await admin
      .from("profiles")
      .select("full_name, email, discipline, city, state")
      .eq("id", claimed.professional_id)
      .single();

    const resendKey = process.env.RESEND_API_KEY;
    if (resendKey) {
      const resend = new Resend(resendKey);
      const from = "Pulse <hello@pulsereferrals.com>";

      // (Admin "CE request claimed" alert removed 2026-09-27 — only signups email admin.)

      // Notify the professional a sponsor claimed (no rep identity revealed yet).
      if (pro?.email) {
        try {
          await resend.emails.send({
            from,
            to: pro.email,
            subject: "A sponsor claimed your CE request",
            html: `
              <div style="font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;max-width:520px;padding:8px 4px;color:#0b1222;">
                <p style="font-size:15px;line-height:1.6;">Good news — a local sponsor has claimed your continuing education request${claimed.topic && !isAnyTopic(claimed.topic) ? ` for <strong>${claimed.topic}</strong>` : ""}.</p>
                <p style="font-size:15px;line-height:1.6;color:#3b4963;">We'll deliver your nationally accredited CE at no cost, and introduce you to your sponsor once it's ready. No action needed right now.</p>
                <p style="font-size:13px;color:#7a8ba8;">— Pulse</p>
              </div>`,
          });
        } catch (e) {
          console.error("professional claim email failed", e);
        }
      }
    }

    // Response carries NO professional PII. Rep is introduced after CE delivery.
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
