-- Add last_seen_at column to profiles (if not already present, it's nullable)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles' 
    AND column_name = 'last_seen_at'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN last_seen_at timestamp with time zone DEFAULT now();
  END IF;
END $$;

-- Add onboarding_completed column to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS onboarding_completed boolean DEFAULT false;

-- Create user_roles enum and table for admin access (security best practice)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'app_role') THEN
    CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');
  END IF;
END $$;

-- Create user_roles table
CREATE TABLE IF NOT EXISTS public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL DEFAULT 'user',
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE (user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- RLS policies for user_roles
CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all roles"
ON public.user_roles
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage roles"
ON public.user_roles
FOR ALL
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Create user_feedback table
CREATE TABLE IF NOT EXISTS public.user_feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  category text NOT NULL CHECK (category IN ('bug', 'feature_request', 'account_issue', 'other')),
  message text NOT NULL,
  screenshot_url text,
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on user_feedback
ALTER TABLE public.user_feedback ENABLE ROW LEVEL SECURITY;

-- Users can insert their own feedback
CREATE POLICY "Users can insert their own feedback"
ON public.user_feedback
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Admins can read all feedback
CREATE POLICY "Admins can read all feedback"
ON public.user_feedback
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- Users can view their own feedback
CREATE POLICY "Users can view their own feedback"
ON public.user_feedback
FOR SELECT
USING (auth.uid() = user_id);

-- Create function to update last_seen_at on profile access
CREATE OR REPLACE FUNCTION public.update_user_last_seen()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.profiles 
  SET last_seen_at = now() 
  WHERE id = auth.uid();
  RETURN NEW;
END;
$$;