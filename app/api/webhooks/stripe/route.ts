import { createClient as createServiceClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import Stripe from "stripe";

function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY not configured");
  return new Stripe(key, { apiVersion: "2026-02-25.clover" });
}

// IMPORTANT: We need the raw body for signature verification.
// Next.js App Router gives us the raw Request object.

export async function POST(request: Request) {
  const stripe = getStripe();
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    console.error("STRIPE_WEBHOOK_SECRET not configured");
    return NextResponse.json({ error: "Webhook secret not configured" }, { status: 500 });
  }

  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    console.error("Webhook signature verification failed:", msg);
    return NextResponse.json({ error: `Signature verification failed: ${msg}` }, { status: 400 });
  }

  const admin = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  try {
    switch (event.type) {
      case "invoice.paid": {
        const invoice = event.data.object as Stripe.Invoice;
        const { error } = await admin
          .from("invoices")
          .update({
            status: "paid",
            paid_at: new Date().toISOString(),
          })
          .eq("stripe_invoice_id", invoice.id);

        if (error) {
          console.error("Failed to update invoice to paid:", error.message);
        } else {
          console.log(`Invoice ${invoice.id} marked as paid`);
        }
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        const { error } = await admin
          .from("invoices")
          .update({ status: "overdue" })
          .eq("stripe_invoice_id", invoice.id);

        if (error) {
          console.error("Failed to update invoice to overdue:", error.message);
        } else {
          console.log(`Invoice ${invoice.id} marked as overdue`);
        }
        break;
      }

      case "invoice.voided": {
        const invoice = event.data.object as Stripe.Invoice;
        const { error } = await admin
          .from("invoices")
          .update({ status: "void" })
          .eq("stripe_invoice_id", invoice.id);

        if (error) {
          console.error("Failed to update invoice to void:", error.message);
        } else {
          console.log(`Invoice ${invoice.id} marked as void`);
        }
        break;
      }

      case "invoice.finalized": {
        const invoice = event.data.object as Stripe.Invoice;
        const { error } = await admin
          .from("invoices")
          .update({
            stripe_hosted_url: invoice.hosted_invoice_url,
            stripe_pdf_url: invoice.invoice_pdf,
            status: "sent",
          })
          .eq("stripe_invoice_id", invoice.id);

        if (error) {
          console.error("Failed to update invoice URLs:", error.message);
        } else {
          console.log(`Invoice ${invoice.id} finalized, URLs updated`);
        }
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (e) {
    console.error("Webhook handler error:", e);
    return NextResponse.json({ error: "Webhook handler error" }, { status: 500 });
  }
}
