import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

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
      .select("org_id, role")
      .eq("id", user.id)
      .single();

    // Fetch invoices scoped to org or rep
    let invoices = [];

    const isManager = profile?.role === "manager" || profile?.role === "admin";

    if (profile?.org_id && isManager) {
      // Managers see org-level invoices
      const { data } = await admin
        .from("invoices")
        .select("*, invoice_line_items(*)")
        .eq("org_id", profile.org_id)
        .order("period_start", { ascending: false })
        .limit(24);
      invoices = data ?? [];
    } else if (profile?.org_id && !isManager) {
      // Reps in an org see a "your company handles billing" message
      invoices = [];
    } else {
      const { data } = await admin
        .from("invoices")
        .select("*, invoice_line_items(*)")
        .eq("rep_id", user.id)
        .order("period_start", { ascending: false })
        .limit(24);
      invoices = data ?? [];
    }

    return NextResponse.json({ invoices });
  } catch (e) {
    console.error("Invoices error:", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
