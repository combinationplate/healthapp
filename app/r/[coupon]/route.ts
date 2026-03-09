import { createClient as createServiceClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  context: { params: Promise<{ coupon: string }> }
) {
  const { coupon } = await context.params;
  const couponCode = coupon.toUpperCase();

  try {
    const admin = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: ceSend } = await admin
      .from("ce_sends")
      .select("id, coupon_code, product_id, course_id, clicked_at, redeemed_at")
      .eq("coupon_code", couponCode)
      .single();

    const now = new Date().toISOString();
    if (ceSend && !ceSend.clicked_at) {
      await admin
        .from("ce_sends")
        .update({ 
          clicked_at: now,
          redeemed_at: now,
        })
        .eq("id", ceSend.id);
    } else if (ceSend && !ceSend.redeemed_at) {
      // Already clicked before, but redeemed_at wasn't set (backfill)
      await admin
        .from("ce_sends")
        .update({ redeemed_at: now })
        .eq("id", ceSend.id);
    }

    let productId = ceSend?.product_id ?? null;
    if (productId == null && ceSend?.course_id) {
      const { data: course } = await admin
        .from("courses")
        .select("product_id")
        .eq("id", ceSend.course_id)
        .single();
      productId = course?.product_id ?? null;
    }

    let redirectUrl = "https://hiscornerstone.com/";
    if (productId) {
      const params = new URLSearchParams({
        "add-to-cart": String(productId),
        coupon_code: couponCode,
      });
      redirectUrl = `https://hiscornerstone.com/?${params.toString()}`;
    }

    return NextResponse.redirect(redirectUrl);
  } catch (e) {
    console.error("Redirect error:", e);
    return NextResponse.redirect("https://hiscornerstone.com/");
  }
}