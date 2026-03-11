import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

// ── GET /api/events — list the rep's events + RSVP data ────────
export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data, error } = await supabase
    .from("events")
    .select(`
      *,
      event_rsvps (
        id, status, professional_id, guest_name, guest_email,
        professionals ( name, email, discipline, facility )
      )
    `)
    .eq("rep_id", user.id)
    .order("starts_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const events = (data ?? []).map((evt: any) => {
    const rsvps = evt.event_rsvps ?? [];
    return {
      ...evt,
      counts: {
        going: rsvps.filter((r: any) => r.status === "going").length,
        maybe: rsvps.filter((r: any) => r.status === "maybe").length,
        declined: rsvps.filter((r: any) => r.status === "declined").length,
        total: rsvps.length,
      },
    };
  });

  return NextResponse.json({ events });
}

// ── POST /api/events — create an event ─────────────────────────
export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();

  if (!body.title?.trim()) {
    return NextResponse.json({ error: "Title is required" }, { status: 400 });
  }
  if (!body.startsAt) {
    return NextResponse.json({ error: "Start date is required" }, { status: 400 });
  }

  // Get rep's display name from profiles
  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", user.id)
    .single();

  // Try to get org name from billing_settings → orgs
  let orgName: string | null = null;
  const { data: billing } = await supabase
    .from("billing_settings")
    .select("org_id")
    .eq("rep_id", user.id)
    .eq("billing_type", "org")
    .limit(1)
    .single();

  if (billing?.org_id) {
    const { data: org } = await supabase
      .from("orgs")
      .select("name")
      .eq("id", billing.org_id)
      .single();
    orgName = org?.name ?? null;
  }

  const { data: event, error } = await supabase
    .from("events")
    .insert({
      rep_id: user.id,
      title: body.title.trim(),
      description: body.description?.trim() || null,
      event_type: body.eventType || "lunch_and_learn",
      external_url: body.externalUrl?.trim() || null,
      location_name: body.locationName?.trim() || null,
      address: body.address?.trim() || null,
      city: body.city?.trim() || null,
      state: body.state?.trim() || null,
      starts_at: body.startsAt,
      duration_minutes: parseInt(body.durationMinutes) || 60,
      max_capacity: body.maxCapacity ? parseInt(body.maxCapacity) : null,
      visibility: body.visibility || "network",
      rep_name: profile?.full_name ?? user.email,
      rep_org: orgName,
      status: "published",
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ event });
}
