import type { SupabaseClient } from "@supabase/supabase-js";
import { Resend } from "resend";

/**
 * Fires when a CE from a *claimed demand request* is redeemed. Reveals the
 * professional to the sponsoring rep and emails both a warm introduction.
 * Gated to demand-claims only (reps who send from their own network already
 * know the professional). Deduped via an "intro" touchpoint marker so it
 * runs at most once per rep↔professional pair. Best-effort — never throws.
 */
export async function introduceOnRedemption(admin: SupabaseClient, ceSendId: string): Promise<void> {
  try {
    const { data: send } = await admin
      .from("ce_sends")
      .select("id, rep_id, professional_id, course_name")
      .eq("id", ceSendId)
      .single();
    if (!send?.rep_id || !send?.professional_id) return;

    const { data: contact } = await admin
      .from("professionals")
      .select("id, name, email, facility")
      .eq("id", send.professional_id)
      .single();
    if (!contact?.email) return;

    // Gate: only introduce when this rep CLAIMED a demand request from this professional.
    const { data: proProfiles } = await admin.from("profiles").select("id").ilike("email", contact.email);
    const proIds = (proProfiles ?? []).map((p: { id: string }) => p.id);
    if (proIds.length === 0) return;
    const { data: claimedReq } = await admin
      .from("ce_requests")
      .select("id")
      .in("professional_id", proIds)
      .eq("rep_id", send.rep_id)
      .limit(1)
      .maybeSingle();
    if (!claimedReq) return;

    // Dedupe: skip if we've already introduced this pair.
    const { data: already } = await admin
      .from("touchpoints")
      .select("id")
      .eq("rep_id", send.rep_id)
      .eq("professional_id", send.professional_id)
      .eq("type", "intro")
      .limit(1)
      .maybeSingle();
    if (already) return;

    // Rep identity
    const { data: repProfile } = await admin.from("profiles").select("full_name, org_id").eq("id", send.rep_id).single();
    let orgName = "";
    if (repProfile?.org_id) {
      const { data: org } = await admin.from("orgs").select("name").eq("id", repProfile.org_id).single();
      orgName = org?.name ?? "";
    }
    const { data: repAuth } = await admin.auth.admin.getUserById(send.rep_id);
    const repEmail = repAuth?.user?.email ?? "";
    const repName = repProfile?.full_name || repEmail || "Your Pulse sponsor";

    const resendKey = process.env.RESEND_API_KEY;
    if (!resendKey) return;
    const resend = new Resend(resendKey);
    const from = "Pulse <noreply@pulsereferrals.com>";
    const proFirst = (contact.name || "there").split(/\s+/)[0];
    const repFirst = repName.split(/\s+/)[0];
    const orgLine = orgName ? ` at ${orgName}` : "";

    // 1) To the rep — reveal the professional they sponsored.
    if (repEmail) {
      await resend.emails.send({
        from,
        to: repEmail,
        subject: `Introduction: ${contact.name} completed the CE you sponsored`,
        html: `
          <div style="font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;max-width:520px;padding:8px 4px;color:#0b1222;">
            <p style="font-size:15px;line-height:1.6;">Hi ${repFirst},</p>
            <p style="font-size:15px;line-height:1.6;color:#3b4963;">${contact.name} just completed the continuing education you sponsored${send.course_name ? ` (<strong>${send.course_name}</strong>)` : ""}. Here's your introduction:</p>
            <p style="font-size:15px;line-height:1.7;margin:14px 0;padding:12px 16px;background:#f6f5f0;border-left:3px solid #2455ff;border-radius:4px;">
              <strong>${contact.name}</strong>${contact.facility ? `<br/>${contact.facility}` : ""}<br/>
              <a href="mailto:${contact.email}" style="color:#2455ff;text-decoration:none;">${contact.email}</a>
            </p>
            <p style="font-size:15px;line-height:1.6;color:#3b4963;">A quick, friendly note thanking them and offering to be a resource goes a long way. You started this relationship with a genuine favor — now build on it.</p>
            <p style="font-size:13px;color:#7a8ba8;">— Pulse</p>
          </div>`,
      });
    }

    // 2) To the professional — reveal their sponsor.
    await resend.emails.send({
      from,
      to: contact.email,
      subject: `You're connected with ${repName}${orgLine}`,
      html: `
        <div style="font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;max-width:520px;padding:8px 4px;color:#0b1222;">
          <p style="font-size:15px;line-height:1.6;">Hi ${proFirst},</p>
          <p style="font-size:15px;line-height:1.6;color:#3b4963;">Nice work completing your CE! It was sponsored by <strong>${repName}</strong>${orgLine}. We wanted to connect you:</p>
          <p style="font-size:15px;line-height:1.7;margin:14px 0;padding:12px 16px;background:#f6f5f0;border-left:3px solid #0d9488;border-radius:4px;">
            <strong>${repName}</strong>${orgName ? `<br/>${orgName}` : ""}${repEmail ? `<br/><a href="mailto:${repEmail}" style="color:#2455ff;text-decoration:none;">${repEmail}</a>` : ""}
          </p>
          <p style="font-size:15px;line-height:1.6;color:#3b4963;">They're a local resource for your facility — feel free to reach out anytime.</p>
          <p style="font-size:13px;color:#7a8ba8;">— Pulse</p>
        </div>`,
    });

    // Mark introduced (dedupe marker + activity log).
    await admin.from("touchpoints").insert({
      rep_id: send.rep_id,
      professional_id: send.professional_id,
      type: "intro",
      notes: `Introduced after CE redemption${send.course_name ? `: ${send.course_name}` : ""}`,
      points: 10,
    });
  } catch (e) {
    console.error("introduceOnRedemption failed:", e);
  }
}
