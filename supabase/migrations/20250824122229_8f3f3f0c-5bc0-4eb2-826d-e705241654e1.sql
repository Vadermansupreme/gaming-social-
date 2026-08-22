-- Ensure get_nearby_visible_users function uses SECURITY INVOKER explicitly
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