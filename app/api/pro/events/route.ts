import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userEmail = (user.email ?? "").toLowerCase();

  // Find all professional records for this user (one per rep they're
  // connected to). This gives us: which reps they know, and their
  // city/state for public event matching.
  const { data: proRecords } = await supabase
    .from("professionals")
    .select("id, city, state, rep_id")
    .ilike("email", userEmail);

  const proIds = (proRecords ?? []).map((p: any) => p.id);
  const connectedRepIds = [
    ...new Set((proRecords ?? []).map((p: any) => p.rep_id)),
  ];

  // Use the first record's location for public event matching.
  const proCity = proRecords?.[0]?.city ?? null;
  const proState = proRecords?.[0]?.state ?? null;

  const now = new Date().toISOString();
  const allEvents: any[] = [];
  const seenIds = new Set<string>();

  // 1. Network events — from reps this professional is connected to
  if (connectedRepIds.length > 0) {
    const { data: networkEvents } = await supabase
      .from("events")
      .select("*")
      .in("rep_id", connectedRepIds)
      .eq("status", "published")
      .gte("starts_at", now)
      .order("starts_at", { ascending: true });

    for (const evt of networkEvents ?? []) {
      if (!seenIds.has(evt.id)) {
        allEvents.push({ ...evt, _source: "network" });
        seenIds.add(evt.id);
      }
    }
  }

  // 2. Public events in the professional's state
  if (proState) {
    const { data: publicEvents } = await supabase
      .from("events")
      .select("*")
      .eq("visibility", "public")
      .eq("status", "published")
      .eq("state", proState)
      .gte("starts_at", now)
      .order("starts_at", { ascending: true });

    for (const evt of publicEvents ?? []) {
      if (!seenIds.has(evt.id)) {
        allEvents.push({ ...evt, _source: "public" });
        seenIds.add(evt.id);
      }
    }
  }

  // Sort combined results by start date
  allEvents.sort(
    (a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime()
  );

  // Get this pro's existing RSVPs for these events
  const eventIds = allEvents.map((e) => e.id);
  const rsvpMap: Record<string, string> = {};

  if (eventIds.length > 0) {
    // Check by professional_id
    if (proIds.length > 0) {
      const { data: proRsvps } = await supabase
        .from("event_rsvps")
        .select("event_id, status")
        .in("event_id", eventIds)
        .in("professional_id", proIds);

      for (const r of proRsvps ?? []) {
        rsvpMap[r.event_id] = r.status;
      }
    }

    // Also check by guest_email (they might have RSVPed before signing up)
    const { data: guestRsvps } = await supabase
      .from("event_rsvps")
      .select("event_id, status")
      .in("event_id", eventIds)
      .eq("guest_email", userEmail);

    for (const r of guestRsvps ?? []) {
      if (!rsvpMap[r.event_id]) rsvpMap[r.event_id] = r.status;
    }
  }

  // Format for frontend
  const events = allEvents.map((evt) => ({
    id: evt.id,
    title: evt.title,
    description: evt.description,
    eventType: evt.event_type,
    externalUrl: evt.external_url,
    locationName: evt.location_name,
    address: evt.address,
    city: evt.city,
    state: evt.state,
    startsAt: evt.starts_at,
    durationMinutes: evt.duration_minutes,
    maxCapacity: evt.max_capacity,
    visibility: evt.visibility,
    repName: evt.rep_name ?? "A rep",
    repOrg: evt.rep_org ?? null,
    source: evt._source,
    myRsvp: rsvpMap[evt.id] ?? null,
  }));

  return NextResponse.json({ events });
}
