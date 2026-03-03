import { createClient as createServiceClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const status = body?.status;
    if (status !== "completed" && status !== "processing") {
      return NextResponse.json({ received: true });
    }

    const couponLines = body?.coupon_lines ?? [];
    if (couponLines.length === 0) {
      return NextResponse.json({ received: true });
    }

    const admin = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    for (const coupon of couponLines) {
      const code = coupon?.code?.toUpperCase();
      if (!code) continue;

      const { data: ceSend } = await admin
        .from("ce_sends")
        .select("id, redeemed_at")
        .eq("coupon_code", code)
        .maybeSingle();

      if (ceSend && !ceSend.redeemed_at) {
        await admin
          .from("ce_sends")
          .update({ redeemed_at: new Date().toISOString() })
          .eq("id", ceSend.id);
      }
    }

    return NextResponse.json({ received: true });
  } catch (e) {
    console.error("Webhook error:", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}