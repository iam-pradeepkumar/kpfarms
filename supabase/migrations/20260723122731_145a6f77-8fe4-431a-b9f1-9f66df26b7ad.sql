
ALTER TABLE public.consultation_bookings
  ADD COLUMN IF NOT EXISTS booking_step text NOT NULL DEFAULT 'registered',
  ADD COLUMN IF NOT EXISTS payment_reference text,
  ADD COLUMN IF NOT EXISTS payment_amount numeric,
  ADD COLUMN IF NOT EXISTS slot_confirmed_at timestamptz,
  ADD COLUMN IF NOT EXISTS paid_at timestamptz;

ALTER TABLE public.farm_visit_bookings
  ADD COLUMN IF NOT EXISTS booking_step text NOT NULL DEFAULT 'registered',
  ADD COLUMN IF NOT EXISTS payment_reference text,
  ADD COLUMN IF NOT EXISTS payment_amount numeric,
  ADD COLUMN IF NOT EXISTS slot_confirmed_at timestamptz,
  ADD COLUMN IF NOT EXISTS paid_at timestamptz;

ALTER TABLE public.training_bookings
  ADD COLUMN IF NOT EXISTS booking_step text NOT NULL DEFAULT 'registered',
  ADD COLUMN IF NOT EXISTS payment_reference text,
  ADD COLUMN IF NOT EXISTS payment_amount numeric,
  ADD COLUMN IF NOT EXISTS slot_confirmed_at timestamptz,
  ADD COLUMN IF NOT EXISTS paid_at timestamptz;

-- Allow anon/authenticated to update their own booking rows within 24h of creation
-- so the multi-step wizard can persist progress (slot, payment) after the initial insert.
DROP POLICY IF EXISTS "guests update recent consultation" ON public.consultation_bookings;
CREATE POLICY "guests update recent consultation" ON public.consultation_bookings
  FOR UPDATE TO anon, authenticated
  USING (created_at > now() - interval '1 day')
  WITH CHECK (created_at > now() - interval '1 day');

DROP POLICY IF EXISTS "guests update recent farm visit" ON public.farm_visit_bookings;
CREATE POLICY "guests update recent farm visit" ON public.farm_visit_bookings
  FOR UPDATE TO anon, authenticated
  USING (created_at > now() - interval '1 day')
  WITH CHECK (created_at > now() - interval '1 day');

DROP POLICY IF EXISTS "guests update recent training" ON public.training_bookings;
CREATE POLICY "guests update recent training" ON public.training_bookings
  FOR UPDATE TO anon, authenticated
  USING (created_at > now() - interval '1 day')
  WITH CHECK (created_at > now() - interval '1 day');

GRANT UPDATE ON public.consultation_bookings TO anon, authenticated;
GRANT UPDATE ON public.farm_visit_bookings TO anon, authenticated;
GRANT UPDATE ON public.training_bookings TO anon, authenticated;
