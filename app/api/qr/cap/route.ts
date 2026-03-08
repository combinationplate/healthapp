import { createClient as createServiceClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const repId = searchParams.get("repId");
  const courseId = searchParams.get("courseId") || null;

  if (!repId) return NextResponse.json({ error: "Missing repId" }, { status: 400 });

  const admin = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Get cap setting
  const query = admin
    .from("qr_codes")
    .select("id, cap")
    .eq("rep_id", repId);

  if (courseId) {
    query.eq("course_id", courseId);
  } else {
    query.is("course_id", null);
  }

  const { data: qrCode } = await query.maybeSingle();

  // Get scan count
  const countQuery = admin
    .from("ce_sends")
    .select("*", { count: "exact", head: true })
    .eq("rep_id", repId)
    .eq("source", "qr");

  if (courseId) {
    countQuery.eq("course_id", courseId);
  }

  const { count: scanCount } = await countQuery;

  return NextResponse.json({
    cap: qrCode?.cap ?? 25,
    scanCount: scanCount ?? 0,
  });
}

export async function POST(request: Request) {
  try {
    const { repId, courseId, cap } = await request.json();

    if (!repId) return NextResponse.json({ error: "Missing repId" }, { status: 400 });

    const admin = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    await admin
      .from("qr_codes")
      .upsert({
        rep_id: repId,
        course_id: courseId || null,
        cap: cap,
        updated_at: new Date().toISOString(),
      }, { onConflict: courseId ? "rep_id,course_id" : "rep_id" })
      .select();

    return NextResponse.json({ success: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
