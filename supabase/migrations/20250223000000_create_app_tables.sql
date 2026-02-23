-- Users: app-facing user record (synced from auth in app/callback)
create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  role text not null check (role in ('manager', 'rep', 'professional')) default 'professional',
  name text,
  created_at timestamptz default now()
);

alter table public.users enable row level security;

create policy "Users can read own row"
  on public.users for select using (auth.uid() = id);
create policy "Users can update own row"
  on public.users for update using (auth.uid() = id);
create policy "Users can insert own row"
  on public.users for insert with check (auth.uid() = id);

-- Professionals: contacts in a rep's network
create table if not exists public.professionals (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  phone text,
  facility text,
  discipline text,
  rep_id uuid not null references public.users(id) on delete cascade,
  created_at timestamptz default now()
);

alter table public.professionals enable row level security;

create policy "Reps can manage their own professionals"
  on public.professionals for all
  using (rep_id = auth.uid())
  with check (rep_id = auth.uid());

create index if not exists professionals_rep_id_idx on public.professionals(rep_id);

-- Touchpoints: log of rep activity with a professional
create table if not exists public.touchpoints (
  id uuid primary key default gen_random_uuid(),
  rep_id uuid not null references public.users(id) on delete cascade,
  professional_id uuid not null references public.professionals(id) on delete cascade,
  type text not null,
  notes text,
  points int default 0,
  created_at timestamptz default now()
);

alter table public.touchpoints enable row level security;

create policy "Reps can manage their own touchpoints"
  on public.touchpoints for all
  using (rep_id = auth.uid())
  with check (rep_id = auth.uid());

create index if not exists touchpoints_rep_id_idx on public.touchpoints(rep_id);
create index if not exists touchpoints_professional_id_idx on public.touchpoints(professional_id);

-- CE requests: professional requests for CE (linked to professional)
create table if not exists public.ce_requests (
  id uuid primary key default gen_random_uuid(),
  professional_id uuid not null references public.professionals(id) on delete cascade,
  topic text not null,
  hours int not null,
  deadline date,
  status text not null default 'pending' check (status in ('pending', 'fulfilled', 'cancelled')),
  created_at timestamptz default now()
);

alter table public.ce_requests enable row level security;

-- Reps can see CE requests for professionals in their network
create policy "Reps can view ce_requests for their professionals"
  on public.ce_requests for select
  using (
    exists (
      select 1 from public.professionals p
      where p.id = ce_requests.professional_id and p.rep_id = auth.uid()
    )
  );
create policy "Reps can insert ce_requests for their professionals"
  on public.ce_requests for insert
  with check (
    exists (
      select 1 from public.professionals p
      where p.id = ce_requests.professional_id and p.rep_id = auth.uid()
    )
  );
create policy "Reps can update ce_requests for their professionals"
  on public.ce_requests for update
  using (
    exists (
      select 1 from public.professionals p
      where p.id = ce_requests.professional_id and p.rep_id = auth.uid()
    )
  );

create index if not exists ce_requests_professional_id_idx on public.ce_requests(professional_id);
