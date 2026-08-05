CREATE OR REPLACE FUNCTION public.trained_farmers_count()
RETURNS integer
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 500 + (SELECT count(*) FROM public.training_bookings)::int;
$$;

REVOKE ALL ON FUNCTION public.trained_farmers_count() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.trained_farmers_count() TO anon, authenticated, service_role;