import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { buildCeEmailSubject, buildCeEmailHtml, buildCeEmailText } from "@/lib/email/ce-email";

export async function POST(request: Request) {
  try {
    const { ceSendId } = await request.json();
    if (!ceSendId) {
      return NextResponse.json({ error: "Missing ceSendId" }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const admin = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Get the original CE send record
    const { data: ceSend, error: ceSendError } = await admin
      .from("ce_sends")
      .select("id, rep_id, professional_id, course_name, course_hours, coupon_code, discount, recipient_email, clicked_at, professionals(name, email)")
      .eq("id", ceSendId)
      .single();

    if (ceSendError || !ceSend) {
      return NextResponse.json({ error: "CE send record not found" }, { status: 404 });
    }

    // Verify the requesting user is the rep who sent it
    if (ceSend.rep_id !== user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Don't remind if already accessed
    if (ceSend.clicked_at) {
      return NextResponse.json({ error: "Course already accessed" }, { status: 400 });
    }

    // Get recipient email
    const pro = ceSend.professionals as { name?: string; email?: string } | null;
    const recipientEmail = ceSend.recipient_email ?? pro?.email;
    const recipientName = pro?.name ?? "there";

    if (!recipientEmail) {
      return NextResponse.json({ error: "No email address found for this professional" }, { status: 400 });
    }

    // Get rep info
    const { data: repProfile } = await admin
      .from("profiles")
      .select("full_name, org_name")
      .eq("id", user.id)
      .single();

    const repName = repProfile?.full_name ?? "Your Rep";
    const repOrgName = repProfile?.org_name ?? "";
    const repEmail = user.email ?? "";

    // Build the access URL
    const appUrl = (process.env.NEXT_PUBLIC_APP_URL ?? "https://pulsereferrals.vercel.app").replace(/\/$/, "");
    const accessUrl = `${appUrl}/r/${ceSend.coupon_code}`;

    // Build email using shared template
    const emailParams = {
      recipientName,
      courseName: ceSend.course_name,
      courseHours: ceSend.course_hours,
      couponCode: ceSend.coupon_code ?? "",
      accessUrl,
      discount: ceSend.discount ?? "100% Free",
      repName,
      repEmail,
      repOrgName,
    };

    const subject = `Reminder: ${buildCeEmailSubject(emailParams)}`;
    const html = buildCeEmailHtml(emailParams);
    const text = buildCeEmailText(emailParams);

    // Send via Resend
    const resendKey = process.env.RESEND_API_KEY;
    if (!resendKey) {
      return NextResponse.json({ error: "Email service not configured" }, { status: 503 });
    }

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${resendKey}`,
      },
      body: JSON.stringify({
        from: process.env.RESEND_FROM_EMAIL ?? "Pulse <noreply@pulsereferrals.com>",
        to: recipientEmail,
        subject,
        html,
        text,
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      console.error("Resend reminder error:", err);
      return NextResponse.json({ error: "Failed to send reminder" }, { status: 502 });
    }

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("Remind error:", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
