import { createHmac, timingSafeEqual } from "crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Resend } from "resend";
import { getEmailHtml } from "@/lib/drip/templates";

/**
 * Pilot-test invitations for H.I.S. Cornerstone courses.
 *
 * ASWB requires each new reading-based course to be tried by at least five
 * social workers. hiscornerstone.com runs the sign-up page, the course access
 * and the reminders; this module only INVITES people, and only while the
 * site reports open spots.
 *
 * Runs once a day from /api/drip/send. It does nothing unless BOTH env vars
 * are set in Vercel:
 *   PILOT_INVITES        "on"  = send;  "dry" = send nothing to professionals,
 *                        email a preview + the numbers to the alert address
 *   HISC_PILOT_FEED_KEY  the key of the site's /pilot-signups feed
 * Optional:
 *   PILOT_INVITES_PER_SPOT   invitations kept in play per open spot (default 4)
 *   PILOT_INVITES_DAILY_CAP  most invitations in one day (default 25)
 *
 * Who is invited: social-work professionals, account at least 8 days old
 * (so the welcome emails are done), not opted out, never invited before.
 * Order: seeking CE in a hospital / hospice / home health / rehab setting,
 * then others in those settings, then others seeking CE, then the rest.
 * Retired, school and insurance settings are skipped.
 *
 * One invitation per person, ever: each is recorded as a completed
 * drip_enrollments row with sequence "pilot_invite".
 */

export const PILOT_SEQUENCE = "pilot_invite";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://pulsereferrals.com";
const FEED_URL =
  process.env.HISC_PILOT_FEED_URL || "https://hiscornerstone.com/wp-json/hisc/v1/pilot-signups";
const ALERT_TO = (process.env.SIGNUP_ALERT_EMAIL || "hello@pulsereferrals.com")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

const SOCIAL_WORK = ["Social Work", "Social Worker"];
const MEDICAL_SETTING = /^(hospital|home health|hospice|snf)/i;
const POOR_FIT_SETTING = /^(retired|school|insurance)/i;
const SUBJECT = "Free CE for social workers: try a new course and tell us what you think";

/* ── Unsubscribe links ─────────────────────────────────────────────── */

function unsubscribeSecret(): string {
  return process.env.CRON_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY || "";
}

export function unsubscribeToken(userId: string): string {
  return createHmac("sha256", unsubscribeSecret()).update(`unsubscribe:${userId}`).digest("hex").slice(0, 32);
}

export function verifyUnsubscribeToken(userId: string, token: string): boolean {
  if (!userId || !token || !unsubscribeSecret()) return false;
  const expected = Buffer.from(unsubscribeToken(userId));
  const given = Buffer.from(token);
  return expected.length === given.length && timingSafeEqual(expected, given);
}

export function unsubscribeUrl(userId: string): string {
  return `${APP_URL}/api/email/unsubscribe?u=${encodeURIComponent(userId)}&t=${unsubscribeToken(userId)}`;
}

/* ── The site's feed ───────────────────────────────────────────────── */

type FeedCourse = {
  course_id: number;
  course: string;
  open: boolean;
  spots: number;
  spots_left: number;
  signup_link: string;
};

type Feed = { days_to_finish?: number; signup_page?: string; courses?: FeedCourse[] };

async function fetchFeed(key: string): Promise<Feed> {
  const res = await fetch(`${FEED_URL}?key=${encodeURIComponent(key)}`, {
    cache: "no-store",
    signal: AbortSignal.timeout(15000),
    headers: { accept: "application/json" },
  });
  if (!res.ok) throw new Error(`feed answered ${res.status}`);
  return (await res.json()) as Feed;
}

/* ── Choosing people ───────────────────────────────────────────────── */

type Candidate = {
  id: string;
  full_name: string | null;
  email: string | null;
  seeking_ce: boolean | null;
  work_setting: string | null;
  license_renews_on: string | null;
  created_at: string;
};

function tier(c: Candidate): number {
  const medical = MEDICAL_SETTING.test(c.work_setting ?? "");
  if (c.seeking_ce && medical) return 0;
  if (medical) return 1;
  if (c.seeking_ce) return 2;
  return 3;
}

/** Days until the license renews; people with no date, or a past date, go last. */
function renewalRank(c: Candidate, now: number): number {
  if (!c.license_renews_on) return Number.MAX_SAFE_INTEGER;
  const days = (new Date(c.license_renews_on).getTime() - now) / 86400000;
  return days >= 0 ? days : Number.MAX_SAFE_INTEGER;
}

