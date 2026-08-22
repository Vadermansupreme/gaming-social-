-- Ensure all table-returning functions use SECURITY INVOKER explicitly
-- This addresses the linter's concern about "security definer views"

-- Re-create get_nearby_visible_users with explicit SECURITY INVOKER
CREATE OR REPLACE FUNCTION public.get_nearby_visible_users()
RETURNS TABLE(user_id uuid, lat double precision, lng double precision, updated_at timestamp with time zone)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path TO 'public'
AS $function$
  SELECT 
    l.user_id,
    l.lat,
    l.lng,
    l.updated_at
  FROM public.locations l
  WHERE 
    l.share_location = true 
    AND l.updated_at > now() - interval '2 hours';
$function$;

-- Comment to clarify that trigger functions legitimately need SECURITY DEFINER
COMMENT ON FUNCTION public.handle_new_user() IS 'Trigger function - requires SECURITY DEFINER for proper operation';
COMMENT ON FUNCTION public.update_post_comment_count() IS 'Trigger function - requires SECURITY DEFINER for proper operation';
COMMENT ON FUNCTION public.update_post_like_count() IS 'Trigger function - requires SECURITY DEFINER for proper operation';
COMMENT ON FUNCTION public.update_follow_counts() IS 'Trigger function - requires SECURITY DEFINER for proper operation';
COMMENT ON FUNCTION public.update_updated_at_column() IS 'Trigger function - requires SECURITY DEFINER for proper operation';