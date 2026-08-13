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
    const { professionalId, repId, courseId, courseIds, discount, personalMessage, recipient, isTest } = body as {
      professionalId?: string;
      repId: string;
      courseId?: string;
      courseIds?: string[];
      discount: string;
      personalMessage?: string;
      recipient?: { name: string; email: string; discipline?: string; city?: string; state?: string; facility?: string };
      /** Rep sends the real email to themselves to preview the experience. */
      isTest?: boolean;
    };

    // Accept a single courseId (back-compat) OR an array of courseIds (multi-send).
    const courseIdList = Array.isArray(courseIds) && courseIds.length > 0
      ? Array.from(new Set(courseIds.filter(Boolean)))
      : courseId
        ? [courseId]
        : [];

    if ((!professionalId && !isTest) || !repId || courseIdList.length === 0 || !discount) {
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

    let pro: { id: string; name: string; email: string } | null = null;
    let ceSendProId: string = professionalId ?? "";

    if (isTest) {
      // Test send — the rep receives the exact email a professional would.
      // We upsert a network row for their own email (ce_sends requires one);
      // the dashboard hides it from the network list.
      const selfEmail = (user.email ?? "").trim().toLowerCase();
      if (!selfEmail) {
        return NextResponse.json({ error: "Your account has no email address." }, { status: 400 });
      }
      const { data: selfPro, error: selfProError } = await admin
        .from("professionals")
        .upsert(
          { rep_id: repId, name: repName, email: selfEmail },
          { onConflict: "rep_id,email" }
        )
        .select("id")
        .single();
      if (selfProError || !selfPro) {
        return NextResponse.json({ error: "Could not set up the test send." }, { status: 500 });
      }
      ceSendProId = selfPro.id;
      pro = { id: selfPro.id, name: repName, email: selfEmail };
    } else {
      // 1. Try existing professionals table
      const { data: proFromProfessionals } = await supabase
        .from("professionals")
        .select("id, name, email")
        .eq("id", professionalId)
        .eq("rep_id", repId)
        .single();
      pro = proFromProfessionals ?? null;
    }

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
    if (!pro && professionalId) {
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
    // Track WHY things failed so the user sees the real reason — previously a
    // DB insert failure was reported as "could not create coupons in the
    // store", which pointed debugging at WooCommerce when Woo had succeeded.
    let lastWooError = "";
    let lastDbError = "";

    for (const course of courses) {
      const couponCode = generateCouponCode(repName);
      const productIdForDb = course.product_id;

      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + (isTest ? 7 : 90));

      const wooResult = await createWooCoupon({
        code: couponCode,
        amount: discountToAmount(discount),
        discountType: "percent",
        productIds: [productIdForDb],
        dateExpires: expiryDate.toISOString().split("T")[0],
        usageLimit: 1,
        description: `Pulse CE${isTest ? " TEST" : ""}: ${course.name} (${discount})`,
      });

      if (wooResult.error) {
        console.warn(`Coupon creation failed for ${course.name}:`, wooResult.error);
        failedCourses.push(course.name);
        lastWooError = wooResult.error;
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
          ...(isTest ? { is_test: true, source: "test" } : {}),
        })
        .select("id")
        .single();

      if (sendError || !insertedSend) {
        console.warn(`ce_send insert failed for ${course.name}:`, sendError?.message);
        failedCourses.push(course.name);
        lastDbError = sendError?.message ?? "insert returned no row";
        continue;
      }
      insertedSendIds.push(insertedSend.id);

      if (!isTest) {
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
      }

      sentCourses.push({
        courseName: course.name,
        courseHours: course.hours,
        couponCode,
        accessUrl: courseAccessUrl(couponCode),
      });
    }

    if (sentCourses.length === 0) {
      // Name the actual failing layer — a DB failure after a successful coupon
      // creation must not masquerade as a store problem.
      const error = lastDbError
        ? `The coupon was created but the send could not be saved: ${lastDbError}`
        : lastWooError
        ? `Could not create the course coupon in the store: ${lastWooError}`
        : "Could not create any course coupons in the store. Please try again.";
      return NextResponse.json({ error }, { status: 502 });
    }

    // Mark one pending CE request fulfilled (if any) — never for test sends.
    // Requests from signed-up professionals store their AUTH id, while sends
    // store the network-contact id — match across both (plus any profile with
    // the recipient's email) so fulfillment actually lands.
    if (!isTest) {
    const candidateIds = new Set<string>([...(professionalId ? [professionalId] : []), ceSendProId]);
    if (pro.email) {
      const [{ data: matchingProfiles }, { data: matchingUsers }] = await Promise.all([
        admin.from("profiles").select("id").ilike("email", pro.email),
        admin.from("users").select("id").ilike("email", pro.email),
      ]);
      for (const mp of matchingProfiles ?? []) candidateIds.add(mp.id);
      for (const mu of matchingUsers ?? []) candidateIds.add(mu.id);
    }
    const { data: pendingRequest } = await admin
      .from("ce_requests")
      .select("id, hours, created_at")
      .in("professional_id", [...candidateIds])
      .eq("status", "pending")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (pendingRequest) {
      // Only close the request once the hours sent (since it was made) cover
      // the hours asked — a 1-hr course must not silently close a 6-hr request.
      const requestedHours = Number(pendingRequest.hours) || 0;
      const { data: sendsSince } = await admin
        .from("ce_sends")
        .select("course_hours")
        .eq("professional_id", ceSendProId)
        .gte("created_at", pendingRequest.created_at);
      const sentHours = (sendsSince ?? []).reduce(
        (sum, row) => sum + (Number(row.course_hours) || 0),
        0
      );
      if (sentHours >= Math.max(requestedHours, 1)) {
        const { error: fulfillError } = await admin
          .from("ce_requests")
          .update({ status: "fulfilled" })
          .eq("id", pendingRequest.id);
        if (fulfillError) {
          console.warn("Could not mark ce_request as fulfilled:", fulfillError.message);
        }
      }
    }
    }

    const resendKey = process.env.RESEND_API_KEY;
    const fromAddress =
      process.env.RESEND_FROM_EMAIL ?? "hello@pulsereferrals.com";
    const fromEmail = `${repName} via Pulse <${fromAddress}>`;

    let emailErrorMsg: string | null = null;
    let resendEmailId: string | null = null;
    const subjectPrefix = isTest ? "[Test] " : "";

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
        const { data: emailData, error: emailError } = await resend.emails.send({
          from: fromEmail,
          to: pro.email,
          subject: subjectPrefix + buildCeEmailSubject(emailParams),
          html: buildCeEmailHtml(emailParams),
          text: buildCeEmailText(emailParams),
        });
        if (emailError) {
          console.error("Resend error (single send):", emailError);
          emailErrorMsg = emailError.message ?? "Email send failed";
        } else {
          resendEmailId = emailData?.id ?? null;
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
        const { data: emailData, error: emailError } = await resend.emails.send({
          from: fromEmail,
          to: pro.email,
          subject: subjectPrefix + buildCeMultiEmailSubject(multiParams),
          html: buildCeMultiEmailHtml(multiParams),
          text: buildCeMultiEmailText(multiParams),
        });
        if (emailError) {
          console.error("Resend error (multi send):", emailError);
          emailErrorMsg = emailError.message ?? "Email send failed";
        } else {
          resendEmailId = emailData?.id ?? null;
        }
      }
    } else {
      emailErrorMsg = "RESEND_API_KEY not configured";
    }

    // Record delivery outcome so failures are visible, not silent.
    // resend_email_id lets the Resend webhook map open/click events back here.
    if (insertedSendIds.length > 0) {
      await admin
        .from("ce_sends")
        .update(
          emailErrorMsg
            ? { email_error: emailErrorMsg }
            : {
                email_sent_at: new Date().toISOString(),
                ...(resendEmailId ? { resend_email_id: resendEmailId } : {}),
              }
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
