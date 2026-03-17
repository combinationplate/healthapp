import { createClient as createServiceClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { buildCeEmailSubject, buildCeEmailHtml, buildCeEmailText } from "@/lib/email/ce-email";

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

    // Get rep profile + org
    const { data: repProfile } = await admin
      .from("profiles")
      .select("id, full_name, org_id, org_name")
      .eq("id", repId)
      .single();

    let repOrgName = repProfile?.org_name ?? "";
    if (!repOrgName && repProfile?.org_id) {
      const { data: org } = await admin.from("orgs").select("name").eq("id", repProfile.org_id).single();
      repOrgName = org?.name ?? "";
    }

    const { data: repAuthUser } = await admin.auth.admin.getUserById(repId);
    const repEmail = repAuthUser?.user?.email ?? "";

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
        const emailParams = {
          recipientName: name,
          courseName: course.name,
          courseHours: course.hours,
          couponCode,
          accessUrl: redirectUrl,
          discount,
          repName: repProfile?.full_name ?? "Your Rep",
          repEmail,
          repOrgName,
        };

        await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
          },
          body: JSON.stringify({
            from: `${emailParams.repName} via Pulse <noreply@pulsereferrals.com>`,
            to: email,
            subject: buildCeEmailSubject(emailParams),
            html: buildCeEmailHtml(emailParams),
            text: buildCeEmailText(emailParams),
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
