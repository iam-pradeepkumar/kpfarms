CREATE OR REPLACE FUNCTION public.payment_proof_path_valid(_name text)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  WITH parts AS (
    SELECT
      split_part(_name, '/', 1) AS kind,
      substring(split_part(_name, '/', 2) from '^[0-9a-fA-F-]{36}') AS bid
  )
  SELECT CASE
    WHEN (SELECT bid FROM parts) IS NULL THEN false
    WHEN (SELECT kind FROM parts) = 'consultation'
      THEN EXISTS (SELECT 1 FROM public.consultation_bookings b WHERE b.id = (SELECT bid FROM parts)::uuid AND b.payment_screenshot_path IS NULL AND coalesce(b.booking_step,'registered') <> 'paid')
    WHEN (SELECT kind FROM parts) = 'farm_visit'
      THEN EXISTS (SELECT 1 FROM public.farm_visit_bookings b WHERE b.id = (SELECT bid FROM parts)::uuid AND b.payment_screenshot_path IS NULL AND coalesce(b.booking_step,'registered') <> 'paid')
    WHEN (SELECT kind FROM parts) = 'training'
      THEN EXISTS (SELECT 1 FROM public.training_bookings b WHERE b.id = (SELECT bid FROM parts)::uuid AND b.payment_screenshot_path IS NULL AND coalesce(b.booking_step,'registered') <> 'paid')
    ELSE false
  END;
$function$;