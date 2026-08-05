CREATE POLICY "Anyone can read blog media" ON storage.objects
  FOR SELECT USING (bucket_id = 'blog-media');

CREATE POLICY "Admins can upload blog media" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (bucket_id = 'blog-media' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update blog media" ON storage.objects
  FOR UPDATE TO authenticated USING (bucket_id = 'blog-media' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete blog media" ON storage.objects
  FOR DELETE TO authenticated USING (bucket_id = 'blog-media' AND public.has_role(auth.uid(), 'admin'));