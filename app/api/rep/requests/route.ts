import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Get professionals in this rep's network
  const { data: myPros } = await admin
    .from("professionals")
    .select("id, name, email, facility, discipline")
    .eq("rep_id", user.id);

  const myProIds = (myPros ?? []).map((p: { id: string }) => p.id);

  // Get requests from network professionals (where professional_id matches a pro in network)
  // We need to join through auth.users to match professional_id to professionals.email
  const { data: networkRequests } = await admin
    .from("ce_requests")
    .select("id, topic, hours, deadline, status, created_at, professional_id, rep_id")
    .eq("status", "pending")
    .or(`rep_id.eq.${user.id},rep_id.is.null`)
    .order("created_at", { ascending: false });

  // Get all pro profiles to match names
  const proUserIds = (networkRequests ?? []).map((r: { professional_id: string }) => r.professional_id);
  
  let proProfiles: { id: string; full_name: string | null; discipline: string | null; city: string | null; state: string | null; facility: string | null }[] = [];
  if (proUserIds.length > 0) {
    const { data } = await admin
      .from("profiles")
      .select("id, full_name, discipline, city, state, facility")
      .in("id", proUserIds);
    proProfiles = data ?? [];
  }

  const requests = (networkRequests ?? []).map((r: {
    id: string;
    topic: string;
    hours: number;
    deadline: string;
    status: string;
    created_at: string;
    professional_id: string;
    rep_id: string | null;
  }) => {
    const profile = proProfiles.find((p) => p.id === r.professional_id);
    const networkPro = myPros?.find((p: { email: string }) => {
      return false; // will match via profile lookup
    });
    const isInNetwork = myProIds.length > 0; // simplified for now
    return {
      id: r.id,
      topic: r.topic,
      hours: r.hours,
      deadline: r.deadline,
      status: r.status,
      created_at: r.created_at,
      professionalName: profile?.full_name ?? "Unknown Professional",
      discipline: profile?.discipline ?? null,
      facility: profile?.facility ?? null,
      city: profile?.city ?? null,
      state: profile?.state ?? null,
      isDirectRequest: r.rep_id === user.id,
      isInNetwork,
    };
  });

  return NextResponse.json({ requests });
}