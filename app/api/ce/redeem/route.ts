import { createClient as createServiceClient, type SupabaseClient } from "@supabase/supabase-js";
import { NextResponse, after } from "next/server";
import { Resend } from "resend";
import { introduceOnRedemption } from "@/lib/demand/introduce";
import { enrollOnHiscornerstone } from "@/lib/hiscornerstone/enroll";

/**
 * POST /api/ce/redeem  { coupon: string }
 *
 * Fired by a human pressing "Start Your Course" on the /start/[coupon] page.
 * This is the billable moment: stamps clicked_at + redeemed_at, then
 *   - 100% Free sends → direct LearnDash enrollment + magic login link
 *   - partial discounts, or any enrollment failure → coupon checkout fallback
 *
 * GET requests never reach this route, so email security scanners
 * (SafeLinks, Mimecast) can no longer trigger redemptions.
 */
export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => ({}))) as {
      coupon?: string;
      firstName?: string;
      lastName?: string;
    };
    const code = (body.coupon ?? "").trim().toUpperCase();
    const firstName = (body.firstName ?? "").trim().slice(0, 60);
    const lastName = (body.lastName ?? "").trim().slice(0, 60);
    if (!code) {
      return NextResponse.json({ error: "Missing coupon" }, { status: 400 });
    }

    const admin = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: ceSend } = await admin
      .from("ce_sends")
      .select("id, coupon_code, product_id, course_id, discount, clicked_at, redeemed_at, professional_id, is_test, rep_id, course_name")
      .eq("coupon_code", code)
      .single();

    if (!ceSend) {
      return NextResponse.json({ error: "This course link is invalid or has expired." }, { status: 404 });
    }

    // Stamp the redemption (idempotent — re-clicks keep the original timestamps).
    const now = new Date().toISOString();
    const firstClick = !ceSend.clicked_at;
    await admin
      .from("ce_sends")
      .update({
        clicked_at: ceSend.clicked_at ?? now,
        redeemed_at: ceSend.redeemed_at ?? now,
      })
      .eq("id", ceSend.id);
    if (firstClick && !ceSend.is_test) {
      after(introduceOnRedemption(admin, ceSend.id));
      // The ONE rep notification per send — fired at the moment of value,
      // when the professional opens the CE. (Email-open pixel events only
      // stamp the dashboard status; they never email the rep.)
      after(notifyRepStarted(admin, ceSend));
    }

    // Resolve the Woo product ID (older rows may only carry course_id).
    let productId: number | null = ceSend.product_id ?? null;
    if (productId == null && ceSend.course_id) {
      const { data: course } = await admin
        .from("courses")
        .select("product_id")
        .eq("id", ceSend.course_id)
        .single();
      productId = course?.product_id ?? null;
    }

    const storeBase = (process.env.WOOCOMMERCE_URL ?? "https://hiscornerstone.com").trim().replace(/\/$/, "");
    const checkoutFallback = productId
      ? `${storeBase}/?${new URLSearchParams({ "add-to-cart": String(productId), coupon_code: code }).toString()}`
      : `${storeBase}/`;

    // Partial discounts must go through checkout — money changes hands.
    if (ceSend.discount !== "100% Free" || !productId) {
      return NextResponse.json({ redirect: checkoutFallback, mode: "checkout" });
    }

    // 100% Free → enroll directly and log them straight into the course.
    const { data: pro } = await admin
      .from("professionals")
      .select("name, email")
      .eq("id", ceSend.professional_id)
      .single();

    if (!pro?.email) {
      return NextResponse.json({ redirect: checkoutFallback, mode: "checkout" });
    }

    // If the professional confirmed/corrected their certificate name on the
    // interstitial, persist it — this becomes the name on their certificate.
    const confirmedName = [firstName, lastName].filter(Boolean).join(" ");
    if (confirmedName && confirmedName !== (pro.name ?? "").trim()) {
      await admin
        .from("professionals")
        .update({ name: confirmedName })
        .eq("id", ceSend.professional_id);
    }

    const nameParts = confirmedName
      ? { firstName, lastName }
      : (() => {
          const parts = (pro.name ?? "").trim().split(/\s+/);
          return { firstName: parts[0] ?? "", lastName: parts.slice(1).join(" ") };
        })();

    const enroll = await enrollOnHiscornerstone({
      email: pro.email,
      name: confirmedName || (pro.name ?? ""),
      firstName: nameParts.firstName,
      lastName: nameParts.lastName,
      productId,
      ceSendId: ceSend.id,
    });

    if (enroll.loginUrl) {
      return NextResponse.json({ redirect: enroll.loginUrl, mode: "enrolled" });
    }

    // Any WP-side failure falls back to the proven coupon checkout.
    console.warn(`[redeem] direct enroll failed for ${code}, falling back to checkout:`, enroll.error);
    return NextResponse.json({ redirect: checkoutFallback, mode: "checkout" });
  } catch (e) {
    console.error("[redeem] error:", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

/**
 * The single rep notification per send: "«Name» just opened the CE you sent."
 * Fires once (first Start press = real value moment), never for test sends.
 * Best-effort — must never break redemption.
 */
async function notifyRepStarted(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  admin: SupabaseClient<any, any, any, any, any>,
  ceSend: { id: string; rep_id: string; course_name: string; professional_id: string | null }
): Promise<void> {
  try {
    const resendKey = process.env.RESEND_API_KEY;
    if (!resendKey || !ceSend.rep_id) return;

    const { data: repAuth } = await admin.auth.admin.getUserById(ceSend.rep_id);
    const repEmail = repAuth?.user?.email;
    if (!repEmail) return;

    const { data: repProfile } = await admin
      .from("profiles")
      .select("full_name")
      .eq("id", ceSend.rep_id)
      .maybeSingle();
    const repFirst =
      (repProfile?.full_name ?? repAuth?.user?.user_metadata?.full_name ?? "there")
        .split(/\s+/)[0];

    let proName = "Your contact";
    if (ceSend.professional_id) {
      const { data: pro } = await admin
        .from("professionals")
        .select("name")
        .eq("id", ceSend.professional_id)
        .maybeSingle();
      if (pro?.name) proName = pro.name;
    }
    const proFirst = proName.split(/\s+/)[0];

    const esc = (s: string) =>
      s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
    const appUrl = (process.env.NEXT_PUBLIC_APP_URL ?? "https://pulsereferrals.com").replace(/\/$/, "");

    const html = `
<div style="font-family:Georgia,'Times New Roman',serif;max-width:540px;margin:0 auto;padding:32px 24px;color:#0b1222;font-size:16px;line-height:1.7;">
  <p>Hi ${esc(repFirst)},</p>
  <p><strong>${esc(proName)}</strong> just opened <strong>${esc(ceSend.course_name)}</strong>. They're in the course, and your name is on the sponsorship.</p>
  <p>Congrats, this is the whole play working. You gave ${esc(proFirst)} something they actually need, and they know exactly who it came from.</p>
  <p>Keep an eye on your <a href="${appUrl}/app" style="color:#2455ff;">dashboard</a>. Professionals who take a CE often come back to request their next one, and answering a request is the easiest send you'll ever make.</p>
  <p>Pulse<br/><span style="color:#7a8ba8;font-size:14px;">pulsereferrals.com</span></p>
</div>`;

    const text = [
      `Hi ${repFirst},`,
      ``,
      `${proName} just opened ${ceSend.course_name}. They're in the course, and your name is on the sponsorship.`,
      ``,
      `Congrats, this is the whole play working. You gave ${proFirst} something they actually need, and they know exactly who it came from.`,
      ``,
      `Keep an eye on your dashboard. Professionals who take a CE often come back to request their next one, and answering a request is the easiest send you'll ever make.`,
      `${appUrl}/app`,
      ``,
      `Pulse`,
    ].join("\n");

    const fromAddress = process.env.RESEND_FROM_EMAIL ?? "hello@pulsereferrals.com";
    const resend = new Resend(resendKey);
    await resend.emails.send({
      from: `Pulse <${fromAddress}>`,
      to: repEmail,
      subject: `${proFirst} just opened the CE you sent 🎉`,
      html,
      text,
    });
  } catch (e) {
    console.warn("[redeem] rep started-notification failed:", e);
  }
}
