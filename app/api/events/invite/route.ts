import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { Resend } from "resend";

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const resend = new Resend(process.env.RESEND_API_KEY);

  const body = await request.json();
  const { eventId, emails } = body;
  // emails: { name?: string, email: string }[]

  if (!eventId || !emails?.length) {
    return NextResponse.json({ error: "eventId and emails required" }, { status: 400 });
  }

  // Verify rep owns this event
  const { data: event } = await supabase
    .from("events")
    .select("*")
    .eq("id", eventId)
    .eq("rep_id", user.id)
    .single();

  if (!event) {
    return NextResponse.json({ error: "Event not found" }, { status: 404 });
  }

  const repName = event.rep_name || user.email;
  const orgName = event.rep_org || "";
  const origin = process.env.NEXT_PUBLIC_APP_URL || "https://pulsereferrals.vercel.app";

  const eventDate = new Date(event.starts_at).toLocaleDateString("en-US", {
    weekday: "long", month: "long", day: "numeric", year: "numeric",
  });
  const eventTime = new Date(event.starts_at).toLocaleTimeString("en-US", {
    hour: "numeric", minute: "2-digit",
  });

  const typeLabels: Record<string, string> = {
    lunch_and_learn: "Lunch & Learn", networking_dinner: "Networking Dinner",
    workshop: "Workshop", in_service: "In-Service", other: "Event",
  };
  const typeLabel = typeLabels[event.event_type] || "Event";

  const results: { email: string; success: boolean; error?: string }[] = [];

  for (const recipient of emails) {
    const toEmail = recipient.email?.trim().toLowerCase();
    if (!toEmail) continue;

    const firstName = recipient.name?.split(/\s+/)[0] || "there";
    const rsvpUrl = `${origin}/events/rsvp/${eventId}?email=${encodeURIComponent(toEmail)}`;
    const ctaUrl = event.external_url || rsvpUrl;
    const ctaLabel = event.external_url ? "View Details &amp; Sign Up" : "RSVP Now";

    try {
      await resend.emails.send({
        from: `${repName} via Pulse <noreply@pulsereferrals.com>`,
        to: toEmail,
        subject: `You're invited: ${event.title} — ${eventDate}`,
        html: `
<div style="font-family:'DM Sans',system-ui,sans-serif;max-width:560px;margin:0 auto;color:#0b1222;">
  <div style="background:linear-gradient(135deg,#0b1222,#1a2744);padding:32px;border-radius:16px 16px 0 0;">
    <div style="font-size:11px;text-transform:uppercase;letter-spacing:0.1em;color:rgba(255,255,255,0.5);margin-bottom:4px;">
      ${typeLabel} Invitation
    </div>
    <h1 style="font-family:Georgia,serif;font-size:24px;font-weight:800;color:#fff;margin:0 0 8px;line-height:1.2;">
      ${event.title}
    </h1>
    <div style="font-size:14px;color:rgba(255,255,255,0.7);">
      Hosted by ${repName}${orgName ? ` &middot; ${orgName}` : ""}
    </div>
  </div>
  <div style="background:#fff;padding:28px 32px;border:1px solid rgba(11,18,34,0.08);border-top:none;">
    <p style="font-size:15px;color:#0b1222;margin:0 0 6px;">Hi ${firstName},</p>
    <p style="font-size:14px;color:#3b4963;line-height:1.6;margin:0 0 24px;">
      You're invited to a ${typeLabel.toLowerCase()}. We'd love to see you there.
    </p>
    <div style="background:#f6f5f0;border-radius:12px;padding:20px;margin-bottom:24px;">
      <table style="width:100%;border-collapse:collapse;">
        <tr>
          <td style="padding:6px 0;font-size:12px;color:#7a8ba8;font-weight:600;width:70px;vertical-align:top;">DATE</td>
          <td style="padding:6px 0;font-size:14px;color:#0b1222;font-weight:600;">${eventDate}</td>
        </tr>
        <tr>
          <td style="padding:6px 0;font-size:12px;color:#7a8ba8;font-weight:600;vertical-align:top;">TIME</td>
          <td style="padding:6px 0;font-size:14px;color:#0b1222;">${eventTime} &middot; ${event.duration_minutes} min</td>
        </tr>
        ${event.location_name ? `
        <tr>
          <td style="padding:6px 0;font-size:12px;color:#7a8ba8;font-weight:600;vertical-align:top;">WHERE</td>
          <td style="padding:6px 0;font-size:14px;color:#0b1222;">
            ${event.location_name}${event.address ? `<br><span style="color:#7a8ba8;font-size:13px;">${event.address}</span>` : ""}
          </td>
        </tr>` : ""}
      </table>
    </div>
    ${event.description ? `<p style="font-size:14px;color:#3b4963;line-height:1.6;margin:0 0 24px;">${event.description}</p>` : ""}
    <div style="text-align:center;margin-bottom:16px;">
      <a href="${ctaUrl}" style="display:inline-block;background:#2455ff;color:#fff;font-weight:700;padding:14px 40px;border-radius:10px;font-size:15px;text-decoration:none;box-shadow:0 2px 10px rgba(36,85,255,0.18);">
        ${ctaLabel}
      </a>
    </div>
    ${!event.external_url ? `
    <p style="font-size:12px;color:#7a8ba8;text-align:center;">
      Can't make it? <a href="${rsvpUrl}&action=decline" style="color:#2455ff;">Let us know</a>
    </p>` : ""}
  </div>
  <div style="padding:16px 32px;font-size:11px;color:#7a8ba8;text-align:center;border:1px solid rgba(11,18,34,0.08);border-top:none;border-radius:0 0 16px 16px;background:#fafaf7;">
    Sent via <strong>Pulse</strong> &middot; pulsereferrals.vercel.app
  </div>
</div>`,
      });
      results.push({ email: toEmail, success: true });
    } catch (e: any) {
      results.push({ email: toEmail, success: false, error: e.message ?? "Send failed" });
    }
  }

  return NextResponse.json({
    sent: results.filter((r) => r.success).length,
    failed: results.filter((r) => !r.success).length,
    results,
  });
}
