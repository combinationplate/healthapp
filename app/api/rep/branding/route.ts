import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

// Flyer branding: upload / remove the company logo shown on QR flyers.
// The logo lives on the rep's ORG (orgs.logo_url), stored in the public
// "org-logos" storage bucket. All writes go through the service role here,
// so the bucket needs no storage RLS policies — see sql/2026-08-11-org-logos.sql.

const BUCKET = "org-logos";
const MAX_BYTES = 2 * 1024 * 1024; // 2MB
const ALLOWED_TYPES: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
};

function serviceClient() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

async function getOrgId(admin: ReturnType<typeof serviceClient>, userId: string) {
  const { data: profile } = await admin
    .from("profiles")
    .select("org_id")
    .eq("id", userId)
    .single();
  return (profile?.org_id as string | null) ?? null;
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const form = await request.formData();
    const file = form.get("logo");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }
    const ext = ALLOWED_TYPES[file.type];
    if (!ext) {
      return NextResponse.json(
        { error: "Logo must be a PNG, JPG, or WebP image" },
        { status: 400 }
      );
    }
    if (file.size > MAX_BYTES) {
      return NextResponse.json({ error: "Logo must be under 2MB" }, { status: 400 });
    }

    const admin = serviceClient();
    const orgId = await getOrgId(admin, user.id);
    if (!orgId) {
      return NextResponse.json(
        { error: "Set your company name first, then upload a logo" },
        { status: 400 }
      );
    }

    const path = `${orgId}/logo.${ext}`;
    const bytes = Buffer.from(await file.arrayBuffer());
    const { error: uploadError } = await admin.storage
      .from(BUCKET)
      .upload(path, bytes, { contentType: file.type, upsert: true });
    if (uploadError) {
      console.error("Logo upload failed:", uploadError.message);
      return NextResponse.json({ error: uploadError.message }, { status: 500 });
    }

    // Cache-bust so a replaced logo shows immediately (path is stable per ext)
    const { data: pub } = admin.storage.from(BUCKET).getPublicUrl(path);
    const logoUrl = `${pub.publicUrl}?v=${Date.now()}`;

    const { error: updateError } = await admin
      .from("orgs")
      .update({ logo_url: logoUrl })
      .eq("id", orgId);
    if (updateError) {
      console.error("orgs.logo_url update failed:", updateError.message);
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, logo_url: logoUrl });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const admin = serviceClient();
    const orgId = await getOrgId(admin, user.id);
    if (!orgId) return NextResponse.json({ success: true });

    // Remove any stored logo files for this org (one per allowed extension)
    const paths = Object.values(ALLOWED_TYPES).map((ext) => `${orgId}/logo.${ext}`);
    await admin.storage.from(BUCKET).remove(paths);

    const { error } = await admin
      .from("orgs")
      .update({ logo_url: null })
      .eq("id", orgId);
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
