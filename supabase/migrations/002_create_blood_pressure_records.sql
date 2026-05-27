-- Create blood_pressure_records table
CREATE TABLE IF NOT EXISTS public.blood_pressure_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  systolic INTEGER NOT NULL CHECK (systolic >= 50 AND systolic <= 250),
  diastolic INTEGER NOT NULL CHECK (diastolic >= 30 AND diastolic <= 150),
  pulse INTEGER CHECK (pulse >= 30 AND pulse <= 200),
  category TEXT NOT NULL CHECK (category IN ('low', 'normal', 'elevated', 'hypertension_stage_1', 'hypertension_stage_2')),
  notes TEXT,
  measured_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- Enable RLS
ALTER TABLE public.blood_pressure_records ENABLE ROW LEVEL SECURITY;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS blood_pressure_records_user_id_measured_at_idx 
  ON public.blood_pressure_records(user_id, measured_at DESC) 
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS blood_pressure_records_user_id_category_idx 
  ON public.blood_pressure_records(user_id, category) 
  WHERE deleted_at IS NULL;

-- Create trigger for updated_at
CREATE TRIGGER blood_pressure_records_updated_at
  BEFORE UPDATE ON public.blood_pressure_records
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();
