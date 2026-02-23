import { createClient } from "@/lib/supabase/server";

export type ProfileRole = "manager" | "rep" | "professional";

export interface Profile {
  id: string;
  role: ProfileRole;
  full_name: string | null;
  created_at?: string;
  updated_at?: string;
}

export async function getProfile(userId: string): Promise<Profile | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("id, role, full_name, created_at, updated_at")
    .eq("id", userId)
    .single();

  if (error || !data) return null;
  return data as Profile;
}
