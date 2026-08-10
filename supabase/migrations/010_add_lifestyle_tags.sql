-- 010: Add lifestyle tags to blood pressure records.
-- Users can tag recordings with lifestyle labels (stress, salty food, etc.)
-- for correlation insights. Also updates atomic RPC functions so demo
-- users' tags are not silently dropped.

-- ======================================================================
-- 1. Add `tags` column and GIN index
-- ======================================================================
ALTER TABLE public.blood_pressure_records
  ADD COLUMN IF NOT EXISTS tags text[] NOT NULL DEFAULT '{}';

CREATE INDEX IF NOT EXISTS idx_records_tags
  ON public.blood_pressure_records USING GIN (tags);

COMMENT ON COLUMN public.blood_pressure_records.tags IS
  'Array of lifestyle tags, e.g. {stress, olahraga, makan_asin}';

-- ======================================================================
-- 2. insert_bp_record_atomic — add p_tags parameter
-- ======================================================================
DROP FUNCTION IF EXISTS public.insert_bp_record_atomic(
  UUID, INT, INT, INT, TEXT, TEXT, TIMESTAMPTZ
);

CREATE OR REPLACE FUNCTION public.insert_bp_record_atomic(
  p_user_id UUID,
  p_systolic INT,
  p_diastolic INT,
  p_pulse INT DEFAULT NULL,
  p_category TEXT DEFAULT NULL,
  p_notes TEXT DEFAULT NULL,
  p_measured_at TIMESTAMPTZ DEFAULT NULL,
  p_tags TEXT[] DEFAULT '{}'
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
    (user_id, systolic, diastolic, pulse, category, notes, measured_at, tags)
  VALUES
    (p_user_id, p_systolic, p_diastolic, p_pulse, p_category, p_notes, p_measured_at, p_tags)
  RETURNING id INTO v_new_id;

  RETURN jsonb_build_object('success', true, 'id', v_new_id);
END;
$$;

REVOKE EXECUTE ON FUNCTION public.insert_bp_record_atomic(
  UUID, INT, INT, INT, TEXT, TEXT, TIMESTAMPTZ, TEXT[]
) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.insert_bp_record_atomic(
  UUID, INT, INT, INT, TEXT, TEXT, TIMESTAMPTZ, TEXT[]
) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.insert_bp_record_atomic(
  UUID, INT, INT, INT, TEXT, TEXT, TIMESTAMPTZ, TEXT[]
) TO service_role;

-- ======================================================================
-- 3. batch_insert_bp_records_atomic — add tags support
-- ======================================================================
DROP FUNCTION IF EXISTS public.batch_insert_bp_records_atomic(UUID, JSONB);

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
  v_tags TEXT[];
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
    v_tags := CASE
      WHEN v_rec ? 'tags' AND jsonb_typeof(v_rec->'tags') = 'array'
      THEN ARRAY(SELECT jsonb_array_elements_text(v_rec->'tags'))
      ELSE '{}'
    END;

    INSERT INTO public.blood_pressure_records
      (user_id, systolic, diastolic, pulse, category, notes, measured_at, tags)
    VALUES
      (p_user_id, v_systolic, v_diastolic, v_pulse, v_category, v_notes, v_measured_at, v_tags);
  END LOOP;

  RETURN jsonb_build_object('success', true, 'count', v_batch_size);
END;
$$;

REVOKE EXECUTE ON FUNCTION public.batch_insert_bp_records_atomic(UUID, JSONB) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.batch_insert_bp_records_atomic(UUID, JSONB) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.batch_insert_bp_records_atomic(UUID, JSONB) TO service_role;
