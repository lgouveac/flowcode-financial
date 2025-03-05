
-- Improved check_billing_notifications function with better logging
CREATE OR REPLACE FUNCTION public.check_billing_notifications()
 RETURNS void
 LANGUAGE plpgsql
AS $function$
DECLARE
    notification_time time;
    current_time_var time;
    template_record RECORD;
    billing_record RECORD;
    interval_record RECORD;
    response RECORD;
BEGIN
    -- Get the notification time setting
    SELECT notification_time INTO notification_time
    FROM email_notification_settings
    LIMIT 1;
    
    -- Get current time
    current_time_var := CURRENT_TIME;
    
    -- Log the current time and notification time for debugging
    RAISE LOG 'Current time: %, Notification time: %', current_time_var, notification_time;

    -- Only proceed if current time matches notification time (within a minute)
    IF NOT (current_time_var BETWEEN notification_time - INTERVAL '1 minute' AND notification_time + INTERVAL '1 minute') THEN
        RAISE LOG 'Notification time not matched. Skipping email sending.';
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
              AND rb.due_day::text::date - INTERVAL '1 day' * interval_record.days_before = CURRENT_DATE
        LOOP
            RAISE LOG 'Sending notification for billing: % to client: % (%)', 
                billing_record.id, billing_record.name, billing_record.email;
            
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
                    (billing_record.due_day::text::date)::text,
                    interval_record.days_before
                )::jsonb
            );

            -- Log the email sending attempt with more details
            RAISE LOG 'Email sending attempt to % (%). Response status: %, content: %',
                billing_record.name,
                billing_record.email,
                response.status,
                response.content;
        END LOOP;
    END LOOP;
    
    RAISE LOG 'Notification check completed.';
END;
$function$;

-- Create a cron job to run the notification check every minute
SELECT cron.schedule(
    'check-billing-notifications',
    '* * * * *',
    'SELECT check_billing_notifications()'
);
