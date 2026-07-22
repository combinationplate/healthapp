import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { Resend } from "resend";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: requests } = await admin
    .from("ce_requests")
    .select("id, topic, hours, deadline, status, created_at")
    .eq("professional_id", user.id)
    .order("created_at", { ascending: false });

  const { data: repsData } = await admin
    .from("professionals")
    .select("rep_id, name")
    .eq("email", user.email ?? "");

  const repIds = (repsData ?? []).map((r: { rep_id: string }) => r.rep_id).filter(Boolean);

  let reps: { id: string; name: string }[] = [];
  if (repIds.length > 0) {
    const { data: repProfiles } = await admin
      .from("profiles")
      .select("id, full_name")
      .in("id", repIds);
    reps = (repProfiles ?? []).map((p: { id: string; full_name: string | null }) => ({
      id: p.id,
      name: p.full_name ?? "Unknown Rep",
    }));
  }

  return NextResponse.json({ requests: requests ?? [], reps });
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const { topic, hours, deadline, visible, inviteEmail } = body;

    if (!topic || !hours || !deadline) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const admin = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const repIdValue = body.repId && body.repId !== "__invite__" ? body.repId : null;

    const { data: newRequest, error } = await admin
      .from("ce_requests")
      .insert({
        professional_id: user.id,
        topic,
        hours: parseInt(hours),
        deadline,
        status: "pending",
        rep_id: repIdValue,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message, details: error }, { status: 500 });
    }

    // Notify admin of the new CE request (also visible in the admin CE log).
    try {
      const alertKey = process.env.RESEND_API_KEY;
      if (alertKey) {
        const { data: prof } = await admin
          .from("profiles")
          .select("full_name, discipline, city, state, facility")
          .eq("id", user.id)
          .single();
        const alertResend = new Resend(alertKey);
        const loc = [prof?.city, prof?.state].filter(Boolean).join(", ");
        await alertResend.emails.send({
          from: "Pulse Alerts <hello@pulsereferrals.com>",
          to: process.env.SIGNUP_ALERT_EMAIL || "hello@pulsereferrals.com",
          subject: `New CE request: ${topic} (${hours} hrs)`,
          html: `
            <div style="font-family:'DM Sans',system-ui,sans-serif;max-width:480px;padding:24px;">
              <h2 style="margin:0 0 12px;font-size:18px;color:#0b1222;">New CE request</h2>
              <table style="font-size:14px;color:#3b4963;border-collapse:collapse;">
                <tr><td style="padding:4px 16px 4px 0;font-weight:600;color:#7a8ba8;">Professional</td><td>${prof?.full_name ?? "—"}</td></tr>
                <tr><td style="padding:4px 16px 4px 0;font-weight:600;color:#7a8ba8;">Discipline</td><td>${prof?.discipline ?? "—"}</td></tr>
                <tr><td style="padding:4px 16px 4px 0;font-weight:600;color:#7a8ba8;">Facility</td><td>${prof?.facility ?? "—"}</td></tr>
                <tr><td style="padding:4px 16px 4px 0;font-weight:600;color:#7a8ba8;">Location</td><td>${loc || "—"}</td></tr>
                <tr><td style="padding:4px 16px 4px 0;font-weight:600;color:#7a8ba8;">Topic</td><td>${topic} (${hours} hrs)</td></tr>
                <tr><td style="padding:4px 16px 4px 0;font-weight:600;color:#7a8ba8;">Deadline</td><td>${deadline}</td></tr>
              </table>
            </div>`,
        });
      }
    } catch (e) {
      console.error("CE request admin notify failed:", e);
    }

    if (visible) {
      await admin
        .from("profiles")
        .update({ seeking_ce: true })
        .eq("id", user.id);
    }

    if (inviteEmail && typeof inviteEmail === "string" && inviteEmail.includes("@")) {
      await admin
        .from("ce_requests")
        .update({ invited_rep_email: inviteEmail })
        .eq("id", newRequest.id);

      const resendKey = process.env.RESEND_API_KEY;
      if (resendKey) {
        const resend = new Resend(resendKey);
        const fromEmail = process.env.RESEND_FROM_EMAIL ?? "Pulse <hello@pulsereferrals.com>";

        const { data: proProfile } = await admin
          .from("profiles")
          .select("full_name, discipline, facility")
          .eq("id", user.id)
          .single();

        const proName = proProfile?.full_name?.trim() || (user.user_metadata?.full_name as string | undefined)?.trim() || user.email || "A healthcare professional";
        const discipline = proProfile?.discipline ?? null;
        const facility = proProfile?.facility ?? null;
        const proDetails = [discipline, facility].filter(Boolean).join(" at ");

        const signupUrl = "https://pulsereferrals.vercel.app/signup";
        const html = `
          <p>Hi,</p>
          <p><strong>${proName}</strong>${proDetails ? ` (${proDetails})` : ""} needs continuing education and is looking for a rep to help them out.</p>
          <p>They requested: <strong>${topic}</strong> (${hours} hrs) — needed by ${new Date(deadline).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}.</p>
          <p>Join Pulse to connect with them and send CE credits directly:</p>
          <p style="margin: 24px 0;">
            <a href="${signupUrl}" style="display:inline-block;background:#2455FF;color:#fff;text-decoration:none;padding:14px 24px;border-radius:8px;font-weight:bold;">Join Pulse &amp; Send CE</a>
          </p>
          <p style="color:#666;font-size:12px;">If the button doesn't work, copy and paste this link: <a href="${signupUrl}">${signupUrl}</a></p>
          <p>— Pulse</p>
        `;
        const text = `Hi,\n\n${proName}${proDetails ? ` (${proDetails})` : ""} needs continuing education and is looking for a rep.\n\nThey requested: ${topic} (${hours} hrs) — needed by ${deadline}.\n\nJoin Pulse to connect with them and send CE credits: ${signupUrl}\n\n— Pulse`;
        const { error: emailError } = await resend.emails.send({
          from: fromEmail,
          to: inviteEmail,
          subject: `${proName} needs CE — join Pulse to help`,
          html,
          text,
        });
        if (emailError) {
          console.warn("Invite email failed:", emailError);
        }
      }
    }

    return NextResponse.json({ success: true, request: newRequest });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}