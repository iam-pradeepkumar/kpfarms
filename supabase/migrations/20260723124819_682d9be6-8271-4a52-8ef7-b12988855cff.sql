
CREATE OR REPLACE FUNCTION public.resume_booking(_kind text, _whatsapp text)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE result jsonb;
BEGIN
  IF _whatsapp IS NULL OR length(btrim(_whatsapp)) = 0 THEN
    RETURN NULL;
  END IF;

  IF _kind = 'consultation' THEN
    SELECT to_jsonb(t) INTO result FROM (
      SELECT id, name, whatsapp, email, topic, preferred_date, preferred_time, notes,
             booking_step, payment_reference
      FROM public.consultation_bookings
      WHERE whatsapp = _whatsapp AND coalesce(booking_step,'registered') <> 'paid'
      ORDER BY created_at DESC LIMIT 1
    ) t;
  ELSIF _kind = 'farm_visit' THEN
    SELECT to_jsonb(t) INTO result FROM (
      SELECT id, name, whatsapp, email, visit_date, group_size, notes,
             booking_step, payment_reference
      FROM public.farm_visit_bookings
      WHERE whatsapp = _whatsapp AND coalesce(booking_step,'registered') <> 'paid'
      ORDER BY created_at DESC LIMIT 1
    ) t;
  ELSIF _kind = 'training' THEN
    SELECT to_jsonb(t) INTO result FROM (
      SELECT id, name, whatsapp, email, program, cohort_date, notes,
             booking_step, payment_reference
      FROM public.training_bookings
      WHERE whatsapp = _whatsapp AND coalesce(booking_step,'registered') <> 'paid'
      ORDER BY created_at DESC LIMIT 1
    ) t;
  END IF;

  RETURN result;
END;
$$;

GRANT EXECUTE ON FUNCTION public.resume_booking(text, text) TO anon, authenticated;
