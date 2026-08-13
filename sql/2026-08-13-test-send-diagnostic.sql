-- 2026-08-13 — Diagnose: test CE send fails after the Woo coupon is created
--
-- Symptom: "Could not create any course coupons in the store" — but the store
-- shows the TEST coupon WAS created (team-t-aug26-mz2r, 2026-08-13 11:14).
-- So the ce_sends INSERT right after it is what failed. Run each block in
-- Supabase Dashboard → SQL Editor and eyeball the output.

-- 1. Do the 8/11 columns actually exist in prod? (expect 3 rows: is_test,
--    resend_email_id, source — if is_test or source is missing, that's the bug)
select column_name, data_type, is_nullable, column_default
from information_schema.columns
where table_schema = 'public' and table_name = 'ce_sends'
order by ordinal_position;

-- 2. Any CHECK constraint that rejects source = 'test' or discount values?
select conname, pg_get_constraintdef(oid) as definition
from pg_constraint
where conrelid = 'public.ce_sends'::regclass;

-- 3. rep_id FK: ce_sends.rep_id references public.users(id). Does the sending
--    account (the "Team" profile) have a users row? (0 rows here = FK violation)
select u.id, u.email, u.name
from public.users u
where u.id in (select id from public.profiles where full_name ilike 'team%');

-- 4. While you're here — who IS the "Team" profile? (same junk name that broke
--    the completion-email attribution)
select id, full_name, email, role, created_at
from public.profiles
where full_name ilike 'team%';
