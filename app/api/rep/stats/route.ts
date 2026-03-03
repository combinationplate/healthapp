import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const now = new Date();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  startOfWeek.setHours(0, 0, 0, 0);

  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [touchResult, ceMonthResult, ceAllTimeResult, redeemedResult, proResult] = await Promise.all([
    admin.from("touchpoints")
      .select("id", { count: "exact" })
      .eq("rep_id", user.id)
      .gte("created_at", startOfWeek.toISOString()),
    admin.from("ce_sends")
      .select("id", { count: "exact" })
      .eq("rep_id", user.id)
      .not("clicked_at", "is", null),
    admin.from("ce_sends")
      .select("id", { count: "exact" })
      .eq("rep_id", user.id),
    admin.from("ce_sends")
      .select("id", { count: "exact" })
      .eq("rep_id", user.id)
      .not("redeemed_at", "is", null),
    admin.from("professionals")
      .select("id")
      .eq("rep_id", user.id),
  ]);

  const proIds = (proResult.data ?? []).map((p: { id: string }) => p.id);

  let requestCount = 0;
  if (proIds.length > 0) {
    const { count } = await admin
      .from("ce_requests")
      .select("id", { count: "exact" })
      .in("professional_id", proIds)
      .eq("status", "pending");
    requestCount = count ?? 0;
  }

  return NextResponse.json({
    touchpointsThisWeek: touchResult.count ?? 0,
    cesSentThisMonth: ceMonthResult.count ?? 0,
    cesSentAllTime: ceAllTimeResult.count ?? 0,
    redeemed: redeemedResult.count ?? 0,
    requests: requestCount,
  });
}