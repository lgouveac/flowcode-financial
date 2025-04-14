
-- Create payment_reminder_settings table if it doesn't exist
CREATE TABLE IF NOT EXISTS payment_reminder_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  notification_time TIME NOT NULL DEFAULT '09:00:00',
  days_interval INT NOT NULL DEFAULT 7,
  active BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default settings if table is empty
INSERT INTO payment_reminder_settings (notification_time, days_interval, active)
SELECT '09:00:00', 7, false
WHERE NOT EXISTS (SELECT 1 FROM payment_reminder_settings);

-- Create payment_reminder_log table to track sent reminders
CREATE TABLE IF NOT EXISTS payment_reminder_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id),
  payment_id UUID REFERENCES payments(id),
  subject TEXT NOT NULL,
  days_overdue INT NOT NULL,
  sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create function to get payment reminder settings
CREATE OR REPLACE FUNCTION get_payment_reminder_settings()
RETURNS TABLE (
  id UUID,
  notification_time TIME,
  days_interval INT,
  active BOOLEAN
) LANGUAGE plpgsql AS $$
BEGIN
  RETURN QUERY
  SELECT 
    prs.id, 
    prs.notification_time, 
    prs.days_interval, 
    prs.active
  FROM payment_reminder_settings prs
  LIMIT 1;
END;
$$;

-- Create function to update payment reminder settings
CREATE OR REPLACE FUNCTION update_payment_reminder_settings(
  p_notification_time TIME,
  p_days_interval INT,
  p_active BOOLEAN
) RETURNS VOID LANGUAGE plpgsql AS $$
BEGIN
  UPDATE payment_reminder_settings
  SET 
    notification_time = p_notification_time,
    days_interval = p_days_interval,
    active = p_active,
    updated_at = NOW()
  WHERE id = (SELECT id FROM payment_reminder_settings LIMIT 1);
  
  -- If no rows exist, insert a new one
  IF NOT FOUND THEN
    INSERT INTO payment_reminder_settings (notification_time, days_interval, active)
    VALUES (p_notification_time, p_days_interval, p_active);
  END IF;
END;
$$;
