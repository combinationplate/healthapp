-- Flyer co-branding: company logo per org (2026-08-11)
-- Run this in the Supabase SQL editor BEFORE (or with) deploying the
-- flyer branding feature. Safe to re-run.

-- 1. Logo URL on the org (shown in the flyer header)
alter table public.orgs add column if not exists logo_url text;

-- 2. Public storage bucket for company logos.
--    All writes go through the service role in app/api/rep/branding/route.ts,
--    so no storage RLS policies are needed; public READ comes from public = true.
insert into storage.buckets (id, name, public)
values ('org-logos', 'org-logos', true)
on conflict (id) do nothing;
