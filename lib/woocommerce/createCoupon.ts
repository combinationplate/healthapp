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
  const credentials = Buffer.from(`${WOO_KEY}:${WOO_SECRET}`).toString("base64");

  const couponData = {
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
        Authorization: `Basic ${credentials}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(couponData),
    });

    const responseText = await res.text();
    const data = (() => {
      try {
        return JSON.parse(responseText) as Record<string, unknown>;
      } catch {
        return {};
      }
    })();

    if (!res.ok) {
      const headersObj: Record<string, string> = {};
      res.headers.forEach((value, key) => {
        headersObj[key] = value;
      });
      console.error("[WooCommerce] Coupon create failed", {
        status: res.status,
        statusText: res.statusText,
        url: apiUrl,
        headers: headersObj,
        body: responseText,
        parsed: data,
      });
      const msg = typeof data.message === "string" ? data.message : Array.isArray(data.message) ? (data.message as string[]).join(" ") : (data.code as string) ?? res.statusText;
      return { error: msg };
    }

    return { id: data.id as number };
  } catch (e) {
    console.error("[WooCommerce] Coupon create request threw", e);
    const msg = e instanceof Error ? e.message : "WooCommerce request failed";
    return { error: msg };
  }
}
