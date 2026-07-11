-- 006_share_rate_limits.sql
-- Tabel share_rate_limits + RPC check_share_rate_limit untuk throttle
-- endpoint share publik agar tidak jadi DoS amplifier.

CREATE TABLE IF NOT EXISTS public.share_rate_limits (
  ip TEXT PRIMARY KEY,
  window_start TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  count INTEGER NOT NULL DEFAULT 1
);

CREATE INDEX IF NOT EXISTS idx_share_rate_limits_window_start
  ON public.share_rate_limits(window_start);

-- Atomic sliding-window per IP. Return TRUE jika request diizinkan.
-- Fail-open untuk input invalid / konfigurasi invalid.
CREATE OR REPLACE FUNCTION public.check_share_rate_limit(
  p_ip TEXT,
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
  IF p_ip IS NULL OR length(p_ip) = 0 OR length(p_ip) > 64 THEN
    RETURN TRUE;
  END IF;
  IF p_max_count <= 0 OR p_window_seconds <= 0 THEN
    RETURN TRUE;
  END IF;

  INSERT INTO public.share_rate_limits (ip, window_start, count)
  VALUES (p_ip, NOW(), 1)
  ON CONFLICT (ip) DO UPDATE SET
    count = CASE
      WHEN public.share_rate_limits.window_start
           + make_interval(secs => p_window_seconds) > NOW()
      THEN public.share_rate_limits.count + 1
      ELSE 1
    END,
    window_start = CASE
      WHEN public.share_rate_limits.window_start
           + make_interval(secs => p_window_seconds) > NOW()
      THEN public.share_rate_limits.window_start
      ELSE NOW()
    END
  RETURNING public.share_rate_limits.count INTO v_count;

  RETURN v_count <= p_max_count;
END;
$$;

GRANT EXECUTE ON FUNCTION public.check_share_rate_limit(TEXT, INT, INT) TO anon;
GRANT EXECUTE ON FUNCTION public.check_share_rate_limit(TEXT, INT, INT) TO authenticated;
