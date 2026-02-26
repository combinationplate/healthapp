import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { ceSendId } = body as { ceSendId: string };
    if (!ceSendId) {
      return NextResponse.json({ error: "Missing ceSendId" }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: row, error: fetchError } = await supabase
      .from("ce_sends")
      .select("id, professional_id")
      .eq("id", ceSendId)
      .single();

    if (fetchError || !row) {
      return NextResponse.json({ error: "CE send not found" }, { status: 404 });
    }

    const { data: pro } = await supabase
      .from("professionals")
      .select("email")
      .eq("id", (row as { professional_id: string }).professional_id)
      .single();

    if (!pro || (pro as { email: string }).email?.toLowerCase() !== user.email?.toLowerCase()) {
      return NextResponse.json({ error: "Not authorized to mark this course" }, { status: 403 });
    }

    const { error: updateError } = await supabase
      .from("ce_sends")
      .update({ redeemed_at: new Date().toISOString() })
      .eq("id", ceSendId);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
