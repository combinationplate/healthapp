import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { Resend } from "resend";
import { SEQUENCES } from "@/lib/drip/sequences";
import { getEmailHtml } from "@/lib/drip/templates";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  // Vercel Cron sends "Authorization: Bearer $CRON_SECRET" automatically when
  // the CRON_SECRET env var is set. Until it's set, we refuse — this endpoint
  // must never be publicly triggerable.
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const resend = new Resend(process.env.RESEND_API_KEY);
  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const now = new Date().toISOString();

  const { data: pending, error } = await admin
    .from("drip_enrollments")
    .select("*")
    .eq("completed", false)
    .lte("next_send_at", now)
    .limit(100);

  if (error) {
    console.error("Failed to fetch pending drips:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  let sent = 0;
  let skipped = 0;
  let completed = 0;

  for (const enrollment of pending ?? []) {
    const sequence = SEQUENCES[enrollment.sequence];
    if (!sequence) {
      await admin.from("drip_enrollments").update({ completed: true }).eq("id", enrollment.id);
      skipped++;
      continue;
    }

    const step = sequence.steps[enrollment.current_step];
    if (!step) {
      await admin.from("drip_enrollments").update({ completed: true }).eq("id", enrollment.id);
      completed++;
      continue;
    }

    const { data: profile } = await admin
      .from("profiles")
      .select("full_name, email")
      .eq("id", enrollment.user_id)
      .single();

    const { data: authUser } = await admin.auth.admin.getUserById(enrollment.user_id);
    const userEmail = profile?.email || authUser?.user?.email;
    const userName = profile?.full_name || (authUser?.user?.user_metadata?.full_name as string | undefined);

    if (!userEmail) {
      skipped++;
      continue;
    }

    // Conditional steps (e.g. only nudge reps who haven't sent a CE yet)
    if (step.condition === "no_ce_sent") {
      const { count } = await admin
        .from("ce_sends")
        .select("id", { count: "exact", head: true })
        .eq("rep_id", enrollment.user_id);

      if ((count ?? 0) > 0) {
        const nextStep = enrollment.current_step + 1;
        if (nextStep >= sequence.steps.length) {
          await admin.from("drip_enrollments").update({ completed: true }).eq("id", enrollment.id);
          completed++;
        } else {
          const nextDelay = sequence.steps[nextStep].delaySeconds;
          const nextSendAt = new Date(Date.now() + nextDelay * 1000).toISOString();
          await admin
            .from("drip_enrollments")
            .update({ current_step: nextStep, next_send_at: nextSendAt })
            .eq("id", enrollment.id);
        }
        skipped++;
        continue;
      }
    }

    try {
      const html = getEmailHtml(step.template, { name: userName ?? undefined, email: userEmail });
      await resend.emails.send({
        from: "Pulse <hello@pulsereferrals.com>",
        to: userEmail,
        subject: step.subject,
        html,
      });
      sent++;

      const nextStep = enrollment.current_step + 1;
      if (nextStep >= sequence.steps.length) {
        await admin
          .from("drip_enrollments")
          .update({ completed: true, current_step: nextStep })
          .eq("id", enrollment.id);
        completed++;
      } else {
        const nextDelay = sequence.steps[nextStep].delaySeconds;
        const nextSendAt = new Date(Date.now() + nextDelay * 1000).toISOString();
        await admin
          .from("drip_enrollments")
          .update({ current_step: nextStep, next_send_at: nextSendAt })
          .eq("id", enrollment.id);
      }
    } catch (e) {
      console.error(`Failed to send drip to ${userEmail}:`, e);
      skipped++;
    }
  }

  return NextResponse.json({ processed: (pending ?? []).length, sent, skipped, completed });
}
