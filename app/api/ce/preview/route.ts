import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import {
  buildCeEmailSubject,
  buildCeEmailHtml,
  buildCeMultiEmailSubject,
  buildCeMultiEmailHtml,
} from "@/lib/email/ce-email";

/**
 * POST /api/ce/preview
 *
 * Renders the EXACT email a professional would receive for the rep's current
 * send-modal selections — same template, same rep name/company — without
 * sending anything or creating coupons. Exists so reps can see what lands in
 * a nurse's inbox before spending relationship capital on a real send.
 */
export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => ({}))) as {
      courseIds?: string[];
      recipientName?: string;
      personalMessage?: string;
      discount?: string;
      // sample: true → server picks a representative course itself. Used by the
      // manager dashboard's "what your reps send" card, where no course picker
      // exists. Renders the same exact template.
      sample?: boolean;
    };

    const courseIdList = Array.from(new Set((body.courseIds ?? []).filter(Boolean)));
    const isSample = body.sample === true && courseIdList.length === 0;
    if (courseIdList.length === 0 && !isSample) {
      return NextResponse.json({ error: "Select at least one course." }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let courses: { id: string; name: string; hours: number }[] | null = null;
    if (isSample) {
      // Prefer an ethics course (every license needs it), else any course.
      const { data: ethics } = await supabase
        .from("courses")
        .select("id, name, hours")
        .ilike("name", "%ethic%")
        .limit(1);
      if (ethics && ethics.length > 0) {
        courses = ethics;
      } else {
        const { data: anyCourse } = await supabase
          .from("courses")
          .select("id, name, hours")
          .limit(1);
        courses = anyCourse;
      }
    } else {
      const { data } = await supabase
        .from("courses")
        .select("id, name, hours")
        .in("id", courseIdList);
      courses = data;
    }
    if (!courses || courses.length === 0) {
      return NextResponse.json({ error: "Course not found" }, { status: 400 });
    }

    const admin = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    const { data: repProfile } = await admin
      .from("profiles")
      .select("full_name, org_id")
      .eq("id", user.id)
      .single();
    const repName =
      (repProfile?.full_name ??
        user.user_metadata?.full_name ??
        user.email?.split("@")[0] ??
        "Rep")
        .trim() || "Rep";
    const repEmail = user.email ?? "";
    let repOrgName = "";
    if (repProfile?.org_id) {
      const { data: org } = await admin
        .from("orgs")
        .select("name")
        .eq("id", repProfile.org_id)
        .single();
      repOrgName = org?.name ?? "";
    }

    const recipientName = (body.recipientName ?? "").trim() || "Jordan Avery";
    const discount = body.discount ?? "100% Free";
    const personalMessage = body.personalMessage?.trim() || undefined;
    const sampleCode = "SAMPLE-CODE";
    const sampleUrl = "#preview";

    let subject: string;
    let html: string;

    if (courses.length === 1) {
      const params = {
        recipientName,
        courseName: courses[0].name,
        courseHours: courses[0].hours,
        couponCode: sampleCode,
        accessUrl: sampleUrl,
        discount,
        repName,
        repEmail,
        repOrgName,
        personalMessage,
      };
      subject = buildCeEmailSubject(params);
      html = buildCeEmailHtml(params);
    } else {
      const params = {
        recipientName,
        repName,
        repEmail,
        repOrgName,
        personalMessage,
        discount,
        courses: courses.map((c) => ({
          courseName: c.name,
          courseHours: c.hours,
          couponCode: sampleCode,
          accessUrl: sampleUrl,
        })),
      };
      subject = buildCeMultiEmailSubject(params);
      html = buildCeMultiEmailHtml(params);
    }

    const fromAddress = process.env.RESEND_FROM_EMAIL ?? "hello@pulsereferrals.com";
    return NextResponse.json({
      subject,
      html,
      from: `${repName} via Pulse <${fromAddress}>`,
    });
  } catch (e) {
    console.error("[ce-preview] error:", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
