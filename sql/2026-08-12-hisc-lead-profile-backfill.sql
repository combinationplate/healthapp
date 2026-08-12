-- 2026-08-12 — Backfill profiles for hiscornerstone.com free-CE leads
--
-- Bug: /api/hisc/ce-request fired upsert_profile_safe + a profiles UPDATE
-- without checking errors. When the profile row never got created, the lead
-- rendered in the admin CE log as "Unknown" with no discipline/location.
-- The auth user's raw_user_meta_data has everything (it was set at
-- createUser time), so this backfills every HISC lead's profile from it.
--
-- Run in Supabase Dashboard → SQL Editor. Safe to run repeatedly:
-- existing non-empty profile values are never overwritten.

insert into public.profiles (id, role, full_name, email, discipline, city, state, facility, seeking_ce)
select
  u.id,
  'professional',
  u.raw_user_meta_data->>'full_name',
  u.email,
  u.raw_user_meta_data->>'discipline',
  u.raw_user_meta_data->>'city',
  u.raw_user_meta_data->>'state',
  u.raw_user_meta_data->>'facility',
  true
from auth.users u
where u.raw_user_meta_data->>'signup_source' = 'hiscornerstone_free_ce'
on conflict (id) do update set
  full_name  = coalesce(nullif(profiles.full_name, ''),  excluded.full_name),
  email      = coalesce(nullif(profiles.email, ''),      excluded.email),
  discipline = coalesce(nullif(profiles.discipline, ''), excluded.discipline),
  city       = coalesce(nullif(profiles.city, ''),       excluded.city),
  state      = coalesce(nullif(profiles.state, ''),      excluded.state),
  facility   = coalesce(nullif(profiles.facility, ''),   excluded.facility),
  seeking_ce = true;

-- ── Verify the backfill took (should show Katherine Garcia fully populated) ──
select p.id, p.full_name, p.email, p.discipline, p.city, p.state, p.facility, p.seeking_ce
from public.profiles p
where p.email = 'katgarcia1@verizon.net';

-- ── Optional root-cause check: why did the original insert path fail? ──
-- 1. Does the rpc the route calls actually exist, and what does it do?
-- select pg_get_functiondef(oid) from pg_proc where proname = 'upsert_profile_safe';
-- 2. Any HISC leads still missing a profile row entirely?
-- select u.id, u.email, u.created_at
-- from auth.users u
-- left join public.profiles p on p.id = u.id
-- where u.raw_user_meta_data->>'signup_source' = 'hiscornerstone_free_ce'
--   and p.id is null;
