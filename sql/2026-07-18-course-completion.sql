-- Course completion tracking (run once in Supabase SQL editor)
-- Adds the two columns the /api/webhooks/course-completed receiver writes.

ALTER TABLE ce_sends ADD COLUMN IF NOT EXISTS completed_at timestamptz;
ALTER TABLE ce_sends ADD COLUMN IF NOT EXISTS certificate_url text;

-- Helpful for the webhook's fallback matcher and future dashboard queries:
CREATE INDEX IF NOT EXISTS ce_sends_completed_at_idx ON ce_sends (completed_at);
