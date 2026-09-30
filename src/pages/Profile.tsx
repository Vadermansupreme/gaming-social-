import { useState, useEffect, useCallback } from "react";
import {
  Camera,
  Plus,
  MapPin,
  Target,
  Dumbbell,
  Users,
  MessageSquare,
  Image,
  Video,
  Lock,
  Globe2,
  Grid,
  Play,
  Shield,
  Loader2,
  ArrowLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Heart } from "lucide-react";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { useAdminStatus } from "@/hooks/useAdminStatus";
import FitnessProfileCard from "@/components/FitnessProfileCard";
import SocialPost from "@/components/SocialPost";
import CreatePost from "@/components/CreatePost";

type ProfilePost = {
  id: string;
  author_id: string;
  text: string | null;
  created_at: string;
  media_urls: string[] | null;
  like_count: number;
  comment_count: number;
  author: { display_name: string; avatar_url: string | null; verified: boolean };
};

const Profile = () => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showImageUpload, setShowImageUpload] = useState(false);
  const [showCreatePost, setShowCreatePost] = useState(false);
const [createPostAction, setCreatePostAction] = useState<"photo" | "video" | null>(null);
  const vibeColors: Record<string, string> = {
  casual: "#9CA3AF",
  routine: "#3B82F6",
  driven: "#10B981",
  competitor: "#F97316",
  apex: "#EF4444",
};

const vibeKey = (profile?.vibe || "casual").toLowerCase();
const vibeColor = vibeColors[vibeKey] || "#9CA3AF";
  const [userMedia, setUserMedia] = useState<any[]>([]);
  const [favoriteGyms, setFavoriteGyms] = useState<any[]>([]);
  const [profilePosts, setProfilePosts] = useState<ProfilePost[]>([]);
  const [userPostPhotos, setUserPostPhotos] = useState<any[]>([]);
  const [postsLoading, setPostsLoading] = useState(false);
  const { isAdmin } = useAdminStatus(user?.id);

  const updatePostLikeCount = useCallback((postId: string, delta: number) => {
    setProfilePosts(prev => prev.map(p =>
      p.id === postId ? { ...p, like_count: Math.max(0, p.like_count + delta) } : p
    ));
  }, []);
  const updatePostCommentCount = useCallback((postId: string, delta: number) => {
    setProfilePosts(prev => prev.map(p =>
      p.id === postId ? { ...p, comment_count: Math.max(0, p.comment_count + delta) } : p
    ));
  }, []);
  const handleProfilePostCreated = (newPost: any) => {
  const postForProfile = {
    ...newPost,
    author: {
      display_name: profile?.display_name || "User",
      avatar_url: profile?.avatar_url || null,
      verified: profile?.verified || false,
    },
  };

  setProfilePosts((prev) => [postForProfile, ...prev]);
};
const loadUserPostPhotos = async () => {
  if (!profile?.id) return;

  const { data } = await supabase
    .from("posts" as any)
    .select("*")
    .eq("author_id", profile.id);

  const flattenedPhotos = (data || []).flatMap((post: any) =>
    (post.media_urls || []).map((url: string, index: number) => ({
      id: `${post.id}-${index}`,
      postId: post.id,
      image_url: url,
    }))
  );

  setUserPostPhotos(flattenedPhotos);
};

  useEffect(() => {
  fetchProfile();
  fetchFavoriteGyms();
  fetchUserPosts();
}, [location.pathname]);

