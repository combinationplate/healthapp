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

  // Get rep's state for territory filtering
  const { data: repProfile } = await admin
    .from("profiles")
    .select("state")
    .eq("id", user.id)
    .single();

  // Discoverable = opted in (seeking_ce) OR has an open pending request —
  // someone with an open request is, by definition, seeking CE.
  const { data: pendingReqRows } = await admin
    .from("ce_requests")
    .select("professional_id")
    .eq("status", "pending");
  const pendingProIds = [
    ...new Set(
      (pendingReqRows ?? [])
        .map((r: { professional_id: string }) => r.professional_id)
        .filter(Boolean)
    ),
  ];

  let query = admin
    .from("profiles")
    .select("id, full_name, discipline, city, state, facility, email")
    .eq("role", "professional")
    .neq("id", user.id);
  query = pendingProIds.length
    ? query.or(`seeking_ce.eq.true,id.in.(${pendingProIds.join(",")})`)
    : query.eq("seeking_ce", true);

  // House account (Pulse Team) has no territory — it fulfills nationwide.
  const HOUSE_EMAIL = (process.env.HOUSE_ACCOUNT_EMAIL || "hello@pulsereferrals.com").toLowerCase();
  const isHouse = (user.email ?? "").toLowerCase() === HOUSE_EMAIL;
  if (repProfile?.state && !isHouse) {
    query = query.eq("state", repProfile.state);
  }

  const { data: professionals } = await query.limit(50);

  const proIds = (professionals ?? []).map((p: { id: string }) => p.id);

  // Get their pending requests
  let requests: { professional_id: string; topic: string; hours: number; deadline: string; created_at: string }[] = [];
  // Get the set of professional IDs this rep has already sent a CE to (unlocks email)
  let unlockedIds = new Set<string>();

  // Fetch rep's network emails (always — needed to match against discovered pros)
  const { data: networkPros } = await admin
    .from("professionals")
    .select("email")
    .eq("rep_id", user.id);
  const networkEmails = new Set(
    (networkPros ?? []).map((n: { email: string }) => n.email?.toLowerCase()).filter(Boolean)
  );

  if (proIds.length > 0) {
    const [{ data: ceRequests }, { data: ceSends }] = await Promise.all([
      admin
        .from("ce_requests")
        .select("professional_id, topic, hours, deadline, created_at")
        .in("professional_id", proIds)
        .eq("status", "pending"),
      admin
        .from("ce_sends")
        .select("professional_id")
        .eq("rep_id", user.id)
        .in("professional_id", proIds),
    ]);
    requests = ceRequests ?? [];
    unlockedIds = new Set((ceSends ?? []).map((s: { professional_id: string }) => s.professional_id));
  }

  const result = (professionals ?? []).map((p: {
    id: string;
    full_name: string | null;
    discipline: string | null;
    city: string | null;
    state: string | null;
    facility: string | null;
    email: string | null;
  }) => ({
    id: p.id,
    name: p.full_name ?? "Unknown",
    email: (unlockedIds.has(p.id) || networkEmails.has(p.email?.toLowerCase() ?? "")) ? (p.email ?? null) : null,
    discipline: p.discipline,
    city: p.city,
    state: p.state,
    facility: p.facility,
    requests: requests.filter((r) => r.professional_id === p.id),
  }));

  // Most recent open request first; profiles with no open request sink to the bottom.
  const latestTs = (reqs: { created_at: string }[]) =>
    reqs.length ? Math.max(...reqs.map((r) => new Date(r.created_at).getTime())) : 0;
  result.sort((a, b) => latestTs(b.requests) - latestTs(a.requests));

  return NextResponse.json({
    professionals: result,
    cities: [...new Set(result.map((p) => p.city).filter(Boolean))].sort(),
  });
}