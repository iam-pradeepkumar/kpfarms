-- Add new allowed public keys to site_settings RLS policies: footer contact info and hero statistics counters
DROP POLICY IF EXISTS "anyone reads public site settings" ON public.site_settings;

CREATE POLICY "anyone reads public site settings"
ON public.site_settings
FOR SELECT
TO anon, authenticated
USING (
  key IN (
    'payment_qr_path',
    'admin_whatsapp',
    'home_video_digital',
    'home_video_poultry',
    'home_video_meeting',
    'home_video_farm_visit',
    'home_video_training',
    'footer_email',
    'footer_address',
    'stat_consultations',
    'stat_farm_visits',
    'stat_training',
    'stat_chicken_production',
    'stat_batch_counts'
  )
);
