-- Create storage bucket for user uploads
INSERT INTO storage.buckets (id, name, public) VALUES ('user-uploads', 'user-uploads', true);

-- Create storage policies for user uploads
CREATE POLICY "Users can view all uploaded images" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'user-uploads');

CREATE POLICY "Users can upload their own images" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'user-uploads' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own images" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'user-uploads' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own images" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'user-uploads' AND auth.uid()::text = (storage.foldername(name))[1]);