import { createClient as createServiceClient } from "@supabase/supabase-js";
import { NextResponse, after } from "next/server";
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
      .select("id, coupon_code, product_id, course_id, discount, clicked_at, redeemed_at, professional_id")
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
    if (firstClick) {
      after(introduceOnRedemption(admin, ceSend.id));
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
