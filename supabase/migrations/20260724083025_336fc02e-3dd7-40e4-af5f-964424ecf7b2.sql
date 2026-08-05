
CREATE TABLE public.training_programs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  price numeric(10,2),
  cohort_date date,
  session_time text,
  venue text,
  seats integer,
  image_url text,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.training_programs TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.training_programs TO authenticated;
GRANT ALL ON public.training_programs TO service_role;

ALTER TABLE public.training_programs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public read active training programs"
  ON public.training_programs FOR SELECT
  TO anon, authenticated
  USING (active = true OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "admins manage training programs"
  ON public.training_programs FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER training_programs_updated_at
  BEFORE UPDATE ON public.training_programs
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

INSERT INTO public.training_programs (name, description, price, cohort_date, session_time, venue, seats, active)
VALUES (
  'Broiler Farming Master Class',
  'A full day on the farm. Learn chick care, feed, farm safety and how to sell your birds.',
  699,
  '2026-09-22',
  '9:00 AM – 5:00 PM',
  'KP Main Farm, Tamil Nadu',
  25,
  true
);
