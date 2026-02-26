import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

const CART_BASE = "https://hiscornerstone.com/cart/";
function courseAccessUrl(productId: number, couponCode: string): string {
  const params = new URLSearchParams({ "add-to-cart": String(productId), coupon_code: couponCode });
  return `${CART_BASE}?${params.toString()}`;
}

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: rows, error } = await supabase
      .from("ce_sends")
      .select("id, course_name, course_hours, discount, coupon_code, product_id, created_at, redeemed_at, users(name)")
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const list = (rows ?? []).map((r: Record<string, unknown>) => {
      const created = r.created_at as string;
      const sentAt = new Date(created);
      const expiryAt = new Date(sentAt);
      expiryAt.setDate(expiryAt.getDate() + 90);
      const repName = (r.users as { name?: string } | null)?.name ?? "Rep";
      const productId = r.product_id as number | null;
      const couponCode = r.coupon_code as string;
      return {
        id: r.id,
        courseName: r.course_name,
        courseHours: r.course_hours,
        sentBy: repName,
        sentAt: created,
        expiryAt: expiryAt.toISOString(),
        redeemUrl: productId ? courseAccessUrl(productId, couponCode) : null,
        redeemedAt: r.redeemed_at as string | null,
      };
    });

    return NextResponse.json({ list });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
