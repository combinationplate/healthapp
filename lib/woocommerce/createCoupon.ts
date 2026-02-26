/**
 * WooCommerce REST API v3 – create a coupon.
 * Uses env: WOOCOMMERCE_URL, WOOCOMMERCE_KEY, WOOCOMMERCE_SECRET.
 */
function getWooCredentials(): { url: string; key: string; secret: string } {
  const url = (process.env.WOOCOMMERCE_URL ?? "").trim().replace(/\/$/, "");
  const key = (process.env.WOOCOMMERCE_KEY ?? "").trim();
  const secret = (process.env.WOOCOMMERCE_SECRET ?? "").trim();
  return { url, key, secret };
}

export type CreateCouponParams = {
  code: string;
  /** Discount amount: "100" | "50" | "25" for percent. */
  amount: string;
  discountType?: "percent" | "fixed_cart" | "fixed_product";
  /** Product IDs the coupon applies to (optional). */
  productIds?: number[];
  /** ISO date string; coupon expires at end of this date. */
  dateExpires?: string;
  /** Max uses per coupon (default 1). */
  usageLimit?: number;
  description?: string;
};

export async function createWooCoupon(params: CreateCouponParams): Promise<{ id?: number; error?: string }> {
  const { url: WOO_URL, key: WOO_KEY, secret: WOO_SECRET } = getWooCredentials();

  if (!WOO_URL || !WOO_KEY || !WOO_SECRET) {
    return { error: "WooCommerce credentials not configured" };
  }

  const apiUrl = `${WOO_URL}/wp-json/wc/v3/coupons`;
  const auth = Buffer.from(`${WOO_KEY}:${WOO_SECRET}`).toString("base64");

  const body = {
    code: params.code,
    amount: params.amount,
    discount_type: params.discountType ?? "percent",
    date_expires: params.dateExpires ?? null,
    product_ids: params.productIds ?? [],
    usage_limit: params.usageLimit ?? 1,
    individual_use: true,
    description: params.description ?? "Pulse CE course",
  };

  try {
    const res = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${auth}`,
      },
      body: JSON.stringify(body),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      const msg = typeof data.message === "string" ? data.message : data.message?.join?.(" ") ?? data.code ?? res.statusText;
      return { error: msg };
    }

    return { id: data.id };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "WooCommerce request failed";
    return { error: msg };
  }
}
