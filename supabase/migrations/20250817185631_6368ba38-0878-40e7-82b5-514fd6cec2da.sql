-- Create likes table for posts
CREATE TABLE public.likes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  post_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, post_id)
);

-- Enable RLS on likes table
ALTER TABLE public.likes ENABLE ROW LEVEL SECURITY;

-- Create policies for likes
CREATE POLICY "Likes are viewable by everyone" 
ON public.likes 
FOR SELECT 
USING (true);

CREATE POLICY "Users can create likes" 
ON public.likes 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own likes" 
ON public.likes 
FOR DELETE 
USING (auth.uid() = user_id);

-- Add profile image fields to profiles table
ALTER TABLE public.profiles 
ADD COLUMN cover_image_url TEXT,
ADD COLUMN fitness_level TEXT DEFAULT 'Beginner',
ADD COLUMN vibe TEXT DEFAULT 'Gym Vibe',
ADD COLUMN followers_count INTEGER DEFAULT 0,
ADD COLUMN following_count INTEGER DEFAULT 0;

-- Create function to update like count
CREATE OR REPLACE FUNCTION public.update_post_like_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.posts 
    SET like_count = like_count + 1 
    WHERE id = NEW.post_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.posts 
    SET like_count = like_count - 1 
    WHERE id = OLD.post_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic like count updates
CREATE TRIGGER update_posts_like_count
AFTER INSERT OR DELETE ON public.likes
FOR EACH ROW
EXECUTE FUNCTION public.update_post_like_count();

-- Create function to update follower counts
CREATE OR REPLACE FUNCTION public.update_follow_counts()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Increment follower count for followed user
    UPDATE public.profiles 
    SET followers_count = followers_count + 1 
    WHERE id = NEW.followed_id;
    
    -- Increment following count for follower user
    UPDATE public.profiles 
    SET following_count = following_count + 1 
    WHERE id = NEW.follower_id;
    
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    -- Decrement follower count for followed user
    UPDATE public.profiles 
    SET followers_count = followers_count - 1 
    WHERE id = OLD.followed_id;
    
    -- Decrement following count for follower user
    UPDATE public.profiles 
    SET following_count = following_count - 1 
    WHERE id = OLD.follower_id;
    
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic follow count updates
CREATE TRIGGER update_follows_count
AFTER INSERT OR DELETE ON public.follows
FOR EACH ROW
EXECUTE FUNCTION public.update_follow_counts();

-- Enable realtime for all tables
ALTER TABLE public.posts REPLICA IDENTITY FULL;
ALTER TABLE public.likes REPLICA IDENTITY FULL;
ALTER TABLE public.follows REPLICA IDENTITY FULL;
ALTER TABLE public.profiles REPLICA IDENTITY FULL;
ALTER TABLE public.comments REPLICA IDENTITY FULL;

-- Add tables to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.posts;
ALTER PUBLICATION supabase_realtime ADD TABLE public.likes;
ALTER PUBLICATION supabase_realtime ADD TABLE public.follows;
ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
ALTER PUBLICATION supabase_realtime ADD TABLE public.comments;