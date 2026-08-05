
-- 1) Remove overly-permissive guest UPDATE policies on booking tables
DROP POLICY IF EXISTS "guests update recent consultation" ON public.consultation_bookings;
DROP POLICY IF EXISTS "guests update recent farm visit" ON public.farm_visit_bookings;
DROP POLICY IF EXISTS "guests update recent training" ON public.training_bookings;

-- 2) Replace open orders INSERT (WITH CHECK true) with a server-side RPC that
--    validates pricing against the products table. Keep an admin/authenticated
--    fallback via existing admin policy.
DROP POLICY IF EXISTS "anyone submits orders" ON public.orders;

-- 3) Ownership-checked update RPCs (SECURITY DEFINER, require id + whatsapp match)

CREATE OR REPLACE FUNCTION public.update_consultation_slot(
  _id uuid, _whatsapp text,
  _preferred_date date, _preferred_time text, _notes text
) RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE _ok boolean;
BEGIN
  IF _id IS NULL OR _whatsapp IS NULL OR length(btrim(_whatsapp))=0 THEN RETURN false; END IF;
  UPDATE public.consultation_bookings
     SET preferred_date = _preferred_date,
         preferred_time = _preferred_time,
         notes = _notes,
         booking_step = 'slot_booked',
         slot_confirmed_at = now()
   WHERE id = _id
     AND whatsapp = _whatsapp
     AND coalesce(booking_step,'registered') <> 'paid';
  GET DIAGNOSTICS _ok = ROW_COUNT;
  RETURN _ok;
END; $$;

CREATE OR REPLACE FUNCTION public.update_farm_visit_slot(
  _id uuid, _whatsapp text,
  _visit_date date, _group_size int, _notes text
) RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE _ok boolean;
BEGIN
  IF _id IS NULL OR _whatsapp IS NULL OR length(btrim(_whatsapp))=0 THEN RETURN false; END IF;
  UPDATE public.farm_visit_bookings
     SET visit_date = _visit_date,
         group_size = _group_size,
         notes = _notes,
         booking_step = 'slot_booked',
         slot_confirmed_at = now()
   WHERE id = _id
     AND whatsapp = _whatsapp
     AND coalesce(booking_step,'registered') <> 'paid';
  GET DIAGNOSTICS _ok = ROW_COUNT;
  RETURN _ok;
END; $$;

CREATE OR REPLACE FUNCTION public.update_training_slot(
  _id uuid, _whatsapp text,
  _cohort_date date, _notes text
) RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE _ok boolean;
BEGIN
  IF _id IS NULL OR _whatsapp IS NULL OR length(btrim(_whatsapp))=0 THEN RETURN false; END IF;
  UPDATE public.training_bookings
     SET cohort_date = _cohort_date,
         notes = _notes,
         booking_step = 'slot_booked',
         slot_confirmed_at = now()
   WHERE id = _id
     AND whatsapp = _whatsapp
     AND coalesce(booking_step,'registered') <> 'paid';
  GET DIAGNOSTICS _ok = ROW_COUNT;
  RETURN _ok;
END; $$;

CREATE OR REPLACE FUNCTION public.mark_booking_paid(
  _kind text, _id uuid, _whatsapp text, _payment_reference text
) RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE _ok boolean := false;
BEGIN
  IF _id IS NULL OR _whatsapp IS NULL OR length(btrim(_whatsapp))=0 THEN RETURN false; END IF;

  IF _kind = 'consultation' THEN
    UPDATE public.consultation_bookings
       SET payment_reference = _payment_reference,
           booking_step = 'paid', status = 'paid', paid_at = now()
     WHERE id = _id AND whatsapp = _whatsapp;
    GET DIAGNOSTICS _ok = ROW_COUNT;
  ELSIF _kind = 'farm_visit' THEN
    UPDATE public.farm_visit_bookings
       SET payment_reference = _payment_reference,
           booking_step = 'paid', status = 'paid', paid_at = now()
     WHERE id = _id AND whatsapp = _whatsapp;
    GET DIAGNOSTICS _ok = ROW_COUNT;
  ELSIF _kind = 'training' THEN
    UPDATE public.training_bookings
       SET payment_reference = _payment_reference,
           booking_step = 'paid', status = 'paid', paid_at = now()
     WHERE id = _id AND whatsapp = _whatsapp;
    GET DIAGNOSTICS _ok = ROW_COUNT;
  END IF;

  RETURN _ok;
END; $$;

-- 4) Orders submission RPC — server derives price/total from products table
CREATE OR REPLACE FUNCTION public.submit_order(
  _product_id uuid,
  _quantity int,
  _customer_name text,
  _whatsapp text,
  _email text,
  _address text,
  _notes text
) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  _p record;
  _qty int := greatest(1, coalesce(_quantity, 1));
  _new_id uuid;
BEGIN
  IF _product_id IS NULL THEN
    RAISE EXCEPTION 'product_id required';
  END IF;
  IF _customer_name IS NULL OR length(btrim(_customer_name))=0
     OR _whatsapp IS NULL OR length(btrim(_whatsapp))=0 THEN
    RAISE EXCEPTION 'customer_name and whatsapp required';
  END IF;

  SELECT id, name, type, price INTO _p FROM public.products WHERE id = _product_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'product not found'; END IF;

  INSERT INTO public.orders (
    product_id, product_name, product_type, unit_price, quantity, total,
    customer_name, whatsapp, email, address, notes, status
  ) VALUES (
    _p.id, _p.name, _p.type, _p.price, _qty, coalesce(_p.price,0) * _qty,
    btrim(_customer_name), btrim(_whatsapp), _email, _address, _notes, 'pending'
  ) RETURNING id INTO _new_id;

  RETURN _new_id;
END; $$;

-- 5) Grants — anon + authenticated can call these RPCs
GRANT EXECUTE ON FUNCTION public.update_consultation_slot(uuid,text,date,text,text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.update_farm_visit_slot(uuid,text,date,int,text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.update_training_slot(uuid,text,date,text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.mark_booking_paid(text,uuid,text,text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.submit_order(uuid,int,text,text,text,text,text) TO anon, authenticated;
