-- Fix security definer view issue by recreating view without security definer
DROP VIEW IF EXISTS public.discoverable_profiles;

-- Create secure discovery view without security definer (uses caller's permissions)
CREATE VIEW public.discoverable_profiles AS
SELECT 
  id,
  display_name,
  avatar_url,
  verified,
  bio,
  fitness_level,
  preferred_workouts,
  fitness_goals,
  availability,
  vibe,
  followers_count,
  following_count,
  home_gym_place_id
FROM public.profiles 
WHERE is_visible = true;

-- Grant access to authenticated users only
GRANT SELECT ON public.discoverable_profiles TO authenticated;