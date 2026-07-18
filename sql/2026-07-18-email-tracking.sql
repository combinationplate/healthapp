-- Email delivery tracking (run once in Supabase SQL editor)
-- Records whether the CE email was actually accepted by Resend, so
-- silent delivery failures become visible.

ALTER TABLE ce_sends ADD COLUMN IF NOT EXISTS email_sent_at timestamptz;
ALTER TABLE ce_sends ADD COLUMN IF NOT EXISTS email_error text;

-- Quick health check you can run anytime — recent sends and their email status:
-- SELECT created_at, course_name, recipient_email, source,
--        email_sent_at, email_error, clicked_at
-- FROM ce_sends ORDER BY created_at DESC LIMIT 25;
