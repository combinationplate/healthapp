-- 2026-11-22  Unsubscribe from Pulse offer emails (needed before pilot invitations go out).
-- Additive and safe to run twice. Set by /api/email/unsubscribe; read by
-- lib/pilot/invites.ts and /api/drip/send.

alter table public.profiles
  add column if not exists marketing_opt_out_at timestamptz;

comment on column public.profiles.marketing_opt_out_at is
  'When this person unsubscribed from Pulse offer emails (course invitations, drip emails). Null = subscribed.';

-- Pilot invitations are recorded in drip_enrollments with sequence = 'pilot_invite'
-- (one completed row per person invited). This index keeps the daily lookup cheap.
create index if not exists drip_enrollments_sequence_created_idx
  on public.drip_enrollments (sequence, created_at);
