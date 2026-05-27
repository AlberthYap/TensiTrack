-- ============================================================================
-- PROFILES TABLE
-- ============================================================================
-- Tabel ini menyimpan data profil user TAMBAHAN saja.
--
-- CATATAN PENTING:
-- ❌ TIDAK ADA kolom password di sini!
-- ✅ Password sudah dikelola oleh Supabase Auth di tabel auth.users
--
-- Supabase Auth (schema auth) sudah menangani:
-- - Email & Password (ter-hash dengan bcrypt)
-- - Email verification
-- - Password reset
-- - Session management
-- - JWT tokens
--
-- Tabel profiles hanya untuk data custom seperti:
-- - full_name
-- - date_of_birth
-- - avatar_url (jika diperlukan)
-- - dll
--
-- Relasi: profiles.id -> auth.users.id (one-to-one)
-- ============================================================================

-- Create profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  date_of_birth DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for profiles
CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Create function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
