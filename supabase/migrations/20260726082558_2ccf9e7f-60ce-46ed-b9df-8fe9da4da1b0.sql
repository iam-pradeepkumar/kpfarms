
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

SELECT cron.unschedule('kp-push-dispatch') WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'kp-push-dispatch');

SELECT cron.schedule(
  'kp-push-dispatch',
  '* * * * *',
  $$
  SELECT net.http_post(
    url := 'https://project--1e7325f9-8230-4fd0-8e99-964f82c09b96.lovable.app/api/public/push-dispatch',
    headers := '{"Content-Type":"application/json","x-cron-secret":"kpfv_push_9f3ab1c7d2e54b08a6c1f7d3e9b40527"}'::jsonb,
    body := '{}'::jsonb
  );
  $$
);
