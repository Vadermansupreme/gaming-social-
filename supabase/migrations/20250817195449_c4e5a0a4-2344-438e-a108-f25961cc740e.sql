-- Create the missing update_updated_at_column function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create user interaction tracking table for "Spot Me" requests
CREATE TABLE public.spot_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  requester_id UUID NOT NULL,
  requestee_id UUID NOT NULL,
  message TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.spot_requests ENABLE ROW LEVEL SECURITY;

-- Create policies for spot requests
CREATE POLICY "Users can view spot requests involving them" 
ON public.spot_requests 
FOR SELECT 
USING (auth.uid() = requester_id OR auth.uid() = requestee_id);

CREATE POLICY "Users can create spot requests" 
ON public.spot_requests 
FOR INSERT 
WITH CHECK (auth.uid() = requester_id);

CREATE POLICY "Users can update spot requests involving them" 
ON public.spot_requests 
FOR UPDATE 
USING (auth.uid() = requester_id OR auth.uid() = requestee_id);

-- Add trigger for updated_at
CREATE TRIGGER update_spot_requests_updated_at
BEFORE UPDATE ON public.spot_requests
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Update profiles table to add more fields for better matching
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS phone TEXT,
ADD COLUMN IF NOT EXISTS experience_level TEXT DEFAULT 'Beginner',
ADD COLUMN IF NOT EXISTS preferred_workouts TEXT[],
ADD COLUMN IF NOT EXISTS fitness_goals TEXT[],
ADD COLUMN IF NOT EXISTS availability TEXT[],
ADD COLUMN IF NOT EXISTS lat DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS lng DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS verified BOOLEAN DEFAULT false;