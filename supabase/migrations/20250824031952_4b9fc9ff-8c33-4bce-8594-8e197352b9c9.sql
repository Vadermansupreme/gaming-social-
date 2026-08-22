
-- Add is_visible column to profiles with default false for privacy
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS is_visible BOOLEAN DEFAULT false;

-- Create public_profiles view that only exposes safe data for visible profiles
CREATE OR REPLACE VIEW public.public_profiles AS
SELECT 
  id,
  display_name,
  avatar_url,
  verified,
  bio,
  home_gym_place_id,
  followers_count,
  following_count
FROM public.profiles 
WHERE is_visible = true;

-- Grant SELECT permission on the view to authenticated users
GRANT SELECT ON public.public_profiles TO authenticated;
GRANT SELECT ON public.public_profiles TO anon;

-- Update profiles RLS policies to be more restrictive
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Users can view public profiles" ON public.profiles;

-- Only allow users to see their own full profile data
CREATE POLICY "Users can only view their own profile" 
  ON public.profiles 
  FOR SELECT 
  USING (auth.uid() = id);

-- Storage security policies for user-uploads bucket (make private)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('user-uploads-private', 'user-uploads-private', false)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies for private user uploads
CREATE POLICY "Users can upload their own files" 
  ON storage.objects 
  FOR INSERT 
  WITH CHECK (
    bucket_id = 'user-uploads-private' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can view their own files" 
  ON storage.objects 
  FOR SELECT 
  USING (
    bucket_id = 'user-uploads-private' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can update their own files" 
  ON storage.objects 
  FOR UPDATE 
  USING (
    bucket_id = 'user-uploads-private' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete their own files" 
  ON storage.objects 
  FOR DELETE 
  USING (
    bucket_id = 'user-uploads-private' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Secure post-media bucket (public read, authenticated write with ownership)
CREATE POLICY "Anyone can view post media" 
  ON storage.objects 
  FOR SELECT 
  USING (bucket_id = 'post-media');

CREATE POLICY "Authenticated users can upload post media" 
  ON storage.objects 
  FOR INSERT 
  WITH CHECK (
    bucket_id = 'post-media' 
    AND auth.role() = 'authenticated'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can update their own post media" 
  ON storage.objects 
  FOR UPDATE 
  USING (
    bucket_id = 'post-media' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete their own post media" 
  ON storage.objects 
  FOR DELETE 
  USING (
    bucket_id = 'post-media' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Secure avatars bucket (public read, authenticated write with ownership)
CREATE POLICY "Anyone can view avatars" 
  ON storage.objects 
  FOR SELECT 
  USING (bucket_id = 'avatars');

CREATE POLICY "Authenticated users can upload avatars" 
  ON storage.objects 
  FOR INSERT 
  WITH CHECK (
    bucket_id = 'avatars' 
    AND auth.role() = 'authenticated'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can update their own avatars" 
  ON storage.objects 
  FOR UPDATE 
  USING (
    bucket_id = 'avatars' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete their own avatars" 
  ON storage.objects 
  FOR DELETE 
  USING (
    bucket_id = 'avatars' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );
