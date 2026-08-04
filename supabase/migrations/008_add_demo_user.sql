-- ============================================================================
-- DEMO USER SUPPORT
-- ============================================================================
-- Adds is_demo flag on profiles table, demo data cleanup functions, atomic
-- RPCs for hard cap checks, auth protection trigger, rate limit cleanup,
-- and pg_cron scheduler.
--
-- Demo user:
--   Email   : guest@tensitrack.com
--   Password: guest@tensitrack.com
--
-- Note: the actual demo user account is created via the seed script
-- scripts/seed-demo-user.ts after this migration runs, because creating
-- a user in auth.users requires the service role key / admin client.
--
-- Demo data is automatically deleted after 24 hours.
-- ============================================================================

-- --------------------------------------------------------------------------
-- 1. is_demo flag on profiles table
-- --------------------------------------------------------------------------
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS is_demo BOOLEAN DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_profiles_is_demo
  ON public.profiles(is_demo)
  WHERE is_demo = true;

-- --------------------------------------------------------------------------
-- 2. Clean up demo data older than 24 hours
-- --------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.cleanup_demo_data()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  demo_user_id UUID;
  demo_email CONSTANT TEXT := 'guest@tensitrack.com';
BEGIN
  SELECT id INTO demo_user_id
  FROM public.profiles
  WHERE email = demo_email AND is_demo = true
  LIMIT 1;

  IF demo_user_id IS NULL THEN
    RETURN;
  END IF;

  -- SECURITY: only the demo user themselves (auth.uid() = demo id) or a
  -- privileged DB context (pg_cron / service role, where auth.uid() IS NULL)
  -- may trigger cleanup.
  IF auth.uid() IS NOT NULL AND auth.uid() <> demo_user_id THEN
    RAISE EXCEPTION 'unauthorized';
  END IF;

  DELETE FROM public.blood_pressure_records
  WHERE user_id = demo_user_id
    AND created_at < NOW() - INTERVAL '24 hours';

  DELETE FROM public.share_tokens
  WHERE user_id = demo_user_id
    AND created_at < NOW() - INTERVAL '24 hours';

  UPDATE public.profiles
  SET full_name = 'Demo Guest',
      date_of_birth = NULL
  WHERE id = demo_user_id
    AND is_demo = true;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.cleanup_demo_data() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.cleanup_demo_data() FROM anon;
GRANT EXECUTE ON FUNCTION public.cleanup_demo_data() TO authenticated;

-- --------------------------------------------------------------------------
-- 3. Trigger — prevent demo account password/email changes via Auth API
-- --------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.prevent_demo_auth_update()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF LOWER(NEW.email) = 'guest@tensitrack.com' THEN
    IF LOWER(NEW.email) IS DISTINCT FROM LOWER(OLD.email) THEN
      RAISE EXCEPTION 'Akun demo tidak dapat diubah.';
    END IF;
    IF NEW.encrypted_password IS DISTINCT FROM OLD.encrypted_password THEN
      RAISE EXCEPTION 'Password akun demo tidak dapat diubah.';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_prevent_demo_auth_update ON auth.users;
CREATE TRIGGER trg_prevent_demo_auth_update
  BEFORE UPDATE ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_demo_auth_update();

