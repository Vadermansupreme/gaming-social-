-- Add zip_code column to profiles table if it doesn't exist
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS zip_code text;

-- Add comment for documentation
COMMENT ON COLUMN public.profiles.zip_code IS 'User ZIP code for location-based features';