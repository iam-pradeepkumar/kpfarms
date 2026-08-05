
CREATE OR REPLACE FUNCTION public.claim_admin_if_first()
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _uid uuid; _has_admin boolean;
BEGIN
  _uid := auth.uid();
  IF _uid IS NULL THEN RETURN false; END IF;
  SELECT EXISTS(SELECT 1 FROM public.user_roles WHERE role = 'admin') INTO _has_admin;
  IF _has_admin THEN RETURN false; END IF;
  INSERT INTO public.user_roles(user_id, role) VALUES (_uid, 'admin') ON CONFLICT DO NOTHING;
  RETURN true;
END; $$;
