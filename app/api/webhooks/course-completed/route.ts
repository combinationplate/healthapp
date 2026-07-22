import { createClient as createServiceClient, type SupabaseClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { Resend } from "resend";
import { verifyPulseSignature } from "@/lib/hiscornerstone/enroll";

/**
 * Congrats email to the professional when they complete a Pulse-sponsored
 * course. Deliberately Pulse-sent (not a Hiscornerstone-wide notification) so
 * the "request your next free CE" pitch only ever reaches sponsored learners —
 * never paying Hiscornerstone customers. Best-effort; never fails the webhook.
 */
async function sendCompletionCongrats(
  admin: SupabaseClient,
  ceSendId: string,
  certificateUrl: string | null
): Promise<void> {
  try {
    const resendKey = process.env.RESEND_API_KEY;
    if (!resendKey) return;

    const { data: send } = await admin
      .from("ce_sends")
      .select("course_name, course_hours, professional_id, rep_id")
      .eq("id", ceSendId)
      .single();
    if (!send) return;

    const { data: pro } = await admin
      .from("professionals")
      .select("name, email")
      .eq("id", send.professional_id)
      .single();
    if (!pro?.email) return;

    let repName = "";
    if (send.rep_id) {
      const { data: rep } = await admin
        .from("profiles")
        .select("full_name")
        .eq("id", send.rep_id)
        .single();
      repName = rep?.full_name ?? "";
    }

    const firstName = (pro.name ?? "there").split(/\s+/)[0];
    const ctaUrl =
      "https://pulsereferrals.com/signup?utm_source=pulse&utm_medium=email&utm_campaign=ce-completed";
    const fromAddress = process.env.RESEND_FROM_EMAIL ?? "hello@pulsereferrals.com";

    const certBlock = certificateUrl
      ? `<p style="margin:0 0 20px;">
          <a href="${certificateUrl}" style="display:inline-block;background:#0d9488;color:#ffffff;text-decoration:none;padding:12px 28px;border-radius:8px;font-size:14px;font-weight:700;">Download Your Certificate</a>
        </p>`
      : `<p style="margin:0 0 20px;font-size:14px;color:#3b4963;line-height:1.6;">Your certificate is available in your account on HISCornerstone.com.</p>`;

    const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0"/></head>
<body style="margin:0;padding:0;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased;">
<table width="100%" cellpadding="0" cellspacing="0" style="padding:24px 16px;"><tr><td align="center">
<table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;text-align:left;"><tr><td>
  <p style="margin:0 0 16px;font-size:15px;color:#0b1222;line-height:1.6;">Hi ${firstName},</p>
  <p style="margin:0 0 16px;font-size:15px;color:#3b4963;line-height:1.6;">
    Congratulations — you completed <strong style="color:#0b1222;">${send.course_name}</strong>${send.course_hours ? ` (${send.course_hours} credit hour${Number(send.course_hours) === 1 ? "" : "s"})` : ""}. Nice work.
  </p>
  ${certBlock}
  ${repName ? `<p style="margin:0 0 20px;font-size:14px;color:#3b4963;line-height:1.6;">This course was sponsored for you by <strong style="color:#0b1222;">${repName}</strong> — if it was helpful, they'd love to hear it.</p>` : ""}
  <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 20px;background:#f6f5f0;border-radius:10px;"><tr><td style="padding:20px;">
    <p style="margin:0 0 6px;font-size:15px;font-weight:700;color:#0b1222;">Need more CE hours?</p>
    <p style="margin:0 0 14px;font-size:14px;color:#3b4963;line-height:1.6;">
      Professionals on Pulse get free, nationally accredited CE courses sponsored by local healthcare partners. Request your next course in under a minute.
    </p>
    <a href="${ctaUrl}" style="display:inline-block;background:#2455ff;color:#ffffff;text-decoration:none;padding:12px 28px;border-radius:8px;font-size:14px;font-weight:700;">Request Your Next Free CE</a>
  </td></tr></table>
  <p style="margin:0;font-size:12px;color:#a8aeb9;">Pulse · pulsereferrals.com</p>
</td></tr></table>
</td></tr></table>
</body></html>`;

    const text = [
      `Hi ${firstName},`,
      ``,
      `Congratulations — you completed ${send.course_name}. Nice work.`,
      ``,
      certificateUrl
        ? `Download your certificate: ${certificateUrl}`
        : `Your certificate is available in your account on HISCornerstone.com.`,
      ``,
      repName ? `This course was sponsored for you by ${repName}.` : ``,
      ``,
      `Need more CE hours? Professionals on Pulse get free, nationally accredited CE courses sponsored by local healthcare partners.`,
      `Request your next course: ${ctaUrl}`,
      ``,
      `Pulse · pulsereferrals.com`,
    ].join("\n");

    const resend = new Resend(resendKey);
    await resend.emails.send({
      from: `Pulse <${fromAddress}>`,
      to: pro.email,
      subject: `Congratulations — you completed ${send.course_name}! 🎓`,
      html,
      text,
    });
  } catch (e) {
    console.warn("[course-completed] congrats email failed:", e);
  }
}

/**
 * POST /api/webhooks/course-completed
 * Fired by the pulse-connect mu-plugin when LearnDash reports a course
 * completion. Verified via HMAC (PULSE_WP_SHARED_SECRET). Sets completed_at
 * and certificate_url on the matching ce_sends row.
 */
export async function POST(request: Request) {
  try {
    const secret = (process.env.PULSE_WP_SHARED_SECRET ?? "").trim();
    if (!secret) {
      console.error("[course-completed] PULSE_WP_SHARED_SECRET not configured");
      return NextResponse.json({ received: true });
    }

    const raw = await request.text();
    const ts = request.headers.get("x-pulse-timestamp") ?? "";
    const sig = request.headers.get("x-pulse-signature") ?? "";

    if (!verifyPulseSignature(raw, ts, sig, secret)) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    const body = JSON.parse(raw) as {
      event?: string;
      email?: string;
      ce_send_id?: string | null;
      certificate_url?: string | null;
      course_title?: string;
      completed_at?: string;
    };

    if (body.event !== "course_completed") {
      return NextResponse.json({ received: true });
    }

    const admin = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    if (body.ce_send_id) {
      const { data: ceSend } = await admin
        .from("ce_sends")
        .select("id, completed_at")
        .eq("id", body.ce_send_id)
        .maybeSingle();

      if (ceSend && !ceSend.completed_at) {
        await admin
          .from("ce_sends")
          .update({
            completed_at: body.completed_at ?? new Date().toISOString(),
            certificate_url: body.certificate_url ?? null,
          })
          .eq("id", ceSend.id);
        await sendCompletionCongrats(admin, ceSend.id, body.certificate_url ?? null);
      }
      return NextResponse.json({ received: true });
    }

    // Fallback: no ce_send_id (pro enrolled before this system, or meta was
    // lost). Match the most recent redeemed-but-not-completed send for this
    // email + course name.
    if (body.email && body.course_title) {
      const { data: pros } = await admin
        .from("professionals")
        .select("id")
        .ilike("email", body.email);
      const proIds = (pros ?? []).map((p: { id: string }) => p.id);
      if (proIds.length > 0) {
        const { data: candidate } = await admin
          .from("ce_sends")
          .select("id")
          .in("professional_id", proIds)
          .eq("course_name", body.course_title)
          .not("redeemed_at", "is", null)
          .is("completed_at", null)
          .order("redeemed_at", { ascending: false })
          .limit(1)
          .maybeSingle();
        if (candidate) {
          await admin
            .from("ce_sends")
            .update({
              completed_at: body.completed_at ?? new Date().toISOString(),
              certificate_url: body.certificate_url ?? null,
            })
            .eq("id", candidate.id);
          await sendCompletionCongrats(admin, candidate.id, body.certificate_url ?? null);
        }
      }
    }

    return NextResponse.json({ received: true });
  } catch (e) {
    console.error("[course-completed] error:", e);
    // Always 200 so WP's fire-and-forget doesn't matter either way.
    return NextResponse.json({ received: true });
  }
}
