-- Attribution: how a user heard about Pulse, captured on the signup form.
alter table public.profiles add column if not exists referral_source text;
