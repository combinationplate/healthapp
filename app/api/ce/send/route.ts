import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { Resend } from "resend";
import { createWooCoupon } from "@/lib/woocommerce/createCoupon";

const CART_BASE = "https://hiscornerstone.com/";
function courseAccessUrl(productId: number, couponCode: string): string {
  const params = new URLSearchParams({ "add-to-cart": String(productId), coupon_code: couponCode });
  return `${CART_BASE}?${params.toString()}`;
}
function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
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
    const { professionalId, repId, courseId, discount, personalMessage } = body as {
      professionalId: string;
      repId: string;
      courseId: string;
      discount: string;
      personalMessage?: string;
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

    const { data: rep } = await supabase.from("users").select("name").eq("id", repId).single();
    const repName = (rep?.name ?? user.user_metadata?.full_name ?? "Rep").trim() || "Rep";

    const { data: pro, error: proError } = await supabase
      .from("professionals")
      .select("id, name, email")
      .eq("id", professionalId)
      .eq("rep_id", repId)
      .single();

    if (proError || !pro) {
      return NextResponse.json({ error: "Professional not found or not in your network" }, { status: 404 });
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

    const { error: sendError } = await supabase.from("ce_sends").insert({
      rep_id: repId,
      professional_id: professionalId,
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

    const { error: touchError } = await supabase.from("touchpoints").insert({
      rep_id: repId,
      professional_id: professionalId,
      type: "ce_send",
      notes: `${course.name} (${couponCode})`,
      points: 5,
    });

    if (touchError) {
      // Log but don't fail the request; ce_send was recorded
      console.warn("Touchpoint insert failed:", touchError);
    }

    const resendKey = process.env.RESEND_API_KEY;
    const fromEmail = process.env.RESEND_FROM_EMAIL ?? "Pulse <noreply@pulsereferrals.com>";
    const accessUrl = courseAccessUrl(productIdForDb, couponCode);

    if (resendKey) {
      const resend = new Resend(resendKey);
      const messageBlock = personalMessage?.trim()
        ? `\n\nPersonal message from your rep:\n${personalMessage.trim()}\n\n`
        : "\n\n";
      const html = `
        <p>Hi ${escapeHtml(pro.name)},</p>
        <p>Your representative has sent you access to the following continuing education course:</p>
        <p><strong>${escapeHtml(course.name)}</strong> (${course.hours} hrs) · ${escapeHtml(discount)}</p>
        ${personalMessage?.trim() ? `<p><em>Personal message from your rep:</em><br/>${escapeHtml(personalMessage.trim())}</p>` : ""}
        <p style="margin: 24px 0;">
          <a href="${escapeHtml(accessUrl)}" style="display: inline-block; background: #2455FF; color: #fff; text-decoration: none; padding: 14px 24px; border-radius: 8px; font-weight: bold;">Access Your Free Course</a>
        </p>
        <p style="color: #666; font-size: 12px;">This link adds the course to your cart with your discount applied. If the button doesn’t work, copy and paste this into your browser:<br/><a href="${escapeHtml(accessUrl)}">${escapeHtml(accessUrl)}</a></p>
        <p>— Pulse</p>
      `;
      const text = `Hi ${pro.name},\n\nYour representative has sent you access to the following continuing education course:\n\n${course.name} (${course.hours} hrs) · ${discount}${messageBlock}Access your course (discount auto-applied): ${accessUrl}\n\n— Pulse`;
      const { error: emailError } = await resend.emails.send({
        from: fromEmail,
        to: pro.email,
        subject: `Your CE course: ${course.name}`,
        html,
        text,
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
