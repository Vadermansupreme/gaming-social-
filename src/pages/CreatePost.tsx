
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Image, Video, X } from "lucide-react";
import { StorageService } from "@/services/StorageService";
import imageCompression from 'browser-image-compression';

const CreatePost = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [text, setText] = useState("");
  const [mediaFiles, setMediaFiles] = useState<File[]>([]);
  const [mediaUrls, setMediaUrls] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleMediaUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    
    if (files.length === 0) return;

    // Validate file types and sizes
    const validFiles = files.filter(file => {
      const isImage = file.type.startsWith('image/');
      const isVideo = file.type.startsWith('video/');
      const isValidSize = file.size <= 20 * 1024 * 1024; // 20MB

      if (!isImage && !isVideo) {
        toast.error(`${file.name} is not a valid image or video file`);
        return false;
      }

      if (!isValidSize) {
        toast.error(`${file.name} is too large (max 20MB)`);
        return false;
      }

      if (isVideo && file.type !== 'video/mp4') {
        toast.error(`${file.name} must be MP4 format`);
        return false;
      }

      return true;
    });

    // Add to files array
    setMediaFiles(prev => [...prev, ...validFiles]);

    // Create preview URLs
    const newUrls = validFiles.map(file => URL.createObjectURL(file));
    setMediaUrls(prev => [...prev, ...newUrls]);
  };

  const removeMedia = (index: number) => {
    setMediaFiles(prev => prev.filter((_, i) => i !== index));
    setMediaUrls(prev => {
      const newUrls = prev.filter((_, i) => i !== index);
      // Revoke the removed URL to free memory
      URL.revokeObjectURL(prev[index]);
      return newUrls;
    });
  };

  const compressImage = async (file: File): Promise<File> => {
    const options = {
      maxSizeMB: 1,
      maxWidthOrHeight: 1920,
      useWebWorker: true
    };

    try {
      return await imageCompression(file, options);
    } catch (error) {
      console.error('Error compressing image:', error);
      return file;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast.error("Please log in to create a post");
      return;
    }

    if (!text.trim() && mediaFiles.length === 0) {
      toast.error("Please add some content to your post");
      return;
    }

    try {
      setIsSubmitting(true);
      let uploadedUrls: string[] = [];

      // Upload media files if any
      if (mediaFiles.length > 0) {
        const uploadPromises = mediaFiles.map(async (file) => {
          try {
            let fileToUpload = file;
            
            // Compress images
            if (file.type.startsWith('image/')) {
              fileToUpload = await compressImage(file);
            }

            const fileName = `${Date.now()}_${fileToUpload.name}`;
            
            const { data, error } = await supabase.storage
              .from('post-media')
              .upload(`${user.id}/${fileName}`, fileToUpload);

            if (error) throw error;

            const { data: { publicUrl } } = supabase.storage
              .from('post-media')
              .getPublicUrl(data.path);

            return publicUrl;
          } catch (error) {
            console.error('Error uploading file:', file.name, error);
            throw new Error(`Failed to upload ${file.name}`);
          }
        });

        uploadedUrls = await Promise.all(uploadPromises);
      }

      // Create the post
      const { error } = await supabase
        .from('posts')
        .insert({
          author_id: user.id,
          text: text.trim() || null,
          media_urls: uploadedUrls.length > 0 ? uploadedUrls : null
        });

      if (error) throw error;

      toast.success("Post created successfully!");
      navigate('/app');
    } catch (error) {
      console.error('Error creating post:', error);
      toast.error("Failed to create post. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="p-6 text-center">
          <h2 className="text-xl font-semibold mb-2">Please log in</h2>
          <p className="text-white mb-4">You need to be logged in to create posts</p>
          <Button onClick={() => navigate('/auth')}>Go to Login</Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
        <div className="flex items-center justify-between px-4 py-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-lg font-semibold">New Post</h1>
          <Button
  onClick={handleSubmit}
  disabled={isSubmitting || (!text.trim() && mediaFiles.length === 0)}
  className="
    rounded-full
    bg-emerald-500
    text-black
    font-semibold
    px-2
    shadow-[0_0_24px_rgba(16,185,129,0.35)]
    hover:bg-emerald-400
    hover:scale-105
    transition-all
    duration-200
    disabled:bg-white/10
    disabled:text-white/40
    disabled:shadow-none
    disabled:hover:scale-100
  "
>
            {isSubmitting ? "Posting..." : "Share"}
          </Button>
        </div>
      </div>

      <div className="max-w-xl mx-auto p-4">
        <form onSubmit={handleSubmit} className="space-y-1">
          <Textarea
            placeholder="Share your workout, progress, or fitness journey..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="
min-h-[300px]
rounded-2xl
border
border-emerald-500/30
bg-white/5
text-white
placeholder:text-white/40
shadow-[0_0_60px_rgba(16,185,129,0.25)]
focus:border-white/30
focus:ring-0
focus-visible:ring-0
resize-none
"
            
            maxLength={500}
          />

          {/* Media Preview */}
          {mediaUrls.length > 0 && (
            <div className="grid grid-cols-2 gap-3">
              {mediaUrls.map((url, index) => (
                <div key={index} className="relative">
                  {mediaFiles[index]?.type.startsWith('video/') ? (
                    <video 
                      src={url} 
                      className="w-full h-32 object-cover rounded-lg"
                      controls
                    />
                  ) : (
                    <img 
                      src={url} 
                      alt={`Upload ${index + 1}`}
                      className="w-full h-32 object-cover rounded-lg"
                    />
                  )}
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute top-1 right-1 bg-black/50 hover:bg-black/70 text-white"
                    onClick={() => removeMedia(index)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}

          {/* Media Upload Buttons */}
          <div className="flex gap-2">
            <label className="flex-1">
              <input
                type="file"
                accept="image/*,video/mp4"
                multiple
                onChange={handleMediaUpload}
                className="hidden"
                disabled={isSubmitting}
              />
              <Button
                type="button"
                variant="outline"
                className="h-28 w-full flex flex-col items-center justify-center gap-2 rounded-2xl border border-white/20 bg-white/5 text-white hover:border-emerald-500 hover:bg-emerald-500/10 transition-all"
                disabled={isSubmitting}
                asChild
              >
                <span>
                  <Image className="w-4 h-4" />
                  Add Photos
                </span>
              </Button>
            </label>
            
            <label className="flex-1">
              <input
                type="file"
                accept="video/mp4"
                onChange={handleMediaUpload}
                className="hidden"
                disabled={isSubmitting}
              />
              <Button
                type="button"
                variant="outline"
                className="h-28 w-full flex flex-col items-center justify-center gap-2 rounded-2xl border border-white/20 bg-white/5 text-white hover:border-emerald-500 hover:bg-emerald-500/10 transition-all"
                disabled={isSubmitting}
                asChild
              >
                <span>
                  <Video className="w-4 h-4" />
                  Add Video
                </span>
              </Button>
            </label>
          </div>

          
          
        </form>
      </div>
    </div>
  );
};

export default CreatePost;
