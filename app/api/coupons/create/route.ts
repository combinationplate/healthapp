import { NextResponse } from "next/server";
import { createWooCoupon } from "@/lib/woocommerce/createCoupon";

/**
 * Server-only API: create a WooCommerce coupon.
 * Reads process.env.WOOCOMMERCE_URL, WOOCOMMERCE_KEY, WOOCOMMERCE_SECRET server-side.
 * The client must call this route; WooCommerce is never accessed from the browser.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      code,
      amount,
      discountType,
      productIds,
      dateExpires,
      usageLimit,
      description,
    } = body as {
      code: string;
      amount: string;
      discountType?: "percent" | "fixed_cart" | "fixed_product";
      productIds?: number[];
      dateExpires?: string;
      usageLimit?: number;
      description?: string;
    };

    if (!code || !amount) {
      return NextResponse.json(
        { error: "Missing required fields: code, amount" },
        { status: 400 }
      );
    }

    const result = await createWooCoupon({
      code,
      amount,
      discountType,
      productIds,
      dateExpires,
      usageLimit,
      description,
    });

    if (result.error) {
      const status = result.error === "WooCommerce credentials not configured" ? 503 : 502;
      return NextResponse.json({ error: result.error }, { status });
    }

    return NextResponse.json({ id: result.id, code });
  } catch (e) {
    console.error("Coupon create error:", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
