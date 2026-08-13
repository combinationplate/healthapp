-- 2026-08-13 — Allow source = 'test' on ce_sends (RUN IN PROD 2026-08-13)
--
-- The 2026-08-11 test-send feature inserts ce_sends rows with source='test',
-- but the live ce_sends_source_check constraint only allowed
-- manual/qr/bulk/request — so every test send failed AFTER creating its Woo
-- coupon, surfacing as "Could not create any course coupons in the store."
-- (The 8/11 migration added the is_test column but never widened this
-- constraint.) Also renamed the house profile full_name 'Team' → 'Pulse Team'
-- (id 8cfd82a2-b089-4e9d-8e55-e1c150331984, hello@pulsereferrals.com).

alter table public.ce_sends drop constraint ce_sends_source_check;
alter table public.ce_sends add constraint ce_sends_source_check
  check (source = any (array['manual'::text,'qr'::text,'bulk'::text,'request'::text,'test'::text]));
