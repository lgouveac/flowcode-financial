
-- Create a cron job to run the trigger-notifications edge function every minute
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
