-- 1) Remove blanket anon INSERT on booking tables (all inserts go through SECURITY DEFINER RPCs)
DROP POLICY IF EXISTS "anyone submits consultation" ON public.consultation_bookings;
DROP POLICY IF EXISTS "anyone submits farm visit" ON public.farm_visit_bookings;
DROP POLICY IF EXISTS "anyone submits training" ON public.training_bookings;

-- 2) Contact messages: keep public submissions but validate content
DROP POLICY IF EXISTS "anyone submits contact" ON public.contact_messages;
CREATE POLICY "anyone submits valid contact" ON public.contact_messages
FOR INSERT TO anon, authenticated
WITH CHECK (
  length(btrim(coalesce(name, ''))) > 0
  AND length(btrim(coalesce(message, ''))) > 0
  AND length(message) <= 5000
);

-- 3) Payment proofs: only allow uploads whose filename references a real booking id
CREATE OR REPLACE FUNCTION public.payment_proof_path_valid(_name text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH parts AS (
    SELECT
      split_part(_name, '/', 1) AS kind,
      substring(split_part(_name, '/', 2) from '^[0-9a-fA-F-]{36}') AS bid
  )
  SELECT CASE
    WHEN (SELECT bid FROM parts) IS NULL THEN false
    WHEN (SELECT kind FROM parts) = 'consultation'
      THEN EXISTS (SELECT 1 FROM public.consultation_bookings b WHERE b.id = (SELECT bid FROM parts)::uuid)
    WHEN (SELECT kind FROM parts) = 'farm_visit'
      THEN EXISTS (SELECT 1 FROM public.farm_visit_bookings b WHERE b.id = (SELECT bid FROM parts)::uuid)
    WHEN (SELECT kind FROM parts) = 'training'
      THEN EXISTS (SELECT 1 FROM public.training_bookings b WHERE b.id = (SELECT bid FROM parts)::uuid)
    ELSE false
  END;
$$;

GRANT EXECUTE ON FUNCTION public.payment_proof_path_valid(text) TO anon, authenticated;

DROP POLICY IF EXISTS "anyone uploads payment proof" ON storage.objects;
CREATE POLICY "booking owners upload payment proof" ON storage.objects
FOR INSERT TO anon, authenticated
WITH CHECK (
  bucket_id = 'payment-proofs'
  AND public.payment_proof_path_valid(name)
);

-- 4) Testimonial media: public read only for approved testimonials
DROP POLICY IF EXISTS "Public can read testimonial media" ON storage.objects;
CREATE POLICY "Public reads approved testimonial media" ON storage.objects
FOR SELECT TO anon, authenticated
USING (
  bucket_id = 'testimonials'
  AND EXISTS (
    SELECT 1 FROM public.testimonials t
    WHERE t.status = 'approved' AND t.media_url = storage.objects.name
  )
);

CREATE POLICY "Admins read all testimonial media" ON storage.objects
FOR SELECT TO authenticated
USING (bucket_id = 'testimonials' AND public.has_role(auth.uid(), 'admin'));
