import { createClient as createAdminClient } from "@supabase/supabase-js";

export type ProfileRole = "manager" | "rep" | "professional";

export interface Profile {
  id: string;
  role: ProfileRole;
  full_name: string | null;
  created_at?: string;
  updated_at?: string;
}

export async function getProfile(userId: string): Promise<Profile | null> {
  const admin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  const { data, error } = await admin
    .from("profiles")
    .select("id, role, full_name, created_at, updated_at")
    .eq("id", userId)
    .single();
  if (error || !data) return null;
  return data as Profile;
}
