-- 2026-09-29 — Clean out existing bot signups · FILE 1 of 2: PREVIEW (read-only, changes nothing)
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

with keep(email) as (values
  ('ztaylor120@gmail.com'), ('hello@hiscornerstone.com'), ('hello@pulsereferrals.com')
  -- , ('someone.real@example.com')   ← add real people here if needed
),
cand as (
  select
    u.id,
    u.email,
    coalesce(p.full_name, u.raw_user_meta_data->>'full_name') as name,
    coalesce(p.role, u.raw_user_meta_data->>'role') as role,
    u.created_at,
    u.email_confirmed_at,
    u.last_sign_in_at,
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
select c.email, c.name, c.role, c.created_at, c.email_confirmed_at, c.last_sign_in_at,
       concat_ws(' + ', case when c.name_problem is not null then 'fake name' end,
                        case when c.gmail_dot_trick then 'gmail dot-trick' end) as reason
from cand c
where (c.name_problem is not null or c.gmail_dot_trick)
  and not exists (select 1 from public.ce_requests r where r.professional_id = c.id or r.rep_id = c.id)
  and not exists (select 1 from public.ce_sends s where s.rep_id = c.id and s.is_test is not true)
  and not exists (select 1 from public.professionals pr where pr.rep_id = c.id)
  and not exists (select 1 from public.billing_settings b where b.rep_id = c.id)
order by c.created_at desc;