export function rankCandidates(list: Candidate[], now: number = Date.now()): Candidate[] {
  return [...list].sort(
    (a, b) =>
      tier(a) - tier(b) ||
      renewalRank(a, now) - renewalRank(b, now) ||
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
}

/* ── The daily run ─────────────────────────────────────────────────── */

export type PilotInviteResult = {
  status:
    | "off"
    | "feed_error"
    | "no_open_spots"
    | "enough_invited"
    | "nobody_left"
    | "dry_run"
    | "sent"
    | "error";
  detail?: string;
  open_spots?: number;
  invited_last_7_days?: number;
  sent?: number;
  failed?: number;
  would_send?: number;
  not_yet_invited?: number;
};

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function runPilotInvites(admin: SupabaseClient, resend: Resend): Promise<PilotInviteResult> {
  const mode = (process.env.PILOT_INVITES || "off").trim().toLowerCase();
  const key = process.env.HISC_PILOT_FEED_KEY;
  if ((mode !== "on" && mode !== "dry") || !key) return { status: "off" };

  try {
    // 1. Are there open spots?
    let feed: Feed;
    try {
      feed = await fetchFeed(key);
    } catch (e) {
      return { status: "feed_error", detail: e instanceof Error ? e.message : String(e) };
    }
    const openCourses = (feed.courses ?? []).filter((c) => c.open && c.spots_left > 0);
    const openSpots = openCourses.reduce((n, c) => n + c.spots_left, 0);
    if (openSpots === 0) return { status: "no_open_spots", open_spots: 0 };

    // 2. How many invitations are already in play?
    const perSpot = Number(process.env.PILOT_INVITES_PER_SPOT) || 4;
    const dailyCap = Number(process.env.PILOT_INVITES_DAILY_CAP) || 25;
    const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString();
    const { count: recent, error: recentErr } = await admin
      .from("drip_enrollments")
      .select("id", { count: "exact", head: true })
      .eq("sequence", PILOT_SEQUENCE)
      .gte("created_at", weekAgo);
    if (recentErr) return { status: "error", detail: recentErr.message };

    const want = Math.min(dailyCap, openSpots * perSpot - (recent ?? 0));
    if (want <= 0) {
      return { status: "enough_invited", open_spots: openSpots, invited_last_7_days: recent ?? 0 };
    }

    // 3. Who has not been invited yet?
    const settled = new Date(Date.now() - 8 * 86400000).toISOString();
    const { data: profiles, error: profErr } = await admin
      .from("profiles")
      .select("id, full_name, email, seeking_ce, work_setting, license_renews_on, created_at")
      .eq("role", "professional")
      .in("discipline", SOCIAL_WORK)
      .is("marketing_opt_out_at", null)
      .lte("created_at", settled)
      .limit(5000);
    if (profErr) return { status: "error", detail: profErr.message };

    const { data: invitedRows, error: invErr } = await admin
      .from("drip_enrollments")
      .select("user_id")
      .eq("sequence", PILOT_SEQUENCE)
      .limit(10000);
    if (invErr) return { status: "error", detail: invErr.message };
    const invited = new Set((invitedRows ?? []).map((r) => r.user_id as string));

    const pool = rankCandidates(
      ((profiles ?? []) as Candidate[]).filter(
        (p) => !invited.has(p.id) && !POOR_FIT_SETTING.test(p.work_setting ?? "")
      )
    );
    if (pool.length === 0) {
      return { status: "nobody_left", open_spots: openSpots, invited_last_7_days: recent ?? 0, not_yet_invited: 0 };
    }
    // Most professional emails live in the users table, not on the profile.
    // Look a little past today's number so a person with no address on file
    // is passed over instead of using up a place in the batch every day.
    const shortlist = pool.slice(0, want + 25);
    const { data: userRows } = await admin
      .from("users")
      .select("id, email, name")
      .in(
        "id",
        shortlist.map((b) => b.id)
      );
    const users = new Map((userRows ?? []).map((u) => [u.id as string, u]));
    const batch = shortlist.filter((b) => b.email || users.get(b.id)?.email).slice(0, want);
    if (batch.length === 0) {
      return { status: "nobody_left", open_spots: openSpots, invited_last_7_days: recent ?? 0, not_yet_invited: 0 };
    }

    const pilot = {
      courses: openCourses.map((c) => c.course),
      signupUrl: `${feed.signup_page || "https://hiscornerstone.com/pilot-signup/"}?utm_source=pulse&utm_medium=email&utm_campaign=pilot-invite`,
      days: feed.days_to_finish || 10,
    };
    const replyTo = process.env.REPLY_TO_EMAIL ?? "hello@hiscornerstone.com";

    // 4a. Dry run: nobody is invited; the alert address gets a preview and the numbers.
    if (mode === "dry") {
      const preview = getEmailHtml("pilot-invite", {
        name: "Preview",
        pilot: { ...pilot, unsubscribeUrl: `${APP_URL}/api/email/unsubscribe` },
      });
      const tiers = [0, 0, 0, 0];
      batch.forEach((b) => tiers[tier(b)]++);
      await resend.emails.send({
        from: "Pulse Alerts <hello@pulsereferrals.com>",
        to: ALERT_TO,
        subject: `DRY RUN - pilot invites: would send ${batch.length} today`,
        html:
          `<div style="font-family:system-ui,sans-serif;font-size:14px;color:#3b4963;padding:16px;">` +
          `<p><strong>Nothing was sent to professionals.</strong> Set PILOT_INVITES=on in Vercel to start.</p>` +
          `<p>Open spots: ${openSpots} · Would invite today: ${batch.length} ` +
          `(seeking CE in a medical setting ${tiers[0]}, other medical ${tiers[1]}, other seeking CE ${tiers[2]}, rest ${tiers[3]}) · ` +
          `Social workers not yet invited: ${pool.length}</p><hr/><p>The invitation they would get:</p></div>` +
          preview,
      });
      return {
        status: "dry_run",
        open_spots: openSpots,
        invited_last_7_days: recent ?? 0,
        would_send: batch.length,
        not_yet_invited: pool.length,
      };
    }

    // 4b. Send. Record first, so a crash can never invite someone twice.
    let sent = 0;
    let failed = 0;
    for (const person of batch) {
      const user = users.get(person.id);
      const email = person.email || (user?.email as string | undefined);
      if (!email) {
        failed++;
        continue;
      }
      const { data: row, error: insErr } = await admin
        .from("drip_enrollments")
        .insert({
          user_id: person.id,
          sequence: PILOT_SEQUENCE,
          current_step: 1,
          next_send_at: new Date().toISOString(),
          completed: true,
        })
        .select("id")
        .single();
      if (insErr || !row) {
        failed++;
        continue;
      }
      try {
        const unsub = unsubscribeUrl(person.id);
        const { error: sendErr } = await resend.emails.send({
          from: "Pulse <hello@pulsereferrals.com>",
          to: email,
          replyTo,
          subject: SUBJECT,
          html: getEmailHtml("pilot-invite", {
            name: person.full_name ?? (user?.name as string | undefined) ?? undefined,
            email,
            pilot: { ...pilot, unsubscribeUrl: unsub },
          }),
          headers: {
            "List-Unsubscribe": `<${unsub}>`,
            "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
          },
        });
        if (sendErr) throw new Error(sendErr.message);
        sent++;
      } catch (e) {
        console.error("Pilot invite failed to send:", e);
        await admin.from("drip_enrollments").delete().eq("id", row.id); // not invited after all
        failed++;
      }
      await sleep(600); // stay under Resend's rate limit
    }

    if (sent > 0) {
      try {
        await resend.emails.send({
          from: "Pulse Alerts <hello@pulsereferrals.com>",
          to: ALERT_TO,
          subject: `Pilot invites: ${sent} sent today (${openSpots} spots open)`,
          html:
            `<div style="font-family:system-ui,sans-serif;font-size:14px;color:#3b4963;padding:16px;">` +
            `<p>${sent} social workers were invited to pilot test today${failed ? ` (${failed} failed)` : ""}.</p>` +
            `<p>Open now: ${pilot.courses.map(escapeHtml).join("; ")}</p>` +
            `<p>Social workers not yet invited: ${pool.length - sent}. Invitations stop by themselves when the spots are taken. ` +
            `To pause, set PILOT_INVITES=off in Vercel.</p></div>`,
        });
      } catch (e) {
        console.error("Pilot invite summary failed:", e);
      }
    }

    return {
      status: "sent",
      open_spots: openSpots,
      invited_last_7_days: recent ?? 0,
      sent,
      failed,
      not_yet_invited: pool.length - sent,
    };
  } catch (e) {
    console.error("Pilot invites crashed:", e);
    return { status: "error", detail: e instanceof Error ? e.message : String(e) };
  }
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
