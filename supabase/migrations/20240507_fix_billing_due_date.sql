
-- Fix the check_billing_notifications function to correctly handle due_day conversion
CREATE OR REPLACE FUNCTION public.check_billing_notifications()
 RETURNS void
 LANGUAGE plpgsql
AS $function$
DECLARE
    settings_notification_time time;
    current_time_var time;
    current_date_var date;
    template_record RECORD;
    billing_record RECORD;
    interval_record RECORD;
    response RECORD;
    due_date_this_month date;
BEGIN
    -- Get the notification time setting with explicit table reference to avoid ambiguity
    SELECT ens.notification_time INTO settings_notification_time
    FROM email_notification_settings ens
    LIMIT 1;
    
    -- If notification_time is NULL or empty, use a default value and log it
    IF settings_notification_time IS NULL THEN
        RAISE LOG 'Notification time is NULL, using default time (18:35:00)';
        settings_notification_time := '18:35:00'::time;
        
        -- Try to update the setting to a default value
        UPDATE email_notification_settings 
        SET notification_time = '18:35:00'::time
        WHERE notification_time IS NULL OR notification_time::text = '';
    END IF;
    
    -- Get current time and date
    current_time_var := CURRENT_TIME;
    current_date_var := CURRENT_DATE;
    
    -- Log the current time and notification time for debugging
    RAISE LOG 'Current time: %, Notification time: %', current_time_var, settings_notification_time;

    -- Only proceed if current time matches notification time (within a minute)
    IF NOT (current_time_var BETWEEN settings_notification_time - INTERVAL '1 minute' AND settings_notification_time + INTERVAL '1 minute') THEN
        RAISE LOG 'Notification time not matched. Current: %, Expected: % (±1 minute). Skipping email sending.',
            current_time_var, settings_notification_time;
        RETURN;
    END IF;

    RAISE LOG 'Notification time matched. Proceeding with email sending...';

    -- Get the default template for recurring billing
    SELECT id, subject, content
    INTO template_record
    FROM email_templates
    WHERE type = 'clients'
      AND subtype = 'recurring'
      AND is_default = true
    LIMIT 1;

    -- Only proceed if we have a template
    IF template_record.id IS NULL THEN
        RAISE LOG 'No default template found for recurring billing. Aborting.';
        RETURN;
    END IF;

    RAISE LOG 'Found default template (id: %)', template_record.id;

    -- For each notification interval
    FOR interval_record IN SELECT * FROM email_notification_intervals LOOP
        RAISE LOG 'Processing notification interval: % days before due date', interval_record.days_before;
        
        -- Find billings that need notification
        FOR billing_record IN
            SELECT rb.*, c.email, c.name
            FROM recurring_billing rb
            JOIN clients c ON rb.client_id = c.id
            WHERE rb.status = 'pending'
        LOOP
            -- Log for debugging which billing we're processing
            RAISE LOG 'Checking billing record id: %, due_day: %, client: %', 
                billing_record.id, billing_record.due_day, billing_record.name;
            
            -- Correctly handle due_day conversion to a date
            -- First create the date for this month with the billing due day
            due_date_this_month := date_trunc('month', current_date_var) + (billing_record.due_day - 1) * INTERVAL '1 day';
            
            -- If the day has passed this month, use next month
            IF due_date_this_month < current_date_var THEN
                due_date_this_month := date_trunc('month', current_date_var + INTERVAL '1 month') + 
                                      (billing_record.due_day - 1) * INTERVAL '1 day';
            END IF;
            
            RAISE LOG 'Calculated due date: % for billing: %', due_date_this_month, billing_record.id;
            
            -- Check if notification day matches today (X days before due date)
            IF due_date_this_month - interval_record.days_before * INTERVAL '1 day' = current_date_var THEN
                RAISE LOG 'Sending notification for billing: % to client: % (%) - Due date: % (% days before)', 
                    billing_record.id, billing_record.name, billing_record.email, due_date_this_month, interval_record.days_before;
                
                -- Send email using the edge function
                SELECT status, content
                INTO response
                FROM net.http_post(
                    url:='https://itlpvpdwgiwbdpqheemw.supabase.co/functions/v1/send-billing-email',
                    headers:=format(
                        '{"Content-Type": "application/json", "Authorization": "Bearer %s"}',
                        current_setting('app.settings.service_key')
                    )::jsonb,
                    body:=format(
                        '{"to": "%s", "subject": "%s", "content": "%s", "recipientName": "%s", "billingValue": %s, "dueDate": "%s", "daysUntilDue": %s}',
                        billing_record.email,
                        template_record.subject,
                        template_record.content,
                        billing_record.name,
                        billing_record.amount,
                        due_date_this_month::text,
                        interval_record.days_before
                    )::jsonb
                );

                -- Log the email sending attempt with more details
                RAISE LOG 'Email sending attempt to % (%). Response status: %, content: %',
                    billing_record.name,
                    billing_record.email,
                    response.status,
                    response.content;
            ELSE
                RAISE LOG 'Skipping billing: % - Due date: % does not match notification date % (% days before)',
                    billing_record.id, due_date_this_month, current_date_var, interval_record.days_before;
            END IF;
        END LOOP;
    END LOOP;
    
    RAISE LOG 'Notification check completed.';
END;
$function$;

-- Fix the cron job for trigger-notifications to use proper syntax
SELECT cron.unschedule('invoke-notifications-every-minute');

SELECT cron.schedule(
  'invoke-notifications-every-minute',
  '* * * * *', -- every minute
  $$
  SELECT net.http_post(
    url:='https://itlpvpdwgiwbdpqheemw.supabase.co/functions/v1/trigger-notifications',
    headers:=format(
      '{"Content-Type": "application/json", "Authorization": "Bearer %s"}',
      current_setting('app.settings.service_key')
    )::jsonb,
    body:='{}'::jsonb
  ) as request_id;
  $$
);
