import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { normalizeWorkSetting, normalizeRenewalDate, normalizeHoursNeeded } from "@/lib/ce-profile";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // select("*") so this keeps working before the ce-profile migration runs.
  const { data: row } = await admin
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  const p = row as Record<string, unknown> | null;
  const profile = p
    ? {
        id: p.id,
        full_name: p.full_name ?? null,
        role: p.role ?? null,
        discipline: p.discipline ?? null,
        state: p.state ?? null,
        city: p.city ?? null,
        facility: p.facility ?? null,
        work_setting: p.work_setting ?? null,
        license_renews_on: p.license_renews_on ?? null,
        ce_hours_needed: p.ce_hours_needed ?? null,
      }
    : null;
  return NextResponse.json({ profile });
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { discipline, state, city, facility, workSetting, licenseRenewsOn, ceHoursNeeded } = body;
  const cityNormalized = typeof city === "string" ? city.trim().replace(/\b\w/g, (c) => c.toUpperCase()) : city;

  const admin = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // CE Profile fields: only touch a column when the client sent the key, so a
  // partial save never clears the others. Values are normalized; invalid or
  // empty input clears the field (null).
  const update: Record<string, unknown> = {
    discipline, state, city: cityNormalized, facility,
    updated_at: new Date().toISOString(),
  };
  const hasCeProfile =
    workSetting !== undefined || licenseRenewsOn !== undefined || ceHoursNeeded !== undefined;
  if (workSetting !== undefined) update.work_setting = normalizeWorkSetting(workSetting);
  if (licenseRenewsOn !== undefined) update.license_renews_on = normalizeRenewalDate(licenseRenewsOn);
  if (ceHoursNeeded !== undefined) update.ce_hours_needed = normalizeHoursNeeded(ceHoursNeeded);

  let { error } = await admin
    .from("profiles")
    .update(update)
    .eq("id", user.id);

  // If the ce-profile migration has not run yet, retry without those columns
  // so the rest of the profile update still lands.
  if (error && hasCeProfile && /work_setting|license_renews_on|ce_hours_needed/i.test(error.message)) {
    delete update.work_setting;
    delete update.license_renews_on;
    delete update.ce_hours_needed;
    ({ error } = await admin.from("profiles").update(update).eq("id", user.id));
  }

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}