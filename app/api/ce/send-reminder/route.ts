import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { Resend } from "resend";

const CART_BASE = "https://hiscornerstone.com/cart/";
function courseAccessUrl(productId: number, couponCode: string): string {
  const params = new URLSearchParams({ "add-to-cart": String(productId), coupon_code: couponCode });
  return `${CART_BASE}?${params.toString()}`;
}
function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { ceSendId } = body as { ceSendId: string };
    if (!ceSendId) {
      return NextResponse.json({ error: "Missing ceSendId" }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: send, error: sendError } = await supabase
      .from("ce_sends")
      .select("id, course_name, course_hours, discount, coupon_code, product_id, personal_message, professional_id")
      .eq("id", ceSendId)
      .eq("rep_id", user.id)
      .single();

    if (sendError || !send) {
      return NextResponse.json({ error: "CE send not found" }, { status: 404 });
    }

    const sendRow = send as { professional_id: string; course_name: string; course_hours: number; discount: string; coupon_code: string; product_id: number | null; personal_message: string | null };
    const { data: pro, error: proError } = await supabase
      .from("professionals")
      .select("id, name, email")
      .eq("id", sendRow.professional_id)
      .single();

    if (proError || !pro) {
      return NextResponse.json({ error: "Professional not found" }, { status: 404 });
    }

    const proRow = pro as { name: string; email: string };
    const productId = sendRow.product_id;
    const accessUrl = productId ? courseAccessUrl(productId, sendRow.coupon_code) : "https://hiscornerstone.com/cart/";

    const resendKey = process.env.RESEND_API_KEY;
    const fromEmail = process.env.RESEND_FROM_EMAIL ?? "Pulse <noreply@pulsereferrals.com>";

    if (resendKey) {
      const resend = new Resend(resendKey);
      const personalMessage = sendRow.personal_message?.trim();
      const html = `
        <p>Hi ${escapeHtml(proRow.name)},</p>
        <p>This is a reminder that your representative sent you access to this continuing education course:</p>
        <p><strong>${escapeHtml(sendRow.course_name)}</strong> (${sendRow.course_hours} hrs) · ${escapeHtml(sendRow.discount)}</p>
        ${personalMessage ? `<p><em>Personal message from your rep:</em><br/>${escapeHtml(personalMessage)}</p>` : ""}
        <p style="margin: 24px 0;">
          <a href="${escapeHtml(accessUrl)}" style="display: inline-block; background: #2455FF; color: #fff; text-decoration: none; padding: 14px 24px; border-radius: 8px; font-weight: bold;">Access Your Free Course</a>
        </p>
        <p style="color: #666; font-size: 12px;">If the button doesn’t work, copy and paste this into your browser:<br/><a href="${escapeHtml(accessUrl)}">${escapeHtml(accessUrl)}</a></p>
        <p>— Pulse</p>
      `;
      const text = `Hi ${proRow.name},\n\nReminder: your representative sent you access to this CE course:\n\n${sendRow.course_name} (${sendRow.course_hours} hrs) · ${sendRow.discount}\n\nAccess your course: ${accessUrl}\n\n— Pulse`;
      const { error: emailError } = await resend.emails.send({
        from: fromEmail,
        to: proRow.email,
        subject: `Reminder: Your CE course – ${sendRow.course_name}`,
        html,
        text,
      });
      if (emailError) {
        return NextResponse.json({ error: emailError.message }, { status: 500 });
      }
    }

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
