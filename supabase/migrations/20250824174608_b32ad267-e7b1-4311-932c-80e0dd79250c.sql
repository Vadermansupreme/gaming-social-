
-- Add ZIP code and home location fields to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS zip_code text,
ADD COLUMN IF NOT EXISTS home_lat double precision,
ADD COLUMN IF NOT EXISTS home_lng double precision;

-- Create post_media table for handling multiple photos/videos per post
CREATE TABLE IF NOT EXISTS public.post_media (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id uuid NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  url text NOT NULL,
  type text NOT NULL CHECK (type IN ('image', 'video')),
  position integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on post_media table
ALTER TABLE public.post_media ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for post_media
CREATE POLICY IF NOT EXISTS "Post media is viewable by everyone" 
  ON public.post_media 
  FOR SELECT 
  USING (true);

CREATE POLICY IF NOT EXISTS "Users can create media for their own posts" 
  ON public.post_media 
  FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.posts 
      WHERE posts.id = post_media.post_id 
      AND posts.author_id = auth.uid()
    )
  );

CREATE POLICY IF NOT EXISTS "Users can update media for their own posts" 
  ON public.post_media 
  FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM public.posts 
      WHERE posts.id = post_media.post_id 
      AND posts.author_id = auth.uid()
    )
  );

CREATE POLICY IF NOT EXISTS "Users can delete media for their own posts" 
  ON public.post_media 
  FOR DELETE 
  USING (
    EXISTS (
      SELECT 1 FROM public.posts 
      WHERE posts.id = post_media.post_id 
      AND posts.author_id = auth.uid()
    )
  );

-- Create storage bucket for posts media (if it doesn't exist)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'posts-media', 
  'posts-media', 
  true, 
  52428800, -- 50MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'video/mp4']
)
ON CONFLICT (id) DO NOTHING;

-- Create RLS policies for posts-media bucket
DO $$
BEGIN
  -- Drop existing policies if they exist to avoid conflicts
  DROP POLICY IF EXISTS "Anyone can view posts media" ON storage.objects;
  DROP POLICY IF EXISTS "Authenticated users can upload posts media" ON storage.objects;
  DROP POLICY IF EXISTS "Users can update their own posts media" ON storage.objects;
  DROP POLICY IF EXISTS "Users can delete their own posts media" ON storage.objects;
  
  -- Create new policies
  CREATE POLICY "Anyone can view posts media" 
    ON storage.objects 
    FOR SELECT 
    USING (bucket_id = 'posts-media');

  CREATE POLICY "Authenticated users can upload posts media" 
    ON storage.objects 
    FOR INSERT 
    WITH CHECK (
      bucket_id = 'posts-media' 
      AND auth.role() = 'authenticated'
    );

  CREATE POLICY "Users can update their own posts media" 
    ON storage.objects 
    FOR UPDATE 
    USING (
      bucket_id = 'posts-media' 
      AND auth.uid()::text = (storage.foldername(name))[1]
    );

  CREATE POLICY "Users can delete their own posts media" 
    ON storage.objects 
    FOR DELETE 
    USING (
      bucket_id = 'posts-media' 
      AND auth.uid()::text = (storage.foldername(name))[1]
    );
END
$$;
