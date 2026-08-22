-- Update profiles table structure with lat/lng instead of geography
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS goals jsonb DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS availability jsonb DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS home_gym_place_id text;

-- Create conversations table
CREATE TABLE IF NOT EXISTS public.conversations (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  is_group boolean DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create conversation_members table
CREATE TABLE IF NOT EXISTS public.conversation_members (
  conversation_id uuid NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  joined_at timestamp with time zone NOT NULL DEFAULT now(),
  PRIMARY KEY (conversation_id, user_id)
);

-- Create gyms table
CREATE TABLE IF NOT EXISTS public.gyms (
  place_id text NOT NULL PRIMARY KEY,
  name text NOT NULL,
  address text,
  lat double precision,
  lng double precision,
  rating numeric,
  phone text,
  website text,
  opening_hours jsonb,
  photo_refs jsonb,
  last_synced timestamp with time zone DEFAULT now()
);

-- Create gym_amenities table
CREATE TABLE IF NOT EXISTS public.gym_amenities (
  place_id text NOT NULL REFERENCES public.gyms(place_id) ON DELETE CASCADE,
  amenities jsonb DEFAULT '[]',
  PRIMARY KEY (place_id)
);

-- Enable RLS on new tables
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gyms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gym_amenities ENABLE ROW LEVEL SECURITY;

-- RLS policies for conversations
CREATE POLICY "Users can view conversations they're in" ON public.conversations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.conversation_members cm 
      WHERE cm.conversation_id = conversations.id 
      AND cm.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create conversations" ON public.conversations
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- RLS policies for conversation_members
CREATE POLICY "Users can view conversation members" ON public.conversation_members
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.conversation_members cm 
      WHERE cm.conversation_id = conversation_members.conversation_id 
      AND cm.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can join conversations" ON public.conversation_members
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS policies for gyms (public read)
CREATE POLICY "Anyone can view gyms" ON public.gyms
  FOR SELECT USING (true);

CREATE POLICY "Service role can manage gyms" ON public.gyms
  FOR ALL USING (auth.role() = 'service_role');

-- RLS policies for gym_amenities (public read)  
CREATE POLICY "Anyone can view gym amenities" ON public.gym_amenities
  FOR SELECT USING (true);

CREATE POLICY "Service role can manage gym amenities" ON public.gym_amenities
  FOR ALL USING (auth.role() = 'service_role');

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_conversation_members_user_id ON public.conversation_members(user_id);
CREATE INDEX IF NOT EXISTS idx_conversation_members_conversation_id ON public.conversation_members(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id_created_at ON public.messages(conversation_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_profiles_lat_lng ON public.profiles(lat, lng);
CREATE INDEX IF NOT EXISTS idx_gyms_lat_lng ON public.gyms(lat, lng);
CREATE INDEX IF NOT EXISTS idx_posts_author_id_created_at ON public.posts(author_id, created_at DESC);

-- Add trigger for conversations updated_at
CREATE TRIGGER update_conversations_updated_at
  BEFORE UPDATE ON public.conversations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for new tables
ALTER publication supabase_realtime ADD TABLE public.conversations;
ALTER publication supabase_realtime ADD TABLE public.conversation_members;