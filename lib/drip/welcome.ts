import { Resend } from "resend";
import { SEQUENCES } from "./sequences";
import { getEmailHtml } from "./templates";

/**
 * Sends step 0 of a drip sequence IMMEDIATELY (at signup/enrollment time)
 * instead of waiting for the daily 14:00 UTC cron — the welcome lands while
 * the new user is still in the dashboard.
 *
 * Returns the enrollment fields the caller should insert:
 * - success → step advanced past 0, next_send_at scheduled for step 1
 * - failure (or a conditional step 0, which is cron-only) → step 0 due now,
 *   so the daily cron delivers the welcome as a fallback. Never throws.
 */
export async function sendWelcomeNow(params: {
  email: string;
  name?: string | null;
  sequence: string;
}): Promise<{ current_step: number; next_send_at: string }> {
  const fallback = { current_step: 0, next_send_at: new Date().toISOString() };

  const sequence = SEQUENCES[params.sequence];
  const step = sequence?.steps[0];
  if (!step || step.condition || !params.email) return fallback;

  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    const html = getEmailHtml(step.template, {
      name: params.name ?? undefined,
      email: params.email,
    });
    await resend.emails.send({
      from: "Pulse <hello@pulsereferrals.com>",
      to: params.email,
      replyTo: process.env.REPLY_TO_EMAIL ?? "hello@hiscornerstone.com",
      subject: step.subject,
      html,
    });

    // Advance past step 0 so the cron never re-sends the welcome.
    if (sequence.steps.length <= 1) {
      return { current_step: 1, next_send_at: new Date().toISOString() };
    }
    const nextDelay = sequence.steps[1].delaySeconds;
    return {
      current_step: 1,
      next_send_at: new Date(Date.now() + nextDelay * 1000).toISOString(),
    };
  } catch (e) {
    console.error("Immediate welcome send failed (cron will deliver it):", e);
    return fallback;
  }
}
