import { useEffect, useState, useCallback } from "react";
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, MessageCircle, UserPlus, Shield, AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import UserAvatar from "@/components/UserAvatar";
import { getMockProfile } from "@/data/mockProfiles";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { EmptyState } from "@/components/EmptyState";
import SocialPost from "@/components/SocialPost";

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

const ViewProfile = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isOwnProfile, setIsOwnProfile] = useState(false);
  const [isFollowLoading, setIsFollowLoading] = useState(false);
  const [profilePosts, setProfilePosts] = useState<ProfilePost[]>([]);
  const [postsLoading, setPostsLoading] = useState(false);
  const vibeColors: Record<string, string> = {
  casual: "#9CA3AF",
  routine: "#3B82F6",
  driven: "#10B981",
  competitor: "#F97316",
  apex: "#EF4444",
};

const vibeKey = (profile?.vibe || "casual").toLowerCase();
const vibeColor = vibeColors[vibeKey] || "#9CA3AF";

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

  useEffect(() => {
    if (!id) {
      navigate('/search');
      return;
    }
    
    fetchProfile();
    getCurrentUser();
  }, [id]);

  const getCurrentUser = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user);
      
      // Check if viewing own profile
      if (user && id === user.id) {
        setIsOwnProfile(true);
        return;
      }
      
      if (user && id && !id.startsWith('demo-')) {
        const { data } = await supabase
          .from('follows')
          .select('follower_id')
          .eq('follower_id', user.id)
          .eq('followed_id', id)
          .maybeSingle();
        
        setIsFollowing(!!data);
      }
    } catch (error) {
      // User not logged in or follow doesn't exist
    }
  };

  const fetchProfile = async () => {
    try {
      setLoading(true);
      
      if (!id) return;

      // Check if it's a mock profile first
      if (id.startsWith('demo-')) {
        const mockProfile = getMockProfile(id);
        if (mockProfile) {
          setProfile(mockProfile);
          setLoading(false);
          return;
        }
      }

      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select(`
          id,
          display_name,
          first_name,
          last_name,
          avatar_url,
          bio,
          vibe,
          fitness_level,
          preferred_workouts,
          fitness_goals,
          availability,
          verified,
          followers_count,
          following_count,
          home_gym_name,
          home_gym_place_id,
          allow_messages
        `)
        .eq('id', id)
        .maybeSingle();

      if (profileError) {
        console.error('Error fetching profile:', profileError);
        toast.error('Failed to load profile');
        setProfile(null);
        setLoading(false);
        return;
      }

      if (!profileData) {
        console.log('Profile not found or not visible');
        setProfile(null);
        setLoading(false);
        return;
      }

      // Use narrow cast to avoid TS errors; treat null as true (messages allowed)
      const p = profileData as any;
      setProfile({
        ...profileData,
        allow_messages: p.allow_messages ?? true
      });
    } catch (error) {
      console.error('Error fetching profile:', error);
      toast.error('Failed to load profile');
      setProfile(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!id || !profile || id.startsWith('demo-')) {
      setProfilePosts([]);
      return;
    }
    let cancelled = false;
    const fetchProfilePosts = async () => {
      setPostsLoading(true);
      try {
        const { data: rows, error } = await supabase
          .from('posts')
          .select('id, text, created_at, media_urls, like_count, comment_count, author_id')
          .eq('author_id', id)
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
    fetchProfilePosts();
    return () => { cancelled = true; };
  }, [id, profile]);

  const handleFollow = async () => {
    if (!currentUser || isFollowLoading) return;

    if (isOwnProfile) {
      toast.error("You can't follow yourself");
      return;
    }

    // For demo profiles, just show a demo message
    if (id?.startsWith('demo-')) {
      setIsFollowing(!isFollowing);
      toast.success(isFollowing ? 'Unfollowed demo user' : 'Following demo user');
      return;
    }

    setIsFollowLoading(true);

    // Save previous state for rollback
    const wasFollowing = isFollowing;
    const prevFollowersCount = profile?.followers_count || 0;

    // Optimistic update - instant UI feedback
    const newFollowing = !wasFollowing;
    const delta = newFollowing ? 1 : -1;
    setIsFollowing(newFollowing);
    setProfile((prev: any) => prev ? {
      ...prev,
      followers_count: Math.max(0, (prev.followers_count || 0) + delta)
    } : prev);

    try {
      if (wasFollowing) {
        const { error } = await supabase
          .from('follows')
          .delete()
          .eq('follower_id', currentUser.id)
          .eq('followed_id', id);

        if (error) throw error;
        toast.success('Unfollowed successfully');
      } else {
        const { error } = await supabase
          .from('follows')
          .insert({
            follower_id: currentUser.id,
            followed_id: id
          });

        // Handle duplicate key error (already following) as success
        if (error && error.code !== '23505') throw error;
        toast.success('Following successfully');
      }
    } catch (error: any) {
      // Rollback on error
      setIsFollowing(wasFollowing);
      setProfile((prev: any) => prev ? {
        ...prev,
        followers_count: prevFollowersCount
      } : prev);
      console.error('Error updating follow status:', error);
      toast.error(error?.message || 'Failed to update follow status');
    } finally {
      setTimeout(() => setIsFollowLoading(false), 300);
    }
  };

  const handleMessage = async () => {
    if (!currentUser) {
      toast.error('Please log in to send messages');
      return;
    }

    if (isOwnProfile) {
      toast.error("You can't message yourself");
      return;
    }

    try {
      // Create or find existing conversation
      const { data: existingConv } = await supabase
        .from('conversations')
        .select('id')
        .or(`and(participant_1.eq.${currentUser.id},participant_2.eq.${id}),and(participant_1.eq.${id},participant_2.eq.${currentUser.id})`)
        .maybeSingle();

      if (!existingConv) {
        // Create new conversation
        const { error } = await supabase
          .from('conversations')
          .insert({
            participant_1: currentUser.id,
            participant_2: id
          });

        if (error) throw error;
      }

      navigate(`/chat/${id}`);
    } catch (error) {
      console.error('Error creating conversation:', error);
      // Still navigate to chat even if conversation creation fails
      navigate(`/chat/${id}`);
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-background">
        <div className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
          <div className="flex items-center justify-between px-4 py-3">
            <Button variant="ghost" size="icon" onClick={() => navigate('/search')}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-lg font-semibold">Profile</h1>
            <div className="w-9" />
          </div>
        </div>
        <EmptyState
          icon={AlertCircle}
          title="Profile Not Found"
          description="This profile doesn't exist or is no longer available. It may have been deleted or set to private."
          action={{
            label: "Find Other Spotters",
            onClick: () => navigate('/search')
          }}
        />
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
          <h1 className="text-lg font-semibold">Profile</h1>
          <div className="w-9" />
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 py-6 space-y-6">
        {/* Profile Header */}
        <Card className="p-6 border-white/20">
          <div className="flex items-start gap-4">
            <UserAvatar 
              src={profile.avatar_url}
              fallback={profile.display_name || profile.first_name}
              size="xl"
              className="ring-0"
            />
          <div className="flex-1 min-w-0">
  <div className="mb-2 w-full">
    <h2 className="text-xl font-bold w-full break-words">
      {profile.display_name}
    </h2>

    <div
      className="mt-2 mb-3 h-3 w-24 rounded-full"
      style={{ backgroundColor: vibeColor }}
    />
  </div>

  {profile.verified && <Shield className="w-4 h-4 text-blue-500" />}
              <div className="flex items-center gap-4 text-sm text-white mb-3">
                <button
  type="button"
  onClick={() => navigate(`/followers?tab=followers&userId=${profile.id}`)}
  className="hover:text-white transition-colors"
>
  {profile.followers_count || 0} followers
</button>

<button
  type="button"
  onClick={() => navigate(`/followers?tab=following&userId=${profile.id}`)}
  className="hover:text-white transition-colors"
>
  {profile.following_count || 0} following
</button>
              </div>
              {profile.bio && (
                <p className="text-sm text-foreground mb-3">{profile.bio}</p>
              )}
            </div>
          </div>

          {/* Action Buttons - Only show if not own profile */}
          {!isOwnProfile && (
            <div className="flex gap-2 mt-4">
              <Button
                onClick={handleFollow}
                variant={isFollowing ? "outline" : "default"}
                className="flex-1"
                disabled={!currentUser || isFollowLoading}
              >
                <UserPlus className="w-4 h-4 mr-2" />
                {isFollowing ? 'Following' : 'Follow'}
              </Button>
              {profile.allow_messages === false ? (
                <Button
                  variant="outline"
                  className="flex-1 opacity-60"
                  disabled
                >
                  <MessageCircle className="w-4 h-4 mr-2" />
                  Messages disabled
                </Button>
              ) : (
                <Button
                  onClick={handleMessage}
                  variant="outline"
                  className="flex-1"
                  disabled={!currentUser}
                >
                  <MessageCircle className="w-4 h-4 mr-2" />
                  Message
                </Button>
              )}
            </div>
          )}

          {/* Show edit button if own profile */}
{isOwnProfile && (
  <div className="flex gap-2 mt-4">
    <Link
      to="/profile/edit"
      className="flex-1 block rounded-md bg-primary px-4 py-3 text-center text-primary-foreground font-medium relative z-[9999] pointer-events-auto"
    >
      Edit Profile
    </Link>
  </div>
)}
            
          
        </Card>
        {isOwnProfile && (
  <button
    type="button"
    onClick={() => alert('button clicked')}
    className="fixed left-6 right-6 bottom-28 z-[999999] rounded-md bg-red-600 px-4 py-4 text-white font-medium"
  >
    TEST EDIT BUTTON
  </button>
)}
<Tabs defaultValue="posts" className="w-full">
  <TabsList className="grid w-full grid-cols-4 gap-2 bg-transparent p-0">
    <TabsTrigger className="!bg-transparent" value="posts">Posts</TabsTrigger>
<TabsTrigger className="!bg-transparent" value="pics">Photos</TabsTrigger>
<TabsTrigger className="!bg-transparent" value="videos">Videos</TabsTrigger>
<TabsTrigger className="!bg-transparent" value="spotlight">My Spots</TabsTrigger>
  </TabsList>

  <TabsContent value="posts" className="mt-4">
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
            currentUserId={currentUser?.id}
            onLikeChange={(delta) => updatePostLikeCount(post.id, delta)}
            onCommentChange={(delta) => updatePostCommentCount(post.id, delta)}
          />
        ))}
      </div>
    )}
  </TabsContent>

  <TabsContent value="pics" className="mt-4">
    <div className="grid grid-cols-3 gap-1">
      {profilePosts.flatMap((post) =>
        (post.media_urls || [])
          .filter(
            (url) =>
              !url.toLowerCase().includes(".mp4") &&
              !url.toLowerCase().includes(".mov") &&
              !url.toLowerCase().includes(".webm")
          )
          .map((url, index) => (
            <div
              key={`${post.id}-photo-${index}`}
              className="aspect-square bg-muted rounded-lg overflow-hidden"
            >
              <img
                src={url}
                alt="Post photo"
                className="w-full h-full object-cover"
              />
            </div>
          ))
      )}
    </div>

    {profilePosts.flatMap((post) =>
      (post.media_urls || []).filter(
        (url) =>
          !url.toLowerCase().includes(".mp4") &&
          !url.toLowerCase().includes(".mov") &&
          !url.toLowerCase().includes(".webm")
      )
    ).length === 0 && (
      <p className="text-sm text-white py-6 text-center">No photos yet</p>
    )}
  </TabsContent>

  <TabsContent value="videos" className="mt-4">
    <div className="grid grid-cols-3 gap-1">
      {profilePosts.flatMap((post) =>
        (post.media_urls || [])
          .filter(
            (url) =>
              url.toLowerCase().includes(".mp4") ||
              url.toLowerCase().includes(".mov") ||
              url.toLowerCase().includes(".webm")
          )
          .map((url, index) => (
            <div
              key={`${post.id}-video-${index}`}
              className="aspect-square bg-muted rounded-lg overflow-hidden"
            >
              <video
                src={url}
                className="w-full h-full object-cover"
                controls
              />
            </div>
          ))
      )}
    </div>

    {profilePosts.flatMap((post) =>
      (post.media_urls || []).filter(
        (url) =>
          url.toLowerCase().includes(".mp4") ||
          url.toLowerCase().includes(".mov") ||
          url.toLowerCase().includes(".webm")
      )
    ).length === 0 && (
      <p className="text-sm text-white py-6 text-center">No videos yet</p>
    )}
  </TabsContent>

  <TabsContent value="spotlight" className="mt-4">
    {profile?.my_spots && profile.my_spots.length > 0 ? (
      <div className="space-y-4">
        {profile.my_spots.map((spot: string, index: number) => (
          <Card key={`${spot}-${index}`} className="p-4">
            <h3 className="font-semibold">{spot}</h3>
            <p className="text-sm text-white">Saved spot</p>
          </Card>
        ))}
      </div>
    ) : (
      <p className="text-sm text-white py-6 text-center">No spots added yet</p>
    )}
  </TabsContent>
</Tabs>
      

        
      </div>
    </div>
  );
};

export default ViewProfile;
