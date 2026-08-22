-- Create storage bucket for post media
INSERT INTO storage.buckets (id, name, public) VALUES ('post-media', 'post-media', true);

-- Create policies for post media uploads
CREATE POLICY "Post media is publicly accessible" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'post-media');

CREATE POLICY "Users can upload their own post media" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'post-media' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own post media" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'post-media' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own post media" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'post-media' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Seed some mock profile data to match our mock data
INSERT INTO profiles (
  id, 
  display_name, 
  bio, 
  avatar_url, 
  cover_image_url,
  fitness_level,
  experience_level,
  preferred_workouts,
  fitness_goals,
  availability,
  followers_count,
  following_count,
  verified,
  vibe
) VALUES 
('00000000-0000-0000-0000-000000000001', 'Arnold Schwarzenegger', 'Former Mr. Olympia and action movie star. Always ready to pump some iron and share training wisdom!', 'https://images.unsplash.com/photo-1567013127542-490d757e51cd?w=150&h=150&fit=crop&crop=face', 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&h=400&fit=crop', 'Expert', 'Professional', ARRAY['Powerlifting', 'Bodybuilding', 'Strength Training'], ARRAY['Build Muscle', 'Strength', 'Competition Prep'], ARRAY['Morning', 'Afternoon'], 15000, 500, true, 'Serious Trainer'),
('00000000-0000-0000-0000-000000000002', 'Jennifer Lawrence', 'Actress and fitness enthusiast. Love high-intensity workouts and making fitness fun!', 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face', 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800&h=400&fit=crop', 'Advanced', 'Intermediate', ARRAY['CrossFit', 'HIIT', 'Functional Training'], ARRAY['Endurance', 'Functional Strength', 'Have Fun'], ARRAY['Evening', 'Weekend'], 8500, 350, true, 'Fun & Energetic'),
('00000000-0000-0000-0000-000000000003', 'Ryan Reynolds', 'Actor and smart-mouth. Training for superhero roles and making inappropriate jokes along the way.', 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face', 'https://images.unsplash.com/photo-1506629905607-24eb9cc13d65?w=800&h=400&fit=crop', 'Advanced', 'Intermediate', ARRAY['Calisthenics', 'Combat Training', 'Cardio'], ARRAY['Lean Muscle', 'Flexibility', 'Movie Prep'], ARRAY['Morning', 'Afternoon'], 12000, 200, true, 'Witty & Motivated'),
('00000000-0000-0000-0000-000000000004', 'Gal Gadot', 'Wonder Woman actress and martial arts expert. Training heroes one workout at a time!', 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=150&h=150&fit=crop&crop=face', 'https://images.unsplash.com/photo-1524863479829-916d8e77f114?w=800&h=400&fit=crop', 'Expert', 'Advanced', ARRAY['Martial Arts', 'Combat Training', 'Strength Training'], ARRAY['Coordination', 'Strength', 'Flexibility'], ARRAY['Morning', 'Evening'], 20000, 150, true, 'Empowering & Strong'),
('00000000-0000-0000-0000-000000000005', 'Will Smith', 'Actor and fitness enthusiast. Swimming my way to greatness and inspiring others to do the same!', 'https://images.unsplash.com/photo-1463453091185-61582044d556?w=150&h=150&fit=crop&crop=face', 'https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=800&h=400&fit=crop', 'Advanced', 'Intermediate', ARRAY['Swimming', 'Cardio', 'Boxing'], ARRAY['Endurance', 'Weight Loss', 'Mental Health'], ARRAY['Morning', 'Weekend'], 9500, 400, true, 'Inspiring & Positive'),
('00000000-0000-0000-0000-000000000006', 'Scarlett Johansson', 'Black Widow actress and yoga practitioner. Finding balance through mindful movement and meditation.', 'https://images.unsplash.com/photo-1489424731084-a5d8b219a5bb?w=150&h=150&fit=crop&crop=face', 'https://images.unsplash.com/photo-1506629905607-24eb9cc13d65?w=800&h=400&fit=crop', 'Advanced', 'Advanced', ARRAY['Yoga', 'Pilates', 'Flexibility Training'], ARRAY['Flexibility', 'Mental Health', 'Balance'], ARRAY['Morning', 'Evening'], 11000, 300, true, 'Mindful & Zen')
ON CONFLICT (id) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  bio = EXCLUDED.bio,
  avatar_url = EXCLUDED.avatar_url,
  cover_image_url = EXCLUDED.cover_image_url,
  fitness_level = EXCLUDED.fitness_level,
  experience_level = EXCLUDED.experience_level,
  preferred_workouts = EXCLUDED.preferred_workouts,
  fitness_goals = EXCLUDED.fitness_goals,
  availability = EXCLUDED.availability,
  followers_count = EXCLUDED.followers_count,
  following_count = EXCLUDED.following_count,
  verified = EXCLUDED.verified,
  vibe = EXCLUDED.vibe;