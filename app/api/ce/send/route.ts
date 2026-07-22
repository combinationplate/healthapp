import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { Resend } from "resend";
import { createWooCoupon } from "@/lib/woocommerce/createCoupon";
import {
  buildCeEmailSubject,
  buildCeEmailHtml,
  buildCeEmailText,
  buildCeMultiEmailSubject,
  buildCeMultiEmailHtml,
  buildCeMultiEmailText,
} from "@/lib/email/ce-email";

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
    const { professionalId, repId, courseId, courseIds, discount, personalMessage, recipient } = body as {
      professionalId: string;
      repId: string;
      courseId?: string;
      courseIds?: string[];
      discount: string;
      personalMessage?: string;
      recipient?: { name: string; email: string; discipline?: string; city?: string; state?: string; facility?: string };
    };

    // Accept a single courseId (back-compat) OR an array of courseIds (multi-send).
    const courseIdList = Array.isArray(courseIds) && courseIds.length > 0
      ? Array.from(new Set(courseIds.filter(Boolean)))
      : courseId
        ? [courseId]
        : [];

    if (!professionalId || !repId || courseIdList.length === 0 || !discount) {
      return NextResponse.json(
        { error: "Missing professionalId, repId, course(s), or discount" },
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

    // Look up all selected courses by UUID from the courses table
    const { data: courses, error: courseError } = await supabase
      .from("courses")
      .select("id, name, hours, product_id")
      .in("id", courseIdList);

    if (courseError || !courses || courses.length === 0) {
      return NextResponse.json({ error: "Course not found" }, { status: 400 });
    }

    const admin = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: repProfile } = await admin
      .from("profiles")
      .select("full_name, org_id")
      .eq("id", repId)
      .single();
    const repName =
      (repProfile?.full_name ??
        user.user_metadata?.full_name ??
        user.email?.split("@")[0] ??
        "Rep")
        .trim() || "Rep";
    const repEmail = user.email ?? "";
    let repOrgName = "";
    if (repProfile?.org_id) {
      const { data: org } = await admin
        .from("orgs")
        .select("name")
        .eq("id", repProfile.org_id)
        .single();
      repOrgName = org?.name ?? "";
    }

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

    // Create a coupon + ce_send record for each selected course.
    const sentCourses: { courseName: string; courseHours: number; couponCode: string; accessUrl: string }[] = [];
    const failedCourses: string[] = [];
    const insertedSendIds: string[] = [];

    for (const course of courses) {
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
        console.warn(`Coupon creation failed for ${course.name}:`, wooResult.error);
        failedCourses.push(course.name);
        continue;
      }

      const { data: insertedSend, error: sendError } = await admin
        .from("ce_sends")
        .insert({
          rep_id: repId,
          professional_id: ceSendProId,
          course_name: course.name,
          course_hours: course.hours,
          discount,
          coupon_code: couponCode,
          personal_message: personalMessage?.trim() || null,
          product_id: productIdForDb,
          recipient_email: pro.email,
        })
        .select("id")
        .single();

      if (sendError || !insertedSend) {
        console.warn(`ce_send insert failed for ${course.name}:`, sendError?.message);
        failedCourses.push(course.name);
        continue;
      }
      insertedSendIds.push(insertedSend.id);

      const { error: touchError } = await admin.from("touchpoints").insert({
        rep_id: repId,
        professional_id: ceSendProId,
        type: "ce_send",
        notes: `${course.name} (${couponCode})`,
        points: 5,
      });
      if (touchError) {
        // Log but don't fail; ce_send was recorded
        console.warn("Touchpoint insert failed:", touchError);
      }

      sentCourses.push({
        courseName: course.name,
        courseHours: course.hours,
        couponCode,
        accessUrl: courseAccessUrl(couponCode),
      });
    }

    if (sentCourses.length === 0) {
      return NextResponse.json(
        { error: "Could not create any course coupons in the store. Please try again." },
        { status: 502 }
      );
    }

    // Mark one pending CE request fulfilled (if any)
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
    const fromAddress =
      process.env.RESEND_FROM_EMAIL ?? "hello@pulsereferrals.com";
    const fromEmail = `${repName} via Pulse <${fromAddress}>`;

    let emailErrorMsg: string | null = null;

    if (resendKey) {
      const resend = new Resend(resendKey);

      if (sentCourses.length === 1) {
        // Single course — use the original per-course email (unchanged look)
        const c = sentCourses[0];
        const emailParams = {
          recipientName: pro.name,
          courseName: c.courseName,
          courseHours: c.courseHours,
          couponCode: c.couponCode,
          accessUrl: c.accessUrl,
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
          console.error("Resend error (single send):", emailError);
          emailErrorMsg = emailError.message ?? "Email send failed";
        }
      } else {
        // Multiple courses — one combined email listing them all
        const multiParams = {
          recipientName: pro.name,
          repName,
          repEmail,
          repOrgName,
          personalMessage: personalMessage?.trim(),
          courses: sentCourses,
          discount,
        };
        const { error: emailError } = await resend.emails.send({
          from: fromEmail,
          to: pro.email,
          subject: buildCeMultiEmailSubject(multiParams),
          html: buildCeMultiEmailHtml(multiParams),
          text: buildCeMultiEmailText(multiParams),
        });
        if (emailError) {
          console.error("Resend error (multi send):", emailError);
          emailErrorMsg = emailError.message ?? "Email send failed";
        }
      }
    } else {
      emailErrorMsg = "RESEND_API_KEY not configured";
    }

    // Record delivery outcome so failures are visible, not silent.
    if (insertedSendIds.length > 0) {
      await admin
        .from("ce_sends")
        .update(
          emailErrorMsg
            ? { email_error: emailErrorMsg }
            : { email_sent_at: new Date().toISOString() }
        )
        .in("id", insertedSendIds);
    }

    return NextResponse.json({
      success: true,
      sent: sentCourses.length,
      failed: failedCourses.length,
      failedCourses,
      coupons: sentCourses.map((c) => c.couponCode),
      emailSent: !emailErrorMsg,
      emailError: emailErrorMsg,
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
