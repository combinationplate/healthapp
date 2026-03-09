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
    const { state, city, orgName } = body;
    const cityNormalized = typeof city === "string" ? city.trim().replace(/\b\w/g, (c) => c.toUpperCase()) : city;

    const admin = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const updatePayload: Record<string, unknown> = { state, city: cityNormalized, updated_at: new Date().toISOString() };
    if (orgName) updatePayload.org_name = orgName.trim();

    await admin
      .from("profiles")
      .update(updatePayload)
      .eq("id", user.id);

    return NextResponse.json({ success: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
