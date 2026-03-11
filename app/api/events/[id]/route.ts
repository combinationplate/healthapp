import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

// ── PATCH — update event ───────────────────────────────────────
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();

  const fieldMap: Record<string, string> = {
    title: "title", description: "description", eventType: "event_type",
    externalUrl: "external_url", locationName: "location_name",
    address: "address", city: "city", state: "state",
    startsAt: "starts_at", durationMinutes: "duration_minutes",
    maxCapacity: "max_capacity", visibility: "visibility", status: "status",
  };

  const updates: Record<string, any> = {};
  for (const [camel, snake] of Object.entries(fieldMap)) {
    if (body[camel] !== undefined) updates[snake] = body[camel];
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("events")
    .update(updates)
    .eq("id", id)
    .eq("rep_id", user.id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({ event: data });
}

// ── DELETE — remove event ──────────────────────────────────────
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { error } = await supabase
    .from("events")
    .delete()
    .eq("id", id)
    .eq("rep_id", user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
