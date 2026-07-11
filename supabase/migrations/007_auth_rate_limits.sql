-- 007_auth_rate_limits.sql
-- Tabel auth_rate_limits + RPC check_auth_rate_limit untuk throttle
-- endpoint auth (login/register/forgot-password) supaya tidak jadi DoS.

CREATE TABLE IF NOT EXISTS public.auth_rate_limits (
  key TEXT PRIMARY KEY,
  window_start TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  count INTEGER NOT NULL DEFAULT 1
);

CREATE INDEX IF NOT EXISTS idx_auth_rate_limits_window_start
  ON public.auth_rate_limits(window_start);

-- Atomic sliding-window per key. Return TRUE jika request diizinkan.
-- Fail-open untuk input invalid / konfigurasi invalid.
CREATE OR REPLACE FUNCTION public.check_auth_rate_limit(
  p_key TEXT,
  p_max_count INT,
  p_window_seconds INT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_count INTEGER;
BEGIN
  IF p_key IS NULL OR length(p_key) = 0 OR length(p_key) > 128 THEN
    RETURN TRUE;
  END IF;
  IF p_max_count <= 0 OR p_window_seconds <= 0 THEN
    RETURN TRUE;
  END IF;

  INSERT INTO public.auth_rate_limits (key, window_start, count)
  VALUES (p_key, NOW(), 1)
  ON CONFLICT (key) DO UPDATE SET
    count = CASE
      WHEN public.auth_rate_limits.window_start
           + make_interval(secs => p_window_seconds) > NOW()
      THEN public.auth_rate_limits.count + 1
      ELSE 1
    END,
    window_start = CASE
      WHEN public.auth_rate_limits.window_start
           + make_interval(secs => p_window_seconds) > NOW()
      THEN public.auth_rate_limits.window_start
      ELSE NOW()
    END
  RETURNING public.auth_rate_limits.count INTO v_count;

  RETURN v_count <= p_max_count;
END;
$$;

GRANT EXECUTE ON FUNCTION public.check_auth_rate_limit(TEXT, INT, INT) TO anon;
GRANT EXECUTE ON FUNCTION public.check_auth_rate_limit(TEXT, INT, INT) TO authenticated;
