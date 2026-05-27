-- Create share_tokens table for shareable links
CREATE TABLE IF NOT EXISTS public.share_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  view_count INTEGER DEFAULT 0,
  max_views INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX idx_share_tokens_token ON public.share_tokens(token);
CREATE INDEX idx_share_tokens_user_id ON public.share_tokens(user_id);
CREATE INDEX idx_share_tokens_expires_at ON public.share_tokens(expires_at);

-- Enable RLS
ALTER TABLE public.share_tokens ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users can view their own share tokens
CREATE POLICY "Users can view own share tokens"
ON public.share_tokens FOR SELECT
USING (auth.uid() = user_id);

-- Users can create their own share tokens
CREATE POLICY "Users can create own share tokens"
ON public.share_tokens FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own share tokens
CREATE POLICY "Users can update own share tokens"
ON public.share_tokens FOR UPDATE
USING (auth.uid() = user_id);

-- Users can delete their own share tokens
CREATE POLICY "Users can delete own share tokens"
ON public.share_tokens FOR DELETE
USING (auth.uid() = user_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_share_tokens_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
CREATE TRIGGER update_share_tokens_updated_at
BEFORE UPDATE ON public.share_tokens
FOR EACH ROW
EXECUTE FUNCTION update_share_tokens_updated_at();

-- Function to clean up expired tokens (optional, can be run periodically)
CREATE OR REPLACE FUNCTION cleanup_expired_share_tokens()
RETURNS void AS $$
BEGIN
  UPDATE public.share_tokens
  SET is_active = false
  WHERE expires_at IS NOT NULL 
    AND expires_at < NOW()
    AND is_active = true;
END;
$$ LANGUAGE plpgsql;
