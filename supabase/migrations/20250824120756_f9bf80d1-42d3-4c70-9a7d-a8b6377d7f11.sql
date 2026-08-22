-- Fix security issue: Restrict profile visibility and remove sensitive data from public access

-- Drop the current overly permissive policy
DROP POLICY IF EXISTS "Profiles are viewable by everyone if visible or by self" ON public.profiles;

-- Create secure policies for profiles
CREATE POLICY "Users can view their own profile" 
  ON public.profiles 
  FOR SELECT 
  USING (auth.uid() = id);

CREATE POLICY "Authenticated users can view other users' basic profiles" 
  ON public.profiles 
  FOR SELECT 
  USING (
    auth.role() = 'authenticated' 
    AND is_visible = true 
    AND id != auth.uid()
  );

-- Create a public discovery view with only safe, non-sensitive data
CREATE OR REPLACE VIEW public.discoverable_profiles AS
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
  -- Remove precise coordinates, phone, and other sensitive data
  home_gym_place_id
FROM public.profiles 
WHERE is_visible = true;

-- Grant access to the discovery view for authenticated users only
GRANT SELECT ON public.discoverable_profiles TO authenticated;

-- Revoke any existing public access to profiles table
REVOKE ALL ON public.profiles FROM anon;
REVOKE ALL ON public.profiles FROM public;

-- Ensure only authenticated users can access profiles
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;