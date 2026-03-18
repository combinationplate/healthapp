import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { Resend } from "resend";

export async function POST(request: Request) {
  const body = await request.json();
  const { userId, email, fullName, role } = body;

  if (!userId || !email || !role) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  const resend = new Resend(process.env.RESEND_API_KEY);
  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // ── Check if already enrolled — skip everything if so ─────────
  const sequence =
    role === "rep" ? "rep_welcome" : role === "manager" ? "rep_welcome" : "pro_welcome";
  const { data: existing } = await admin
    .from("drip_enrollments")
    .select("id")
    .eq("user_id", userId)
    .eq("sequence", sequence)
    .maybeSingle();

  if (existing) {
    return NextResponse.json({ success: true, already_enrolled: true });
  }

  // ── 1. Notify you (only for genuinely new users) ──────────────
  try {
    const roleLabel =
      role === "rep" ? "Sales Rep" : role === "manager" ? "Manager" : "Healthcare Professional";
    await resend.emails.send({
      from: "Pulse Alerts <noreply@pulsereferrals.com>",
      to: "hello@pulsereferrals.com",
      subject: `New signup: ${fullName || email} (${roleLabel})`,
      html: `
        <div style="font-family:'DM Sans',system-ui,sans-serif;max-width:480px;padding:24px;">
          <h2 style="margin:0 0 12px;font-size:18px;color:#0b1222;">New Pulse Signup</h2>
          <table style="font-size:14px;color:#3b4963;border-collapse:collapse;">
            <tr><td style="padding:4px 16px 4px 0;font-weight:600;color:#7a8ba8;">Name</td><td>${fullName || "—"}</td></tr>
            <tr><td style="padding:4px 16px 4px 0;font-weight:600;color:#7a8ba8;">Email</td><td>${email}</td></tr>
            <tr><td style="padding:4px 16px 4px 0;font-weight:600;color:#7a8ba8;">Role</td><td>${roleLabel}</td></tr>
            <tr><td style="padding:4px 16px 4px 0;font-weight:600;color:#7a8ba8;">Time</td><td>${new Date().toLocaleString(
              "en-US",
              { timeZone: "America/Chicago" }
            )}</td></tr>
          </table>
        </div>
      `,
    });
  } catch (e) {
    console.error("Failed to send signup notification:", e);
  }

  // ── 2. Enroll in drip ─────────────────────────────────────────
  try {
    await admin.from("drip_enrollments").insert({
      user_id: userId,
      sequence,
      current_step: 0,
      next_send_at: new Date().toISOString(),
      completed: false,
    });
  } catch (e) {
    console.error("Failed to enroll in drip:", e);
  }

  return NextResponse.json({ success: true });
}

