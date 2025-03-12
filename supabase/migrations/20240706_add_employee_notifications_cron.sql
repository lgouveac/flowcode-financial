
-- Create extensions if they don't already exist
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Create a cron job to run the trigger-employee-notifications edge function daily
SELECT cron.schedule(
  'invoke-employee-notifications-daily',
  '0 9 * * *', -- at 9 AM every day
  $$
  SELECT net.http_post(
    url:='https://itlpvpdwgiwbdpqheemw.supabase.co/functions/v1/trigger-employee-notifications',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml0bHB2cGR3Z2l3YmRwcWhlZW13Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDAxOTA5NzEsImV4cCI6MjA1NTc2Njk3MX0.gljQ6JAfbMzP-cbA68Iz21vua9YqAqVQgpB-eLk6nAg"}'::jsonb,
    body:='{}'::jsonb
  ) as request_id;
  $$
);

-- Create a server setting for the service key
-- This is needed to authenticate edge function calls
ALTER DATABASE postgres SET app.settings.service_key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml0bHB2cGR3Z2l3YmRwcWhlZW13Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDAxOTA5NzEsImV4cCI6MjA1NTc2Njk3MX0.gljQ6JAfbMzP-cbA68Iz21vua9YqAqVQgpB-eLk6nAg';
