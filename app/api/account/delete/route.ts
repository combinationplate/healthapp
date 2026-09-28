import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { Resend } from "resend";

export const dynamic = "force-dynamic";

/**
 * POST /api/account/delete   body: { confirm: "DELETE" }
 *
 * Self-serve account deletion for the signed-in user.
 *
 * - Professionals: always allowed. Removes their CE requests + drip enrollment,
 *   unlinks (but keeps) any ce_sends addressed to them — those rows are the
 *   sending rep's billing record — then deletes the auth user, which cascades
 *   profiles + users.
 * - Reps / managers: allowed only when there's no real (non-test) send, billing,
 *   or org history. Otherwise returns 409 and points them to support, because
 *   deleting would wipe billable usage and invoice records.
 * - Admin + house accounts can never be deleted from here.
 *
 * If the hard delete is blocked by a foreign key we don't know about (prod schema
 * has drifted from repo migrations before), falls back to Supabase's soft delete:
 * sign-in is disabled permanently and the email is freed, while the rows other
 * tables point at stay intact. Admin is only emailed if BOTH attempts fail.
 */

const PROTECTED_EMAILS = ["ztaylor120@gmail.com", "hello@hiscornerstone.com"];
const SUPPORT_EMAIL = "support@pulsereferrals.com";