-- --------------------------------------------------------------------------
-- 4. Atomic RPC — hard cap check + insert (single BP record)
-- --------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.insert_bp_record_atomic(
  p_user_id UUID,
  p_systolic INT,
  p_diastolic INT,
  p_pulse INT DEFAULT NULL,
  p_category TEXT DEFAULT NULL,
  p_notes TEXT DEFAULT NULL,
  p_measured_at TIMESTAMPTZ DEFAULT NULL
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_is_demo BOOLEAN;
  v_count INT;
  v_cap CONSTANT INT := 100;
  v_new_id UUID;
BEGIN
  IF auth.uid() IS NOT NULL AND auth.uid() != p_user_id THEN
    RAISE EXCEPTION 'unauthorized';
  END IF;

  SELECT is_demo INTO v_is_demo FROM public.profiles WHERE id = p_user_id;

  IF v_is_demo THEN
    SELECT COUNT(*) INTO v_count FROM public.blood_pressure_records WHERE user_id = p_user_id;
    IF v_count >= v_cap THEN
      RETURN jsonb_build_object(
        'error', 'Batas demo tercapai. Silakan buat akun gratis untuk melanjutkan.'
      );
    END IF;
  END IF;

  INSERT INTO public.blood_pressure_records
    (user_id, systolic, diastolic, pulse, category, notes, measured_at)
  VALUES
    (p_user_id, p_systolic, p_diastolic, p_pulse, p_category, p_notes, p_measured_at)
  RETURNING id INTO v_new_id;

  RETURN jsonb_build_object('success', true, 'id', v_new_id);
END;
$$;

REVOKE EXECUTE ON FUNCTION public.insert_bp_record_atomic(
  UUID, INT, INT, INT, TEXT, TEXT, TIMESTAMPTZ
) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.insert_bp_record_atomic(
  UUID, INT, INT, INT, TEXT, TEXT, TIMESTAMPTZ
) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.insert_bp_record_atomic(
  UUID, INT, INT, INT, TEXT, TEXT, TIMESTAMPTZ
) TO service_role;

-- --------------------------------------------------------------------------
-- 5. Atomic RPC — hard cap check + batch insert (BP records)
-- --------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.batch_insert_bp_records_atomic(
  p_user_id UUID,
  p_records JSONB
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_is_demo BOOLEAN;
  v_count INT;
  v_cap CONSTANT INT := 100;
  v_batch_size INT;
  v_rec JSONB;
  v_systolic INT;
  v_diastolic INT;
  v_pulse INT;
  v_category TEXT;
  v_notes TEXT;
  v_measured_at TIMESTAMPTZ;
BEGIN
  IF auth.uid() IS NOT NULL AND auth.uid() != p_user_id THEN
    RAISE EXCEPTION 'unauthorized';
  END IF;

  SELECT is_demo INTO v_is_demo FROM public.profiles WHERE id = p_user_id;

  v_batch_size := jsonb_array_length(p_records);

  IF v_is_demo THEN
    SELECT COUNT(*) INTO v_count FROM public.blood_pressure_records WHERE user_id = p_user_id;
    IF v_count + v_batch_size > v_cap THEN
      RETURN jsonb_build_object(
        'error', 'Batas demo tercapai. Silakan buat akun gratis untuk melanjutkan.'
      );
    END IF;
  END IF;

  FOR v_rec IN SELECT * FROM jsonb_array_elements(p_records)
  LOOP
    v_systolic := (v_rec->>'systolic')::INT;
    v_diastolic := (v_rec->>'diastolic')::INT;
    v_pulse := NULLIF(v_rec->>'pulse', '')::INT;
    v_category := v_rec->>'category';
    v_notes := NULLIF(v_rec->>'notes', '');
    v_measured_at := (v_rec->>'measured_at')::TIMESTAMPTZ;

    INSERT INTO public.blood_pressure_records
      (user_id, systolic, diastolic, pulse, category, notes, measured_at)
    VALUES
      (p_user_id, v_systolic, v_diastolic, v_pulse, v_category, v_notes, v_measured_at);
  END LOOP;

  RETURN jsonb_build_object('success', true, 'count', v_batch_size);
END;
$$;

REVOKE EXECUTE ON FUNCTION public.batch_insert_bp_records_atomic(
  UUID, JSONB
) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.batch_insert_bp_records_atomic(
  UUID, JSONB
) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.batch_insert_bp_records_atomic(
  UUID, JSONB
) TO service_role;

-- --------------------------------------------------------------------------
-- 6. Atomic RPC — hard cap check + insert (share token)
-- --------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.create_share_token_atomic(
  p_user_id UUID,
  p_token TEXT,
  p_expires_at TIMESTAMPTZ DEFAULT NULL,
  p_max_views INT DEFAULT NULL
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_is_demo BOOLEAN;
  v_count INT;
  v_cap CONSTANT INT := 50;
  v_result RECORD;
BEGIN
  IF auth.uid() IS NOT NULL AND auth.uid() != p_user_id THEN
    RAISE EXCEPTION 'unauthorized';
  END IF;

  SELECT is_demo INTO v_is_demo FROM public.profiles WHERE id = p_user_id;

  IF v_is_demo THEN
    SELECT COUNT(*) INTO v_count
    FROM public.share_tokens
    WHERE user_id = p_user_id AND is_active = TRUE;

    IF v_count >= v_cap THEN
      RETURN jsonb_build_object(
        'error', 'Batas demo tercapai. Silakan buat akun gratis untuk melanjutkan.'
      );
    END IF;
  END IF;

  INSERT INTO public.share_tokens
    (user_id, token, expires_at, max_views)
  VALUES
    (p_user_id, p_token, p_expires_at, p_max_views)
  RETURNING * INTO v_result;

  RETURN jsonb_build_object(
    'success', true,
    'id', v_result.id,
    'user_id', v_result.user_id,
    'token', v_result.token,
    'expires_at', v_result.expires_at,
    'is_active', v_result.is_active,
    'view_count', v_result.view_count,
    'max_views', v_result.max_views,
    'created_at', v_result.created_at,
    'updated_at', v_result.updated_at
  );
END;
$$;

REVOKE EXECUTE ON FUNCTION public.create_share_token_atomic(
  UUID, TEXT, TIMESTAMPTZ, INT
) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.create_share_token_atomic(
  UUID, TEXT, TIMESTAMPTZ, INT
) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.create_share_token_atomic(
  UUID, TEXT, TIMESTAMPTZ, INT
) TO service_role;

-- --------------------------------------------------------------------------
-- 7. Clean up stale rate limit rows (auth_rate_limits + share_rate_limits)
-- --------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.cleanup_stale_rate_limits()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_deleted_auth INT;
  v_deleted_share INT;
BEGIN
  DELETE FROM public.auth_rate_limits
  WHERE window_start < NOW() - INTERVAL '7 days';
  GET DIAGNOSTICS v_deleted_auth = ROW_COUNT;

  DELETE FROM public.share_rate_limits
  WHERE window_start < NOW() - INTERVAL '7 days';
  GET DIAGNOSTICS v_deleted_share = ROW_COUNT;

  IF v_deleted_auth > 0 OR v_deleted_share > 0 THEN
    RAISE NOTICE 'cleanup_stale_rate_limits: deleted auth=%, share=%', v_deleted_auth, v_deleted_share;
  END IF;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.cleanup_stale_rate_limits() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.cleanup_stale_rate_limits() FROM anon;
GRANT EXECUTE ON FUNCTION public.cleanup_stale_rate_limits() TO authenticated;

-- --------------------------------------------------------------------------
-- 8. pg_cron — scheduled cleanup jobs
-- --------------------------------------------------------------------------
DO $$
BEGIN
  CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'pg_cron unavailable — cleanup will run via login trigger only.';
END
$$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    PERFORM cron.schedule(
      'cleanup-demo-data',
      '0 * * * *',
      'SELECT public.cleanup_demo_data();'
    );

    PERFORM cron.schedule(
      'cleanup-stale-rate-limits',
      '30 * * * *',
      'SELECT public.cleanup_stale_rate_limits();'
    );
  END IF;
END
$$;
