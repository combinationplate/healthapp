-- Profiles table: one row per user, stores role for dashboard routing
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role text not null check (role in ('manager', 'rep', 'professional')) default 'professional',
  full_name text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- RLS: users can read and update their own profile; insert own (for auth callback)
alter table public.profiles enable row level security;

create policy "Users can read own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

create policy "Users can insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);
