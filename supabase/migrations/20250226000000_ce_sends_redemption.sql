-- Add product_id (for redeem link) and redeemed_at (redemption status) to ce_sends
alter table public.ce_sends add column if not exists product_id int;
alter table public.ce_sends add column if not exists redeemed_at timestamptz;

-- Professionals can read ce_sends where the professional's email matches the logged-in user's email
create policy "Professionals can view ce_sends sent to them"
  on public.ce_sends for select
  using (
    exists (
      select 1 from public.professionals p
      where p.id = ce_sends.professional_id
      and lower(p.email) = lower(auth.jwt() ->> 'email')
    )
  );

-- Professionals can read their own contact row(s) (matched by email) so they can see sends
create policy "Professionals can read own contact by email"
  on public.professionals for select
  using (lower(email) = lower(auth.jwt() ->> 'email'));

-- Professionals can read rep (users) name when that rep sent them a CE (for "sent by" display)
create policy "Professionals can read rep names for their ce_sends"
  on public.users for select
  using (
    exists (
      select 1 from public.ce_sends s
      join public.professionals p on p.id = s.professional_id
      where s.rep_id = users.id
      and lower(p.email) = lower(auth.jwt() ->> 'email')
    )
  );
