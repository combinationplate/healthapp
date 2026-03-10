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
      const { data: orgInvoices } = await admin
        .from("invoices")
        .select("*, invoice_line_items(*)")
        .eq("org_id", profile.org_id)
        .order("period_start", { ascending: false })
        .limit(24);

      // Also get individual rep invoices for reps in this org
      const { data: orgMembers } = await admin
        .from("profiles")
        .select("id")
        .eq("org_id", profile.org_id);

      const memberIds = (orgMembers ?? []).map((m: { id: string }) => m.id);

      const { data: repInvoices } = memberIds.length > 0
        ? await admin
            .from("invoices")
            .select("*, invoice_line_items(*)")
            .in("rep_id", memberIds)
            .order("period_start", { ascending: false })
            .limit(24)
        : { data: [] };

      // Merge and deduplicate by id
      const allInvoices = [...(orgInvoices ?? []), ...(repInvoices ?? [])];
      const seen = new Set<string>();
      invoices = allInvoices.filter(inv => {
        if (seen.has(inv.id)) return false;
        seen.add(inv.id);
        return true;
      }).sort((a, b) => new Date(b.period_start).getTime() - new Date(a.period_start).getTime());
    } else if (profile?.org_id && !isManager) {
      // Reps in an org see only their own invoices (if billing individually)
      const { data } = await admin
        .from("invoices")
        .select("*, invoice_line_items(*)")
        .eq("rep_id", user.id)
        .order("period_start", { ascending: false })
        .limit(24);
      invoices = data ?? [];
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
