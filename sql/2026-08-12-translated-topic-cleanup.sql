-- 2026-08-12 — Clean up CE request topics submitted through browser translators
--
-- Bug: the pro-dashboard topic dropdown had no value attributes, so when a
-- professional browsed with Google Translate / Edge translator on, the
-- TRANSLATED option label was submitted and stored ("Outro" = Portuguese
-- "Other") and then displayed to everyone on the demand map / open requests.
-- Client + server are now fixed; this repairs existing rows.
--
-- Run in Supabase Dashboard → SQL Editor. Scoped to deadline IS NOT NULL
-- (pro-dashboard requests always set a deadline; HISC free-text leads don't).

update public.ce_requests
set topic = 'Other'
where deadline is not null
  and topic in ('Outro','Otro','Autre','Andere','Altro','Другое','其他','Diğer','Outros','Otros','Outra');

-- Verify: any remaining pro-dashboard topics outside the canonical list?
select id, topic, status, created_at
from public.ce_requests
where deadline is not null
  and topic not in ('Ethics','Palliative Care','Mental Health','Chronic Disease Management','Patient Safety','Care Transitions','Other');
