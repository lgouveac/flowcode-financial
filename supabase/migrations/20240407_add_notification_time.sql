
ALTER TABLE email_notification_settings
ADD COLUMN notification_time time NOT NULL DEFAULT '09:00';
