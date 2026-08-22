
-- Create gym favorites table
CREATE TABLE IF NOT EXISTS public.gym_favorites (
  user_id uuid REFERENCES auth.users NOT NULL,
  place_id text NOT NULL,
  place_name text NOT NULL,
  photo_ref text,
  address text,
  lat double precision,
  lng double precision,
  created_at timestamptz DEFAULT now(),
  PRIMARY KEY (user_id, place_id)
);

-- Enable RLS for gym_favorites
ALTER TABLE public.gym_favorites ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for gym_favorites
CREATE POLICY "read own gym_favorites" ON public.gym_favorites 
  FOR SELECT TO authenticated 
  USING (auth.uid() = user_id);

CREATE POLICY "upsert own gym_favorites" ON public.gym_favorites 
  FOR INSERT TO authenticated 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "delete own gym_favorites" ON public.gym_favorites 
  FOR DELETE TO authenticated 
  USING (auth.uid() = user_id);

-- Create gym check-ins table
CREATE TABLE IF NOT EXISTS public.gym_checkins (
  user_id uuid REFERENCES auth.users NOT NULL,
  place_id text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS for gym_checkins
ALTER TABLE public.gym_checkins ENABLE ROW LEVEL SECURITY;

-- Create RLS policy for gym_checkins
CREATE POLICY "own checkins" ON public.gym_checkins
  FOR ALL TO authenticated 
  USING (auth.uid() = user_id) 
  WITH CHECK (auth.uid() = user_id);
