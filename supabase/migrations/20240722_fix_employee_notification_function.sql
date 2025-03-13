
-- Fix the check_employee_notifications function to use direct token authentication
CREATE OR REPLACE FUNCTION public.check_employee_notifications()
 RETURNS void
 LANGUAGE plpgsql
AS $function$
DECLARE
    notification_time time;
    curr_day integer;
    template_record RECORD;
    employee_record RECORD;
    monthly_record RECORD;
    invoice_record RECORD;
    auth_token text := 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml0bHB2cGR3Z2l3YmRwcWhlZW13Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDAxOTA5NzEsImV4cCI6MjA1NTc2Njk3MX0.gljQ6JAfbMzP-cbA68Iz21vua9YqAqVQgpB-eLk6nAg';
    response RECORD;
BEGIN
    -- Get settings
    SELECT notification_time INTO notification_time
    FROM employee_email_settings
    LIMIT 1;
    
    -- Get current notification day of month
    SELECT employee_emails_send_day INTO curr_day
    FROM global_settings
    LIMIT 1;

    -- Only proceed if it's the correct day of month
    IF NOT (EXTRACT(DAY FROM CURRENT_DATE) = curr_day) THEN
        RAISE NOTICE 'Not the correct day for employee notifications. Current day: %, Notification day: %', 
            EXTRACT(DAY FROM CURRENT_DATE), curr_day;
        RETURN;
    END IF;

    -- Only proceed if current time matches notification time (within a minute)
    IF NOT (CURRENT_TIME BETWEEN notification_time - INTERVAL '1 minute' AND notification_time + INTERVAL '1 minute') THEN
        RAISE NOTICE 'Not the correct time for employee notifications. Current time: %, Notification time: %', 
            CURRENT_TIME, notification_time;
        RETURN;
    END IF;

    RAISE NOTICE 'Starting employee notifications process at % on day %', notification_time, curr_day;

    -- Get invoice template
    SELECT id, subject, content
    INTO template_record
    FROM email_templates
    WHERE type = 'employees'
      AND subtype = 'invoice'
      AND is_default = true
    LIMIT 1;

    -- Send invoice emails
    IF template_record.id IS NOT NULL THEN
        FOR employee_record IN 
            SELECT e.*, mv.amount 
            FROM employees e
            JOIN employee_monthly_values mv ON e.id = mv.employee_id
            WHERE e.status = 'active'
            AND mv.month = TO_CHAR(CURRENT_DATE, 'YYYY-MM')
        LOOP
            -- Send email using the edge function with direct token
            PERFORM net.http_post(
                url:='https://itlpvpdwgiwbdpqheemw.supabase.co/functions/v1/send-email',
                headers:=jsonb_build_object(
                    'Content-Type', 'application/json',
                    'Authorization', 'Bearer ' || auth_token
                ),
                body:=jsonb_build_object(
                    'to', employee_record.email,
                    'subject', template_record.subject,
                    'content', template_record.content,
                    'nome_funcionario', employee_record.name,
                    'valor_nota', employee_record.amount,
                    'data_nota', CURRENT_DATE
                )
            );

            -- Log the email sending attempt
            RAISE NOTICE 'Invoice email sent to employee % (%).', 
                employee_record.name,
                employee_record.email;
        END LOOP;
    END IF;

    -- Get hours template
    SELECT id, subject, content
    INTO template_record
    FROM email_templates
    WHERE type = 'employees'
      AND subtype = 'hours'
      AND is_default = true
    LIMIT 1;

    -- Send hours emails  
    IF template_record.id IS NOT NULL THEN
        FOR employee_record IN 
            SELECT e.* 
            FROM employees e
            WHERE e.status = 'active'
        LOOP
            -- Get total hours for the current month if available
            SELECT SUM(COALESCE(work_hours, 0)) AS total_hours
            INTO monthly_record
            FROM employee_hours 
            WHERE employee_id = employee_record.id
            AND EXTRACT(MONTH FROM work_date) = EXTRACT(MONTH FROM CURRENT_DATE)
            AND EXTRACT(YEAR FROM work_date) = EXTRACT(YEAR FROM CURRENT_DATE);
            
            -- Send email using the edge function with direct token
            PERFORM net.http_post(
                url:='https://itlpvpdwgiwbdpqheemw.supabase.co/functions/v1/send-email',
                headers:=jsonb_build_object(
                    'Content-Type', 'application/json',
                    'Authorization', 'Bearer ' || auth_token
                ),
                body:=jsonb_build_object(
                    'to', employee_record.email,
                    'subject', template_record.subject,
                    'content', template_record.content,
                    'nome_funcionario', employee_record.name,
                    'total_horas', COALESCE(monthly_record.total_hours, 0),
                    'periodo', TO_CHAR(CURRENT_DATE, 'MM/YYYY')
                )
            );

            -- Log the email sending attempt
            RAISE NOTICE 'Hours email sent to employee % (%).',
                employee_record.name,
                employee_record.email;
        END LOOP;
    END IF;
    
    RAISE NOTICE 'Employee notification process completed successfully.';
END;
$function$;

-- Unschedule the old employee notification job if it exists
SELECT cron.unschedule('invoke-employee-notifications-daily');

-- Create a new cron job that uses the token directly
SELECT cron.schedule(
  'invoke-employee-notifications-daily-fixed',
  '0 9 * * *', -- at 9 AM every day
  $$
  SELECT net.http_post(
    url:='https://itlpvpdwgiwbdpqheemw.supabase.co/functions/v1/trigger-employee-notifications',
    headers:=jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml0bHB2cGR3Z2l3YmRwcWhlZW13Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDAxOTA5NzEsImV4cCI6MjA1NTc2Njk3MX0.gljQ6JAfbMzP-cbA68Iz21vua9YqAqVQgpB-eLk6nAg'
    ),
    body:='{}'::jsonb
  ) as request_id;
  $$
);
