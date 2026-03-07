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

  // Get rep's state for territory filtering
  const { data: repProfile } = await admin
    .from("profiles")
    .select("state")
    .eq("id", user.id)
    .single();

  // Get professionals seeking CE, optionally filtered by state
  let query = admin
    .from("profiles")
    .select("id, full_name, discipline, city, state, facility")
    .eq("seeking_ce", true)
    .eq("role", "professional")
    .neq("id", user.id);

  if (repProfile?.state) {
    query = query.eq("state", repProfile.state);
  }

  const { data: professionals } = await query.limit(50);

  // Get their pending requests
  const proIds = (professionals ?? []).map((p: { id: string }) => p.id);
  let requests: { professional_id: string; topic: string; hours: number; deadline: string }[] = [];
  
  if (proIds.length > 0) {
    const { data } = await admin
      .from("ce_requests")
      .select("professional_id, topic, hours, deadline")
      .in("professional_id", proIds)
      .eq("status", "pending");
    requests = data ?? [];
  }

  const result = (professionals ?? []).map((p: {
    id: string;
    full_name: string | null;
    discipline: string | null;
    city: string | null;
    state: string | null;
    facility: string | null;
  }) => ({
    id: p.id,
    name: p.full_name ?? "Unknown",
    discipline: p.discipline,
    city: p.city,
    state: p.state,
    facility: p.facility,
    requests: requests.filter((r) => r.professional_id === p.id),
  }));

  return NextResponse.json({
    professionals: result,
    cities: [...new Set(result.map((p) => p.city).filter(Boolean))].sort(),
  });
}