
-- PROFILES: lock down SELECT to owner only; expose safe fields via RPC
DROP POLICY IF EXISTS "Authenticated users can view basic public profiles" ON public.profiles;

CREATE POLICY "profiles_select_own"
ON public.profiles
FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- Public safe profile RPC (no PII)
CREATE OR REPLACE FUNCTION public.get_public_profile(p_profile_id uuid)
RETURNS TABLE (
  id uuid,
  display_name text,
  avatar_url text,
  bio text,
  fitness_goals text[],
  fitness_level text,
  preferred_workouts text[],
  followers_count int4,
  following_count int4,
  home_gym_place_id text,
  verified boolean,
  vibe text
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id, display_name, avatar_url, bio, fitness_goals, fitness_level,
         preferred_workouts, followers_count, following_count, home_gym_place_id,
         verified, vibe
  FROM public.profiles
  WHERE id = p_profile_id
    AND COALESCE(is_visible, false) = true;
$$;

REVOKE ALL ON FUNCTION public.get_public_profile(uuid) FROM public;
GRANT EXECUTE ON FUNCTION public.get_public_profile(uuid) TO authenticated;

-- FEED helper returning posts + safe author fields
CREATE OR REPLACE FUNCTION public.get_post_feed(p_offset int, p_limit int)
RETURNS TABLE (
  post_id uuid,
  author_id uuid,
  created_at timestamptz,
  text text,
  media_urls text[],
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
           p.like_count, p.comment_count
    FROM public.posts p
    WHERE p.deleted_at IS NULL
    ORDER BY p.created_at DESC
    OFFSET GREATEST(p_offset,0) LIMIT GREATEST(p_limit,1)
  )
  SELECT b.post_id, b.author_id, b.created_at, b.text, b.media_urls,
         b.like_count, b.comment_count,
         pr.display_name as author_display_name,
         pr.avatar_url as author_avatar_url,
         pr.vibe as author_vibe,
         pr.verified as author_verified
  FROM base b
  JOIN public.profiles pr ON pr.id = b.author_id
  WHERE COALESCE(pr.is_visible,false) = true;
$$;

REVOKE ALL ON FUNCTION public.get_post_feed(int,int) FROM public;
GRANT EXECUTE ON FUNCTION public.get_post_feed(int,int) TO authenticated;

-- Privacy defaults: new users are hidden until they opt in
ALTER TABLE public.profiles ALTER COLUMN is_visible SET DEFAULT false;

-- MESSAGES: restrict recipient edits to read flags only via trigger
CREATE OR REPLACE FUNCTION public.enforce_message_update()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  -- Never allow changing linkage
  IF NEW.sender_id <> OLD.sender_id
     OR NEW.recipient_id <> OLD.recipient_id
     OR NEW.thread_id <> OLD.thread_id THEN
    RAISE EXCEPTION 'Not allowed to change message linkage';
  END IF;

  -- Recipient can only toggle read fields
  IF auth.uid() = OLD.recipient_id THEN
    IF (NEW.read IS DISTINCT FROM OLD.read) THEN
      -- Update read_by jsonb array when read status changes
      IF NEW.read = true AND OLD.read = false THEN
        NEW.read_by := COALESCE(OLD.read_by, '[]'::jsonb) || jsonb_build_array(auth.uid());
      END IF;
    END IF;

    IF COALESCE(NEW.text,'') <> COALESCE(OLD.text,'')
       OR COALESCE(NEW.attachment_url,'') <> COALESCE(OLD.attachment_url,'') THEN
      RAISE EXCEPTION 'Recipient can only toggle read status';
    END IF;

    RETURN NEW;
  END IF;

  -- Sender can edit content, but not read flags
  IF auth.uid() = OLD.sender_id THEN
    NEW.read := OLD.read;
    NEW.read_by := OLD.read_by;
    RETURN NEW;
  END IF;

  RAISE EXCEPTION 'Not allowed to update this message';
END;
$$;

DROP TRIGGER IF EXISTS trg_enforce_message_update ON public.messages;
CREATE TRIGGER trg_enforce_message_update
BEFORE UPDATE ON public.messages
FOR EACH ROW EXECUTE FUNCTION public.enforce_message_update();

-- POSTS: soft delete support
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS deleted_at timestamptz;

-- STORAGE: make user-uploads private and scoped to owner
UPDATE storage.buckets SET public = false WHERE id = 'user-uploads';

-- Storage RLS for user-uploads bucket
CREATE POLICY IF NOT EXISTS "user-uploads read own"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'user-uploads'
  AND (regexp_split_to_array(name, '/'))[1] = auth.uid()::text
);

CREATE POLICY IF NOT EXISTS "user-uploads write own"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'user-uploads'
  AND (regexp_split_to_array(name, '/'))[1] = auth.uid()::text
);

CREATE POLICY IF NOT EXISTS "user-uploads update/delete own"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'user-uploads' AND (regexp_split_to_array(name, '/'))[1] = auth.uid()::text)
WITH CHECK (bucket_id = 'user-uploads' AND (regexp_split_to_array(name, '/'))[1] = auth.uid()::text);

CREATE POLICY IF NOT EXISTS "user-uploads delete own"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'user-uploads'
  AND (regexp_split_to_array(name, '/'))[1] = auth.uid()::text
);

-- GYMS CACHE: used by places/details function
CREATE TABLE IF NOT EXISTS public.gyms_cache (
  place_id text PRIMARY KEY,
  name text,
  lat double precision,
  lng double precision,
  address text,
  phone text,
  website text,
  rating numeric,
  raw jsonb,
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.gyms_cache ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "read_gyms_cache"
ON public.gyms_cache
FOR SELECT
TO anon, authenticated
USING (true);

-- Rate limit table for API usage tracking
CREATE TABLE IF NOT EXISTS public.rate_limits (
  key text,
  ts timestamptz DEFAULT now()
);
ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "insert_any_rate"
ON public.rate_limits FOR INSERT TO authenticated, anon WITH CHECK (true);
CREATE POLICY IF NOT EXISTS "read_none_rate"
ON public.rate_limits FOR SELECT TO authenticated, anon USING (false);
