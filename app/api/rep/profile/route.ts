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

  const { data: profile } = await admin
    .from("profiles")
    .select("id, full_name, state, city, org_id, manager_id")
    .eq("id", user.id)
    .single();

  let org_name: string | null = null;
  if (profile?.org_id) {
    const { data: org } = await admin
      .from("orgs")
      .select("name")
      .eq("id", profile.org_id)
      .single();
    org_name = org?.name ?? null;
  }

  return NextResponse.json({ profile: profile ? { ...profile, org_name } : null });
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const { state, city, orgName, discipline, facility } = body;
    const cityNormalized =
      typeof city === "string" ? city.trim().replace(/\b\w/g, (c: string) => c.toUpperCase()) : null;

    const admin = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Build profile update
    const profileUpdate: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };
    if (state) profileUpdate.state = state;
    if (cityNormalized) profileUpdate.city = cityNormalized;
    if (discipline) profileUpdate.discipline = discipline;
    if (facility) profileUpdate.facility = facility;

    // Handle org linkage if orgName is provided
    if (orgName && orgName.trim()) {
      const trimmedName = orgName.trim();

      // Check if org already exists (case-insensitive)
      const { data: existingOrg } = await admin
        .from("orgs")
        .select("id")
        .ilike("name", trimmedName)
        .maybeSingle();

      if (existingOrg) {
        profileUpdate.org_id = existingOrg.id;
      } else {
        // Create new org
        const { data: newOrg, error: orgError } = await admin
          .from("orgs")
          .insert({ name: trimmedName })
          .select("id")
          .single();

        if (orgError) {
          console.error("Failed to create org:", orgError.message);
        } else if (newOrg) {
          profileUpdate.org_id = newOrg.id;
        }
      }
    }

    const { error } = await admin
      .from("profiles")
      .update(profileUpdate)
      .eq("id", user.id);

    if (error) {
      console.error("Profile update failed:", error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