useEffect(() => {
  if (profile?.id) {
    loadUserPostPhotos();
  }
}, [profile?.id]);

  useEffect(() => {
    if (!user?.id || !profile) return;
    let cancelled = false;
    const fetchMyProfilePosts = async () => {
      setPostsLoading(true);
      try {
        const { data: rows, error } = await supabase
          .from('posts')
          .select('id, text, created_at, media_urls, like_count, comment_count, author_id, repost_of, repost_count')
          .eq('author_id', user.id)
          .is('deleted_at', null)
          .order('created_at', { ascending: false });

        if (cancelled) return;
        if (error) throw error;

        const author = {
          display_name: profile.display_name || 'User',
          avatar_url: profile.avatar_url ?? null,
          verified: profile.verified ?? false,
        };
        const posts: ProfilePost[] = (rows || []).map((row: any) => ({
          id: row.id,
          author_id: row.author_id,
          text: row.text,
          created_at: row.created_at,
          media_urls: row.media_urls,
          like_count: row.like_count ?? 0,
          comment_count: row.comment_count ?? 0,
          repost_of: row.repost_of ?? null,
repost_count: row.repost_count ?? 0,
          author,
        }));
        setProfilePosts(posts);
      } catch (err) {
        if (!cancelled) {
          console.error('Error fetching profile posts:', err);
          setProfilePosts([]);
        }
      } finally {
        if (!cancelled) setPostsLoading(false);
      }
    };
    fetchMyProfilePosts();
    return () => { cancelled = true; };
  }, [user?.id, profile]);

  const fetchProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/auth');
        return;
      }

      setUser(user);

      // Update last_seen_at
      await supabase
        .from('profiles')
        .update({ last_seen_at: new Date().toISOString() })
        .eq('id', user.id);

      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();
        const { count: followersCount } = await supabase
  .from('follows')
  .select('*', { count: 'exact', head: true })
  .eq('following_id', user.id);

const { count: followingCount } = await supabase
  .from('follows')
  .select('*', { count: 'exact', head: true })
  .eq('follower_id', user.id);
  setProfile({
  ...profileData,
  followers_count: followersCount ?? 0,
  following_count: followingCount ?? 0,
  my_spots: (profileData as any).preferred_workouts || [],
});

      
    } catch (error) {
      console.error('Error fetching profile:', error);
      toast.error('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const fetchFavoriteGyms = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: favorites } = await supabase
        .from('gym_favorites')
        .select('*')
        .eq('user_id', user.id);

      setFavoriteGyms(favorites || []);
    } catch (error) {
      console.error('Error fetching favorite gyms:', error);
    }
  };

  const fetchUserPosts = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: posts, error } = await supabase
        .from('posts')
        .select('id, media_urls, created_at')
        .eq('author_id', user.id)
        .not('media_urls', 'is', null)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const mediaItems: any[] = [];
      posts?.forEach(post => {
        if (post.media_urls && Array.isArray(post.media_urls)) {
          post.media_urls.forEach((url: string, index: number) => {
            const isVideo = url.includes('.mp4') || url.includes('.webm') || url.includes('.mov') || url.match(/\.(mp4|webm|mov)(\?|$)/i);
            mediaItems.push({
              id: `${post.id}_${index}`,
              url,
              type: isVideo ? 'video' : 'image',
              created_at: post.created_at,
              post_id: post.id
            });
          });
        }
      });

      setUserMedia(mediaItems);
    } catch (error) {
      console.error('Error fetching user posts:', error);
    }
  };

  const handleSettingsClick = () => {
    navigate('/settings');
  };

  const handleEditProfileClick = () => {
    navigate('/profile/edit');
  };

  const handleAvatarClick = () => {
    navigate('/profile/edit');
  };

  const handleCoverPhotoClick = () => {
    navigate('/profile/edit');
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) {
      toast.error('Please select an image or video file');
      return;
    }

    try {
      const fileName = `${user.id}/${Date.now()}_${file.name}`;
      
      const { error: uploadError } = await supabase.storage
        .from('user-uploads')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('user-uploads')
        .getPublicUrl(fileName);

      const mediaItem = {
        id: Date.now().toString(),
        url: publicUrl,
        type: file.type.startsWith('image/') ? 'image' : 'video',
        created_at: new Date().toISOString()
      };

      setUserMedia(prev => [mediaItem, ...prev]);
      toast.success('Media uploaded successfully!');
      setShowImageUpload(false);
      
      setTimeout(() => {
        fetchUserPosts();
      }, 1000);
    } catch (error) {
      console.error('Error uploading file:', error);
      toast.error('Failed to upload media');
    }
  };
