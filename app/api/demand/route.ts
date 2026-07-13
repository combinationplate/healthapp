import { NextResponse } from "next/server";
import { getDemandData } from "@/lib/demand/data";

// Reading the client IP for rate-limiting makes this dynamic; anonymous page
// traffic is served by the cached /demand page, not this endpoint.
export const dynamic = "force-dynamic";

const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 30;
const hits = new Map<string, { count: number; start: number }>();

function rateLimited(ip: string): boolean {
  const now = Date.now();
  if (hits.size > 5000) {
    for (const [k, v] of hits) if (now - v.start > WINDOW_MS) hits.delete(k);
  }
  const h = hits.get(ip);
  if (!h || now - h.start > WINDOW_MS) {
    hits.set(ip, { count: 1, start: now });
    return false;
  }
  h.count += 1;
  return h.count > MAX_PER_WINDOW;
}

export async function GET(request: Request) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown";
  if (rateLimited(ip)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  // getDemandData returns only anonymized fields (no name/email/PII).
  const data = await getDemandData();
  return NextResponse.json(data, {
    headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600" },
  });
}