export async function POST(request: Request) {
  let body: { confirm?: string } = {};
  try {
    body = await request.json();
  } catch {
    // fall through to the confirm check
  }
  if ((body.confirm ?? "").trim().toUpperCase() !== "DELETE") {
    return NextResponse.json(
      { error: "confirm_required", message: "Type DELETE to confirm." },
      { status: 400 }
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const uid = user.id;
  const email = (user.email ?? "").toLowerCase();
  const houseEmail = (process.env.HOUSE_ACCOUNT_EMAIL || "hello@pulsereferrals.com").toLowerCase();
  if (PROTECTED_EMAILS.includes(email) || email === houseEmail) {
    return NextResponse.json(
      { error: "protected_account", message: "This is an admin/house account and can't be deleted here." },
      { status: 403 }
    );
  }

  const admin = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: profile } = await admin
    .from("profiles")
    .select("role, org_id")
    .eq("id", uid)
    .maybeSingle();
  const role: string = profile?.role ?? "professional";

  // ── Reps / managers: refuse if deleting would destroy billing history ──
  if (role === "rep" || role === "manager") {
    const checks = [
      admin
        .from("ce_sends")
        .select("id", { count: "exact", head: true })
        .eq("rep_id", uid)
        .not("is_test", "is", true),
      admin.from("billing_settings").select("id", { count: "exact", head: true }).eq("rep_id", uid),
      admin.from("invoices").select("id", { count: "exact", head: true }).eq("rep_id", uid),
    ];
    if (role === "manager" && profile?.org_id) {
      checks.push(
        admin
          .from("profiles")
          .select("id", { count: "exact", head: true })
          .eq("org_id", profile.org_id)
          .neq("id", uid)
      );
      checks.push(
        admin
          .from("billing_settings")
          .select("id", { count: "exact", head: true })
          .eq("org_id", profile.org_id)
      );
    }
    const results = await Promise.all(checks);
    // Any failed check counts as "has history" — never guess on billing data.
    const hasHistory = results.some((r) => r.error || (r.count ?? 0) > 0);
    if (hasHistory) {
      return NextResponse.json(
        {
          error: "has_history",
          message: `Your account has CE sends, billing, or team history tied to it, so it can't be removed automatically. Email ${SUPPORT_EMAIL} from this address and we'll close it for you.`,
        },
        { status: 409 }
      );
    }
  }

  // ── Clean up rows that point at this user (best-effort, logged) ──
  const cleanup: [string, PromiseLike<{ error: { message: string } | null }>][] = [
    // Stop all Pulse drip/re-engagement email immediately.
    ["drip_enrollments", admin.from("drip_enrollments").delete().eq("user_id", uid)],
    // Their own CE requests (also removes them from the demand map + rep lists).
    ["ce_requests (own)", admin.from("ce_requests").delete().eq("professional_id", uid)],
    // Requests this user claimed as a rep go back to the open pool.
    [
      "ce_requests (claimed)",
      admin.from("ce_requests").update({ rep_id: null }).eq("rep_id", uid).eq("status", "pending"),
    ],
    // Keep the send (rep's billing record) — just drop the link to this account.
    ["ce_sends.user_id", admin.from("ce_sends").update({ user_id: null }).eq("user_id", uid)],
  ];
  for (const [label, op] of cleanup) {
    try {
      const { error } = await op;
      if (error) console.warn(`[account/delete] ${label} cleanup failed:`, error.message);
    } catch (e) {
      console.warn(`[account/delete] ${label} cleanup threw:`, e);
    }
  }

  // ── Delete the auth user (cascades profiles + users) ──
  const { error: hardErr } = await admin.auth.admin.deleteUser(uid);
  if (hardErr) {
    console.error("[account/delete] hard delete failed, trying soft delete:", hardErr.message);

    // Scrub the profile first so nothing personal lingers on the kept row, and
    // clear its email so hiscornerstone.com lead intake never re-attaches to it.
    const { error: scrubErr } = await admin
      .from("profiles")
      .update({ full_name: "Deleted user", email: null, facility: null, city: null, seeking_ce: false })
      .eq("id", uid);
    if (scrubErr) console.warn("[account/delete] profile scrub failed:", scrubErr.message);

    const { error: softErr } = await admin.auth.admin.deleteUser(uid, true);
    if (softErr) {
      console.error("[account/delete] soft delete failed:", softErr.message);
      await alertAdminDeleteFailed(email, uid, role, `${hardErr.message} / ${softErr.message}`);
      return NextResponse.json(
        {
          error: "delete_failed",
          message: `We couldn't finish deleting your account. We've been notified and will complete it shortly — or email ${SUPPORT_EMAIL}.`,
        },
        { status: 500 }
      );
    }
  }

  // Clear this browser's session cookies. The user no longer exists, so the
  // server-side revoke may 404 — that's fine, cookies are still cleared.
  try {
    await supabase.auth.signOut({ scope: "local" });
  } catch {
    // ignore
  }

  return NextResponse.json({ success: true });
}

// Only fires when an account could NOT be deleted at all (user can still sign
// in) — an action item, not noise. Normal deletions send no admin email.
async function alertAdminDeleteFailed(email: string, uid: string, role: string, reason: string) {
  const key = process.env.RESEND_API_KEY;
  if (!key) return;
  try {
    await new Resend(key).emails.send({
      from: "Pulse Alerts <hello@pulsereferrals.com>",
      to: process.env.SIGNUP_ALERT_EMAIL || "hello@pulsereferrals.com",
      subject: `ACTION: account deletion failed — ${email}`,
      html: `
        <div style="font-family:'DM Sans',system-ui,sans-serif;max-width:480px;padding:24px;">
          <h2 style="margin:0 0 12px;font-size:18px;color:#0b1222;">Account deletion failed</h2>
          <p style="font-size:14px;color:#3b4963;">A user asked to delete their account and both the hard and soft delete failed. Finish it in Supabase → Authentication → Users.</p>
          <table style="font-size:14px;color:#3b4963;border-collapse:collapse;">
            <tr><td style="padding:4px 16px 4px 0;font-weight:600;color:#7a8ba8;">Email</td><td>${email}</td></tr>
            <tr><td style="padding:4px 16px 4px 0;font-weight:600;color:#7a8ba8;">User ID</td><td>${uid}</td></tr>
            <tr><td style="padding:4px 16px 4px 0;font-weight:600;color:#7a8ba8;">Role</td><td>${role}</td></tr>
            <tr><td style="padding:4px 16px 4px 0;font-weight:600;color:#7a8ba8;">Error</td><td>${reason}</td></tr>
          </table>
        </div>`,
    });
  } catch (e) {
    console.error("[account/delete] admin alert failed:", e);
  }
}
