import { createClient as createServiceClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { buildCeEmailSubject, buildCeEmailHtml, buildCeEmailText } from "@/lib/email/ce-email";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const repId = searchParams.get("repId");
  const courseId = searchParams.get("courseId");

  if (!repId) return NextResponse.json({ error: "Missing repId" }, { status: 400 });

  const admin = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Get rep info
  const { data: repProfile } = await admin
    .from("profiles")
    .select("id, full_name, org_id, email")
    .eq("id", repId)
    .single();

  let orgName = "";
  if (repProfile?.org_id) {
    const { data: org } = await admin
      .from("orgs")
      .select("name")
      .eq("id", repProfile.org_id)
      .single();
    orgName = org?.name ?? "";
  }

  // Get courses
  let courses = [];
  if (courseId) {
    const { data } = await admin
      .from("courses")
      .select("id, name, hours, topic")
      .eq("id", courseId)
      .single();
    if (data) courses = [data];
  } else {
    // Get courses with their approved professions
    const { data: cpData } = await admin
      .from("course_professions")
      .select("profession, courses(id, name, hours, topic)")
      .order("profession");

    // Build course list with professions attached
    const courseMap = new Map<string, { id: string; name: string; hours: number; topic: string | null; professions: string[] }>();
    for (const row of (cpData ?? []) as any[]) {
      const c = Array.isArray(row.courses) ? row.courses[0] : row.courses;
      if (!c?.id) continue;
      if (!courseMap.has(c.id)) {
        courseMap.set(c.id, { ...c, professions: [] });
      }
      courseMap.get(c.id)!.professions.push(row.profession);
    }
    courses = Array.from(courseMap.values()).sort((a: any, b: any) => a.name.localeCompare(b.name));
  }

  // Check if QR cap is reached
  let capReached = false;
  if (repId) {
    const { data: qrCode } = await admin
      .from("qr_codes")
      .select("cap")
      .eq("rep_id", repId)
      .eq("course_id", courseId ?? null)
      .maybeSingle();

    if (qrCode?.cap !== null && qrCode?.cap !== undefined) {
      const { count } = await admin
        .from("ce_sends")
        .select("*", { count: "exact", head: true })
        .eq("rep_id", repId)
        .eq("source", "qr")
        .eq("course_id", courseId ?? null);

      capReached = (count ?? 0) >= qrCode.cap;
    }
  }

  return NextResponse.json({
    rep: {
      name:
        repProfile?.full_name ??
        repProfile?.email?.split("@")[0] ??
        "Rep",
      company: orgName,
    },
    courses,
    preselectedCourse: courseId ?? null,
    capReached,
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { repId, courseId, email, name, discipline } = body;

    if (!repId || !courseId || !email || !name) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const emailNormalized = String(email).trim().toLowerCase();

    const admin = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Get course
    const { data: course } = await admin
      .from("courses")
      .select("id, name, hours, price, product_id")
      .eq("id", courseId)
      .single();

    if (!course) return NextResponse.json({ error: "Course not found" }, { status: 404 });

    // Get rep profile
    const { data: repProfile } = await admin
      .from("profiles")
      .select("id, full_name, org_id")
      .eq("id", repId)
      .single();

    let orgName = "";
    if (repProfile?.org_id) {
      const { data: org } = await admin.from("orgs").select("name").eq("id", repProfile.org_id).single();
      orgName = org?.name ?? "";
    }

    const { data: repAuthUser } = await admin.auth.admin.getUserById(repId);
    const repEmail = repAuthUser?.user?.email ?? "";

    // Upsert qr_codes record and get the cap for this rep+course
    const { data: qrCode } = await admin
      .from("qr_codes")
      .upsert({
        rep_id: repId,
        course_id: courseId || null,
        cap: 25,
      }, { onConflict: "rep_id,course_id" })
      .select("id, cap")
      .single();

    // Count existing QR sends for this rep+course
    const { count: scanCount } = await admin
      .from("ce_sends")
      .select("*", { count: "exact", head: true })
      .eq("rep_id", repId)
      .eq("source", "qr")
      .eq("course_id", courseId);

    // Enforce cap
    if (qrCode?.cap !== null && (scanCount ?? 0) >= (qrCode?.cap ?? 25)) {
      return NextResponse.json({ error: "cap_reached" }, { status: 403 });
    }

    // Deduplication — one QR send per email per rep
    const { data: alreadySent } = await admin
      .from("ce_sends")
      .select("id")
      .eq("rep_id", repId)
      .eq("source", "qr")
      .eq("recipient_email", emailNormalized)
      .maybeSingle();

    if (alreadySent) {
      return NextResponse.json({ error: "already_sent" }, { status: 409 });
    }

    // Upsert professional into rep's network
    const { data: pro } = await admin
      .from("professionals")
      .upsert({
        rep_id: repId,
        name: name.trim(),
        email: emailNormalized,
        discipline: discipline || null,
      }, { onConflict: "rep_id,email" })
      .select("id")
      .single();

    if (!pro) return NextResponse.json({ error: "Failed to add professional" }, { status: 500 });

    // Check if professional has a Pulse account (public users table)
    const { data: existingUser } = await admin
      .from("users")
      .select("id")
      .eq("email", emailNormalized)
      .maybeSingle();

    // Generate coupon code
    const repName = (repProfile?.full_name ?? "REP").split(" ")[0].toUpperCase();
    const initials = name.trim().split(/\s+/).map((n: string) => n[0]).join("").toUpperCase().slice(0, 2);
    const month = new Date().toLocaleString("default", { month: "short" }).toUpperCase();
    const year = new Date().getFullYear().toString().slice(-2);
    const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
    const couponCode = `${repName}-${initials}-${month}${year}-${rand}`;

    // Create WooCommerce coupon
    const wcAuth = Buffer.from(
      `${process.env.WOOCOMMERCE_KEY}:${process.env.WOOCOMMERCE_SECRET}`
    ).toString("base64");

    const wcResult = await fetch(`${process.env.WOOCOMMERCE_URL}/wp-json/wc/v3/coupons`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${wcAuth}`,
      },
      body: JSON.stringify({
        code: couponCode,
        discount_type: "percent",
        amount: "100",
        usage_limit: 1,
        usage_limit_per_user: 1,
        product_ids: course.product_id ? [course.product_id] : [],
      }),
    });
    const wcData = await wcResult.json();
    if (!wcResult.ok) console.error("WooCommerce coupon error:", JSON.stringify(wcData));
    else console.log("WooCommerce coupon created:", wcData.code);

    // Log CE send (link to auth user if they have a Pulse account so it appears in their dashboard)
    const redirectUrl = `${process.env.NEXT_PUBLIC_APP_URL}/r/${couponCode}`;
    const { data: ceSendData, error: ceSendError } = await admin
      .from("ce_sends")
      .insert({
        rep_id: repId,
        professional_id: pro.id,
        ...(existingUser ? { user_id: existingUser.id } : {}),
        course_id: courseId,
        course_name: course.name,
        course_hours: course.hours,
        product_id: course.product_id,
        coupon_code: couponCode,
        discount: "100% Free",
        redirect_url: redirectUrl,
        source: "qr",
        recipient_email: emailNormalized,
      })
      .select()
      .single();
    if (ceSendError) console.error("ce_sends insert error:", ceSendError);

    // Log touchpoint
    await admin.from("touchpoints").insert({
      rep_id: repId,
      professional_id: pro.id,
      type: "ce",
      points: 5,
      notes: "CE sent via QR code scan",
    });

    // Send email via Resend
    const emailParams = {
      recipientName: name,
      courseName: course.name,
      courseHours: course.hours,
      couponCode,
      accessUrl: redirectUrl,
      discount: "100% Free",
      repName: repProfile?.full_name ?? repAuthUser?.user?.user_metadata?.full_name ?? (repEmail.split("@")[0] || "Your Rep"),
      repEmail,
      repOrgName: orgName,
    };

    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: `${emailParams.repName} via Pulse <noreply@pulsereferrals.com>`,
        to: emailNormalized,
        subject: buildCeEmailSubject(emailParams),
        html: buildCeEmailHtml(emailParams),
        text: buildCeEmailText(emailParams),
      }),
    });

    return NextResponse.json({ success: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
