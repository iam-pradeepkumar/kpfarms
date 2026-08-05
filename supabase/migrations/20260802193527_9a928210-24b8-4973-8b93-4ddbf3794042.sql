REVOKE ALL ON FUNCTION public.set_updated_at() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.has_role(uuid, app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.payment_proof_path_valid(text) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.proof_upload_token(text, uuid, text) TO anon, authenticated, service_role;