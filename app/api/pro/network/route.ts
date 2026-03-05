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

  // Find all professionals table rows where email matches this user
  const { data: connections } = await admin
    .from("professionals")
    .select("rep_id, facility, discipline, created_at")
    .eq("email", user.email ?? "");

  if (!connections || connections.length === 0) {
    return NextResponse.json({ reps: [] });
  }

  const repIds = connections.map((c: { rep_id: string }) => c.rep_id);

  const { data: repProfiles } = await admin
    .from("profiles")
    .select("id, full_name, org_id")
    .in("id", repIds);

  const reps = (repProfiles ?? []).map((p: { id: string; full_name: string | null; org_id: string | null }) => ({
    id: p.id,
    name: p.full_name ?? "Unknown Rep",
    connectedAt: connections.find((c: { rep_id: string }) => c.rep_id === p.id)?.created_at ?? null,
  }));

  return NextResponse.json({ reps });
}