import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { Resend } from "resend";
import { createWooCoupon } from "@/lib/woocommerce/createCoupon";
import { buildCeEmailSubject, buildCeEmailHtml, buildCeEmailText } from "@/lib/email/ce-email";

const CART_BASE = "https://hiscornerstone.com/";
function courseAccessUrl(couponCode: string): string {
  const appUrl = (process.env.NEXT_PUBLIC_APP_URL ?? "https://pulsereferrals.vercel.app").replace(/\/$/, "");
  return `${appUrl}/r/${couponCode}`;
}

const DISCOUNTS = ["100% Free", "50% Off", "25% Off"] as const;

/** Map discount label to WooCommerce coupon amount (percent). */
function discountToAmount(discount: string): string {
  if (discount === "100% Free") return "100";
  if (discount === "50% Off") return "50";
  if (discount === "25% Off") return "25";
  return "100";
}

function initials(name: string): string {
  return name
    .split(/\s+/)
    .map((s) => s[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function generateCouponCode(repName: string): string {
  const base = repName.replace(/\s+/g, "").toUpperCase().slice(0, 20);
  const init = initials(repName);
  const now = new Date();
  const mon = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"][now.getMonth()];
  const year = String(now.getFullYear()).slice(-2);
  const suffix = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${base}-${init}-${mon}${year}-${suffix}`;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { professionalId, repId, courseId, discount, personalMessage, recipient } = body as {
      professionalId: string;
      repId: string;
      courseId: string;
      discount: string;
      personalMessage?: string;
      recipient?: { name: string; email: string; discipline?: string; city?: string; state?: string; facility?: string };
    };

    if (!professionalId || !repId || !courseId || !discount) {
      return NextResponse.json(
        { error: "Missing professionalId, repId, courseId, or discount" },
        { status: 400 }
      );
    }

    if (!DISCOUNTS.includes(discount as (typeof DISCOUNTS)[number])) {
      return NextResponse.json({ error: "Invalid discount" }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || user.id !== repId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Look up course by UUID from the courses table
    const { data: course, error: courseError } = await supabase
      .from("courses")
      .select("id, name, hours, product_id")
      .eq("id", courseId)
      .single();

    if (courseError || !course) {
      return NextResponse.json({ error: "Course not found" }, { status: 400 });
    }

    const admin = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: rep } = await supabase.from("users").select("name").eq("id", repId).single();
    const repName = (rep?.name ?? user.user_metadata?.full_name ?? "Rep").trim() || "Rep";
    const repEmail = user.email ?? "";

    // Fetch org/company name from profiles table
    const { data: repProfile } = await supabase.from("profiles").select("org_name").eq("id", repId).single();
    const repOrgName = repProfile?.org_name ?? "";

    // 1. Try existing professionals table
    const { data: proFromProfessionals } = await supabase
      .from("professionals")
      .select("id, name, email")
      .eq("id", professionalId)
      .eq("rep_id", repId)
      .single();

    let pro: { id: string; name: string; email: string } | null = proFromProfessionals ?? null;
    let ceSendProId: string = professionalId;

    // 2. If not found AND we have recipient data from frontend, upsert directly
    if (!pro && recipient?.email) {
      const email = recipient.email.trim().toLowerCase();
      const { data: upsertedPro } = await admin
        .from("professionals")
        .upsert({
          rep_id: repId,
          name: recipient.name,
          email,
          discipline: recipient.discipline ?? null,
          city: recipient.city ?? null,
          state: recipient.state ?? null,
          facility: recipient.facility ?? null,
        }, { onConflict: "rep_id,email" })
        .select("id")
        .single();

      if (upsertedPro) {
        ceSendProId = upsertedPro.id;
        pro = { id: upsertedPro.id, name: recipient.name, email };
      }
    }

    // 3. Last resort — try profiles + auth lookup
    if (!pro) {
      const { data: profile } = await admin
        .from("profiles")
        .select("id, full_name, discipline, city, state, facility")
        .eq("id", professionalId)
        .single();

      if (profile) {
        const { data: authData } = await admin.auth.admin.getUserById(professionalId);
        const email = authData?.user?.email ?? null;
        if (email) {
          const { data: upsertedPro } = await admin
            .from("professionals")
            .upsert({
              rep_id: repId,
              name: profile.full_name ?? "Professional",
              email,
              discipline: profile.discipline ?? null,
              city: profile.city ?? null,
              state: profile.state ?? null,
              facility: profile.facility ?? null,
            }, { onConflict: "rep_id,email" })
            .select("id")
            .single();

          ceSendProId = upsertedPro?.id ?? professionalId;
          pro = { id: ceSendProId, name: profile.full_name ?? "Professional", email };
        }
      }
    }

    if (!pro) {
      return NextResponse.json({ error: "Could not find email for this professional. Try adding them to your network first." }, { status: 404 });
    }

    const couponCode = generateCouponCode(repName);
    const productIdForDb = course.product_id;

    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + 90);

    const wooResult = await createWooCoupon({
      code: couponCode,
      amount: discountToAmount(discount),
      discountType: "percent",
      productIds: [productIdForDb],
      dateExpires: expiryDate.toISOString().split("T")[0],
      usageLimit: 1,
      description: `Pulse CE: ${course.name} (${discount})`,
    });

    if (wooResult.error) {
      const status = wooResult.error === "WooCommerce credentials not configured" ? 503 : 502;
      return NextResponse.json(
        { error: `Could not create coupon in store: ${wooResult.error}` },
        { status }
      );
    }

    const { error: sendError } = await admin.from("ce_sends").insert({
      rep_id: repId,
      professional_id: ceSendProId,
      course_name: course.name,
      course_hours: course.hours,
      discount,
      coupon_code: couponCode,
      personal_message: personalMessage?.trim() || null,
      product_id: productIdForDb,
    });

    if (sendError) {
      return NextResponse.json({ error: sendError.message }, { status: 500 });
    }

    const { error: touchError } = await admin.from("touchpoints").insert({
      rep_id: repId,
      professional_id: ceSendProId,
      type: "ce_send",
      notes: `${course.name} (${couponCode})`,
      points: 5,
    });

    if (touchError) {
      // Log but don't fail the request; ce_send was recorded
      console.warn("Touchpoint insert failed:", touchError);
    }

    const { data: pendingRequest } = await admin
      .from("ce_requests")
      .select("id")
      .eq("professional_id", ceSendProId)
      .eq("status", "pending")
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (pendingRequest) {
      const { error: fulfillError } = await admin
        .from("ce_requests")
        .update({ status: "fulfilled" })
        .eq("id", pendingRequest.id);
      if (fulfillError) {
        console.warn("Could not mark ce_request as fulfilled:", fulfillError.message);
      }
    }

    const resendKey = process.env.RESEND_API_KEY;
    const fromEmail = process.env.RESEND_FROM_EMAIL ?? "Pulse <noreply@pulsereferrals.com>";
    const accessUrl = courseAccessUrl(couponCode);

    if (resendKey) {
      const resend = new Resend(resendKey);

      const emailParams = {
        recipientName: pro.name,
        courseName: course.name,
        courseHours: course.hours,
        couponCode,
        accessUrl,
        discount,
        repName,
        repEmail,
        repOrgName,
        personalMessage: personalMessage?.trim(),
      };

      const { error: emailError } = await resend.emails.send({
        from: fromEmail,
        to: pro.email,
        subject: buildCeEmailSubject(emailParams),
        html: buildCeEmailHtml(emailParams),
        text: buildCeEmailText(emailParams),
      });
      if (emailError) {
        console.warn("Resend error:", emailError);
        // Still return success; record and points are saved
      }
    }

    return NextResponse.json({ success: true, couponCode });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
