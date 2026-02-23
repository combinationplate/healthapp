-- Add 'admin' to profiles only (for testing/role switcher). users.role stays manager | rep | professional.

alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles add constraint profiles_role_check
  check (role in ('manager', 'rep', 'professional', 'admin'));
