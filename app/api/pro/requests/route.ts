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

  const { data: requests } = await admin
    .from("ce_requests")
    .select("id, topic, hours, deadline, status, created_at")
    .eq("professional_id", user.id)
    .order("created_at", { ascending: false });

  const { data: repsData } = await admin
    .from("professionals")
    .select("rep_id, name")
    .eq("email", user.email ?? "");

  const repIds = (repsData ?? []).map((r: { rep_id: string }) => r.rep_id).filter(Boolean);

  let reps: { id: string; name: string }[] = [];
  if (repIds.length > 0) {
    const { data: repProfiles } = await admin
      .from("profiles")
      .select("id, full_name")
      .in("id", repIds);
    reps = (repProfiles ?? []).map((p: { id: string; full_name: string | null }) => ({
      id: p.id,
      name: p.full_name ?? "Unknown Rep",
    }));
  }

  return NextResponse.json({ requests: requests ?? [], reps });
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const { topic, hours, deadline, visible } = body;

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

    if (error) {
      return NextResponse.json({ error: error.message, details: error }, { status: 500 });
    }

    if (visible) {
      await admin
        .from("profiles")
        .update({ seeking_ce: true })
        .eq("id", user.id);
    }

    return NextResponse.json({ success: true, request: newRequest });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}