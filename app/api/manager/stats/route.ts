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

  const { data: managerProfile } = await admin
    .from("profiles")
    .select("org_id")
    .eq("id", user.id)
    .single();

  if (!managerProfile?.org_id) {
    return NextResponse.json({ reps: [], stats: null });
  }

  const orgId = managerProfile.org_id;

  const { data: repProfiles } = await admin
    .from("profiles")
    .select("id, full_name")
    .eq("org_id", orgId)
    .eq("role", "rep");

  if (!repProfiles || repProfiles.length === 0) {
    return NextResponse.json({ reps: [], stats: null });
  }
  const repIds = repProfiles.map((r: { id: string }) => r.id);
  const now = new Date();
  const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

  const [cesResult, profResult, touchResult] = await Promise.all([
    admin.from("ce_sends").select("id, rep_id, created_at, redeemed_at").in("rep_id", repIds),
    admin.from("professionals").select("id, rep_id").in("rep_id", repIds),
    admin.from("touchpoints").select("id, rep_id, created_at").in("rep_id", repIds).order("created_at", { ascending: false }),
  ]);

  const allCeSends = cesResult.data ?? [];
  const allProfessionals = profResult.data ?? [];
  const allTouchpoints = touchResult.data ?? [];

  const cesThisMonth = allCeSends.filter((c) => c.created_at >= firstOfMonth);
  const redeemed = allCeSends.filter((c) => c.redeemed_at);
  const redemptionRate = allCeSends.length > 0
    ? `${Math.round((redeemed.length / allCeSends.length) * 100)}%`
    : "—";
  const activeRepIds = new Set(cesThisMonth.map((c) => c.rep_id));

  const stats = {
    totalCesThisMonth: cesThisMonth.length,
    totalProfessionals: allProfessionals.length,
    activeReps: activeRepIds.size,
    redemptionRate,
  };

  const reps = repProfiles.map((rep: { id: string; full_name: string | null }) => {
    const repCesThisMonth = cesThisMonth.filter((c) => c.rep_id === rep.id).length;
    const repProfessionals = allProfessionals.filter((p) => p.rep_id === rep.id).length;
    const repCesAll = allCeSends.filter((c) => c.rep_id === rep.id);
    const repRedeemed = repCesAll.filter((c) => c.redeemed_at).length;
    const repRedemptionRate = repCesAll.length > 0
      ? `${Math.round((repRedeemed / repCesAll.length) * 100)}%`
      : "—";
    const lastTouch = allTouchpoints.find((t) => t.rep_id === rep.id);
    const lastActivity = lastTouch
      ? new Date(lastTouch.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })
      : "No activity";

    return {
      id: rep.id,
      name: rep.full_name ?? "Unknown",
      cesThisMonth: repCesThisMonth,
      professionalsInNetwork: repProfessionals,
      lastActivity,
      redemptionRate: repRedemptionRate,
    };
  });

  reps.sort((a, b) => b.cesThisMonth - a.cesThisMonth);
  return NextResponse.json({ reps, stats });
}