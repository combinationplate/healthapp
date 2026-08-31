-- 2026-08-31 — Multi-state territories for reps
--
-- Reps who cover more than one state could only ever see their profiles.state
-- in Discover. territory_states holds the ADDITIONAL states a rep covers;
-- profiles.state stays the "home" state (used for city/flyers/onboarding).
-- Effective territory = state + territory_states (deduped) — computed in
-- app code (lib/territory.ts), no DB logic needed.
--
-- Run in Supabase Dashboard → SQL Editor. Safe to re-run.

alter table public.profiles
  add column if not exists territory_states text[];

comment on column public.profiles.territory_states is
  'Additional US state codes a rep covers beyond profiles.state. NULL/empty = home state only.';
