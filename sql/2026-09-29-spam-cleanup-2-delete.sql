-- 2026-09-29 — Clean out existing bot signups · FILE 2 of 2: DELETE (run only after reviewing the preview)
--
-- RUN AFTER 2026-09-29-block-spam-signups.sql (it reuses that function's name
-- rules, so this file uses the exact same definition of "fake name").
--
-- An account is treated as spam only when BOTH are true:
--   • fake name (one word / gibberish, same rules as the hook) OR a gmail
--     address with 3+ dots (dot-trick), AND
--   • zero real activity: no CE requests, no real CE sends, no contacts,
--     no billing setup.
-- Admin + house accounts and hiscornerstone.com leads are never touched.
--
-- STEP 1 — run  2026-09-29-spam-cleanup-1-preview.sql  (read-only). Eyeball the
--          list. If a real person shows up, add their email to the `keep` list
--          in BOTH files and re-run the preview.
-- STEP 2 — run  2026-09-29-spam-cleanup-2-delete.sql  (whole file). It stops
--          their drip emails, then deletes the accounts (profiles + users rows
--          cascade automatically). All-or-nothing: any error rolls it all back.

begin;

create temp table spam_ids on commit drop as
with keep(email) as (values
  ('ztaylor120@gmail.com'), ('hello@hiscornerstone.com'), ('hello@pulsereferrals.com')
  -- , ('someone.real@example.com')   ← keep in sync with the preview list
),
cand as (
  select
    u.id,
    public.hook_block_spam_signups(jsonb_build_object('user', jsonb_build_object(
      'email', 'name-check@example.invalid',
      'user_metadata', jsonb_build_object(
        'full_name', coalesce(p.full_name, u.raw_user_meta_data->>'full_name', ''),
        'signup_source', coalesce(u.raw_user_meta_data->>'signup_source', '')))))->'error'->>'message' as name_problem,
    (split_part(lower(u.email), '@', 2) in ('gmail.com', 'googlemail.com')
      and length(split_part(split_part(lower(u.email), '@', 1), '+', 1))
        - length(replace(split_part(split_part(lower(u.email), '@', 1), '+', 1), '.', '')) >= 3) as gmail_dot_trick
  from auth.users u
  left join public.profiles p on p.id = u.id
  where lower(u.email) not in (select email from keep)
    and coalesce(u.raw_user_meta_data->>'signup_source', '') <> 'hiscornerstone_free_ce'
)
select c.id
from cand c
where (c.name_problem is not null or c.gmail_dot_trick)
  and not exists (select 1 from public.ce_requests r where r.professional_id = c.id or r.rep_id = c.id)
  and not exists (select 1 from public.ce_sends s where s.rep_id = c.id and s.is_test is not true)
  and not exists (select 1 from public.professionals pr where pr.rep_id = c.id)
  and not exists (select 1 from public.billing_settings b where b.rep_id = c.id);

select count(*) as accounts_to_delete from spam_ids;

-- Stop any further drip/re-engagement emails to these addresses.
delete from public.drip_enrollments where user_id in (select id from spam_ids);

-- Drop the link from any CE-send rows (only if that column exists in prod).
do $$
begin
  if exists (select 1 from information_schema.columns
             where table_schema = 'public' and table_name = 'ce_sends' and column_name = 'user_id') then
    execute 'update public.ce_sends set user_id = null where user_id in (select id from spam_ids)';
  end if;
end $$;

-- Delete the accounts (profiles + users rows cascade).
delete from auth.users where id in (select id from spam_ids);

commit;
