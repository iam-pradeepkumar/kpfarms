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
  _tok  text := substring(_file from '^[0-9a-fA-F-]{36}-([0-9a-f]{24})');
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

REVOKE ALL ON FUNCTION public.payment_proof_path_valid(text) FROM anon, authenticated;