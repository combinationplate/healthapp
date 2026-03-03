import { createClient as createServiceClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    let body: Record<string, unknown>;
    try {
      body = await request.json();
    } catch {
      // WooCommerce sometimes sends a ping with no body
      return NextResponse.json({ received: true });
    }

    const status = body?.status as string | undefined;
    if (status !== "completed" && status !== "processing") {
      return NextResponse.json({ received: true });
    }

    const couponLines = (body?.coupon_lines as { code?: string }[]) ?? [];
    if (couponLines.length === 0) {
      return NextResponse.json({ received: true });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceKey) {
      console.error("Missing Supabase env vars");
      return NextResponse.json({ received: true });
    }

    const admin = createServiceClient(supabaseUrl, serviceKey);

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
    // Always return 200 to WooCommerce so it doesn't keep retrying
    return NextResponse.json({ received: true });
  }
}