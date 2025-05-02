
-- Atualizar a função check_employee_notifications para considerar execução 1 minuto antes
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

    -- MODIFICADO: Agora verifica se o tempo atual é entre 1 minuto antes e o horário exato da notificação
    -- Isso permite que a notificação seja processada se o cron executar 1 minuto antes
    IF NOT (CURRENT_TIME BETWEEN notification_time - INTERVAL '1 minute' AND notification_time) THEN
        RAISE NOTICE 'Not the correct time for employee notifications. Current time: %, Notification time: %', 
            CURRENT_TIME, notification_time;
        RETURN;
    END IF;

    RAISE NOTICE 'Starting employee notifications process at % on day % (scheduled for %)', 
        CURRENT_TIME, curr_day, notification_time;

    -- O resto da função permanece igual...
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

-- Atualizar o cron job para executar 1 minuto antes do horário configurado
CREATE OR REPLACE FUNCTION public.update_employee_notification_cron()
 RETURNS void
 LANGUAGE plpgsql
AS $function$
DECLARE
    notification_time time;
    cron_expression text;
    hour_part integer;
    minute_part integer;
BEGIN
    -- Get the notification time
    SELECT notification_time INTO notification_time
    FROM employee_email_settings
    LIMIT 1;
    
    -- Se não houver configuração, use 9:00 como padrão
    IF notification_time IS NULL THEN
        notification_time := '09:00:00'::time;
    END IF;
    
    -- Extrair hora e minuto
    hour_part := EXTRACT(HOUR FROM notification_time);
    minute_part := EXTRACT(MINUTE FROM notification_time);
    
    -- Decrementar 1 minuto
    minute_part := minute_part - 1;
    
    -- Lidar com o caso de -1 minuto
    IF minute_part < 0 THEN
        minute_part := 59;
        hour_part := hour_part - 1;
        
        -- Lidar com hora -1
        IF hour_part < 0 THEN
            hour_part := 23;
        END IF;
    END IF;
    
    -- Criar a expressão cron (executar todos os dias no horário específico - 1 minuto)
    cron_expression := minute_part || ' ' || hour_part || ' * * *';
    
    -- Remover crons antigos se existirem
    PERFORM cron.unschedule('employee-notifications-daily');
    PERFORM cron.unschedule('invoke-employee-notifications-daily');
    PERFORM cron.unschedule('invoke-employee-notifications-daily-fixed');
    PERFORM cron.unschedule('invoke-employee-notifications-daily-direct');
    
    -- Criar o novo cron job
    PERFORM cron.schedule(
        'employee-notifications-daily',
        cron_expression,
        $$
        SELECT net.http_post(
          url:='https://itlpvpdwgiwbdpqheemw.supabase.co/functions/v1/trigger-employee-notifications',
          headers:=jsonb_build_object(
            'Content-Type', 'application/json',
            'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml0bHB2cGR3Z2l3YmRwcWhlZW13Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDAxOTA5NzEsImV4cCI6MjA1NTc2Njk3MX0.gljQ6JAfbMzP-cbA68Iz21vua9YqAqVQgpB-eLk6nAg'
          ),
          body:=jsonb_build_object(
            'execution_time', now()::text,
            'scheduled', true
          )
        ) as request_id;
        $$
    );
    
    RAISE NOTICE 'Employee notification cron job updated to run at % (notification time: %)',
        cron_expression, notification_time;
END;
$function$;

-- Executar a atualização do cron imediatamente
SELECT update_employee_notification_cron();

-- Criar um trigger para atualizar o cron quando o horário de notificação mudar
CREATE OR REPLACE FUNCTION update_employee_notification_cron_on_change()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    PERFORM update_employee_notification_cron();
    RETURN NEW;
END;
$function$;

-- Remover o trigger existente se houver
DROP TRIGGER IF EXISTS employee_notification_time_change ON employee_email_settings;

-- Criar o trigger
CREATE TRIGGER employee_notification_time_change
AFTER INSERT OR UPDATE OF notification_time ON employee_email_settings
FOR EACH ROW
EXECUTE FUNCTION update_employee_notification_cron_on_change();
