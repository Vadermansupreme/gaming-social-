
-- Add video and gallery support to posts table
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS video_urls text[];
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS gallery_urls text[];

-- Update the get_post_feed function to include new media fields
CREATE OR REPLACE FUNCTION public.get_post_feed(p_offset int, p_limit int)
RETURNS TABLE (
  post_id uuid,
  author_id uuid,
  created_at timestamptz,
  text text,
  media_urls text[],
  video_urls text[],
  gallery_urls text[],
  like_count int4,
  comment_count int4,
  author_display_name text,
  author_avatar_url text,
  author_vibe text,
  author_verified boolean
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  WITH base AS (
    SELECT p.id as post_id, p.author_id, p.created_at, p.text, p.media_urls,
           p.video_urls, p.gallery_urls, p.like_count, p.comment_count
    FROM public.posts p
    WHERE p.deleted_at IS NULL
    ORDER BY p.created_at DESC
    OFFSET GREATEST(p_offset,0) LIMIT GREATEST(p_limit,1)
  )
  SELECT b.post_id, b.author_id, b.created_at, b.text, b.media_urls,
         b.video_urls, b.gallery_urls, b.like_count, b.comment_count,
         pr.display_name as author_display_name,
         pr.avatar_url as author_avatar_url,
         pr.vibe as author_vibe,
         pr.verified as author_verified
  FROM base b
  JOIN public.profiles pr ON pr.id = b.author_id
  WHERE COALESCE(pr.is_visible,false) = true;
$$;

-- Create a video storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('videos', 'videos', true, 104857600, ARRAY['video/mp4', 'video/webm', 'video/quicktime'])
ON CONFLICT (id) DO NOTHING;

-- Create a gallery storage bucket  
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('gallery', 'gallery', true, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif'])
ON CONFLICT (id) DO NOTHING;
