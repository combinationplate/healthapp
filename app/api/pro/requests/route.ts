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

  // Get professional's requests
  const { data: requests } = await admin
    .from("ce_requests")
    .select("id, topic, hours, deadline, status, created_at")
    .eq("professional_id", user.id)
    .order("created_at", { ascending: false });

  // Get reps connected to this professional
  const { data: repsData } = await admin
    .from("professionals")
    .select("rep_id, profiles(id, full_name)")
    .eq("email", user.email);

  const reps = (repsData ?? []).map((r: Record<string, unknown>) => {
    const profile = r.profiles as { id: string; full_name: string | null } | null;
    return {
      id: profile?.id ?? "",
      name: profile?.full_name ?? "Unknown Rep",
    };
  }).filter((r) => r.id);

  return NextResponse.json({ requests: requests ?? [], reps });
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { topic, hours, deadline, notes, visible } = body;

  if (!topic || !hours || !deadline) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const admin = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: newRequest, error } = await admin
    .from("ce_requests")
    .insert({
      professional_id: user.id,
      topic,
      hours: parseInt(hours),
      deadline,
      status: "pending",
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // If visible, update profile to be discoverable
  if (visible) {
    await admin
      .from("profiles")
      .update({ seeking_ce: true })
      .eq("id", user.id);
  }

  return NextResponse.json({ success: true, request: newRequest });
}