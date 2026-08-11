import { createClient as createServiceClient, type SupabaseClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { Resend } from "resend";
import crypto from "crypto";

/**
 * POST /api/webhooks/resend
 *
 * Resend webhook (email.opened / email.clicked). Correlates events back to
 * ce_sends via resend_email_id (stamped by /api/ce/send at delivery time),
 * records opened_at, and emails the rep ONCE per send the first time their
 * professional opens the CE email — closing the loop that makes the second
 * send happen.
 *
 * Setup (Resend dashboard):
 *   1. Webhooks → Add endpoint → https://pulsereferrals.com/api/webhooks/resend
 *      with events: email.opened, email.clicked
 *   2. Copy the signing secret (whsec_...) → Vercel env RESEND_WEBHOOK_SECRET
 *   3. Domains → pulsereferrals.com → enable open tracking (and click tracking
 *      if desired; clicked_at from the redeem flow still works without it)
 */

const TOLERANCE_SECONDS = 5 * 60;

/** Verify a Svix-style webhook signature (Resend uses Svix under the hood). */
function verifySvixSignature(
  secret: string,
  payload: string,
  msgId: string,
  timestamp: string,
  signatureHeader: string
): boolean {
  const ts = parseInt(timestamp, 10);
  if (!Number.isFinite(ts)) return false;
  const nowSec = Math.floor(Date.now() / 1000);
  if (Math.abs(nowSec - ts) > TOLERANCE_SECONDS) return false;

  const secretBytes = Buffer.from(
    secret.startsWith("whsec_") ? secret.slice(6) : secret,
    "base64"
  );
  const signedContent = `${msgId}.${timestamp}.${payload}`;
  const expected = crypto
    .createHmac("sha256", secretBytes)
    .update(signedContent)
    .digest("base64");

  // Header format: "v1,<base64sig> v1,<base64sig> ..."
  return signatureHeader.split(" ").some((part) => {
    const [version, sig] = part.split(",");
    if (version !== "v1" || !sig) return false;
    const a = Buffer.from(sig);
    const b = Buffer.from(expected);
    return a.length === b.length && crypto.timingSafeEqual(a, b);
  });
}

export async function POST(request: Request) {
  try {
    const secret = (process.env.RESEND_WEBHOOK_SECRET ?? "").trim();
    if (!secret) {
      console.error("[resend-webhook] RESEND_WEBHOOK_SECRET not configured");
      return NextResponse.json({ received: true });
    }

    const raw = await request.text();
    const svixId = request.headers.get("svix-id") ?? "";
    const svixTimestamp = request.headers.get("svix-timestamp") ?? "";
    const svixSignature = request.headers.get("svix-signature") ?? "";

    if (!verifySvixSignature(secret, raw, svixId, svixTimestamp, svixSignature)) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    const event = JSON.parse(raw) as {
      type?: string;
      data?: { email_id?: string };
    };

    if (event.type !== "email.opened" && event.type !== "email.clicked") {
      return NextResponse.json({ received: true });
    }

    const emailId = event.data?.email_id;
    if (!emailId) return NextResponse.json({ received: true });

    const admin = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // One delivery email can cover several ce_sends rows (multi-course send).
    const { data: sends } = await admin
      .from("ce_sends")
      .select("id, rep_id, professional_id, course_name, recipient_email, is_test, opened_at, rep_notified_at")
      .eq("resend_email_id", emailId);

    if (!sends || sends.length === 0) {
      return NextResponse.json({ received: true });
    }

    // Stamp first-open on any row that hasn't been opened yet.
    await admin
      .from("ce_sends")
      .update({ opened_at: new Date().toISOString() })
      .eq("resend_email_id", emailId)
      .is("opened_at", null);

    // Notify the rep once per send (never for their own test sends).
    const first = sends[0];
    const alreadyNotified = sends.some((s) => s.rep_notified_at);
    if (first.is_test || alreadyNotified) {
      return NextResponse.json({ received: true });
    }

    await admin
      .from("ce_sends")
      .update({ rep_notified_at: new Date().toISOString() })
      .eq("resend_email_id", emailId);

    await notifyRep(admin, first, sends.length);

    return NextResponse.json({ received: true });
  } catch (e) {
    console.error("[resend-webhook] error:", e);
    // 200 — webhook retries won't fix a code bug, and Resend disables
    // endpoints that keep failing.
    return NextResponse.json({ received: true });
  }
}

/** "They opened it" email to the rep — deliberately plain and human. */
async function notifyRep(
  admin: SupabaseClient,
  send: {
    id: string;
    rep_id: string;
    professional_id: string | null;
    course_name: string;
    recipient_email: string | null;
  },
  courseCount: number
): Promise<void> {
  try {
    const resendKey = process.env.RESEND_API_KEY;
    if (!resendKey) return;

    const { data: repAuth } = await admin.auth.admin.getUserById(send.rep_id);
    const repEmail = repAuth?.user?.email;
    if (!repEmail) return;

    const { data: repProfile } = await admin
      .from("profiles")
      .select("full_name")
      .eq("id", send.rep_id)
      .maybeSingle();
    const repFirst =
      (repProfile?.full_name ?? repAuth?.user?.user_metadata?.full_name ?? "there")
        .split(/\s+/)[0];

    let proName = send.recipient_email ?? "Your contact";
    if (send.professional_id) {
      const { data: pro } = await admin
        .from("professionals")
        .select("name")
        .eq("id", send.professional_id)
        .maybeSingle();
      if (pro?.name) proName = pro.name;
    }
    const proFirst = proName.split(/\s+/)[0];

    const appUrl = (process.env.NEXT_PUBLIC_APP_URL ?? "https://pulsereferrals.com").replace(/\/$/, "");
    const courseLabel =
      courseCount > 1
        ? `${send.course_name} (and ${courseCount - 1} more)`
        : send.course_name;

    const html = `
<div style="font-family:Georgia,'Times New Roman',serif;max-width:540px;margin:0 auto;padding:32px 24px;color:#0b1222;font-size:16px;line-height:1.7;">
  <p>Hi ${escapeHtml(repFirst)},</p>
  <p>Quick heads up — <strong>${escapeHtml(proName)}</strong> just opened the email with <strong>${escapeHtml(courseLabel)}</strong>.</p>
  <p>Nothing you need to do. But if you're seeing ${escapeHtml(proFirst)} soon, it's a natural opener: &ldquo;Did you get a chance to start that course?&rdquo;</p>
  <p>We'll let you know when they start it.</p>
  <p>— Pulse<br/><span style="color:#7a8ba8;font-size:14px;"><a href="${appUrl}/app" style="color:#7a8ba8;">Your dashboard</a> · pulsereferrals.com</span></p>
</div>`;

    const text = [
      `Hi ${repFirst},`,
      ``,
      `Quick heads up — ${proName} just opened the email with ${courseLabel}.`,
      ``,
      `Nothing you need to do. But if you're seeing ${proFirst} soon, it's a natural opener: "Did you get a chance to start that course?"`,
      ``,
      `We'll let you know when they start it.`,
      ``,
      `— Pulse`,
      `${appUrl}/app`,
    ].join("\n");

    const fromAddress = process.env.RESEND_FROM_EMAIL ?? "hello@pulsereferrals.com";
    const resend = new Resend(resendKey);
    await resend.emails.send({
      from: `Pulse <${fromAddress}>`,
      to: repEmail,
      subject: `${proFirst} just opened the CE you sent`,
      html,
      text,
    });
  } catch (e) {
    console.warn("[resend-webhook] rep notification failed:", e);
  }
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
