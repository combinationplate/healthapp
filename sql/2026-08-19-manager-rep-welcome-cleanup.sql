-- 2026-08-19 — Sharon Watkins (and any manager) double-enrolled in rep_welcome.
-- Root cause: app/api/notify-signup/route.ts still had the stale
-- manager → rep_welcome mapping (fixed in code same day). Each enrollment site
-- dedupes on its own sequence name, so the mismatch created two enrollments.
--
-- ⚠️ RUN THIS FIRST — before manually triggering /api/drip/send and before the
-- next daily cron (14:00 UTC / 9am Central) — or the manager gets rep emails.
-- Safe to re-run (idempotent). No deploy required for this part.

-- Kill rep_welcome for ALL manager-role profiles (covers Sharon + any future
-- signup that happens before the notify-signup fix is deployed)
update drip_enrollments de
set completed = true
from profiles p
where p.id = de.user_id
  and p.role = 'manager'
  and de.sequence = 'rep_welcome'
  and de.completed = false;

-- Verify: managers should show ONLY manager_welcome active
select p.full_name, de.sequence, de.current_step, de.completed, de.next_send_at
from drip_enrollments de
join profiles p on p.id = de.user_id
where p.role = 'manager'
order by de.created_at desc;
