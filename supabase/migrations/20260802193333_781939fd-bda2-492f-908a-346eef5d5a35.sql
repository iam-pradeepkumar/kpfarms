-- 1) site_settings: only expose non-sensitive public keys to visitors
DROP POLICY IF EXISTS "anyone reads site settings" ON public.site_settings;

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
    'home_video_training'
  )
);

-- 2) Payment proof uploads must carry a token only the booking owner can obtain
CREATE OR REPLACE FUNCTION public.proof_upload_token(_kind text, _id uuid, _whatsapp text)
RETURNS text
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE _created timestamptz; _wa text := btrim(coalesce(_whatsapp, ''));
BEGIN
  IF _id IS NULL OR length(_wa) = 0 THEN RETURN NULL; END IF;

  IF _kind = 'consultation' THEN
    SELECT created_at INTO _created FROM public.consultation_bookings WHERE id = _id AND whatsapp = _wa;
  ELSIF _kind = 'farm_visit' THEN
    SELECT created_at INTO _created FROM public.farm_visit_bookings WHERE id = _id AND whatsapp = _wa;
  ELSIF _kind = 'training' THEN
    SELECT created_at INTO _created FROM public.training_bookings WHERE id = _id AND whatsapp = _wa;
  ELSE
    RETURN NULL;
  END IF;

  IF _created IS NULL THEN RETURN NULL; END IF;
  RETURN substr(md5(_id::text || '|' || _wa || '|' || _created::text), 1, 24);
END; $$;

CREATE OR REPLACE FUNCTION public.payment_proof_path_valid(_name text)
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _kind text := split_part(_name, '/', 1);
  _file text := split_part(_name, '/', 2);
  _bid  text := substring(_file from '^[0-9a-fA-F-]{36}');
  _tok  text := substring(_file from '^[0-9a-fA-F-]{36}-([0-9a-f]{24})\.');
  _row  record;
BEGIN
  IF _bid IS NULL OR _tok IS NULL THEN RETURN false; END IF;

  IF _kind = 'consultation' THEN
    SELECT id, whatsapp, created_at, payment_screenshot_path, booking_step INTO _row
      FROM public.consultation_bookings WHERE id = _bid::uuid;
  ELSIF _kind = 'farm_visit' THEN
    SELECT id, whatsapp, created_at, payment_screenshot_path, booking_step INTO _row
      FROM public.farm_visit_bookings WHERE id = _bid::uuid;
  ELSIF _kind = 'training' THEN
    SELECT id, whatsapp, created_at, payment_screenshot_path, booking_step INTO _row
      FROM public.training_bookings WHERE id = _bid::uuid;
  ELSE
    RETURN false;
  END IF;

  IF _row IS NULL THEN RETURN false; END IF;
  IF _row.payment_screenshot_path IS NOT NULL THEN RETURN false; END IF;
  IF coalesce(_row.booking_step, 'registered') = 'paid' THEN RETURN false; END IF;

  RETURN _tok = substr(md5(_row.id::text || '|' || _row.whatsapp || '|' || _row.created_at::text), 1, 24);
END; $$;

-- 3) Least privilege on internal SECURITY DEFINER functions
REVOKE ALL ON FUNCTION public.payment_proof_path_valid(text) FROM anon, authenticated;
REVOKE ALL ON FUNCTION public.has_role(uuid, app_role) FROM anon;
REVOKE ALL ON FUNCTION public.set_updated_at() FROM anon, authenticated;

GRANT EXECUTE ON FUNCTION public.proof_upload_token(text, uuid, text) TO anon, authenticated;