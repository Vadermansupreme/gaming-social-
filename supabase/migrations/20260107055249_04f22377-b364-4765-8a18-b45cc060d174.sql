-- ============================================
-- UI-001: Like/Comment Count Triggers + Backfill
-- ============================================

-- 1. Drop existing triggers to prevent conflicts
DROP TRIGGER IF EXISTS trg_likes_insert ON public.likes;
DROP TRIGGER IF EXISTS trg_likes_delete ON public.likes;
DROP TRIGGER IF EXISTS trg_comments_insert ON public.comments;
DROP TRIGGER IF EXISTS trg_comments_delete ON public.comments;

-- 2. Create trigger function for like_count
CREATE OR REPLACE FUNCTION public.trg_update_post_like_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.posts
    SET like_count = like_count + 1
    WHERE id = NEW.post_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.posts
    SET like_count = GREATEST(like_count - 1, 0)
    WHERE id = OLD.post_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

-- 3. Create trigger function for comment_count
CREATE OR REPLACE FUNCTION public.trg_update_post_comment_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.posts
    SET comment_count = comment_count + 1
    WHERE id = NEW.post_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.posts
    SET comment_count = GREATEST(comment_count - 1, 0)
    WHERE id = OLD.post_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

-- 4. Create triggers on likes table
CREATE TRIGGER trg_likes_insert
AFTER INSERT ON public.likes
FOR EACH ROW
EXECUTE FUNCTION public.trg_update_post_like_count();

CREATE TRIGGER trg_likes_delete
AFTER DELETE ON public.likes
FOR EACH ROW
EXECUTE FUNCTION public.trg_update_post_like_count();

-- 5. Create triggers on comments table
CREATE TRIGGER trg_comments_insert
AFTER INSERT ON public.comments
FOR EACH ROW
EXECUTE FUNCTION public.trg_update_post_comment_count();

CREATE TRIGGER trg_comments_delete
AFTER DELETE ON public.comments
FOR EACH ROW
EXECUTE FUNCTION public.trg_update_post_comment_count();

-- 6. One-time backfill: sync like_count from actual likes
UPDATE public.posts p
SET like_count = (
  SELECT COUNT(*)::int
  FROM public.likes l
  WHERE l.post_id = p.id
);

-- 7. One-time backfill: sync comment_count from actual comments
UPDATE public.posts p
SET comment_count = (
  SELECT COUNT(*)::int
  FROM public.comments c
  WHERE c.post_id = p.id
);