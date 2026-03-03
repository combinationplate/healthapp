import { createClient as createServiceClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: { coupon: string } }
) {
  const couponCode = params.coupon.toUpperCase();

  try {
    const admin = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: ceSend } = await admin
      .from("ce_sends")
      .select("id, coupon_code, product_id, clicked_at")
      .eq("coupon_code", couponCode)
      .single();

    if (ceSend && !ceSend.clicked_at) {
      await admin
        .from("ce_sends")
        .update({ clicked_at: new Date().toISOString() })
        .eq("id", ceSend.id);
    }

    // Redirect to hiscornerstone.com with coupon applied
    const productId = ceSend?.product_id;
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
