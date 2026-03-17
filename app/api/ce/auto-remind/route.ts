import { createClient as createServiceClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { Resend } from "resend";
import {
  buildCeEmailSubject,
  buildCeEmailHtml,
  buildCeEmailText,
} from "@/lib/email/ce-email";

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
  const resendKey = process.env.RESEND_API_KEY;
  const resend = resendKey ? new Resend(resendKey) : null;

  const now = new Date();

  const { data: dueReminders, error } = await admin
    .from("ce_sends")
    .select(
      `
      id, rep_id, professional_id, course_name, course_hours, 
      coupon_code, discount, created_at, reminder_count,
      redirect_url, recipient_email
    `,
    )
    .is("clicked_at", null)
    .lt("reminder_count", 3)
    .order("created_at", { ascending: true })
    .limit(100);

  if (error) {
    console.error("Failed to fetch due reminders:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  let sent = 0;
  let skipped = 0;

  for (const ce of dueReminders ?? []) {
    const sentAt = new Date(ce.created_at);
    const daysSinceSend =
      (now.getTime() - sentAt.getTime()) / (1000 * 60 * 60 * 24);

    if (ce.reminder_count === 0 && daysSinceSend < 3) {
      skipped++;
      continue;
    }
    if (ce.reminder_count === 1 && daysSinceSend < 7) {
      skipped++;
      continue;
    }
    if (ce.reminder_count === 2 && daysSinceSend < 14) {
      skipped++;
      continue;
    }

    let proEmail = ce.recipient_email as string | null;
    let proName = "";

    if (ce.professional_id) {
      const { data: pro } = await admin
        .from("professionals")
        .select("name, email")
        .eq("id", ce.professional_id)
        .maybeSingle();
      if (pro) {
        proEmail = proEmail || (pro.email as string | null);
        proName = pro.name as string;
      }
    }

    if (!proEmail) {
      skipped++;
      continue;
    }

    const { data: repProfile } = await admin
      .from("profiles")
      .select("full_name, org_id")
      .eq("id", ce.rep_id)
      .maybeSingle();

    const { data: repAuth } = await admin.auth.admin.getUserById(ce.rep_id);
    const repEmail = repAuth?.user?.email ?? "";
    const repName =
      repProfile?.full_name ??
      repAuth?.user?.user_metadata?.full_name ??
      repEmail.split("@")[0] ??
      "Rep";

    let repOrgName = "";
    if (repProfile?.org_id) {
      const { data: org } = await admin
        .from("orgs")
        .select("name")
        .eq("id", repProfile.org_id)
        .maybeSingle();
      repOrgName = org?.name ?? "";
    }

    const appUrl =
      (process.env.NEXT_PUBLIC_APP_URL ??
        "https://pulsereferrals.com").replace(/\/$/, "");
    const accessUrl =
      ce.redirect_url || `${appUrl}/r/${ce.coupon_code as string}`;
    const isLastReminder = ce.reminder_count === 2;

    const emailParams = {
      recipientName: proName || proEmail,
      courseName: ce.course_name as string,
      courseHours: ce.course_hours as number,
      couponCode: ce.coupon_code as string,
      accessUrl,
      discount: ce.discount ?? "100% Free",
      repName,
      repEmail,
      repOrgName,
    };

    const subjectPrefix = isLastReminder
      ? "Last reminder"
      : "Your CE course is still waiting";
    const subject =
      subjectPrefix === "Last reminder"
        ? `${subjectPrefix}: ${buildCeEmailSubject(emailParams)}`
        : buildCeEmailSubject(emailParams);

    if (!resend) {
      skipped++;
      continue;
    }

    try {
      const fromAddress =
        process.env.RESEND_FROM_EMAIL ?? "noreply@pulsereferrals.com";

      await resend.emails.send({
        from: `${repName} via Pulse <${fromAddress}>`,
        to: proEmail,
        subject,
        html: buildCeEmailHtml(emailParams),
        text: buildCeEmailText(emailParams),
      });

      await admin
        .from("ce_sends")
        .update({
          reminder_count: (ce.reminder_count as number) + 1,
          last_reminder_at: now.toISOString(),
        })
        .eq("id", ce.id);

      sent++;
    } catch (e) {
      console.error(`Failed to send reminder for ce_send ${ce.id}:`, e);
      skipped++;
    }
  }

  return NextResponse.json({
    processed: (dueReminders ?? []).length,
    sent,
    skipped,
  });
}