const handlePrivacyToggle = async () => {
  if (!user?.id || !profile) return;

  const newValue = !profile.is_private;

  setProfile((prev: any) =>
    prev
      ? {
          ...prev,
          is_private: newValue,
        }
      : prev
  );

  try {
    const { error } = await (supabase as any)
      .from("profiles")
      .update({
        is_private: newValue,
      })
      .eq("id", user.id);

    if (error) throw error;

    toast.success(
      newValue
        ? "Account is now private"
        : "Account is now public"
    );
  } catch (error) {
    console.error("Error updating privacy:", error);

    setProfile((prev: any) =>
      prev
        ? {
            ...prev,
            is_private: !newValue,
          }
        : prev
    );

    toast.error("Failed to update account privacy");
  }
};
  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto">
        {/* Cover Photo */}
        <div className="relative h-48 bg-gradient-to-br from-primary/20 to-primary-end/20 cursor-pointer" onClick={handleCoverPhotoClick}>
          {profile?.cover_image_url ? (
            <img src={profile.cover_image_url} alt="Cover" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary-end/20" />
          )}
          
        </div>

        {/* Profile Info */}
        <div className="px-6 pb-6">
          {/* Avatar and Basic Info */}
          <div className="flex items-start gap-6 -mt-20 mb-6">
            <div className="relative inline-block">
              <button 
                onClick={handleAvatarClick}
                className="relative group"
              >
                <img 
                  src={profile?.avatar_url || '/placeholder.svg'} 
                  alt={profile?.display_name || 'Profile'} 
                  className="w-32 h-32 rounded-full border-2 border-emerald-500 object-cover shadow-[0_0_0_1px_rgba(255,255,255,0.18)]"
                />
                <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <Camera className="w-6 h-6 text-white" />
                </div>
              </button>
            </div>
          </div>

          <div className="flex-1 min-w-0">
           <div className="mb-2 w-full">
  <h1 className="text-2xl font-bold w-full break-words">
    {profile?.display_name || 'User'}
  </h1>

  <div
  className="mt-2 mb-3 h-3 w-24 rounded-full"
  style={{ backgroundColor: vibeColor, display: 'block' }}
