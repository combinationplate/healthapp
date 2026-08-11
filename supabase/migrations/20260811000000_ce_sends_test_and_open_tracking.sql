-- Test sends + email open tracking on ce_sends.
--
-- is_test          rep sent this CE to themselves to preview the experience;
--                  excluded from stats, billing, drips, reminders, and demand intros.
-- resend_email_id  Resend message id of the delivery email, used to correlate
--                  webhook events (email.opened / email.clicked) back to the send.
-- opened_at        first time the professional opened the delivery email.
-- rep_notified_at  when we emailed the rep "they opened it" (one notification per send).

alter table public.ce_sends add column if not exists is_test boolean not null default false;
alter table public.ce_sends add column if not exists resend_email_id text;
alter table public.ce_sends add column if not exists opened_at timestamptz;
alter table public.ce_sends add column if not exists rep_notified_at timestamptz;

create index if not exists ce_sends_resend_email_id_idx
  on public.ce_sends(resend_email_id)
  where resend_email_id is not null;
