import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import Stripe from "stripe";

function getStripe() {
  return new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: "2026-02-25.clover",
  });
}

export async function POST(request: Request) {
  const stripe = getStripe();
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { billingType, billingEmail, orgName } = await request.json() as {
      billingType: "org" | "rep";
      billingEmail: string;
      orgName?: string;
    };

    if (!billingType || !billingEmail) {
      return NextResponse.json({ error: "Missing billingType or billingEmail" }, { status: 400 });
    }

    // Validate email format
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(billingEmail)) {
      return NextResponse.json({ error: "Invalid email address" }, { status: 400 });
    }

    const admin = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Get user profile
    const { data: profile } = await admin
      .from("profiles")
      .select("id, full_name, org_id, role")
      .eq("id", user.id)
      .single();

    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    let orgId: string | null = null;
    let repId: string | null = null;

    if (billingType === "org") {
      // For now, allow any authenticated user to set up org billing
      // TODO: restrict to managers once roles are fully implemented

      // Create or get org
      if (profile.org_id) {
        orgId = profile.org_id;
        // Update org name if provided
        if (orgName) {
          await admin.from("orgs").update({ name: orgName }).eq("id", orgId);
        }
      } else {
        const { data: newOrg, error: orgError } = await admin
          .from("orgs")
          .insert({
            name: orgName || profile.full_name + "'s Company",
            billing_email: billingEmail,
          })
          .select("id")
          .single();

        if (orgError || !newOrg) {
          return NextResponse.json({ error: "Failed to create organization" }, { status: 500 });
        }

        orgId = newOrg.id;

        // Link profile to org
        await admin
          .from("profiles")
          .update({ org_id: orgId })
          .eq("id", user.id);
      }
    } else {
      repId = user.id;
    }

    // Check for existing billing settings
    const existingQuery = billingType === "org"
      ? admin.from("billing_settings").select("id, stripe_customer_id").eq("org_id", orgId!).eq("is_active", true).maybeSingle()
      : admin.from("billing_settings").select("id, stripe_customer_id").eq("rep_id", repId!).eq("is_active", true).maybeSingle();

    const { data: existing } = await existingQuery;

    let stripeCustomerId: string;

    if (existing?.stripe_customer_id) {
      // Update existing Stripe customer
      stripeCustomerId = existing.stripe_customer_id;
      await stripe.customers.update(stripeCustomerId, {
        email: billingEmail,
        name: billingType === "org" ? orgName : profile.full_name,
      });

      // Update billing settings
      await admin
        .from("billing_settings")
        .update({ billing_email: billingEmail })
        .eq("id", existing.id);
    } else {
      // Create new Stripe customer
      const customer = await stripe.customers.create({
        email: billingEmail,
        name: billingType === "org" ? (orgName || "Company") : (profile.full_name || "Rep"),
        metadata: {
          pulse_billing_type: billingType,
          ...(orgId ? { pulse_org_id: orgId } : {}),
          ...(repId ? { pulse_rep_id: repId } : {}),
        },
      });

      stripeCustomerId = customer.id;

      // Deactivate any old billing settings
      if (billingType === "org" && orgId) {
        await admin.from("billing_settings").update({ is_active: false }).eq("org_id", orgId);
      } else if (repId) {
        await admin.from("billing_settings").update({ is_active: false }).eq("rep_id", repId);
      }

      // Create billing settings
      await admin.from("billing_settings").insert({
        org_id: orgId,
        rep_id: repId,
        stripe_customer_id: stripeCustomerId,
        billing_email: billingEmail,
        billing_type: billingType,
        is_active: true,
      });

      // Store stripe customer ID on org too for quick access
      if (orgId) {
        await admin.from("orgs").update({ stripe_customer_id: stripeCustomerId }).eq("id", orgId);
      }
    }

    return NextResponse.json({ success: true, stripeCustomerId });
  } catch (e) {
    console.error("Billing setup error:", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const admin = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: profile } = await admin
      .from("profiles")
      .select("org_id")
      .eq("id", user.id)
      .single();

    // Check for org billing first, then rep billing
    let settings = null;

    if (profile?.org_id) {
      const { data } = await admin
        .from("billing_settings")
        .select("*")
        .eq("org_id", profile.org_id)
        .eq("is_active", true)
        .maybeSingle();
      settings = data;
    }

    if (!settings) {
      const { data } = await admin
        .from("billing_settings")
        .select("*")
        .eq("rep_id", user.id)
        .eq("is_active", true)
        .maybeSingle();
      settings = data;
    }

    // Get org name if exists
    let orgName = null;
    if (profile?.org_id) {
      const { data: org } = await admin
        .from("orgs")
        .select("name")
        .eq("id", profile.org_id)
        .single();
      orgName = org?.name;
    }

    return NextResponse.json({
      settings,
      orgName,
      hasOrg: !!profile?.org_id,
    });
  } catch (e) {
    console.error("Billing get error:", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
