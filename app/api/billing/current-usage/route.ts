import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const admin = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Get user's org
    const { data: profile } = await admin
      .from("profiles")
      .select("org_id, role")
      .eq("id", user.id)
      .single();

    // Determine which reps to include
    let repIds: string[] = [user.id];

    if (profile?.org_id) {
      // Get all reps in this org
      const { data: orgMembers } = await admin
        .from("profiles")
        .select("id")
        .eq("org_id", profile.org_id)
        .in("role", ["rep", "manager", "admin"]);

      if (orgMembers && orgMembers.length > 0) {
        repIds = orgMembers.map((m: { id: string }) => m.id);
      }
    }

    // Current billing period
    const now = new Date();
    const periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    // Get redeemed, unbilled CE sends for this period
    const { data: sends } = await admin
      .from("ce_sends")
      .select(`
        id, rep_id, course_name, course_hours,
        redeemed_at, billed, coupon_code,
        professionals(name),
        courses(price)
      `)
      .in("rep_id", repIds)
      .not("redeemed_at", "is", null)
      .gte("redeemed_at", periodStart.toISOString())
      .lte("redeemed_at", periodEnd.toISOString())
      .order("redeemed_at", { ascending: false });

    // Get rep names
    const uniqueRepIds = [...new Set((sends ?? []).map((s: any) => s.rep_id))];
    const { data: repProfiles } = await admin
      .from("profiles")
      .select("id, full_name")
      .in("id", uniqueRepIds);

    const repNameMap = new Map(
      (repProfiles ?? []).map((p: { id: string; full_name: string | null }) => [p.id, p.full_name ?? "Unknown"])
    );

    const lineItems = (sends ?? []).map((s: any) => {
      const pro = s.professionals as { name?: string } | null;
      const course = Array.isArray(s.courses) ? s.courses[0] : s.courses;
      const priceCents = course?.price ? Math.round(course.price * 100) : 1500; // default $15

      return {
        id: s.id,
        repName: repNameMap.get(s.rep_id) ?? "Unknown",
        professionalName: pro?.name ?? "Unknown",
        courseName: s.course_name,
        courseHours: s.course_hours,
        redeemedAt: s.redeemed_at,
        priceCents,
        billed: s.billed ?? false,
      };
    });

    const totalCents = lineItems.reduce((sum: number, li: any) => sum + li.priceCents, 0);

    return NextResponse.json({
      periodStart: periodStart.toISOString().split("T")[0],
      periodEnd: periodEnd.toISOString().split("T")[0],
      ceCount: lineItems.length,
      totalCents,
      lineItems,
    });
  } catch (e) {
    console.error("Usage error:", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
