
-- Function to get payment reminder settings
CREATE OR REPLACE FUNCTION get_payment_reminder_settings()
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
  settings_record RECORD;
BEGIN
  SELECT * INTO settings_record
  FROM payment_reminder_settings
  WHERE id = 1;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'id', 1,
      'notification_time', '09:00',
      'days_interval', 7,
      'active', true
    );
  END IF;
  
  RETURN to_jsonb(settings_record);
END;
$$;

-- Function to update payment reminder settings
CREATE OR REPLACE FUNCTION update_payment_reminder_settings(
  p_notification_time TIME,
  p_days_interval INT,
  p_active BOOLEAN
)
RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO payment_reminder_settings (id, notification_time, days_interval, active, updated_at)
  VALUES (1, p_notification_time, p_days_interval, p_active, NOW())
  ON CONFLICT (id) DO UPDATE
  SET 
    notification_time = p_notification_time,
    days_interval = p_days_interval,
    active = p_active,
    updated_at = NOW();
END;
$$;
