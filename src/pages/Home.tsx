import { useState, useEffect, useCallback, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import SocialFeed from "@/components/SocialFeed";
import SampleFeed from "@/components/SampleFeed";
import CreatePost from "@/components/CreatePost";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { OnboardingChecklist } from "@/components/OnboardingChecklist";
import { RefreshCw } from "lucide-react";

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

const Home = () => {
  const [user, setUser] = useState<any>(null);
  const [createPostAction, setCreatePostAction] = useState<"photo" | "video" | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [hasRealContent, setHasRealContent] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [newPost, setNewPost] = useState<NewPostData | null>(null);

  // Memoize author profile for SocialFeed
  const authorProfile = useMemo(() => {
    if (!profile) return null;
    return {
      display_name: profile.display_name || 'User',
      avatar_url: profile.avatar_url || null,
      vibe: profile.vibe || null,
      verified: profile.verified || false
    };
  }, [profile]);

  // Memoize whether to show onboarding - check profile loaded AND not completed
  const showOnboarding = useMemo(() => {
    return user && profile && profile.onboarding_completed === false;
  }, [user, profile]);

  useEffect(() => {
    getUser();
  }, []);

  const getUser = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      
      if (user) {
        // Update last_seen_at
        await supabase
          .from('profiles')
          .update({ last_seen_at: new Date().toISOString() })
          .eq('id', user.id);

        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
        setProfile(profileData);

        // Check if there are any real posts using the RPC function
        const { data: postsData } = await supabase.rpc('get_post_feed' as any, {
          p_offset: 0,
          p_limit: 1
        });
        
        setHasRealContent(postsData && postsData.length > 0);
      }
    } catch (error) {
      console.error('Error fetching user:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle new post created - no key remount, just pass to SocialFeed
  const handlePostCreated = useCallback((postData: NewPostData) => {
    setShowCreatePost(false);
    setHasRealContent(true);
    setNewPost(postData);
  }, []);
useEffect(() => {
  const refreshHomeFeed = () => {
    window.location.reload();
  };

  window.addEventListener("refreshHomeFeed", refreshHomeFeed);

  return () => {
    window.removeEventListener("refreshHomeFeed", refreshHomeFeed);
  };
}, []);

  // Handle pull-to-refresh on mobile
  useEffect(() => {
    let touchStart = 0;
    let touchEnd = 0;
    
    const handleTouchStart = (e: TouchEvent) => {
      touchStart = e.touches[0].clientY;
    };
    
   
    const handleTouchEnd = async (e: TouchEvent) => {
  touchEnd = e.changedTouches[0].clientY;
  const scrollTop = document.documentElement.scrollTop || document.body.scrollTop;

  if (scrollTop === 0 && touchEnd - touchStart > 80 && !isRefreshing) {
    window.location.reload();
  }
};

document.addEventListener('touchstart', handleTouchStart, { passive: true });
document.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isRefreshing]);

  return (
    <div className="bg-background min-h-screen">
      {/* Pull to refresh indicator - only shows when actively refreshing */}
      {isRefreshing && (
        <div className="flex justify-center py-4">
          <RefreshCw className="w-5 h-5 animate-spin text-primary" />
        </div>
      )}

      {/* Top spacing for first content */}
      <div className="pt-4">
        {/* Onboarding Checklist - only show when profile is loaded and not completed */}
        {showOnboarding && (
          <OnboardingChecklist userId={user.id} profile={profile} />
        )}

        {isLoading ? (
          <LoadingSpinner />
        ) : hasRealContent ? (
          <SocialFeed 
            currentUserId={user?.id} 
            newPost={newPost}
            authorProfile={authorProfile}
            onOpenCreatePost={(action = null) => {
  setCreatePostAction(action);
  setShowCreatePost(true);
}}
          />
        ) : (
          <SampleFeed currentUserId={user?.id} />
        )}
      </div>

      {/* Create Post Modal */}
      {user && profile && (
        <CreatePost 
          open={showCreatePost} 
          onClose={() => {
  setShowCreatePost(false);
  setCreatePostAction(null);
}}
          user={user} 
          profile={profile} 
          onPostCreated={handlePostCreated} 
          initialAction={createPostAction}
        />
      )}
    </div>
  );
};

export default Home;
