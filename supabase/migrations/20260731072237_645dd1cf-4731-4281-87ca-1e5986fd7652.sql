CREATE OR REPLACE FUNCTION public.submit_order(_product_id uuid, _quantity integer, _customer_name text, _whatsapp text, _email text, _address text, _notes text)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _p record;
  _qty int := greatest(1, coalesce(_quantity, 1));
  _unit numeric;
  _new_id uuid;
BEGIN
  IF _product_id IS NULL THEN
    RAISE EXCEPTION 'product_id required';
  END IF;
  IF _customer_name IS NULL OR length(btrim(_customer_name))=0
     OR _whatsapp IS NULL OR length(btrim(_whatsapp))=0 THEN
    RAISE EXCEPTION 'customer_name and whatsapp required';
  END IF;

  SELECT id, name, type, price, offer_price INTO _p FROM public.products WHERE id = _product_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'product not found'; END IF;

  _unit := coalesce(_p.offer_price, _p.price);

  INSERT INTO public.orders (
    product_id, product_name, product_type, unit_price, quantity, total,
    customer_name, whatsapp, email, address, notes, status
  ) VALUES (
    _p.id, _p.name, _p.type, _unit, _qty, coalesce(_unit,0) * _qty,
    btrim(_customer_name), btrim(_whatsapp), _email, _address, _notes, 'pending'
  ) RETURNING id INTO _new_id;

  RETURN _new_id;
END; $function$;