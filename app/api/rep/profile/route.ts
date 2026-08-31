import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { sanitizeTerritoryStates } from "@/lib/territory";

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
    // select("*") so this keeps working before the territory_states migration runs
    .select("*")
    .eq("id", user.id)
    .single();

  let org_name: string | null = null;
  let org_logo_url: string | null = null;
  if (profile?.org_id) {
    // select("*") so this keeps working even before the logo_url migration runs
    const { data: org } = await admin
      .from("orgs")
      .select("*")
      .eq("id", profile.org_id)
      .single();
    org_name = org?.name ?? null;
    org_logo_url = (org as { logo_url?: string | null } | null)?.logo_url ?? null;
  }

  const prof = profile as (typeof profile & { territory_states?: string[] | null }) | null;
  return NextResponse.json({
    profile: prof
      ? {
          id: prof.id,
          full_name: prof.full_name ?? null,
          state: prof.state ?? null,
          city: prof.city ?? null,
          org_id: prof.org_id ?? null,
          manager_id: prof.manager_id ?? null,
          territory_states: prof.territory_states ?? null,
          org_name,
          org_logo_url,
          email: user.email ?? null,
        }
      : null,
  });
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const { state, city, orgName, discipline, facility, territoryStates } = body;
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
    // Multi-state territory: only touch the column when the client sent the
    // key (Array). Sanitized against real state codes; home state excluded.
    let territoryUpdate: string[] | null | undefined = undefined;
    if (Array.isArray(territoryStates)) {
      let home: string | null = typeof state === "string" && state ? state : null;
      if (!home) {
        const { data: existing } = await admin
          .from("profiles")
          .select("state")
          .eq("id", user.id)
          .single();
        home = existing?.state ?? null;
      }
      territoryUpdate = sanitizeTerritoryStates(territoryStates, home);
      profileUpdate.territory_states = territoryUpdate;
    }

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

    let { error } = await admin
      .from("profiles")
      .update(profileUpdate)
      .eq("id", user.id);

    // If the territory_states migration has not run yet, retry without it so
    // the rest of the profile update still lands.
    if (error && territoryUpdate !== undefined && /territory_states/i.test(error.message)) {
      delete profileUpdate.territory_states;
      ({ error } = await admin.from("profiles").update(profileUpdate).eq("id", user.id));
    }

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
