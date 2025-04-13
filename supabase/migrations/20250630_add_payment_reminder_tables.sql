
-- Create payment_reminder_settings table
CREATE TABLE IF NOT EXISTS payment_reminder_settings (
  id INT PRIMARY KEY DEFAULT 1,
  notification_time TIME NOT NULL DEFAULT '09:00:00',
  days_interval INT NOT NULL DEFAULT 7,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Insert default settings if table is empty
INSERT INTO payment_reminder_settings (id, notification_time, days_interval, active)
VALUES (1, '09:00:00', 7, true)
ON CONFLICT (id) DO NOTHING;

-- Create payment_reminder_log table to track sent reminders
CREATE TABLE IF NOT EXISTS payment_reminder_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id),
  payment_id UUID REFERENCES payments(id),
  subject TEXT NOT NULL,
  days_overdue INT NOT NULL,
  sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create a function to check and send payment reminders
CREATE OR REPLACE FUNCTION check_payment_reminders()
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  settings_record RECORD;
  current_time_var TIME;
  last_reminder_date DATE;
  days_since_last INT;
  auth_token TEXT := 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml0bHB2cGR3Z2l3YmRwcWhlZW13Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDAxOTA5NzEsImV4cCI6MjA1NTc2Njk3MX0.gljQ6JAfbMzP-cbA68Iz21vua9YqAqVQgpB-eLk6nAg';
BEGIN
  -- Get reminder settings
  SELECT notification_time, days_interval, active 
  INTO settings_record
  FROM payment_reminder_settings
  WHERE id = 1;
  
  -- Exit if reminders are disabled
  IF NOT settings_record.active THEN
    RAISE LOG 'Payment reminders are disabled. Skipping check.';
    RETURN;
  END IF;
  
  -- Get current time
  current_time_var := CURRENT_TIME;
  
  -- Check if current time matches notification time (within 5 minutes)
  IF NOT (current_time_var BETWEEN settings_record.notification_time - INTERVAL '5 minutes' 
          AND settings_record.notification_time + INTERVAL '5 minutes') THEN
    RAISE LOG 'Not time to send payment reminders yet. Current: %, Scheduled: %', 
      current_time_var, settings_record.notification_time;
    RETURN;
  END IF;
  
  -- Check when the last reminder was sent
  SELECT CAST(MAX(sent_at) AS DATE) INTO last_reminder_date
  FROM payment_reminder_log;
  
  -- If we have sent reminders before, check if enough days have passed
  IF last_reminder_date IS NOT NULL THEN
    days_since_last := CURRENT_DATE - last_reminder_date;
    
    IF days_since_last < settings_record.days_interval THEN
      RAISE LOG 'Last reminders sent % days ago. Waiting for interval of % days.', 
        days_since_last, settings_record.days_interval;
      RETURN;
    END IF;
  END IF;
  
  -- All conditions met, trigger the reminder emails
  RAISE LOG 'Triggering payment reminder emails...';
  
  PERFORM net.http_post(
    url:='https://itlpvpdwgiwbdpqheemw.supabase.co/functions/v1/send-reminder-email',
    headers:=jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || auth_token
    ),
    body:='{}'::jsonb
  );
  
  RAISE LOG 'Payment reminder emails triggered successfully.';
END;
$$;

-- Create a cron job to check payment reminders every 5 minutes
SELECT cron.schedule(
  'check-payment-reminders',
  '*/5 * * * *',
  'SELECT check_payment_reminders()'
);
