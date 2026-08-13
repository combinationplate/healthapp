-- 2026-08-13 — First-CE-free credit ("Your first CE is on us")
--
-- Decision: each rep's FIRST redeemed, non-test CE send is free. Stamped
-- explicitly at redemption time (auditable forever) rather than computed at
-- invoice time (fragile under pricing changes). Billing surfaces (admin
-- billing page, current-usage, invoice generation) all skip intro_credit rows.
--
-- Run in Supabase Dashboard → SQL Editor BEFORE deploying the code that
-- references the column.

alter table public.ce_sends
  add column if not exists intro_credit boolean not null default false;

-- Optional retro-grant: give existing reps their credit retroactively, so
-- early-access reps aren't worse off than new signups when billing goes live.
-- (Idempotent; stamps each rep's earliest redeemed real send.)
-- update public.ce_sends s
-- set intro_credit = true
-- where s.id = (
--   select s2.id from public.ce_sends s2
--   where s2.rep_id = s.rep_id and s2.is_test = false and s2.redeemed_at is not null
--   order by s2.redeemed_at asc limit 1
-- )
-- and s.is_test = false and s.redeemed_at is not null;
