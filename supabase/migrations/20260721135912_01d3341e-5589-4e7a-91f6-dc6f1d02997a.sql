
CREATE TABLE public.testimonials (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  place TEXT,
  rating INT NOT NULL DEFAULT 5,
  text TEXT,
  media_type TEXT NOT NULL DEFAULT 'text',
  media_url TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  featured BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT testimonials_rating_chk CHECK (rating BETWEEN 1 AND 5),
  CONSTRAINT testimonials_media_type_chk CHECK (media_type IN ('text','photo','video','audio')),
  CONSTRAINT testimonials_status_chk CHECK (status IN ('pending','approved','rejected'))
);

GRANT SELECT, INSERT ON public.testimonials TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.testimonials TO authenticated;
GRANT ALL ON public.testimonials TO service_role;

ALTER TABLE public.testimonials ENABLE ROW LEVEL SECURITY;

-- Anyone can view approved testimonials
CREATE POLICY "Public can view approved testimonials"
ON public.testimonials FOR SELECT
USING (status = 'approved');

-- Admins can view all
CREATE POLICY "Admins can view all testimonials"
ON public.testimonials FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Anyone (guests) can submit a testimonial (forced to pending)
CREATE POLICY "Anyone can submit testimonials"
ON public.testimonials FOR INSERT
WITH CHECK (status = 'pending');

-- Admins can insert freely (approved/featured)
CREATE POLICY "Admins can insert testimonials"
ON public.testimonials FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Admins can update / delete
CREATE POLICY "Admins can update testimonials"
ON public.testimonials FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete testimonials"
ON public.testimonials FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_testimonials_updated_at
BEFORE UPDATE ON public.testimonials
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX idx_testimonials_status_created ON public.testimonials(status, created_at DESC);
