-- 2026-08-14 — Managers were being enrolled in the rep_welcome drip sequence.
-- Code now enrolls managers in manager_welcome; this migration fixes accounts
-- that already signed up.
--
-- ⚠️ RUN AFTER the Vercel deploy that adds manager_welcome to
-- lib/drip/sequences.ts. If the drip cron (daily, 14:00 UTC / 9am Central)
-- runs against OLD code, it treats manager_welcome as an unknown sequence and
-- marks the enrollment completed — the manager would then get nothing.
--
-- Safe to re-run (idempotent).

-- 1) Stop the rep-focused emails for manager accounts
update drip_enrollments de
set completed = true
from profiles p
where p.id = de.user_id
  and p.role = 'manager'
  and de.sequence = 'rep_welcome'
  and de.completed = false;

-- 2) Enroll recently signed-up managers in manager_welcome.
--    Scoped to managers who hold a rep_welcome enrollment created in the last
--    14 days, so long-standing manager/test accounts don't suddenly get
--    welcome emails. next_send_at = now() → the next daily cron run sends
--    manager-welcome-0.
insert into drip_enrollments (user_id, sequence, current_step, next_send_at, completed)
select p.id, 'manager_welcome', 0, now(), false
from profiles p
join drip_enrollments de
  on de.user_id = p.id
 and de.sequence = 'rep_welcome'
where p.role = 'manager'
  and de.created_at > now() - interval '14 days'
on conflict (user_id, sequence) do nothing;

-- 3) Verify: expect the new manager listed with sequence manager_welcome,
--    current_step 0, completed false — and their rep_welcome row completed.
select p.full_name, p.role, de.sequence, de.current_step, de.completed, de.next_send_at
from drip_enrollments de
join profiles p on p.id = de.user_id
where p.role = 'manager'
order by de.created_at desc;
