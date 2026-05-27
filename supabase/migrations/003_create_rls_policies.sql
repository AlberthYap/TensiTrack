-- RLS Policies for profiles table

-- Users can view their own profile
CREATE POLICY "Users can view own profile"
  ON public.profiles
  FOR SELECT
  USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON public.profiles
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- RLS Policies for blood_pressure_records table

-- Users can view their own records (excluding soft deleted)
CREATE POLICY "Users can view own records"
  ON public.blood_pressure_records
  FOR SELECT
  USING (auth.uid() = user_id AND deleted_at IS NULL);

-- Users can insert their own records
CREATE POLICY "Users can insert own records"
  ON public.blood_pressure_records
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own records
CREATE POLICY "Users can update own records"
  ON public.blood_pressure_records
  FOR UPDATE
  USING (auth.uid() = user_id AND deleted_at IS NULL)
  WITH CHECK (auth.uid() = user_id);

-- Users can soft delete their own records (by setting deleted_at)
CREATE POLICY "Users can delete own records"
  ON public.blood_pressure_records
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
