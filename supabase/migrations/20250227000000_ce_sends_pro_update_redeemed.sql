-- Professionals can set redeemed_at on ce_sends sent to them (for "Mark as Redeemed" / webhook)
create policy "Professionals can update redeemed_at on their ce_sends"
  on public.ce_sends for update
  using (
    exists (
      select 1 from public.professionals p
      where p.id = ce_sends.professional_id
      and lower(p.email) = lower(auth.jwt() ->> 'email')
    )
  )
  with check (
    exists (
      select 1 from public.professionals p
      where p.id = ce_sends.professional_id
      and lower(p.email) = lower(auth.jwt() ->> 'email')
    )
  );
