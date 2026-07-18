import crypto from "crypto";

/**
 * Direct LearnDash enrollment on Hiscornerstone via the pulse-connect mu-plugin.
 * Signs requests with PULSE_WP_SHARED_SECRET (must match PULSE_SHARED_SECRET in wp-config.php).
 * Base URL reuses WOOCOMMERCE_URL.
 */
export type EnrollParams = {
  email: string;
  name?: string;
  /** WooCommerce product ID — resolved to a LearnDash course on the WP side. */
  productId: number;
  /** Pulse ce_sends UUID — echoed back on the course-completed webhook. */
  ceSendId: string;
};

export type EnrollResult = {
  loginUrl?: string;
  courseUrl?: string;
  existingUser?: boolean;
  error?: string;
};

export function signPulsePayload(body: string, secret: string, timestamp?: string): { ts: string; sig: string } {
  const ts = timestamp ?? String(Math.floor(Date.now() / 1000));
  const sig = crypto.createHmac("sha256", secret).update(`${ts}.${body}`).digest("hex");
  return { ts, sig };
}

/** Constant-time verification for inbound webhooks from the mu-plugin. */
export function verifyPulseSignature(rawBody: string, timestamp: string, signature: string, secret: string): boolean {
  const age = Math.abs(Math.floor(Date.now() / 1000) - Number(timestamp));
  if (!Number.isFinite(age) || age > 300) return false;
  const expected = crypto.createHmac("sha256", secret).update(`${timestamp}.${rawBody}`).digest("hex");
  const a = Buffer.from(expected, "hex");
  const b = Buffer.from((signature ?? "").trim().toLowerCase(), "hex");
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

export async function enrollOnHiscornerstone(params: EnrollParams): Promise<EnrollResult> {
  const base = (process.env.WOOCOMMERCE_URL ?? "https://hiscornerstone.com").trim().replace(/\/$/, "");
  const secret = (process.env.PULSE_WP_SHARED_SECRET ?? "").trim();
  if (!secret) return { error: "PULSE_WP_SHARED_SECRET not configured" };

  const body = JSON.stringify({
    email: params.email.trim().toLowerCase(),
    name: params.name ?? "",
    product_id: params.productId,
    ce_send_id: params.ceSendId,
  });
  const { ts, sig } = signPulsePayload(body, secret);

  try {
    const res = await fetch(`${base}/wp-json/pulse/v1/enroll`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Pulse-Timestamp": ts,
        "X-Pulse-Signature": sig,
      },
      body,
      signal: AbortSignal.timeout(10_000),
    });

    const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;

    if (!res.ok || !data.login_url) {
      const msg =
        typeof data.message === "string" ? data.message : `Enroll failed (HTTP ${res.status})`;
      console.warn("[Hiscornerstone] enroll failed:", msg);
      return { error: msg };
    }

    return {
      loginUrl: data.login_url as string,
      courseUrl: (data.course_url as string) ?? undefined,
      existingUser: Boolean(data.existing_user),
    };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Enroll request failed";
    console.warn("[Hiscornerstone] enroll request threw:", msg);
    return { error: msg };
  }
}
