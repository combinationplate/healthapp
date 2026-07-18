import { createClient as createServiceClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { verifyPulseSignature } from "@/lib/hiscornerstone/enroll";

/**
 * POST /api/webhooks/course-completed
 * Fired by the pulse-connect mu-plugin when LearnDash reports a course
 * completion. Verified via HMAC (PULSE_WP_SHARED_SECRET). Sets completed_at
 * and certificate_url on the matching ce_sends row.
 */
export async function POST(request: Request) {
  try {
    const secret = (process.env.PULSE_WP_SHARED_SECRET ?? "").trim();
    if (!secret) {
      console.error("[course-completed] PULSE_WP_SHARED_SECRET not configured");
      return NextResponse.json({ received: true });
    }

    const raw = await request.text();
    const ts = request.headers.get("x-pulse-timestamp") ?? "";
    const sig = request.headers.get("x-pulse-signature") ?? "";

    if (!verifyPulseSignature(raw, ts, sig, secret)) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    const body = JSON.parse(raw) as {
      event?: string;
      email?: string;
      ce_send_id?: string | null;
      certificate_url?: string | null;
      course_title?: string;
      completed_at?: string;
    };

    if (body.event !== "course_completed") {
      return NextResponse.json({ received: true });
    }

    const admin = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    if (body.ce_send_id) {
      const { data: ceSend } = await admin
        .from("ce_sends")
        .select("id, completed_at")
        .eq("id", body.ce_send_id)
        .maybeSingle();

      if (ceSend && !ceSend.completed_at) {
        await admin
          .from("ce_sends")
          .update({
            completed_at: body.completed_at ?? new Date().toISOString(),
            certificate_url: body.certificate_url ?? null,
          })
          .eq("id", ceSend.id);
      }
      return NextResponse.json({ received: true });
    }

    // Fallback: no ce_send_id (pro enrolled before this system, or meta was
    // lost). Match the most recent redeemed-but-not-completed send for this
    // email + course name.
    if (body.email && body.course_title) {
      const { data: pros } = await admin
        .from("professionals")
        .select("id")
        .ilike("email", body.email);
      const proIds = (pros ?? []).map((p: { id: string }) => p.id);
      if (proIds.length > 0) {
        const { data: candidate } = await admin
          .from("ce_sends")
          .select("id")
          .in("professional_id", proIds)
          .eq("course_name", body.course_title)
          .not("redeemed_at", "is", null)
          .is("completed_at", null)
          .order("redeemed_at", { ascending: false })
          .limit(1)
          .maybeSingle();
        if (candidate) {
          await admin
            .from("ce_sends")
            .update({
              completed_at: body.completed_at ?? new Date().toISOString(),
              certificate_url: body.certificate_url ?? null,
            })
            .eq("id", candidate.id);
        }
      }
    }

    return NextResponse.json({ received: true });
  } catch (e) {
    console.error("[course-completed] error:", e);
    // Always 200 so WP's fire-and-forget doesn't matter either way.
    return NextResponse.json({ received: true });
  }
}
