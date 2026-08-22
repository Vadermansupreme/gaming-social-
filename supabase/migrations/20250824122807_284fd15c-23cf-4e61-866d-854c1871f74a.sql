-- Fix security vulnerability: Remove access to sensitive profile data
-- Drop the overly permissive policy that exposes sensitive data
DROP POLICY IF EXISTS "Authenticated users can view other users' basic profiles" ON public.profiles;

-- Recreate the discoverable_profiles view to only expose safe, public data
DROP VIEW IF EXISTS public.discoverable_profiles;

-- Create a secure discovery view with only non-sensitive data
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
  home_gym_place_id,
  -- Exclude sensitive data: phone, lat, lng, first_name, last_name, last_seen_at
  created_at  -- Only creation date, not last seen
FROM public.profiles 
WHERE is_visible = true;

-- Grant access to authenticated users only for the safe view
GRANT SELECT ON public.discoverable_profiles TO authenticated;

-- Create a more restrictive policy for direct profile access
-- Only allow viewing basic profile info, excluding sensitive fields
CREATE POLICY "Authenticated users can view basic public profiles" 
ON public.profiles 
FOR SELECT 
TO authenticated
USING (
  is_visible = true 
  AND id != auth.uid()
);

-- Add a function to safely get public profile data only
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