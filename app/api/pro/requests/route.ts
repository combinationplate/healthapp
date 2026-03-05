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

    const { data: newRequest, error } = await admin
      .from("ce_requests")
      .insert({
        professional_id: user.id,
        topic,
        hours: parseInt(hours),
        deadline,
        status: "pending",
        rep_id: body.repId || null,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message, details: error }, { status: 500 });
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
        const fromEmail = process.env.RESEND_FROM_EMAIL ?? "Pulse <noreply@pulsereferrals.com>";
        const proName = (user.user_metadata?.full_name as string | undefined)?.trim() || user.email || "A healthcare professional";
        const signupUrl = "https://pulsereferrals.vercel.app/signup";
        const html = `
          <p>Hi,</p>
          <p><strong>${proName}</strong> needs continuing education and is looking for a rep to help them out.</p>
          <p>They requested: <strong>${topic}</strong> (${hours} hrs) — needed by ${new Date(deadline).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}.</p>
          <p>Join Pulse to connect with them and send CE credits directly:</p>
          <p style="margin: 24px 0;">
            <a href="${signupUrl}" style="display:inline-block;background:#2455FF;color:#fff;text-decoration:none;padding:14px 24px;border-radius:8px;font-weight:bold;">Join Pulse &amp; Send CE</a>
          </p>
          <p style="color:#666;font-size:12px;">If the button doesn't work, copy and paste this link: <a href="${signupUrl}">${signupUrl}</a></p>
          <p>— Pulse</p>
        `;
        const text = `Hi,\n\n${proName} needs continuing education and is looking for a rep.\n\nThey requested: ${topic} (${hours} hrs) — needed by ${deadline}.\n\nJoin Pulse to connect with them and send CE credits: ${signupUrl}\n\n— Pulse`;
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