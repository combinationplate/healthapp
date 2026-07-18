import { createClient as createServiceClient, type SupabaseClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { Resend } from "resend";
import { verifyPulseSignature } from "@/lib/hiscornerstone/enroll";

/**
 * POST /api/hisc/ce-request
 *
 * Lead intake from the hiscornerstone.com /free-ce request form (relayed and
 * HMAC-signed by the pulse-connect plugin). Creates a real Pulse professional
 * (find-or-create auth user + profile) and a pending ce_request, so the lead
 * shows up on the public demand map and in rep dashboards exactly like an
 * organic request. Sends the professional an acknowledgment email and alerts
 * admin.
 */

type LeadBody = {
  name?: string;
  email?: string;
  discipline?: string;
  city?: string;
  state?: string;
  facility?: string;
  topic?: string;
  hours?: number;
  source?: string;
};

async function findOrCreateProfessional(
  admin: SupabaseClient,
  lead: Required<Pick<LeadBody, "name" | "email">> & LeadBody
): Promise<{ userId: string | null; created: boolean }> {
  // 1. Existing profile by email (covers everyone who's touched Pulse before).
  const { data: existing } = await admin
    .from("profiles")
    .select("id")
    .ilike("email", lead.email)
    .maybeSingle();
  if (existing?.id) return { userId: existing.id, created: false };

  // 2. Create the auth user (no password — they can set one via reset later).
  const { data: createdUser, error: createErr } = await admin.auth.admin.createUser({
    email: lead.email,
    email_confirm: true,
    user_metadata: {
      full_name: lead.name,
      role: "professional",
      discipline: lead.discipline ?? null,
      city: lead.city ?? null,
      state: lead.state ?? null,
      facility: lead.facility ?? null,
      signup_source: "hiscornerstone_free_ce",
    },
  });
  if (createdUser?.user?.id) return { userId: createdUser.user.id, created: true };

  // 3. Auth user exists but no profile row — scan for them (rare; small scale).
  if (createErr) {
    for (let page = 1; page <= 3; page++) {
      const { data: list } = await admin.auth.admin.listUsers({ page, perPage: 500 });
      const hit = list?.users?.find(
        (u) => (u.email ?? "").toLowerCase() === lead.email.toLowerCase()
      );
      if (hit) return { userId: hit.id, created: false };
      if (!list || list.users.length < 500) break;
    }
    console.error("[hisc/ce-request] could not create or find user:", createErr.message);
  }
  return { userId: null, created: false };
}

export async function POST(request: Request) {
  try {
    const secret = (process.env.PULSE_WP_SHARED_SECRET ?? "").trim();
    if (!secret) {
      return NextResponse.json({ error: "Not configured" }, { status: 500 });
    }

    const raw = await request.text();
    const ts = request.headers.get("x-pulse-timestamp") ?? "";
    const sig = request.headers.get("x-pulse-signature") ?? "";
    if (!verifyPulseSignature(raw, ts, sig, secret)) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    const body = JSON.parse(raw) as LeadBody;
    const name = (body.name ?? "").trim();
    const email = (body.email ?? "").trim().toLowerCase();
    const discipline = (body.discipline ?? "").trim();
    const city = (body.city ?? "").trim();
    const state = (body.state ?? "").trim().toUpperCase();
    const facility = (body.facility ?? "").trim() || null;
    const topic = (body.topic ?? "").trim() || "Continuing education";
    const hours = Math.max(1, Math.min(30, Number(body.hours) || 1));

    if (!name || !email.includes("@") || !discipline || !city || state.length !== 2) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const admin = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { userId } = await findOrCreateProfessional(admin, { name, email, discipline, city, state, facility: facility ?? undefined });
    if (!userId) {
      return NextResponse.json({ error: "Could not create account" }, { status: 500 });
    }

    // Upsert the profile so the demand map has discipline + metro to work with.
    await admin.rpc("upsert_profile_safe", {
      p_id: userId,
      p_role: "professional",
      p_full_name: name,
      p_state: state,
      p_city: city,
    });
    await admin
      .from("profiles")
      .update({ email, discipline, facility, seeking_ce: true })
      .eq("id", userId);

    // Dedupe: identical pending request from this professional → acknowledge, don't duplicate.
    const { data: dupe } = await admin
      .from("ce_requests")
      .select("id")
      .eq("professional_id", userId)
      .eq("status", "pending")
      .ilike("topic", topic)
      .maybeSingle();

    if (!dupe) {
      const { error: reqErr } = await admin.from("ce_requests").insert({
        professional_id: userId,
        topic,
        hours,
        deadline: null,
        status: "pending",
        rep_id: null,
      });
      if (reqErr) {
        console.error("[hisc/ce-request] ce_request insert failed:", reqErr.message);
        return NextResponse.json({ error: "Could not save request" }, { status: 500 });
      }
    }

    // Emails: acknowledgment to the professional + admin alert. Best-effort.
    const resendKey = process.env.RESEND_API_KEY;
    if (resendKey) {
      const resend = new Resend(resendKey);
      const fromAddress = process.env.RESEND_FROM_EMAIL ?? "noreply@pulsereferrals.com";
      const firstName = name.split(/\s+/)[0];

      try {
        await resend.emails.send({
          from: `Pulse <${fromAddress}>`,
          to: email,
          subject: "Your CE request is in — here's what happens next",
          html: `
<div style="font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;max-width:560px;margin:0 auto;padding:24px 16px;color:#0b1222;">
  <p style="font-size:15px;line-height:1.6;">Hi ${firstName},</p>
  <p style="font-size:15px;line-height:1.6;color:#3b4963;">
    We received your request for a sponsored CE course${topic !== "Continuing education" ? ` on <strong style="color:#0b1222;">${topic}</strong>` : ""} (${hours} hour${hours === 1 ? "" : "s"}).
  </p>
  <p style="font-size:15px;line-height:1.6;color:#3b4963;">
    <strong style="color:#0b1222;">What happens next:</strong> H.I.S. Cornerstone partners with Pulse to match
    requests like yours with local healthcare partners who sponsor accredited CE at no cost to you.
    When a sponsor in your area picks up your request — usually within a few days — your course
    arrives by email, one click to start. No account setup, no checkout, no cost.
  </p>
  <p style="font-size:13px;line-height:1.6;color:#7a8ba8;">
    Want to track your request or browse what's available? A free Pulse account was created for
    you with this email — visit <a href="https://pulsereferrals.com/login" style="color:#2455ff;">pulsereferrals.com</a>
    and use "Forgot password" to set yours.
  </p>
  <p style="font-size:12px;color:#a8aeb9;margin-top:24px;">Pulse · pulsereferrals.com · in partnership with H.I.S. Cornerstone</p>
</div>`,
          text: [
            `Hi ${firstName},`,
            ``,
            `We received your request for a sponsored CE course${topic !== "Continuing education" ? ` on ${topic}` : ""} (${hours} hour${hours === 1 ? "" : "s"}).`,
            ``,
            `What happens next: H.I.S. Cornerstone partners with Pulse to match requests like yours with local healthcare partners who sponsor accredited CE at no cost to you. When a sponsor in your area picks up your request — usually within a few days — your course arrives by email, one click to start.`,
            ``,
            `Track your request: a free Pulse account was created for you with this email. Visit https://pulsereferrals.com/login and use "Forgot password" to set yours.`,
            ``,
            `Pulse · pulsereferrals.com · in partnership with H.I.S. Cornerstone`,
          ].join("\n"),
        });
      } catch (e) {
        console.warn("[hisc/ce-request] ack email failed:", e);
      }

      try {
        await resend.emails.send({
          from: `Pulse Alerts <${fromAddress}>`,
          to: process.env.SIGNUP_ALERT_EMAIL || "hello@pulsereferrals.com",
          subject: `HISC lead: ${discipline} in ${city}, ${state} requesting ${topic} (${hours} hrs)`,
          html: `
<div style="font-family:'DM Sans',system-ui,sans-serif;max-width:480px;padding:24px;">
  <h2 style="margin:0 0 12px;font-size:18px;color:#0b1222;">New CE request from hiscornerstone.com</h2>
  <table style="font-size:14px;color:#3b4963;border-collapse:collapse;">
    <tr><td style="padding:4px 16px 4px 0;font-weight:600;color:#7a8ba8;">Name</td><td>${name}</td></tr>
    <tr><td style="padding:4px 16px 4px 0;font-weight:600;color:#7a8ba8;">Email</td><td>${email}</td></tr>
    <tr><td style="padding:4px 16px 4px 0;font-weight:600;color:#7a8ba8;">Discipline</td><td>${discipline}</td></tr>
    <tr><td style="padding:4px 16px 4px 0;font-weight:600;color:#7a8ba8;">Location</td><td>${city}, ${state}</td></tr>
    <tr><td style="padding:4px 16px 4px 0;font-weight:600;color:#7a8ba8;">Facility</td><td>${facility ?? "—"}</td></tr>
    <tr><td style="padding:4px 16px 4px 0;font-weight:600;color:#7a8ba8;">Request</td><td>${topic} (${hours} hrs)</td></tr>
  </table>
  <p style="font-size:13px;color:#7a8ba8;margin-top:12px;">Now live on the demand map + claimable by reps. No rep nearby? Fulfill it as house rep.</p>
</div>`,
        });
      } catch (e) {
        console.warn("[hisc/ce-request] admin alert failed:", e);
      }
    }

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("[hisc/ce-request] error:", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
