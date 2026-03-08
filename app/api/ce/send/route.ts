import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { Resend } from "resend";
import { createWooCoupon } from "@/lib/woocommerce/createCoupon";

const CART_BASE = "https://hiscornerstone.com/";
function courseAccessUrl(couponCode: string): string {
  const appUrl = (process.env.NEXT_PUBLIC_APP_URL ?? "https://pulsereferrals.vercel.app").replace(/\/$/, "");
  return `${appUrl}/r/${couponCode}`;
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

    const { data: proFromProfessionals } = await supabase
      .from("professionals")
      .select("id, name, email")
      .eq("id", professionalId)
      .eq("rep_id", repId)
      .single();

    let pro: { id: string; name: string; email: string } | null = proFromProfessionals ?? null;
    let ceSendProId: string = professionalId;

    if (!pro) {
      const { data: profile } = await admin
        .from("profiles")
        .select("id, full_name, discipline, city, state, facility")
        .eq("id", professionalId)
        .single();

      if (profile) {
        const { data: authUser } = await admin.auth.admin.getUserById(professionalId);
        const email = authUser?.user?.email ?? null;
        if (email) {
          const name = profile.full_name ?? "Professional";
          const { data: newPro, error: insertProError } = await admin
            .from("professionals")
            .insert({
              id: professionalId,
              rep_id: repId,
              name,
              email,
              discipline: profile.discipline ?? null,
              city: profile.city ?? null,
              state: profile.state ?? null,
              facility: profile.facility ?? null,
            })
            .select("id")
            .single();

          if (insertProError) {
            console.warn("Could not insert professional from profile:", insertProError.message);
          } else if (newPro) {
            ceSendProId = newPro.id;
          }

          pro = { id: ceSendProId, name, email };
        }
      }
    }

    if (!pro) {
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

      const sponsorLine = repOrgName
        ? `Compliments of <strong style="color:#ffffff;font-size:20px;">${escapeHtml(repOrgName)}</strong><br/><span style="color:rgba(255,255,255,0.6);font-size:13px;">${escapeHtml(repName)}</span>`
        : `Compliments of <strong style="color:#ffffff;font-size:20px;">${escapeHtml(repName)}</strong>`;

      const personalBlock = personalMessage?.trim()
        ? `<tr><td style="padding:0 40px 24px;">
            <div style="background:#f6f5f0;border-radius:10px;padding:16px 20px;border-left:3px solid #0d9488;">
              <div style="font-size:11px;font-weight:700;color:#7a8ba8;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:4px;">Message from ${escapeHtml(repName)}</div>
              <div style="font-size:14px;color:#3b4963;line-height:1.6;">${escapeHtml(personalMessage.trim())}</div>
            </div>
          </td></tr>`
        : "";

      const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0"/></head>
<body style="margin:0;padding:0;background:#f6f5f0;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f6f5f0;padding:32px 16px;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.06);">

  <!-- Sponsor banner -->
  <tr><td style="background:linear-gradient(135deg,#0b1222,#1a2744);padding:28px 40px;">
    <div style="font-size:11px;font-weight:600;color:rgba(255,255,255,0.45);text-transform:uppercase;letter-spacing:0.1em;margin-bottom:6px;">
      ${discount === "100% Free" ? "Free CE Course" : `CE Course (${escapeHtml(discount)})`}
    </div>
    ${sponsorLine}
  </td></tr>

  <!-- Greeting -->
  <tr><td style="padding:32px 40px 16px;">
    <p style="margin:0;font-size:16px;color:#0b1222;line-height:1.5;">
      Hi ${escapeHtml(pro.name.split(/\s+/)[0])},
    </p>
    <p style="margin:8px 0 0;font-size:15px;color:#3b4963;line-height:1.6;">
      You've been sent a free, nationally accredited continuing education course. Here are the details:
    </p>
  </td></tr>

  <!-- Course card -->
  <tr><td style="padding:0 40px 24px;">
    <div style="background:#f6f5f0;border-radius:12px;padding:20px 24px;border:1px solid rgba(11,18,34,0.06);">
      <div style="font-size:18px;font-weight:700;color:#0b1222;line-height:1.3;margin-bottom:6px;">
        ${escapeHtml(course.name)}
      </div>
      <div style="font-size:14px;color:#3b4963;">
        ${course.hours} credit hour${course.hours !== 1 ? "s" : ""} · Nationally Accredited · ${escapeHtml(discount)}
      </div>
    </div>
  </td></tr>

  ${personalBlock}

  <!-- Coupon code -->
  <tr><td style="padding:0 40px 24px;">
    <div style="background:#ffffff;border:2px dashed rgba(11,18,34,0.12);border-radius:10px;padding:16px;text-align:center;">
      <div style="font-size:12px;color:#7a8ba8;margin-bottom:6px;">Your coupon code</div>
      <div style="font-size:24px;font-weight:800;color:#0b1222;letter-spacing:0.02em;">${escapeHtml(couponCode)}</div>
    </div>
  </td></tr>

  <!-- CTA button -->
  <tr><td style="padding:0 40px 28px;" align="center">
    <a href="${escapeHtml(accessUrl)}" style="display:inline-block;background:#2455ff;color:#ffffff;text-decoration:none;padding:16px 48px;border-radius:10px;font-size:16px;font-weight:700;box-shadow:0 4px 16px rgba(36,85,255,0.25);">
      Access Your Course &rarr;
    </a>
  </td></tr>

  <!-- How it works steps -->
  <tr><td style="padding:0 40px 28px;">
    <div style="font-size:11px;font-weight:700;color:#7a8ba8;text-transform:uppercase;letter-spacing:0.06em;margin-bottom:12px;">
      How to access your course
    </div>
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td width="28" valign="top" style="padding-bottom:10px;">
          <div style="width:24px;height:24px;border-radius:6px;background:#0b1222;color:#ffffff;font-size:12px;font-weight:800;text-align:center;line-height:24px;">1</div>
        </td>
        <td style="padding:2px 0 10px 10px;font-size:14px;color:#3b4963;">Click "Access Your Course" above</td>
      </tr>
      <tr>
        <td width="28" valign="top" style="padding-bottom:10px;">
          <div style="width:24px;height:24px;border-radius:6px;background:#0b1222;color:#ffffff;font-size:12px;font-weight:800;text-align:center;line-height:24px;">2</div>
        </td>
        <td style="padding:2px 0 10px 10px;font-size:14px;color:#3b4963;">You'll be taken to hiscornerstone.com with your discount applied</td>
      </tr>
      <tr>
        <td width="28" valign="top">
          <div style="width:24px;height:24px;border-radius:6px;background:#0d9488;color:#ffffff;font-size:12px;font-weight:800;text-align:center;line-height:24px;">3</div>
        </td>
        <td style="padding:2px 0 0 10px;font-size:14px;color:#3b4963;">Complete your course online — self-paced, any device</td>
      </tr>
    </table>
  </td></tr>

  <!-- Divider -->
  <tr><td style="padding:0 40px;"><div style="border-top:1px solid rgba(11,18,34,0.06);"></div></td></tr>

  <!-- Rep contact -->
  <tr><td style="padding:20px 40px;">
    <div style="font-size:13px;color:#7a8ba8;">
      Questions? Contact <strong style="color:#0b1222;">${escapeHtml(repName)}</strong>${repEmail ? ` at <a href="mailto:${escapeHtml(repEmail)}" style="color:#2455ff;text-decoration:none;">${escapeHtml(repEmail)}</a>` : ""}${repOrgName ? ` · ${escapeHtml(repOrgName)}` : ""}
    </div>
  </td></tr>

  <!-- Fallback link -->
  <tr><td style="padding:0 40px 12px;">
    <div style="font-size:11px;color:#7a8ba8;line-height:1.5;">
      If the button above doesn't work, copy and paste this link into your browser:<br/>
      <a href="${escapeHtml(accessUrl)}" style="color:#2455ff;word-break:break-all;">${escapeHtml(accessUrl)}</a>
    </div>
  </td></tr>

  <!-- Footer -->
  <tr><td style="padding:20px 40px 28px;">
    <div style="font-size:11px;color:#7a8ba8;text-align:center;">
      Powered by <strong>Pulse</strong> · <a href="https://hiscornerstone.com" style="color:#7a8ba8;">hiscornerstone.com</a>
    </div>
  </td></tr>

</table>
</td></tr>
</table>
</body></html>`;

      const text = [
        `Hi ${pro.name.split(/\s+/)[0]},`,
        ``,
        `You've been sent a free, nationally accredited CE course${repOrgName ? ` from ${repOrgName}` : ""}.`,
        ``,
        `Course: ${course.name}`,
        `Hours: ${course.hours} credit hour${course.hours !== 1 ? "s" : ""}`,
        `Discount: ${discount}`,
        `Coupon Code: ${couponCode}`,
        personalMessage?.trim() ? `\nMessage from ${repName}: ${personalMessage.trim()}\n` : ``,
        ``,
        `Access your course here (discount auto-applied):`,
        accessUrl,
        ``,
        `How to access:`,
        `1. Click the link above`,
        `2. You'll be taken to hiscornerstone.com with your discount applied`,
        `3. Complete your course online — self-paced, any device`,
        ``,
        `Questions? Contact ${repName}${repEmail ? ` at ${repEmail}` : ""}${repOrgName ? ` · ${repOrgName}` : ""}`,
        ``,
        `— Powered by Pulse · hiscornerstone.com`,
      ].join("\n");

      const { error: emailError } = await resend.emails.send({
        from: fromEmail,
        to: pro.email,
        subject: `Free CE Course${repOrgName ? ` from ${repOrgName}` : ""}: ${course.name}`,
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
