
CREATE POLICY "anyone uploads payment proof" ON storage.objects FOR INSERT TO anon, authenticated
  WITH CHECK (bucket_id = 'payment-proofs');
CREATE POLICY "admins read payment proofs" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'payment-proofs' AND public.has_role(auth.uid(),'admin'));
CREATE POLICY "admins delete payment proofs" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'payment-proofs' AND public.has_role(auth.uid(),'admin'));

CREATE POLICY "anyone reads site assets" ON storage.objects FOR SELECT TO anon, authenticated
  USING (bucket_id = 'site-assets');
CREATE POLICY "admins write site assets" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'site-assets' AND public.has_role(auth.uid(),'admin'));
CREATE POLICY "admins update site assets" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'site-assets' AND public.has_role(auth.uid(),'admin'))
  WITH CHECK (bucket_id = 'site-assets' AND public.has_role(auth.uid(),'admin'));
CREATE POLICY "admins delete site assets" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'site-assets' AND public.has_role(auth.uid(),'admin'));
