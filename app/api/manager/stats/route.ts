import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export async function GET() {
  // Use regular client just for auth check
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Use service role client to bypass RLS for manager queries
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
    admin.from("ce_sends").select("id, rep_id