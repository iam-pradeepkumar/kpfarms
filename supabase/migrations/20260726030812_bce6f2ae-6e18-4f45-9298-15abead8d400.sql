
ALTER TABLE public.consultation_bookings
  ADD COLUMN IF NOT EXISTS payment_screenshot_path text,
  ADD COLUMN IF NOT EXISTS meeting_link text,
  ADD COLUMN IF NOT EXISTS confirmed_at timestamptz;
ALTER TABLE public.farm_visit_bookings
  ADD COLUMN IF NOT EXISTS payment_screenshot_path text,
  ADD COLUMN IF NOT EXISTS meeting_link text,
  ADD COLUMN IF NOT EXISTS confirmed_at timestamptz;
ALTER TABLE public.training_bookings
  ADD COLUMN IF NOT EXISTS payment_screenshot_path text,
  ADD COLUMN IF NOT EXISTS meeting_link text,
  ADD COLUMN IF NOT EXISTS confirmed_at timestamptz;

CREATE TABLE IF NOT EXISTS public.site_settings (
  key text PRIMARY KEY,
  value text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.site_settings TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.site_settings TO authenticated;
GRANT ALL ON public.site_settings TO service_role;
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anyone reads site settings" ON public.site_settings FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "admins manage site settings" ON public.site_settings FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER site_settings_set_updated_at BEFORE UPDATE ON public.site_settings
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE FUNCTION public.submit_payment_proof(_kind text, _id uuid, _whatsapp text, _screenshot_path text)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _ok boolean := false;
BEGIN
  IF _id IS NULL OR _whatsapp IS NULL OR length(btrim(_whatsapp))=0 OR _screenshot_path IS NULL THEN RETURN false; END IF;

  IF _kind = 'consultation' THEN
    UPDATE public.consultation_bookings
       SET payment_screenshot_path = _screenshot_path, booking_step = 'paid',
           status = 'pending_verification', paid_at = now()
     WHERE id = _id AND whatsapp = _whatsapp;
    GET DIAGNOSTICS _ok = ROW_COUNT;
  ELSIF _kind = 'farm_visit' THEN
    UPDATE public.farm_visit_bookings
       SET payment_screenshot_path = _screenshot_path, booking_step = 'paid',
           status = 'pending_verification', paid_at = now()
     WHERE id = _id AND whatsapp = _whatsapp;
    GET DIAGNOSTICS _ok = ROW_COUNT;
  ELSIF _kind = 'training' THEN
    UPDATE public.training_bookings
       SET payment_screenshot_path = _screenshot_path, booking_step = 'paid',
           status = 'pending_verification', paid_at = now()
     WHERE id = _id AND whatsapp = _whatsapp;
    GET DIAGNOSTICS _ok = ROW_COUNT;
  END IF;
  RETURN _ok;
END; $$;

CREATE OR REPLACE FUNCTION public.booking_status(_kind text, _whatsapp text)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE result jsonb;
BEGIN
  IF _whatsapp IS NULL OR length(btrim(_whatsapp)) = 0 THEN RETURN NULL; END IF;
  IF _kind = 'consultation' THEN
    SELECT to_jsonb(t) INTO result FROM (
      SELECT id, name, whatsapp, booking_step, status, meeting_link, confirmed_at, preferred_date, preferred_time
      FROM public.consultation_bookings WHERE whatsapp = _whatsapp
      ORDER BY created_at DESC LIMIT 1) t;
  ELSIF _kind = 'farm_visit' THEN
    SELECT to_jsonb(t) INTO result FROM (
      SELECT id, name, whatsapp, booking_step, status, meeting_link, confirmed_at, visit_date
      FROM public.farm_visit_bookings WHERE whatsapp = _whatsapp
      ORDER BY created_at DESC LIMIT 1) t;
  ELSIF _kind = 'training' THEN
    SELECT to_jsonb(t) INTO result FROM (
      SELECT id, name, whatsapp, booking_step, status, meeting_link, confirmed_at, program, cohort_date
      FROM public.training_bookings WHERE whatsapp = _whatsapp
      ORDER BY created_at DESC LIMIT 1) t;
  END IF;
  RETURN result;
END; $$;

GRANT EXECUTE ON FUNCTION public.submit_payment_proof(text, uuid, text, text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.booking_status(text, text) TO anon, authenticated;
