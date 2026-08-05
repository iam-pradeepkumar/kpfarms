
CREATE OR REPLACE FUNCTION public.register_consultation(_name text, _whatsapp text, _email text DEFAULT NULL, _topic text DEFAULT NULL)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _id uuid;
BEGIN
  INSERT INTO public.consultation_bookings(name, whatsapp, email, topic, booking_step)
  VALUES (_name, _whatsapp, _email, _topic, 'registered') RETURNING id INTO _id;
  RETURN _id;
END; $$;

CREATE OR REPLACE FUNCTION public.register_farm_visit(_name text, _whatsapp text, _email text DEFAULT NULL)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _id uuid;
BEGIN
  INSERT INTO public.farm_visit_bookings(name, whatsapp, email, booking_step)
  VALUES (_name, _whatsapp, _email, 'registered') RETURNING id INTO _id;
  RETURN _id;
END; $$;

CREATE OR REPLACE FUNCTION public.register_training(_name text, _whatsapp text, _email text DEFAULT NULL, _program text DEFAULT NULL, _cohort_date date DEFAULT NULL)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _id uuid;
BEGIN
  INSERT INTO public.training_bookings(name, whatsapp, email, program, cohort_date, booking_step)
  VALUES (_name, _whatsapp, _email, _program, _cohort_date, 'registered') RETURNING id INTO _id;
  RETURN _id;
END; $$;

GRANT EXECUTE ON FUNCTION public.register_consultation(text,text,text,text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.register_farm_visit(text,text,text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.register_training(text,text,text,text,date) TO anon, authenticated;
