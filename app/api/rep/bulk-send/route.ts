import { createClient as createServiceClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

type Recipient = {
  name: string;
  email: string;
  discipline?: string;
};

type BulkSendResult = {
  email: string;
  name: string;
  success: boolean;
  error?: string;
  couponCode?: string;
};

export async function POST(request: Request) {
  try {
    const { repId, courseId, discount, recipients } = await request.json();

    if (!repId || !courseId || !recipients?.length) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    if (recipients.length > 100) {
      return NextResponse.json({ error: "Maximum 100 recipients per bulk send" }, { status: 400 });
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

    // Check which emails already received this course from this rep
    const emails = recipients.map((r: Recipient) => r.email.trim().toLowerCase());
    const { data: alreadySent } = await admin
      .from("ce_sends")
      .select("recipient_email")
      .eq("rep_id", repId)
      .eq("course_id", courseId)
      .in("recipient_email", emails);

    const alreadySentEmails = new Set(
      (alreadySent ?? []).map((s: { recipient_email: string }) => s.recipient_email)
    );

    const wcAuth = Buffer.from(
      `${process.env.WOOCOMMERCE_KEY}:${process.env.WOOCOMMERCE_SECRET}`
    ).toString("base64");

    const discountAmount = discount === "100% Free" ? "100" : discount === "50% Off" ? "50" : "25";

    const results: BulkSendResult[] = [];

    // Process sequentially to avoid rate limits
    for (const recipient of recipients) {
      const email = recipient.email.trim().toLowerCase();
      const name = recipient.name.trim();

      // Skip duplicates
      if (alreadySentEmails.has(email)) {
        results.push({ email, name, success: false, error: "already_sent" });
        continue;
      }

      try {
        // Generate coupon code
        const repName = (repProfile?.full_name ?? "REP").split(" ")[0].toUpperCase();
        const initials = name.split(/\s+/).map((n: string) => n[0]).join("").toUpperCase().slice(0, 2);
        const month = new Date().toLocaleString("default", { month: "short" }).toUpperCase();
        const year = new Date().getFullYear().toString().slice(-2);
        const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
        const couponCode = `${repName}-${initials}-${month}${year}-${rand}`;

        // Create WooCommerce coupon
        const wcRes = await fetch(`${process.env.WOOCOMMERCE_URL}/wp-json/wc/v3/coupons`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Basic ${wcAuth}`,
          },
          body: JSON.stringify({
            code: couponCode,
            discount_type: "percent",
            amount: discountAmount,
            usage_limit: 1,
            usage_limit_per_user: 1,
            product_ids: course.product_id ? [course.product_id] : [],
          }),
        });

        if (!wcRes.ok) throw new Error("WooCommerce coupon creation failed");

        // Upsert professional into rep's network
        const { data: pro } = await admin
          .from("professionals")
          .upsert({
            rep_id: repId,
            name,
            email,
            discipline: recipient.discipline || null,
          }, { onConflict: "rep_id,email" })
          .select("id")
          .single();

        // Log CE send
        const redirectUrl = `${process.env.NEXT_PUBLIC_APP_URL}/r/${couponCode}`;
        await admin.from("ce_sends").insert({
          rep_id: repId,
          professional_id: pro?.id,
          course_id: courseId,
          course_name: course.name,
          course_hours: course.hours,
          coupon_code: couponCode,
          discount,
          product_id: course.product_id,
          recipient_email: email,
          source: "bulk",
          redirect_url: redirectUrl,
        });

        // Log touchpoint
        await admin.from("touchpoints").insert({
          rep_id: repId,
          professional_id: pro?.id,
          type: "ce",
          points: 5,
          notes: `CE sent via bulk send`,
        });

        // Send email
        await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
          },
          body: JSON.stringify({
            from: "noreply@pulsereferrals.com",
            to: email,
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

        results.push({ email, name, success: true, couponCode });

        // Small delay between sends to avoid rate limits
        await new Promise(resolve => setTimeout(resolve, 300));

      } catch (err) {
        const msg = err instanceof Error ? err.message : "Unknown error";
        results.push({ email, name, success: false, error: msg });
      }
    }

    const succeeded = results.filter(r => r.success).length;
    const skipped = results.filter(r => r.error === "already_sent").length;
    const failed = results.filter(r => !r.success && r.error !== "already_sent").length;

    return NextResponse.json({ results, succeeded, skipped, failed });

  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
