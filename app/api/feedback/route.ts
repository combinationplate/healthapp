import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { Resend } from "resend";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { message, page } = (await request.json()) as { message?: string; page?: string };
    const text = (message ?? "").trim();
    if (!text) return NextResponse.json({ error: "Empty message" }, { status: 400 });
    if (text.length > 5000) return NextResponse.json({ error: "Too long" }, { status: 400 });

    const resend = new Resend(process.env.RESEND_API_KEY);
    const esc = (v: string) =>
      v.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    await resend.emails.send({
      from: "Pulse Alerts <noreply@pulsereferrals.com>",
      to: process.env.SIGNUP_ALERT_EMAIL || "hello@pulsereferrals.com",
      replyTo: user.email ?? undefined,
      subject: `Feedback from ${user.email ?? "a user"}`,
      html: `
        <div style="font-family:'DM Sans',system-ui,sans-serif;max-width:520px;padding:24px;color:#0b1222;">
          <h2 style="margin:0 0 12px;font-size:18px;">Pulse feedback</h2>
          <p style="margin:0 0 6px;font-size:13px;color:#7a8ba8;">From: ${esc(user.email ?? "unknown")}${page ? ` · Page: ${esc(page)}` : ""}</p>
          <p style="font-size:15px;line-height:1.7;color:#3b4963;white-space:pre-wrap;">${esc(text)}</p>
        </div>`,
    });

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("feedback error:", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
