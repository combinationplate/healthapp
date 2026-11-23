import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { verifyUnsubscribeToken } from "@/lib/pilot/invites";

export const dynamic = "force-dynamic";

/**
 * Unsubscribe from Pulse offer emails (course invitations and the like).
 *
 * GET  shows a confirm button — opening the link alone changes nothing, so a
 *      mail scanner that follows links cannot unsubscribe someone by accident.
 * POST records the opt-out (also what a mail app's one-click "Unsubscribe" calls).
 *
 * The opt-out is profiles.marketing_opt_out_at. Emails about a course someone
 * is actually taking (their CE link, its reminders) are not affected.
 */

function page(title: string, body: string, status = 200) {
  return new NextResponse(
    `<!DOCTYPE html><html><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/>` +
      `<meta name="robots" content="noindex"/><title>${title} · Pulse</title></head>` +
      `<body style="margin:0;font-family:system-ui,sans-serif;color:#0b1222;background:#f7f8fb;">` +
      `<div style="max-width:440px;margin:80px auto;padding:32px;background:#fff;border-radius:14px;text-align:center;">` +
      `<h1 style="font-size:20px;margin:0 0 12px;">${title}</h1>${body}</div></body></html>`,
    { status, headers: { "content-type": "text/html; charset=utf-8" } }
  );
}

const BAD_LINK = () =>
  page(
    "That link did not work",
    `<p style="font-size:15px;color:#3b4963;line-height:1.6;">Reply to any Pulse email and we will take you off the list by hand.</p>`,
    400
  );

export async function GET(request: Request) {
  const url = new URL(request.url);
  const u = url.searchParams.get("u") ?? "";
  const t = url.searchParams.get("t") ?? "";
  if (!verifyUnsubscribeToken(u, t)) return BAD_LINK();

  return page(
    "Stop offer emails from Pulse?",
    `<p style="font-size:15px;color:#3b4963;line-height:1.6;">You will still get emails about a course you are taking.</p>` +
      `<form method="post" action="/api/email/unsubscribe?u=${encodeURIComponent(u)}&t=${encodeURIComponent(t)}">` +
      `<button type="submit" style="background:#2455ff;color:#fff;font-weight:700;border:0;padding:14px 32px;border-radius:10px;font-size:15px;cursor:pointer;">Unsubscribe</button></form>`
  );
}

export async function POST(request: Request) {
  const url = new URL(request.url);
  const u = url.searchParams.get("u") ?? "";
  const t = url.searchParams.get("t") ?? "";
  if (!verifyUnsubscribeToken(u, t)) return BAD_LINK();

  const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  const { error } = await admin
    .from("profiles")
    .update({ marketing_opt_out_at: new Date().toISOString() })
    .eq("id", u)
    .is("marketing_opt_out_at", null);
  if (error) {
    console.error("Unsubscribe failed:", error);
    return page(
      "Something went wrong",
      `<p style="font-size:15px;color:#3b4963;line-height:1.6;">Reply to any Pulse email and we will take you off the list by hand.</p>`,
      500
    );
  }
  return page(
    "You are unsubscribed",
    `<p style="font-size:15px;color:#3b4963;line-height:1.6;">You will not get offer emails from Pulse again.</p>`
  );
}
