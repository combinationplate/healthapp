import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const supabase = await createClient();
  const body = await request.json();
  const { eventId, status, email, name } = body;

  if (!eventId || !status) {
    return NextResponse.json({ error: "eventId and status required" }, { status: 400 });
  }
  if (!["going", "maybe", "declined"].includes(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  // Try to identify as a professional via auth
  const { data: { user } } = await supabase.auth.getUser();
  let professionalId: string | null = null;

  if (user) {
    // Match by email — a professional might have multiple records
    // (one per rep), so just grab the first to use as the RSVP identity
    // Try professionals table first (rep-added contacts)
    const { data: pro } = await supabase
      .from("professionals")
      .select("id")
      .ilike("email", user.email ?? "")
      .limit(1)
      .maybeSingle();

    if (pro) professionalId = pro.id;
  }

  if (professionalId) {
    // Upsert by professional_id
    const { error } = await supabase
      .from("event_rsvps")
      .upsert(
        { event_id: eventId, professional_id: professionalId, status },
        { onConflict: "event_id,professional_id" }
      );
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  } else if (email) {
    // Guest RSVP via email link
    const { error } = await supabase
      .from("event_rsvps")
      .upsert(
        {
          event_id: eventId,
          guest_email: email.trim().toLowerCase(),
          guest_name: name?.trim() || null,
          status,
        },
        { onConflict: "event_id,guest_email" }
      );
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  } else {
    return NextResponse.json(
      { error: "Must be logged in or provide an email" },
      { status: 400 }
    );
  }

  return NextResponse.json({ success: true, status });
}
