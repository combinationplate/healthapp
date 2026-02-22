export type UserRole = "manager" | "rep" | "professional";

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  company?: string;
  facility?: string;
  discipline?: string;
  state_licensed?: string;
  city_zip?: string;
  team_size?: string;
  avatar_initials?: string;
  credits?: number;
  created_at?: string;
  updated_at?: string;
}
