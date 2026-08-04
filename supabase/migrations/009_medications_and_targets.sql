-- =============================================================================
-- 009: Medication tracking + target blood pressure
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. Medications table
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.medications (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  dosage      TEXT,                                          -- e.g. "10mg", "1 tablet"
  taken       BOOLEAN NOT NULL DEFAULT FALSE,
  taken_date  DATE NOT NULL DEFAULT CURRENT_DATE,            -- which day this log is for
  notes       TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_medications_user_date
  ON public.medications (user_id, taken_date DESC);

-- Enable RLS
ALTER TABLE public.medications ENABLE ROW LEVEL SECURITY;

-- RLS: users can CRUD their own medications only
CREATE POLICY "Users can view own medications"
  ON public.medications
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own medications"
  ON public.medications
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own medications"
  ON public.medications
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own medications"
  ON public.medications
  FOR DELETE
  USING (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- 2. Target blood pressure columns on profiles
-- ---------------------------------------------------------------------------
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS target_systolic  INTEGER,
  ADD COLUMN IF NOT EXISTS target_diastolic INTEGER;

-- No RLS changes needed — profiles already has RLS from 003.
