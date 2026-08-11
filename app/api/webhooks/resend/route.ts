import { createClient as createServiceClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import crypto from "crypto";

/**
 * POST /api/webhooks/resend
 *
 * Resend webhook (email.opened / email.clicked). Correlates events back to
 * ce_sends via resend_email_id (stamped by /api/ce/send at delivery time) and
 * records opened_at for the dashboard's "Opened 👀" status. Deliberately does
 * NOT email the rep — the one notification per send fires at the moment of
 * value instead, when the professional presses Start (see /api/ce/redeem).
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

    // Stamp first-open on any matching row (one delivery email can cover
    // several ce_sends rows in a multi-course send). No rep email here —
    // the single per-send notification fires from /api/ce/redeem when the
    // professional actually presses Start.
    await admin
      .from("ce_sends")
      .update({ opened_at: new Date().toISOString() })
      .eq("resend_email_id", emailId)
      .is("opened_at", null);

    return NextResponse.json({ received: true });
  } catch (e) {
    console.error("[resend-webhook] error:", e);
    // 200 — webhook retries won't fix a code bug, and Resend disables
    // endpoints that keep failing.
    return NextResponse.json({ received: true });
  }
}
