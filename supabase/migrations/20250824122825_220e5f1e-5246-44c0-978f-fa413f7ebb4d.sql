-- Fix function search path mutable warning
CREATE OR REPLACE FUNCTION public.get_public_profile(profile_id uuid)
RETURNS TABLE(
  id uuid,
  display_name text,
  avatar_url text,
  verified boolean,
  bio text,
  fitness_level text,
  preferred_workouts text[],
  fitness_goals text[],
  availability text[],
  vibe text,
  followers_count integer,
  following_count integer,
  home_gym_place_id text
)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path TO 'public'
AS $function$
  SELECT 
    p.id,
    p.display_name,
    p.avatar_url,
    p.verified,
    p.bio,
    p.fitness_level,
    p.preferred_workouts,
    p.fitness_goals,
    p.availability,
    p.vibe,
    p.followers_count,
    p.following_count,
    p.home_gym_place_id
  FROM public.profiles p
  WHERE p.id = profile_id 
    AND p.is_visible = true
    AND p.id != auth.uid();
$function$;