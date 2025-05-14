
-- Remove notification_time column from email_notification_settings
ALTER TABLE email_notification_settings
DROP COLUMN IF EXISTS notification_time;

-- Remove notification_time column from employee_email_settings
ALTER TABLE employee_email_settings
DROP COLUMN IF EXISTS notification_time;
