import { useEffect, useState } from "react";
import { Camera, Video, X, Send, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import imageCompression from 'browser-image-compression';

interface NewPostData {
  id: string;
  author_id: string;
  created_at: string;
  text: string | null;
  media_urls: string[] | null;
  like_count: number;
  comment_count: number;
  deleted_at: string | null;
}

interface CreatePostProps {
  open: boolean;
  onClose: () => void;
  user: any;
  profile: any;
  onPostCreated?: (newPost: NewPostData) => void;
  initialAction?: "photo" | "video" | null;
}

const CreatePost = ({ open, onClose, user, profile, onPostCreated, initialAction, }: CreatePostProps) => {
  const [text, setText] = useState('');
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [selectedVideo, setSelectedVideo] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  useEffect(() => {
  if (!open || !initialAction) return;

  const timer = setTimeout(() => {
    if (initialAction === "photo") {
      document.getElementById("image-upload")?.click();
    }

    if (initialAction === "video") {
      document.getElementById("video-upload")?.click();
    }
  }, 100);

  return () => clearTimeout(timer);
}, [open, initialAction]);

  const compressImage = async (file: File): Promise<File> => {
    const options = {
      maxSizeMB: 5,
      maxWidthOrHeight: 1920,
      useWebWorker: true,
      initialQuality: 0.8,
    };
    
    try {
      return await imageCompression(file, options);
    } catch (error) {
      console.error('Error compressing image:', error);
      return file;
    }
  };

  const validateFile = (file: File, type: 'image' | 'video'): boolean => {
    if (type === 'image') {
      if (!file.type.startsWith('image/')) {
        toast.error('Please select a valid image file');
        return false;
      }
      if (file.size > 5 * 1024 * 1024) { // 5MB
        toast.error('Image file size should be less than 5MB');
        return false;
      }
    } else if (type === 'video') {
      if (file.type !== 'video/mp4') {
        toast.error('Please select an MP4 video file');
        return false;
      }
      if (file.size > 50 * 1024 * 1024) { // 50MB
        toast.error('Video file size should be less than 50MB');
        return false;
      }
    }
    return true;
  };

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    if (selectedImages.length + files.length > 5) {
      toast.error('You can upload up to 5 images per post');
      return;
    }

    const validFiles: File[] = [];
    for (const file of files) {
      if (validateFile(file, 'image')) {
        const compressedFile = await compressImage(file);
        validFiles.push(compressedFile);
      }
    }

    setSelectedImages(prev => [...prev, ...validFiles]);
  };

  const handleVideoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && validateFile(file, 'video')) {
      setSelectedVideo(file);
    }
  };

  const removeImage = (index: number) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== index));
    if (currentImageIndex >= selectedImages.length - 1) {
      setCurrentImageIndex(Math.max(0, selectedImages.length - 2));
    }
  };

  const removeVideo = () => {
    setSelectedVideo(null);
  };

  const uploadFiles = async (postId: string): Promise<string[]> => {
    const mediaUrls: string[] = [];

    // Upload images sequentially to maintain order
    for (let index = 0; index < selectedImages.length; index++) {
      const file = selectedImages[index];
      const fileName = `${user.id}/${postId}/image_${index}_${Date.now()}.${file.name.split('.').pop()}`;
      
      const { error: uploadError } = await supabase.storage
        .from('post-media')
        .upload(fileName, file);

      if (uploadError) {
        console.error('Image upload error:', uploadError);
        throw new Error(`Failed to upload image ${index + 1}`);
      }

      const { data: { publicUrl } } = supabase.storage
        .from('post-media')
        .getPublicUrl(fileName);

      mediaUrls.push(publicUrl);
    }

    // Upload video
    if (selectedVideo) {
      const fileName = `${user.id}/${postId}/video_${Date.now()}.mp4`;
      
      const { error: uploadError } = await supabase.storage
        .from('post-media')
        .upload(fileName, selectedVideo);

      if (uploadError) {
        console.error('Video upload error:', uploadError);
        throw new Error('Failed to upload video');
      }

      const { data: { publicUrl } } = supabase.storage
        .from('post-media')
        .getPublicUrl(fileName);

      mediaUrls.push(publicUrl);
    }

    return mediaUrls;
  };

  const handleSubmit = async () => {
    if (!text.trim() && selectedImages.length === 0 && !selectedVideo) {
      toast.error('Please add some content to your post');
      return;
    }

    setUploading(true);
    let createdPostId: string | null = null;
    
    try {
      // Create the post first (without media_urls)
      const { data: postData, error: postError } = await supabase
        .from('posts')
        .insert({
          text: text.trim() || null,
          author_id: user.id
        })
        .select()
        .single();

      if (postError) throw postError;
      createdPostId = postData.id;

      // Upload media files and get URLs
      let mediaUrls: string[] = [];
      if (selectedImages.length > 0 || selectedVideo) {
        try {
          mediaUrls = await uploadFiles(postData.id);
          
          // Update the post with media URLs
          if (mediaUrls.length > 0) {
            const { error: updateError } = await supabase
              .from('posts')
              .update({ media_urls: mediaUrls })
              .eq('id', postData.id);
            
            if (updateError) {
              console.error('Error updating post with media URLs:', updateError);
              // Non-fatal: post exists, just media URLs not saved
            }
          }
        } catch (uploadError: any) {
          // Media upload failed - delete the post to avoid orphaned records
          console.error('Media upload failed:', uploadError);
          await supabase.from('posts').delete().eq('id', postData.id);
          toast.error(uploadError.message || 'Failed to upload media');
          return;
        }
      }

      toast.success('Post created successfully!');
      setText('');
      setSelectedImages([]);
      setSelectedVideo(null);
      setCurrentImageIndex(0);
      
      // Pass the minimal new post data to the callback
      const newPostData: NewPostData = {
        id: postData.id,
        author_id: postData.author_id,
        created_at: postData.created_at,
        text: postData.text,
        media_urls: mediaUrls.length > 0 ? mediaUrls : null,
        like_count: postData.like_count ?? 0,
        comment_count: postData.comment_count ?? 0,
        deleted_at: postData.deleted_at
      };
      
      onPostCreated?.(newPostData);
      onClose();
    } catch (error: any) {
      console.error('Error creating post:', error);
      toast.error(error.message || 'Failed to create post');
    } finally {
      setUploading(false);
    }
  };

  const nextImage = () => {
    setCurrentImageIndex(prev => (prev + 1) % selectedImages.length);
  };

  const prevImage = () => {
    setCurrentImageIndex(prev => (prev - 1 + selectedImages.length) % selectedImages.length);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] max-w-[520px] mx-auto rounded-3xl border border-white/10 bg-[#090909] p-6 text-white shadow-2xl">
        <DialogTitle className="text-white text-center">
  Create Post
</DialogTitle>

        <div className="space-y-4">
          {/* User info */}
          <div className="flex items-center gap-3">
            <Avatar className="w-10 h-10 avatar-ring">
              <AvatarImage src={profile?.avatar_url} />
              <AvatarFallback className="bg-gradient-to-r from-[hsl(var(--primary))] to-[hsl(var(--primary-end))] text-primary-foreground font-semibold">
                {profile?.display_name?.charAt(0) || 'U'}
              </AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-semibold text-white">{profile?.display_name || 'User'}</h3>
              <p className="text-sm text-white/60">Post to your feed</p>
            </div>
          </div>

          {/* Text input */}
          <Textarea
  placeholder="What's on your mind?"
  value={text}
  onChange={(e) => setText(e.target.value)}
  className="min-h-[110px] resize-none rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-base text-white placeholder:text-white/35 focus-visible:border-white/20 focus-visible:ring-0"
  maxLength={500}
/>

          {/* Image carousel preview */}
          {selectedImages.length > 0 && (
            <div className="relative">
              <div className="relative overflow-hidden rounded-lg">
                <img
                  src={URL.createObjectURL(selectedImages[currentImageIndex])}
                  alt="Selected"
                  className="w-full h-64 object-cover"
                />
                
                {/* Navigation arrows */}
                {selectedImages.length > 1 && (
                  <>
                    <Button
                      size="icon"
                      variant="secondary"
                      className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/50 hover:bg-black/70"
                      onClick={prevImage}
                    >
                      <ChevronLeft className="w-4 h-4 text-white" />
                    </Button>
                    <Button
                      size="icon"
                      variant="secondary"
                      className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/50 hover:bg-black/70"
                      onClick={nextImage}
                    >
                      <ChevronRight className="w-4 h-4 text-white" />
                    </Button>
                  </>
                )}

                {/* Remove button */}
                <Button
                  size="icon"
                  variant="destructive"
                  className="absolute top-2 right-2 w-6 h-6"
                  onClick={() => removeImage(currentImageIndex)}
                >
                  <X className="w-3 h-3" />
                </Button>
              </div>

              {/* Dots indicator */}
              {selectedImages.length > 1 && (
                <div className="flex justify-center gap-1 mt-2">
                  {selectedImages.map((_, index) => (
                    <button
                      key={index}
                      className={`w-2 h-2 rounded-full transition-colors ${
                        index === currentImageIndex ? 'bg-primary' : 'bg-muted-foreground/30'
                      }`}
                      onClick={() => setCurrentImageIndex(index)}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Video preview */}
          {selectedVideo && (
            <div className="relative">
              <video
                src={URL.createObjectURL(selectedVideo)}
                className="w-full h-64 object-cover rounded-lg"
                controls
                poster=""
              />
              <Button
                size="icon"
                variant="destructive"
                className="absolute top-2 right-2 w-6 h-6"
                onClick={removeVideo}
              >
                <X className="w-3 h-3" />
              </Button>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                className="text-white/60 hover:text-white"
                onClick={() => document.getElementById('image-upload')?.click()}
                disabled={selectedImages.length >= 5}
              >
                <Camera className="w-4 h-4 mr-1" />
                Photo ({selectedImages.length}/5)
              </Button>
              
              {!selectedVideo && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-white/60 hover:text-white"
                  onClick={() => document.getElementById('video-upload')?.click()}
                >
                  <Video className="w-4 h-4 mr-1" />
                  Video
                </Button>
              )}
            </div>

            <Button
              onClick={handleSubmit}
              disabled={uploading || (!text.trim() && selectedImages.length === 0 && !selectedVideo)}
              className="rounded-xl bg-lime-400 px-5 py-2 text-sm font-semibold text-black transition hover:bg-lime-300 disabled:bg-lime-400/35 disabled:text-black/60 disabled:opacity-100"
            >
              {uploading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
              ) : (
                <Send className="w-4 h-4 mr-2" />
              )}
              {uploading ? 'Posting...' : 'Share'}
            </Button>
          </div>

          <input
            id="image-upload"
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={handleImageSelect}
          />
          <input
            id="video-upload"
            type="file"
            accept="video/mp4"
            className="hidden"
            onChange={handleVideoSelect}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CreatePost;
