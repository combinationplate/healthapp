-- 2026-08-31 — CE Profile fields (rep-facing professional context)
--
-- Three optional fields that make a professional's requests more claimable:
--   work_setting      — structured setting/role (lib/ce-profile.ts WORK_SETTINGS)
--   license_renews_on — license renewal date (stored as the 1st of the month;
--                       UI collects month/year only)
--   ce_hours_needed   — CE hours still needed this renewal cycle
--
-- Collected progressively (request modal + My CE Profile card), never required.
-- Run in Supabase Dashboard → SQL Editor. Safe to re-run.

alter table public.profiles add column if not exists work_setting text;
alter table public.profiles add column if not exists license_renews_on date;
alter table public.profiles add column if not exists ce_hours_needed int;

comment on column public.profiles.work_setting is
  'Structured work setting from lib/ce-profile.ts WORK_SETTINGS. Optional.';
comment on column public.profiles.license_renews_on is
  'License renewal date (day is always 01 — month/year granularity). Optional.';
comment on column public.profiles.ce_hours_needed is
  'Self-reported CE hours still needed this renewal cycle. Optional.';
