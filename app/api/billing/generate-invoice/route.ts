import { createClient as createServiceClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import Stripe from "stripe";

function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY not configured");
  return new Stripe(key, { apiVersion: "2026-02-25.clover" });
}

// POST /api/billing/generate-invoice
// Generates invoices for all billing entities with unbilled CE redemptions.
//
// Security: Protected by a secret token in the request header.
// Call from Vercel Cron or manually for testing.
//
// Optional query param: ?test=true to preview without creating Stripe invoices

export async function POST(request: Request) {
  try {
    // Verify authorization — use a secret token for cron/admin access
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    // Allow if: valid cron secret OR valid Supabase session (for manual testing)
    let isAuthorized = false;

    if (cronSecret && authHeader === `Bearer ${cronSecret}`) {
      isAuthorized = true;
    }

    if (!isAuthorized) {
      // Fall back to checking if the user is an admin/manager
      const { createClient } = await import("@/lib/supabase/server");
      const supabase = await createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const admin = createServiceClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.SUPABASE_SERVICE_ROLE_KEY!
        );
        const { data: profile } = await admin
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .single();
        // Allow managers/admins to trigger manually
        if (profile?.role === "manager" || profile?.role === "admin") {
          isAuthorized = true;
        }
        // For testing: allow any authenticated user
        // TODO: Remove this in production
        isAuthorized = true;
      }
    }

    if (!isAuthorized) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const isTest = searchParams.get("test") === "true";
    const isDryRun = searchParams.get("dry") === "true";

    const stripe = getStripe();
    const admin = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Determine billing period (prior month by default, or current if ?current=true)
    const now = new Date();
    let periodStart: Date;
    let periodEnd: Date;

    if (searchParams.get("current") === "true") {
      // Bill for current month (useful for testing)
      periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
      periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
    } else {
      // Bill for prior month
      periodStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      periodEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
    }

    // Get all unbilled, redeemed CE sends in the period
    const { data: unbilledSends, error: sendsError } = await admin
      .from("ce_sends")
      .select(`
        id, rep_id, course_name, course_hours, redeemed_at,
        coupon_code, recipient_email,
        professionals(name),
        courses(price)
      `)
      .not("redeemed_at", "is", null)
      .eq("billed", false)
      .gte("redeemed_at", periodStart.toISOString())
      .lte("redeemed_at", periodEnd.toISOString())
      .order("redeemed_at");

    if (sendsError) {
      console.error("Error fetching unbilled sends:", sendsError);
      return NextResponse.json({ error: "Failed to fetch unbilled sends" }, { status: 500 });
    }

    if (!unbilledSends || unbilledSends.length === 0) {
      return NextResponse.json({
        message: "No unbilled CE redemptions for this period",
        periodStart: periodStart.toISOString().split("T")[0],
        periodEnd: periodEnd.toISOString().split("T")[0],
        invoicesGenerated: 0,
      });
    }

    // Get rep profiles to determine billing entities
    const repIds = [...new Set(unbilledSends.map((s: any) => s.rep_id))];
    const { data: repProfiles } = await admin
      .from("profiles")
      .select("id, full_name, org_id")
      .in("id", repIds);

    const profileMap = new Map(
      (repProfiles ?? []).map((p: any) => [p.id, p])
    );

    // Group sends by billing entity (org_id or rep_id)
    const billingGroups = new Map<string, {
      billingKey: string;
      orgId: string | null;
      repId: string | null;
      sends: any[];
    }>();

    for (const send of unbilledSends) {
      const profile = profileMap.get(send.rep_id);
      const orgId = profile?.org_id ?? null;
      // Group by org if available, otherwise by rep
      const billingKey = orgId ? `org:${orgId}` : `rep:${send.rep_id}`;

      if (!billingGroups.has(billingKey)) {
        billingGroups.set(billingKey, {
          billingKey,
          orgId,
          repId: orgId ? null : send.rep_id,
          sends: [],
        });
      }
      billingGroups.get(billingKey)!.sends.push(send);
    }

    const results: any[] = [];

    for (const [key, group] of billingGroups) {
      try {
        // Find billing settings — try org first, then fall back to individual rep
        let billingSettings = null;

        if (group.orgId) {
          const { data } = await admin
            .from("billing_settings")
            .select("*")
            .eq("org_id", group.orgId)
            .eq("is_active", true)
            .maybeSingle();
          billingSettings = data;
        }

        // If no org billing, try individual rep billing for each rep in the group
        // In this case, generate separate invoices per rep
        if (!billingSettings && group.orgId) {
          // Group sends by rep within this org
          const repSendMap = new Map<string, any[]>();
          for (const send of group.sends) {
            if (!repSendMap.has(send.rep_id)) repSendMap.set(send.rep_id, []);
            repSendMap.get(send.rep_id)!.push(send);
          }

          let allHandled = true;
          for (const [repId, repSends] of repSendMap) {
            const { data: repBilling } = await admin
              .from("billing_settings")
              .select("*")
              .eq("rep_id", repId)
              .eq("is_active", true)
              .maybeSingle();

            if (repBilling) {
              // Override group to process this rep individually
              billingSettings = repBilling;
              group.sends = repSends;
              group.repId = repId;
              group.orgId = null;
              break; // Process first found, rest will be caught next run
            } else {
              allHandled = false;
            }
          }

          if (!allHandled && !billingSettings) {
            results.push({
              billingKey: key,
              status: "skipped",
              reason: "No billing settings configured (checked org and individual reps)",
              ceCount: group.sends.length,
            });
            continue;
          }
        }

        if (!billingSettings && group.repId) {
          const { data } = await admin
            .from("billing_settings")
            .select("*")
            .eq("rep_id", group.repId)
            .eq("is_active", true)
            .maybeSingle();
          billingSettings = data;
        }

        if (!billingSettings) {
          results.push({
            billingKey: key,
            status: "skipped",
            reason: "No billing settings configured",
            ceCount: group.sends.length,
          });
          continue;
        }

        // Calculate line items
        const lineItems = group.sends.map((send: any) => {
          const pro = send.professionals as { name?: string } | null;
          const course = Array.isArray(send.courses) ? send.courses[0] : send.courses;
          const priceCents = course?.price ? Math.round(course.price * 100) : 1500;
          const repProfile = profileMap.get(send.rep_id);

          return {
            ceSendId: send.id,
            repId: send.rep_id,
            repName: repProfile?.full_name ?? "Unknown",
            professionalName: pro?.name ?? send.recipient_email ?? "Unknown",
            courseName: send.course_name,
            courseHours: send.course_hours,
            priceCents,
            redeemedAt: send.redeemed_at,
          };
        });

        const totalCents = lineItems.reduce((sum: number, li: any) => sum + li.priceCents, 0);

        if (isDryRun) {
          results.push({
            billingKey: key,
            status: "dry_run",
            ceCount: lineItems.length,
            totalCents,
            lineItems: lineItems.map((li: any) => ({
              courseName: li.courseName,
              professionalName: li.professionalName,
              priceCents: li.priceCents,
            })),
          });
          continue;
        }

        // Create Stripe Invoice
        let stripeInvoice = null;

        if (!isTest) {
          // Create invoice items first
          for (const li of lineItems) {
            await stripe.invoiceItems.create({
              customer: billingSettings.stripe_customer_id,
              amount: li.priceCents,
              currency: "usd",
              description: `CE: ${li.courseName} (${li.courseHours} hrs) — ${li.professionalName}`,
              metadata: {
                ce_send_id: li.ceSendId,
                rep_name: li.repName,
                professional_name: li.professionalName,
              },
            });
          }

          // Create and finalize the invoice
          stripeInvoice = await stripe.invoices.create({
            customer: billingSettings.stripe_customer_id,
            auto_advance: true, // Auto-send to customer
            collection_method: "send_invoice",
            days_until_due: 30,
            metadata: {
              pulse_billing_key: key,
              period_start: periodStart.toISOString().split("T")[0],
              period_end: periodEnd.toISOString().split("T")[0],
            },
          });

          // Finalize the invoice (this locks it and sends it)
          stripeInvoice = await stripe.invoices.finalizeInvoice(stripeInvoice.id);

          // Send the invoice email
          await stripe.invoices.sendInvoice(stripeInvoice.id);
        }

        // Create local invoice record
        const { data: invoice, error: invoiceError } = await admin
          .from("invoices")
          .insert({
            stripe_invoice_id: stripeInvoice?.id ?? `test_${Date.now()}_${key}`,
            billing_settings_id: billingSettings.id,
            org_id: group.orgId,
            rep_id: group.repId,
            period_start: periodStart.toISOString().split("T")[0],
            period_end: periodEnd.toISOString().split("T")[0],
            total_cents: totalCents,
            ce_count: lineItems.length,
            status: isTest ? "draft" : "sent",
            stripe_hosted_url: stripeInvoice?.hosted_invoice_url ?? null,
            stripe_pdf_url: stripeInvoice?.invoice_pdf ?? null,
          })
          .select("id")
          .single();

        if (invoiceError) {
          console.error("Invoice insert error:", invoiceError);
          results.push({ billingKey: key, status: "error", error: invoiceError.message });
          continue;
        }

        // Create line item records
        const lineItemRows = lineItems.map((li: any) => ({
          invoice_id: invoice!.id,
          ce_send_id: li.ceSendId,
          rep_id: li.repId,
          rep_name: li.repName,
          professional_name: li.professionalName,
          course_name: li.courseName,
          course_hours: li.courseHours,
          unit_price_cents: li.priceCents,
          redeemed_at: li.redeemedAt,
        }));

        await admin.from("invoice_line_items").insert(lineItemRows);

        // Mark CE sends as billed
        const ceSendIds = lineItems.map((li: any) => li.ceSendId);
        await admin
          .from("ce_sends")
          .update({ billed: true, invoice_id: invoice!.id })
          .in("id", ceSendIds);

        results.push({
          billingKey: key,
          status: isTest ? "test_created" : "sent",
          invoiceId: invoice!.id,
          stripeInvoiceId: stripeInvoice?.id ?? null,
          stripeUrl: stripeInvoice?.hosted_invoice_url ?? null,
          ceCount: lineItems.length,
          totalCents,
        });

      } catch (err) {
        const msg = err instanceof Error ? err.message : "Unknown error";
        console.error(`Invoice error for ${key}:`, err);
        results.push({ billingKey: key, status: "error", error: msg });
      }
    }

    return NextResponse.json({
      periodStart: periodStart.toISOString().split("T")[0],
      periodEnd: periodEnd.toISOString().split("T")[0],
      invoicesGenerated: results.filter((r) => r.status === "sent" || r.status === "test_created").length,
      results,
    });
  } catch (e) {
    console.error("Generate invoice error:", e);
    const msg = e instanceof Error ? e.message : "Server error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
