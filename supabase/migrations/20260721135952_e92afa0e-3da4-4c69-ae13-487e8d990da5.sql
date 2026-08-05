
CREATE POLICY "Public can read testimonial media"
ON storage.objects FOR SELECT
USING (bucket_id = 'testimonials');

CREATE POLICY "Admins can upload testimonial media"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'testimonials' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update testimonial media"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'testimonials' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete testimonial media"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'testimonials' AND public.has_role(auth.uid(), 'admin'));
