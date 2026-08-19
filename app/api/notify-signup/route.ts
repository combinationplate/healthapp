import { createClient as createServiceClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { Resend } from "resend";
import { sendWelcomeNow } from "@/lib/drip/welcome";

// Where new-signup alerts are sent. Override in Vercel → Project → Settings →
// Environment Variables with SIGNUP_ALERT_EMAIL (comma-separate for multiple).
const ALERT_TO = (process.env.SIGNUP_ALERT_EMAIL || "hello@pulsereferrals.com")
  .split(",")
  .map((e) => e.trim())
  .filter(Boolean);

export async function POST(request: Request) {
  let body: {
    userId?: string;
    email?: string;
    fullName?: string;
    role?: string;
    city?: string;
    state?: string;
    discipline?: string;
    facility?: string;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const { userId, email, fullName, role, city, state, discipline, facility } = body;
  if (!email || !role) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  const admin = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // ⚠️ Keep this mapping in sync with app/(app)/app/page.tsx and
  // app/api/drip/enroll/route.ts — a stale copy here double-enrolled a manager
  // into rep_welcome on 2026-08-19 (each site dedupes on its OWN sequence name,
  // so mismatched mappings create two enrollments).
  const sequence =
    role === "rep" ? "rep_welcome" : role === "manager" ? "manager_welcome" : "pro_welcome";

  // Dedupe: drip enrollment is our "already handled this signup" marker. If the
  // user is already enrolled, we've already alerted — skip so you never get a
  // duplicate email (e.g. the dashboard-load path in app/(app)/app/page.tsx).
  if (userId) {
    const { data: existing } = await admin
      .from("drip_enrollments")
      .select("id")
      .eq("user_id", userId)
      .eq("sequence", sequence)
      .maybeSingle();
    if (existing) {
      return NextResponse.json({ success: true, already_notified: true });
    }
  }

  const roleLabel =
    role === "rep" ? "Sales Rep" : role === "manager" ? "Manager" : "Healthcare Professional";

  const location = [city, state].filter(Boolean).join(", ");
  const infoRows: [string, string][] = [
    ["Name", fullName || "—"],
    ["Email", email],
    ["Role", roleLabel],
  ];
  if (discipline) infoRows.push(["Discipline", discipline]);
  if (facility) infoRows.push(["Facility", facility]);
  if (location) infoRows.push(["Location", location]);
  infoRows.push([
    "Time",
    new Date().toLocaleString("en-US", { timeZone: "America/Chicago" }),
  ]);

  // ── 1. Alert you ──────────────────────────────────────────────
  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    await resend.emails.send({
      from: "Pulse Alerts <hello@pulsereferrals.com>",
      to: ALERT_TO,
      subject: `New signup: ${fullName || email} (${roleLabel})`,
      html: `
        <div style="font-family:'DM Sans',system-ui,sans-serif;max-width:480px;padding:24px;">
          <h2 style="margin:0 0 12px;font-size:18px;color:#0b1222;">New Pulse Signup</h2>
          <table style="font-size:14px;color:#3b4963;border-collapse:collapse;">
            ${infoRows
              .map(
                ([k, v]) =>
                  `<tr><td style="padding:4px 16px 4px 0;font-weight:600;color:#7a8ba8;">${k}</td><td>${v}</td></tr>`
              )
              .join("")}
          </table>
        </div>
      `,
    });
  } catch (e) {
    console.error("Failed to send signup notification:", e);
  }

  // ── 2. Send welcome NOW + enroll in drip (also the dedupe marker) ─────
  // This route usually wins the race against the dashboard-load path, so it
  // must send the immediate welcome too; on failure the enrollment stays at
  // step 0 and the daily cron delivers it as fallback.
  if (userId) {
    try {
      const enrollmentStart = await sendWelcomeNow({
        email,
        name: fullName,
        sequence,
      });
      await admin.from("drip_enrollments").insert({
        user_id: userId,
        sequence,
        current_step: enrollmentStart.current_step,
        next_send_at: enrollmentStart.next_send_at,
        completed: false,
      });
    } catch (e) {
      console.error("Failed to enroll in drip:", e);
    }
  }

  return NextResponse.json({ success: true });
}
