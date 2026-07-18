import { NextResponse } from "next/server";

/**
 * Legacy CE email links point here (/r/CODE). This is now a pure redirect to
 * the /start/[coupon] interstitial and has NO side effects — clicked_at and
 * redeemed_at are stamped only by POST /api/ce/redeem when a human presses
 * the button. Email security scanners that prefetch GET links (Outlook
 * SafeLinks, Mimecast) therefore can't trigger billable redemptions anymore.
 */
export async function GET(
  request: Request,
  context: { params: Promise<{ coupon: string }> }
) {
  const { coupon } = await context.params;
  const origin = new URL(request.url).origin;
  return NextResponse.redirect(`${origin}/start/${encodeURIComponent(coupon)}`);
}
