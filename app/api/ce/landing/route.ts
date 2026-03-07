import { createClient as createServiceClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

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
    .select("id, full_name, org_id")
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
    const { data } = await admin
      .from("courses")
      .select("id, name, hours, topic")
      .order("name");
    courses = data ?? [];
  }

  return NextResponse.json({
    rep: {
      name: repProfile?.full_name ?? "Your Rep",
      company: orgName,
    },
    courses,
    preselectedCourse: courseId ?? null,
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { repId, courseId, email, name, discipline } = body;

    if (!repId || !courseId || !email || !name) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

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
      .select("id, full_name")
      .eq("id", repId)
      .single();

    // Upsert professional into rep's network
    const { data: pro } = await admin
      .from("professionals")
      .upsert({
        rep_id: repId,
        name: name.trim(),
        email: email.trim().toLowerCase(),
        discipline: discipline || null,
      }, { onConflict: "rep_id,email" })
      .select("id")
      .single();

    if (!pro) return NextResponse.json({ error: "Failed to add professional" }, { status: 500 });

    // Generate coupon code
    const repName = (repProfile?.full_name ?? "REP").split(" ")[0].toUpperCase();
    const initials = name.trim().split(/\s+/).map((n: string) => n[0]).join("").toUpperCase().slice(0, 2);
    const month = new Date().toLocaleString("default", { month: "short" }).toUpperCase();
    const year = new Date().getFullYear().toString().slice(-2);
    const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
    const couponCode = `${repName}-${initials}-${month}${year}-${rand}`;

    // Create WooCommerce coupon
    const wcAuth = Buffer.from(
      `${process.env.WC_CONSUMER_KEY}:${process.env.WC_CONSUMER_SECRET}`
    ).toString("base64");

    await fetch(`${process.env.WC_STORE_URL}/wp-json/wc/v3/coupons`, {
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

    // Log CE send
    const redirectUrl = `${process.env.NEXT_PUBLIC_APP_URL}/r/${couponCode}`;
    await admin.from("ce_sends").insert({
      rep_id: repId,
      professional_id: pro.id,
      course_id: courseId,
      course_name: course.name,
      course_hours: course.hours,
      coupon_code: couponCode,
      discount: "100%",
      redirect_url: redirectUrl,
    });

    // Log touchpoint
    await admin.from("touchpoints").insert({
      rep_id: repId,
      professional_id: pro.id,
      type: "ce",
      points: 5,
      notes: "CE sent via QR code scan",
    });

    // Send email via Resend
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: process.env.RESEND_FROM_EMAIL,
        to: email.trim().toLowerCase(),
        subject: `Your free CE course from ${repProfile?.full_name ?? "your rep"}`,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
            <h1 style="font-size: 24px; font-weight: 800; margin-bottom: 8px;">Your free CE course is ready 🎉</h1>
            <p style="color: #64748B; margin-bottom: 24px;">Hi ${name}, here's your complimentary CE course from ${repProfile?.full_name ?? "your rep"}.</p>
            <div style="background: #F0F9FF; border-radius: 12px; padding: 24px; margin-bottom: 24px;">
              <div style="font-weight: 700; font-size: 18px; margin-bottom: 4px;">${course.name}</div>
              <div style="color: #64748B; font-size: 14px;">${course.hours} credit hours</div>
            </div>
            <div style="background: #F8FAFC; border-radius: 8px; padding: 16px; margin-bottom: 24px; text-align: center;">
              <div style="font-size: 12px; color: #64748B; margin-bottom: 4px;">Your coupon code</div>
              <div style="font-size: 24px; font-weight: 800; letter-spacing: 2px; color: #2D5BFF;">${couponCode}</div>
            </div>
            <a href="${redirectUrl}" style="display: block; background: #2D5BFF; color: white; text-align: center; padding: 16px; border-radius: 8px; text-decoration: none; font-weight: 700; font-size: 16px;">Access Your Course →</a>
            <p style="color: #94A3B8; font-size: 12px; margin-top: 24px; text-align: center;">Powered by Pulse · hiscornerstone.com</p>
          </div>
        `,
      }),
    });

    return NextResponse.json({ success: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
