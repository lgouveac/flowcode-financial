
-- Create missing tables and functions for payment reminders
CREATE TABLE IF NOT EXISTS public.payment_reminder_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  notification_time time DEFAULT '13:00:00',
  days_interval integer DEFAULT 7,
  active boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

-- Create email notification log table
CREATE TABLE IF NOT EXISTS public.email_notification_log (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id uuid REFERENCES clients(id),
  billing_id uuid REFERENCES recurring_billing(id),
  days_before integer,
  due_date date,
  payment_type text,
  sent_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

-- Enable RLS on new tables
ALTER TABLE public.payment_reminder_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_notification_log ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for payment_reminder_settings
CREATE POLICY "Allow authenticated users to select payment_reminder_settings" 
  ON public.payment_reminder_settings 
  FOR SELECT 
  USING (true);

CREATE POLICY "Allow authenticated users to update payment_reminder_settings" 
  ON public.payment_reminder_settings 
  FOR UPDATE 
  USING (true);

CREATE POLICY "Allow authenticated users to insert payment_reminder_settings" 
  ON public.payment_reminder_settings 
  FOR INSERT 
  WITH CHECK (true);

-- Create RLS policies for email_notification_log
CREATE POLICY "Allow authenticated users to select email_notification_log" 
  ON public.email_notification_log 
  FOR SELECT 
  USING (true);

CREATE POLICY "Allow authenticated users to insert email_notification_log" 
  ON public.email_notification_log 
  FOR INSERT 
  WITH CHECK (true);

-- Create functions for payment reminder settings
CREATE OR REPLACE FUNCTION public.get_payment_reminder_settings()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  result json;
BEGIN
  SELECT to_json(prs.*) INTO result
  FROM payment_reminder_settings prs
  LIMIT 1;
  
  IF result IS NULL THEN
    -- Insert default settings if none exist
    INSERT INTO payment_reminder_settings (notification_time, days_interval, active)
    VALUES ('13:00:00', 7, false)
    RETURNING to_json(payment_reminder_settings.*) INTO result;
  END IF;
  
  RETURN result;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_payment_reminder_settings(
  p_notification_time time,
  p_days_interval integer,
  p_active boolean
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
  -- Update or insert settings
  INSERT INTO payment_reminder_settings (notification_time, days_interval, active, updated_at)
  VALUES (p_notification_time, p_days_interval, p_active, now())
  ON CONFLICT (id) DO UPDATE SET
    notification_time = p_notification_time,
    days_interval = p_days_interval,
    active = p_active,
    updated_at = now();
    
  -- If no conflict occurred but no rows were updated, it means table was empty
  -- So we ensure at least one row exists
  IF NOT FOUND THEN
    UPDATE payment_reminder_settings 
    SET 
      notification_time = p_notification_time,
      days_interval = p_days_interval,
      active = p_active,
      updated_at = now()
    WHERE id = (SELECT id FROM payment_reminder_settings LIMIT 1);
  END IF;
END;
$function$;

-- Insert default payment reminder settings if none exist
INSERT INTO public.payment_reminder_settings (notification_time, days_interval, active)
SELECT '13:00:00', 7, false
WHERE NOT EXISTS (SELECT 1 FROM public.payment_reminder_settings);
