import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  console.log("user:", user?.id);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: managerProfile, error: profileError } = await supabase
    .from("profiles")
    .select("org_id")
    .eq("id", user.id)
    .single();

  console.log("managerProfile:", managerProfile, "profileError:", profileError);

  if (!managerProfile?.org_id) {
    return NextResponse.json({ reps: [], stats: null });
  }

  const orgId = managerProfile.org_id;

  const { data: repProfiles, error: repError } = await supabase
    .from("profiles")
    .select("id, full_name")
    .eq("org_id", orgId)
    .eq("role", "rep");

  console.log("repProfiles:", repProfiles, "repError:", repError);

  if (!repProfiles || repProfiles.length === 0) {
    return NextResponse.json({ reps: [], stats: null });
  }

  const repIds = repProfiles.map((r) => r.id);
  const now = new Date();
  const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

  const [cesResult, profResult, touchResult] = await Promise.all([
    supabase.from("ce_sends").select("id, rep_id, created_at, redeemed_at").in("rep_id", repIds),
    supabase.from("professionals").select("id, rep_id").in("rep_id", repIds),
    supabase.from("touchpoints").select("id, rep_id, created_at").in("rep_id", repIds).order("created_at", { ascending: false }),
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

  const reps = repProfiles.map((rep) => {
    const repCesThisMonth = cesThisMonth.filter((c) => c.rep_id === rep.id).length;
    const repProfessionals = allProfe