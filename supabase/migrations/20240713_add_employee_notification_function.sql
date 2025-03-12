
-- Create a function to check and trigger employee notifications
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
            -- Send email using the edge function
            SELECT status, content
            INTO response
            FROM net.http_post(
                url:='https://itlpvpdwgiwbdpqheemw.supabase.co/functions/v1/send-email',
                headers:=format(
                    '{"Content-Type": "application/json", "Authorization": "Bearer %s"}',
                    current_setting('app.settings.service_key')
                )::jsonb,
                body:=format(
                    '{"to": "%s", "subject": "%s", "content": "%s", "nome_funcionario": "%s", "valor_nota": %s, "data_nota": "%s"}',
                    employee_record.email,
                    template_record.subject,
                    template_record.content,
                    employee_record.name,
                    employee_record.amount,
                    CURRENT_DATE
                )::jsonb
            );

            -- Log the email sending attempt
            RAISE NOTICE 'Invoice email sent to employee % (%). Response: %',
                employee_record.name,
                employee_record.email,
                response;
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
            
            -- Send email using the edge function
            SELECT status, content
            INTO response
            FROM net.http_post(
                url:='https://itlpvpdwgiwbdpqheemw.supabase.co/functions/v1/send-email',
                headers:=format(
                    '{"Content-Type": "application/json", "Authorization": "Bearer %s"}',
                    current_setting('app.settings.service_key')
                )::jsonb,
                body:=format(
                    '{"to": "%s", "subject": "%s", "content": "%s", "nome_funcionario": "%s", "total_horas": %s, "periodo": "%s"}',
                    employee_record.email,
                    template_record.subject,
                    template_record.content,
                    employee_record.name,
                    COALESCE(monthly_record.total_hours, 0),
                    TO_CHAR(CURRENT_DATE, 'MM/YYYY')
                )::jsonb
            );

            -- Log the email sending attempt
            RAISE NOTICE 'Hours email sent to employee % (%). Response: %',
                employee_record.name,
                employee_record.email,
                response;
        END LOOP;
    END IF;
END;
$function$;

-- Add comment to the function
COMMENT ON FUNCTION public.check_employee_notifications IS 'Checks if employee notifications should be sent today and sends them if appropriate';