/>
</div> 
            <div className="flex items-center gap-4 text-sm text-white mb-3 flex-wrap">
              <button 
                onClick={() => navigate('/followers?tab=followers')} 
                className="hover:text-white transition-colors"
              >
                <span className="font-semibold text-white">{profile?.followers_count || 0}</span> followers
              </button>
              <button 
                onClick={() => navigate('/followers?tab=following')} 
                className="hover:text-white transition-colors"
              >
                <span className="font-semibold text-white">{profile?.following_count || 0}</span> following
              </button>
              <span>{profilePosts.length} posts</span>
            </div>
            {profile?.bio && (
              <p className="text-sm text-white mb-4">{profile.bio}</p>
            )}
            
            

            {/* Action Buttons */}
            <div className="mb-6 space-y-3">
  <Button
    onClick={() => navigate("/profile/edit")}
    className="w-full bg-emerald-500 hover:bg-emerald-600 text-white border border-white/20"
  >
    Edit Profile
  </Button>

  <button
    type="button"
    onClick={handlePrivacyToggle}
    className="w-full flex items-center justify-between rounded-xl border border-white/15 px-4 py-3 hover:bg-white/5 transition"
  >
    <div className="flex items-center gap-3 text-left">
      {profile?.is_private ? (
        <Lock className="w-5 h-5 text-white" />
      ) : (
        <Globe2 className="w-5 h-5 text-white" />
      )}

      <div>
        <p className="text-sm font-medium text-white">
          Private account
        </p>

        <p className="text-xs text-white/50">
          {profile?.is_private
            ? "Only approved followers can view your content"
            : "Anyone can follow and view your content"}
        </p>
      </div>
    </div>

    <div
      className={`relative w-11 h-6 rounded-full transition ${
        profile?.is_private
          ? "bg-emerald-500"
          : "bg-white/20"
      }`}
    >
      <div
        className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
          profile?.is_private
            ? "translate-x-6"
            : "translate-x-1"
        }`}
      />
    </div>
  </button>
</div>
          </div>


          

          {/* Content Tabs */}
          <div className="mb-6 -mx-4 flex items-center gap-3 rounded-2xl border border-white px-4 py-1.5">
  {profile?.avatar_url ? (
    <img
      src={profile.avatar_url}
      alt={profile?.display_name || "Profile"}
      className="h-9 w-9 shrink-0 rounded-full object-cover"
    />
  ) : (
    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-sm font-semibold text-black">
      {profile?.display_name?.charAt(0) || "U"}
    </div>
  )}

  <button
    type="button"
    onClick={() => {
      setCreatePostAction(null);
      setShowCreatePost(true);
    }}
    className="flex-1 px-2 py-1 text-left text-sm font-medium text-white hover:text-white"
  >
    Share something...
  </button>
<div className="ml-auto translate-x-5 flex items-center gap-2 md:gap-3 md:translate-x-0">
  <button
    type="button"
    onClick={() => {
      setCreatePostAction("photo");
      setShowCreatePost(true);
    }}
    className="p-0 min-w-0 w-auto md:p-1 text-white/55 transition hover:text-white"
    aria-label="Add photo"
  >
    <Image className="h-5 w-5 -translate-x-3 md:translate-x-0 text-white" />
  </button>

  <button
    type="button"
    onClick={() => {
      setCreatePostAction("video");
      setShowCreatePost(true);
    }}
    className="text-white/55 transition hover:text-white"
    aria-label="Add video"
  >
    <Video className="h-6 w-6 text-white" />
  </button></div>
</div>
          {/* Content Tabs */}
<Tabs defaultValue="posts" className="w-full">
  <TabsList className="grid w-full grid-cols-4 bg-transparent gap-0">
  <TabsTrigger
    value="posts"
    className="bg-black text-white rounded-l-xl border border-emerald-500 border-r-0 data-[state=active]:bg-emerald-500 data-[state=active]:text-black data-[state=active]:shadow-none"
  >
    Posts
  </TabsTrigger>

  <TabsTrigger
    value="pics"
    className="flex items-center justify-center gap-2 bg-black text-white border-t border-b border-emerald-500 border-r-0 data-[state=active]:bg-emerald-500 data-[state=active]:text-black data-[state=active]:shadow-none"
  >
    <Grid className="w-4 h-4" />
    Photos
  </TabsTrigger>

  <TabsTrigger
    value="videos"
    className="flex items-center justify-center gap-2 bg-black text-white border-t border-b border-emerald-500 border-r-0 data-[state=active]:bg-emerald-500 data-[state=active]:text-black data-[state=active]:shadow-none"
  >
    <Play className="w-4 h-4" />
    Videos
  </TabsTrigger>

  <TabsTrigger
    value="spotlight"
    className="bg-black text-white rounded-r-xl border border-emerald-500 data-[state=active]:bg-emerald-500 data-[state=active]:text-black data-[state=active]:shadow-none"
  >
    Respawns
  </TabsTrigger>
</TabsList>

  <TabsContent value="pics" className="mt-4">
    <div className="grid grid-cols-3 gap-1">
      {userPostPhotos.length === 0 ? (
        <p className="col-span-3 text-sm text-zinc-400">No photos yet.</p>
      ) : (
        <>
          {userPostPhotos.map((post: any) => (
            <div
  key={post.id}
  className="aspect-square bg-muted rounded-lg overflow-hidden cursor-pointer"
  onClick={() => setSelectedImage(post.image_url)}
>
  <img
    src={post.image_url}
    alt="Post photo"
    className="w-full h-full object-cover"
  />
</div>
          ))}
        </>
      )}
    </div>
  </TabsContent>

  <TabsContent value="videos" className="mt-4">
    <div className="grid grid-cols-3 gap-1">
      {userMedia.filter((item) => item.type === "video").length === 0 ? (
        <div className="col-span-3 text-center py-12">
          <p className="text-white">No videos yet</p>
        </div>
      ) : (
        <>
          {userMedia
            .filter((item) => item.type === "video")
            .map((item) => (
              <div
                key={item.id}
                className="aspect-square bg-muted rounded-lg overflow-hidden relative"
              >
                <video
                  src={item.url}
                  className="w-full h-full object-cover"
                  poster=""
                />
              </div>
            ))}
        </>
      )}
    </div>
  </TabsContent>

            <TabsContent value="spotlight" className="mt-4">
  <div className="space-y-4">
    {profilePosts.filter((post: any) => post.repost_of).length === 0 ? (
      <p className="py-12 text-center text-sm text-white">
        No Respawns yet
      </p>
    ) : (
      profilePosts
        .filter((post: any) => post.repost_of)
        .map((post) => (
          <SocialPost
            key={post.id}
            post={post}
            currentUserId={user?.id}
            onLikeChange={(delta) =>
              updatePostLikeCount(post.id, delta)
            }
            onCommentChange={(delta) =>
              updatePostCommentCount(post.id, delta)
            }
            onDelete={() =>
              setProfilePosts((prev) =>
                prev.filter((p) => p.id !== post.id)
              )
            }
          />
        ))
    )}
  </div>
</TabsContent>

<TabsContent value="posts" className="mt-6 -mx-6 sm:mx-0">
  {postsLoading ? (
    <div className="flex justify-center items-center py-8">
      <Loader2 className="w-6 h-6 animate-spin text-primary" />
    </div>
  ) : profilePosts.length === 0 ? (
    <p className="text-sm text-white py-6 text-center">No posts yet</p>
  ) : (
    <div className="space-y-4 pb-4">
      {profilePosts.map((post) => (
        <SocialPost
          key={post.id}
          post={post}
          currentUserId={user?.id}
          onLikeChange={(delta) => updatePostLikeCount(post.id, delta)}
          onCommentChange={(delta) => updatePostCommentCount(post.id, delta)}
          onDelete={() =>
  setProfilePosts((prev) => prev.filter((p) => p.id !== post.id))
}
        />
      ))}
    </div>
  )}
</TabsContent>

</Tabs>
        </div>
{selectedImage && (
  <div
    className="fixed inset-0 bg-black/90 flex items-center justify-center z-50"
    onClick={() => setSelectedImage(null)}
  >
    <img
      src={selectedImage}
      alt="Selected photo"
      className="max-w-full max-h-full object-contain"
    />
  </div>
)}
        {/* Upload Dialog */}
        <Dialog open={showImageUpload} onOpenChange={setShowImageUpload}>
          <DialogContent className="w-[95vw] max-w-md mx-auto">
            <DialogHeader>
              <DialogTitle>Upload Media</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <Button 
                className="w-full" 
                onClick={() => document.getElementById('media-upload')?.click()}
              >
                <Camera className="w-4 h-4 mr-2" />
                Choose Photo or Video
              </Button>
              <input
                id="media-upload"
                type="file"
                accept="image/*,video/*"
                className="hidden"
                onChange={handleFileSelect}
              />
            </div>
          </DialogContent>
        </Dialog>
        {user && profile && (
  <CreatePost
    open={showCreatePost}
    onClose={() => {
      setShowCreatePost(false);
      setCreatePostAction(null);
    }}
    user={user}
    profile={profile}
    onPostCreated={handleProfilePostCreated}
    initialAction={createPostAction}
  />
)}
      </div>
    </div>
  );
};

export default Profile;
