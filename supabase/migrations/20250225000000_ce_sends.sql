-- CE sends: record of a rep sending a CE course to a professional (coupon, email sent, etc.)
create table if not exists public.ce_sends (
  id uuid primary key default gen_random_uuid(),
  rep_id uuid not null references public.users(id) on delete cascade,
  professional_id uuid not null references public.professionals(id) on delete cascade,
  course_name text not null,
  course_hours int not null,
  discount text not null check (discount in ('100% Free', '50% Off', '25% Off')),
  coupon_code text not null,
  personal_message text,
  created_at timestamptz default now()
);

alter table public.ce_sends enable row level security;

create policy "Reps can manage their own ce_sends"
  on public.ce_sends for all
  using (
    rep_id = auth.uid()
    and exists (
      select 1 from public.professionals p
      where p.id = ce_sends.professional_id and p.rep_id = auth.uid()
    )
  )
  with check (
    rep_id = auth.uid()
    and exists (
      select 1 from public.professionals p
      where p.id = ce_sends.professional_id and p.rep_id = auth.uid()
    )
  );

create index if not exists ce_sends_rep_id_idx on public.ce_sends(rep_id);
create index if not exists ce_sends_professional_id_idx on public.ce_sends(professional_id);
