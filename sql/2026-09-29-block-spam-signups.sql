-- 2026-09-29 — Block bot signups at the source (Supabase "Before User Created" auth hook)
--
-- WHY: bots are pushing signups through Turnstile with real people's emails
-- (gmail dot-variants like da.y.na.gould.sbur.y@gmail.com) and gibberish
-- one-word names ("Kktse", "Nwvqcjjj"). This is "email bombing" — every fake
-- signup sends the victim a confirmation + our welcome email, which leads to
-- spam complaints against pulsereferrals.com's sending reputation.
--
-- This hook runs inside Supabase Auth BEFORE any user row is created, for every
-- signup path (the form, direct API calls with the public key, admin.createUser),
-- so it can't be bypassed from the browser. Rejected signups create nothing and
-- send no email.
--
-- RULES (reject when…)
--   1. Gmail / googlemail address with 3+ dots in the part before @ (dot-trick).
--   2. Gmail address whose dot/plus-normalized form already has an account.
--   3. Name is blank or a single word (need first + last) — skipped for
--      hiscornerstone.com free-CE leads (signup_source = hiscornerstone_free_ce).
--   4. Any name word of 4+ letters with no vowel, or 6+ consonants in a row
--      (ALL-CAPS words like LCSW / LMFT / PMHNP are treated as credentials and skipped).
-- FAIL-OPEN: if anything inside this function errors, the signup is ALLOWED —
-- a bug here must never lock out real users.
--
-- HOW TO INSTALL (2 steps):
--   A. Supabase Dashboard → SQL Editor → paste this whole file → Run.
--   B. Supabase Dashboard → Authentication → Hooks → "Before User Created"
--      → Add hook → type: Postgres → schema: public →
--      function: hook_block_spam_signups → Create/Enable.
-- Safe to re-run. To disable instantly: toggle the hook off in step B.

create or replace function public.hook_block_spam_signups(event jsonb)
returns jsonb
language plpgsql
as $$
declare
  v_email  text;
  v_meta   jsonb;
  v_name   text;
  v_source text;
  v_local  text;
  v_domain text;
  v_base   text;
  v_tokens text[];
  v_tok    text;
  v_letters text;
begin
  v_email  := lower(trim(coalesce(event->'user'->>'email', '')));
  v_meta   := coalesce(event->'user'->'user_metadata', '{}'::jsonb);
  v_name   := trim(regexp_replace(coalesce(v_meta->>'full_name', ''), '\s+', ' ', 'g'));
  v_source := coalesce(v_meta->>'signup_source', '');

  -- Not an email signup (phone/anonymous) → nothing to check.
  if v_email = '' or position('@' in v_email) = 0 then
    return '{}'::jsonb;
  end if;

  v_local  := split_part(v_email, '@', 1);
  v_domain := split_part(v_email, '@', 2);

  -- ── Rules 1 + 2: Gmail dot-trick ────────────────────────────────
  if v_domain in ('gmail.com', 'googlemail.com') then
    v_base := split_part(v_local, '+', 1);

    if length(v_base) - length(replace(v_base, '.', '')) >= 3 then
      return jsonb_build_object('error', jsonb_build_object(
        'http_code', 400,
        'message', 'Please sign up with your standard Gmail address (without extra dots).'));
    end if;

    if exists (
      select 1
      from auth.users u
      where split_part(lower(u.email), '@', 2) in ('gmail.com', 'googlemail.com')
        and replace(split_part(split_part(lower(u.email), '@', 1), '+', 1), '.', '')
            = replace(v_base, '.', '')
    ) then
      return jsonb_build_object('error', jsonb_build_object(
        'http_code', 400,
        'message', 'This email is already registered — log in or reset your password instead.'));
    end if;
  end if;

  -- ── Rules 3 + 4: name quality (not applied to hiscornerstone.com leads) ──
  if v_source <> 'hiscornerstone_free_ce' then
    -- Words that contain at least one letter ("RN," and "Jr." still count).
    select coalesce(array_agg(t), '{}')
      into v_tokens
      from unnest(string_to_array(v_name, ' ')) as t
     where t ~ '[[:alpha:]]';

    if coalesce(array_length(v_tokens, 1), 0) < 2 then
      return jsonb_build_object('error', jsonb_build_object(
        'http_code', 400,
        'message', 'Please enter your first and last name.'));
    end if;

    foreach v_tok in array v_tokens loop
      v_letters := regexp_replace(v_tok, '[^[:alpha:]]', '', 'g');
      -- ALL-CAPS words are credentials (LCSW, LMFT, PMHNP, FNP-BC) — skip them.
      continue when v_letters = upper(v_letters);
      v_letters := lower(v_letters);
      if (length(v_letters) >= 4 and v_letters !~ '[aeiouyàáâãäåèéêëìíîïòóôõöùúûüý]')
         or v_letters ~ '[bcdfghjklmnpqrstvwxz]{6,}' then
        return jsonb_build_object('error', jsonb_build_object(
          'http_code', 400,
          'message', 'Please enter your real first and last name.'));
      end if;
    end loop;
  end if;

  return '{}'::jsonb;
exception when others then
  -- Fail open: never block real signups because of a bug in this function.
  raise warning 'hook_block_spam_signups error: %', sqlerrm;
  return '{}'::jsonb;
end;
$$;

-- Only Supabase Auth may call this hook.
grant execute on function public.hook_block_spam_signups(jsonb) to supabase_auth_admin;
revoke execute on function public.hook_block_spam_signups(jsonb) from authenticated, anon, public;

-- ── Sanity checks (run after installing; expect the "expect" column to match) ──
select 'real pro' as case_, public.hook_block_spam_signups(
         '{"user":{"email":"sanity.check@example.com","user_metadata":{"full_name":"Grace Johnson, RN"}}}'
       ) = '{}'::jsonb as allowed, true as expect
union all
select 'gibberish one-word', public.hook_block_spam_signups(
         '{"user":{"email":"omar_marsa@msn.com","user_metadata":{"full_name":"Kktse"}}}'
       ) = '{}'::jsonb, false
union all
select 'gmail dot-trick', public.hook_block_spam_signups(
         '{"user":{"email":"da.y.na.gould.sbur.y@gmail.com","user_metadata":{"full_name":"Dayna Gouldsbury"}}}'
       ) = '{}'::jsonb, false
union all
select 'no-vowel two-word', public.hook_block_spam_signups(
         '{"user":{"email":"x@lsu.edu","user_metadata":{"full_name":"Nwvqcjjj Tmecjbxck"}}}'
       ) = '{}'::jsonb, false
union all
select 'HISC lead one-word', public.hook_block_spam_signups(
         '{"user":{"email":"lead@example.com","user_metadata":{"full_name":"Katherine","signup_source":"hiscornerstone_free_ce"}}}'
       ) = '{}'::jsonb, true;
