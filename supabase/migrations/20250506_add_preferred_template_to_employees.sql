
-- Add the preferred_template column to the employees table
ALTER TABLE employees 
ADD COLUMN IF NOT EXISTS preferred_template text DEFAULT 'invoice';

-- Update the check_employee_notifications function to handle the preferred_template field
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

    -- Send emails based on employee preferred template or default templates
    FOR employee_record IN 
        SELECT e.*, mv.amount 
        FROM employees e
        LEFT JOIN employee_monthly_values mv ON e.id = mv.employee_id AND mv.month = TO_CHAR(CURRENT_DATE, 'YYYY-MM')
        WHERE e.status = 'active'
    LOOP
        -- Determine which template to use based on employee preference
        DECLARE 
            template_subtype text;
            template_content text;
            template_subject text;
        BEGIN
            -- Get the preferred template type or default to 'invoice'
            template_subtype := COALESCE(employee_record.preferred_template, 'invoice');
            
            -- Get the template with the matching subtype
            SELECT id, subject, content
            INTO template_record
            FROM email_templates
            WHERE type = 'employees'
              AND subtype = template_subtype
              AND is_default = true
            LIMIT 1;
              
            -- If no template found for the preferred type, fall back to invoice template
            IF template_record.id IS NULL THEN
                SELECT id, subject, content
                INTO template_record
                FROM email_templates
                WHERE type = 'employees'
                  AND subtype = 'invoice'
                  AND is_default = true
                LIMIT 1;
            END IF;
            
            IF template_record.id IS NOT NULL THEN
                -- Get total hours for the current month if available (for hours template)
                IF template_subtype = 'hours' THEN
                    SELECT SUM(COALESCE(work_hours, 0)) AS total_hours
                    INTO monthly_record
                    FROM employee_hours 
                    WHERE employee_id = employee_record.id
                    AND EXTRACT(MONTH FROM work_date) = EXTRACT(MONTH FROM CURRENT_DATE)
                    AND EXTRACT(YEAR FROM work_date) = EXTRACT(YEAR FROM CURRENT_DATE);
                    
                    -- Send hours email template
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
                ELSE
                    -- Send invoice email template or any other template
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
                            'valor_nota', COALESCE(employee_record.amount, 0),
                            'data_nota', CURRENT_DATE
                        )
                    );
                END IF;

                -- Log the email sending attempt
                RAISE NOTICE 'Email sent to employee % (%) using template %',
                    employee_record.name,
                    employee_record.email,
                    template_subtype;
            ELSE
                RAISE NOTICE 'No template found for employee % (%)',
                    employee_record.name,
                    employee_record.email;
            END IF;
        END;
    END LOOP;
    
    RAISE NOTICE 'Employee notification process completed successfully.';
END;
$function$;
