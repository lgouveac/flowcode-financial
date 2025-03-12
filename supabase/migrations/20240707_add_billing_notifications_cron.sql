
-- Create a cron job to run the trigger-billing-notifications edge function daily
SELECT cron.schedule(
  'invoke-billing-notifications-daily',
  '0 8 * * *', -- every day at 8 AM
  $$
  SELECT net.http_post(
    url:='https://itlpvpdwgiwbdpqheemw.supabase.co/functions/v1/trigger-billing-notifications',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml0bHB2cGR3Z2l3YmRwcWhlZW13Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDAxOTA5NzEsImV4cCI6MjA1NTc2Njk3MX0.gljQ6JAfbMzP-cbA68Iz21vua9YqAqVQgpB-eLk6nAg"}'::jsonb,
    body:='{}'::jsonb
  ) as request_id;
  $$
);
