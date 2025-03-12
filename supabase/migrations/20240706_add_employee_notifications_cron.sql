
-- Create a cron job to run the trigger-employee-notifications edge function daily
SELECT cron.schedule(
  'invoke-employee-notifications-daily',
  '* * * * *', -- every minute (for testing), change to '0 9 * * *' for production
  $$
  SELECT net.http_post(
    url:='https://itlpvpdwgiwbdpqheemw.supabase.co/functions/v1/trigger-employee-notifications',
    headers:=format(
      '{"Content-Type": "application/json", "Authorization": "Bearer %s"}',
      current_setting('app.settings.service_key')
    )::jsonb,
    body:='{}'::jsonb
  ) as request_id;
  $$
);
