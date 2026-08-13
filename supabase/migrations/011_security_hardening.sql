-- 011: Security hardening for internal rate limiting and SECURITY DEFINER RPCs.
-- This migration is safe to apply after migrations 001-010 have already run.

-- Rate-limit state is internal server data. It must not be readable or
-- writable through the public Supabase API.
ALTER TABLE public.auth_rate_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.share_rate_limits ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.auth_rate_limits FROM PUBLIC, anon, authenticated;
REVOKE ALL ON TABLE public.share_rate_limits FROM PUBLIC, anon, authenticated;

-- Rate limiting is called through the server's service-role client only.
REVOKE EXECUTE ON FUNCTION public.check_auth_rate_limit(TEXT, INT, INT)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.check_auth_rate_limit(TEXT, INT, INT)
  TO service_role;

REVOKE EXECUTE ON FUNCTION public.check_share_rate_limit(TEXT, INT, INT)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.check_share_rate_limit(TEXT, INT, INT)
  TO service_role;

-- Explicitly pin search_path for every SECURITY DEFINER function that can be
-- reached by the application. This prevents object shadowing through a
-- caller-controlled search path.
ALTER FUNCTION public.check_auth_rate_limit(TEXT, INT, INT)
  SET search_path = '';
ALTER FUNCTION public.check_share_rate_limit(TEXT, INT, INT)
  SET search_path = '';
ALTER FUNCTION public.increment_share_token_view(TEXT)
  SET search_path = '';
ALTER FUNCTION public.insert_bp_record_atomic(UUID, INT, INT, INT, TEXT, TEXT, TIMESTAMPTZ, TEXT[])
  SET search_path = '';
ALTER FUNCTION public.batch_insert_bp_records_atomic(UUID, JSONB)
  SET search_path = '';
ALTER FUNCTION public.create_share_token_atomic(UUID, TEXT, TIMESTAMPTZ, INT)
  SET search_path = '';
ALTER FUNCTION public.cleanup_stale_rate_limits()
  SET search_path = '';

-- Cleanup and seed operations are internal jobs, not user-callable RPCs.
REVOKE EXECUTE ON FUNCTION public.cleanup_stale_rate_limits()
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.cleanup_stale_rate_limits()
  TO service_role;

REVOKE EXECUTE ON FUNCTION public.seed_demo_sample_data()
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.seed_demo_sample_data()
  TO service_role;
