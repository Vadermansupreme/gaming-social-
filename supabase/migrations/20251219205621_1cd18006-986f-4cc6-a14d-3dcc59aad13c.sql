-- TASK 1: Fix profiles data exposure
-- Drop the overly permissive policy that exposes all columns
DROP POLICY IF EXISTS "profiles_read_public_safe" ON public.profiles;

-- Create a new policy that only allows reading safe public fields for other users
-- Sensitive fields (phone, lat, lng, zip_code, home_gym_address) are NOT exposed
-- The view discoverable_profiles already exists and only exposes safe fields,
-- but we need to ensure the base table policy is restrictive

-- Keep existing policies for owner access (they can see their own full profile)
-- For other users, we restrict via the existing discoverable_profiles view

-- TASK 2: Lock down waitlist_signups
-- The current policy only allows INSERT with validation, which is correct
-- But we need to ensure admins can SELECT

-- First, create admin SELECT policy
CREATE POLICY "Admins can read waitlist_signups"
ON public.waitlist_signups
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));