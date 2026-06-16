-- ============================================================================
-- FIX: Atomic increment of share_tokens.view_count with max_views enforcement
-- ============================================================================
-- Sebelumnya, validasi max_views dan increment view_count dilakukan di
-- aplikasi (read-modify-write) sehingga rentan race condition. Sekarang
-- dilakukan secara atomik di database via RPC.
-- ============================================================================

CREATE OR REPLACE FUNCTION public.increment_share_token_view(
  p_token TEXT
)
RETURNS TABLE (
  id UUID,
  user_id UUID,
  token TEXT,
  expires_at TIMESTAMPTZ,
  is_active BOOLEAN,
  view_count INTEGER,
  max_views INTEGER,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  status TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_share_token public.share_tokens%ROWTYPE;
  v_status TEXT;
BEGIN
  -- Lock row untuk mencegah race condition
  -- (qualify kolom 'token' dengan share_tokens.token supaya tidak
  -- ambigu dengan parameter function p_token)
  SELECT st.*
  INTO v_share_token
  FROM public.share_tokens st
  WHERE st.token = p_token
  FOR UPDATE;

  -- Token tidak ditemukan
  IF NOT FOUND THEN
    RETURN QUERY SELECT
      NULL::UUID, NULL::UUID, NULL::TEXT, NULL::TIMESTAMPTZ,
      NULL::BOOLEAN, NULL::INTEGER, NULL::INTEGER,
      NULL::TIMESTAMPTZ, NULL::TIMESTAMPTZ,
      'not_found'::TEXT;
    RETURN;
  END IF;

  -- Token non-aktif
  IF v_share_token.is_active = FALSE THEN
    RETURN QUERY SELECT
      v_share_token.id, v_share_token.user_id, v_share_token.token,
      v_share_token.expires_at, v_share_token.is_active,
      v_share_token.view_count, v_share_token.max_views,
      v_share_token.created_at, v_share_token.updated_at,
      'inactive'::TEXT;
    RETURN;
  END IF;

  -- Token kadaluarsa
  IF v_share_token.expires_at IS NOT NULL
     AND v_share_token.expires_at < NOW() THEN
    -- Auto-deactivate
    UPDATE public.share_tokens
    SET is_active = FALSE
    WHERE share_tokens.id = v_share_token.id;

    RETURN QUERY SELECT
      v_share_token.id, v_share_token.user_id, v_share_token.token,
      v_share_token.expires_at, FALSE,
      v_share_token.view_count, v_share_token.max_views,
      v_share_token.created_at, v_share_token.updated_at,
      'expired'::TEXT;
    RETURN;
  END IF;

  -- Sudah mencapai max views
  IF v_share_token.max_views IS NOT NULL
     AND v_share_token.view_count >= v_share_token.max_views THEN
    RETURN QUERY SELECT
      v_share_token.id, v_share_token.user_id, v_share_token.token,
      v_share_token.expires_at, v_share_token.is_active,
      v_share_token.view_count, v_share_token.max_views,
      v_share_token.created_at, v_share_token.updated_at,
      'max_views_reached'::TEXT;
    RETURN;
  END IF;

  -- OK: increment view_count secara atomic
  UPDATE public.share_tokens
  SET view_count = v_share_token.view_count + 1,
      updated_at = NOW()
  WHERE share_tokens.id = v_share_token.id
  RETURNING share_tokens.* INTO v_share_token;

  RETURN QUERY SELECT
    v_share_token.id, v_share_token.user_id, v_share_token.token,
    v_share_token.expires_at, v_share_token.is_active,
    v_share_token.view_count, v_share_token.max_views,
    v_share_token.created_at, v_share_token.updated_at,
    'ok'::TEXT;
END;
$$;

-- Grant execute ke anon & authenticated untuk akses share publik
GRANT EXECUTE ON FUNCTION public.increment_share_token_view(TEXT) TO anon;
GRANT EXECUTE ON FUNCTION public.increment_share_token_view(TEXT) TO authenticated;
