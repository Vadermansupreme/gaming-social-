import { useState, useEffect } from "react";
import { ArrowLeft, UserMinus, SquarePen, Ban } from "lucide-react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";


interface FollowUser {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  vibe: string | null;
  bio: string | null;
}

const Followers = () => {
  const navigate = useNavigate();
  const { userId } = useParams();
  const [searchParams] = useSearchParams();
  const initialTab = searchParams.get('tab') || 'followers';
  const { user } = useAuth();
  const [followers, setFollowers] = useState<FollowUser[]>([]);
  const [following, setFollowing] = useState<FollowUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(initialTab);

  const profileId = userId || user?.id;

  useEffect(() => {
    if (profileId) {
      fetchFollowData();
    }
  }, [profileId]);

  const fetchFollowData = async () => {
    if (!profileId) return;
    
    setLoading(true);
    try {
      // Fetch followers (people who follow this user)
      const { data: followersData, error: followersError } = await supabase
        .from('follows')
        .select('follower_id')
        .eq('followed_id', profileId);

      if (followersError) throw followersError;

      // Fetch following (people this user follows)
      const { data: followingData, error: followingError } = await supabase
        .from('follows')
        .select('followed_id')
        .eq('follower_id', profileId);

      if (followingError) throw followingError;

      // Get follower profiles
      if (followersData && followersData.length > 0) {
        const followerIds = followersData.map(f => f.follower_id);
        const { data: followerProfiles, error: profilesError } = await supabase
          .from('public_profiles')
          .select('id, display_name, avatar_url, vibe, bio')
          .in('id', followerIds);

        if (!profilesError && followerProfiles) {
          setFollowers(followerProfiles);
        }
      } else {
        setFollowers([]);
      }

      // Get following profiles
      if (followingData && followingData.length > 0) {
        const followingIds = followingData.map(f => f.followed_id);
        const { data: followingProfiles, error: profilesError } = await supabase
          .from('public_profiles')
          .select('id, display_name, avatar_url, vibe, bio')
          .in('id', followingIds);

        if (!profilesError && followingProfiles) {
          setFollowing(followingProfiles);
        }
      } else {
        setFollowing([]);
      }
    } catch (error) {
      console.error('Error fetching follow data:', error);
      toast.error('Failed to load follow data');
    } finally {
      setLoading(false);
    }
  };
const handleFollow = async (targetUserId: string) => {
  try {
    const { error } = await supabase.from("follows").insert({
      follower_id: profileId,
      followed_id: targetUserId,
    });

    if (error) throw error;

setFollowing((prev) => prev.filter((p) => p.id !== targetUserId));
    toast.success("Followed successfully");
  } catch (error) {
    console.error("Error following:", error);
    toast.error("Failed to follow");
  }
};
  const handleUnfollow = async (targetUserId: string) => {
    if (!user) return;

    // Save previous state for rollback
    const prevFollowing = [...following];

    // Optimistic update - remove from list immediately
    setFollowing(prev => prev.filter(u => u.id !== targetUserId));

    try {
      const { error } = await supabase
        .from('follows')
        .delete()
        .eq('follower_id', user.id)
        .eq('followed_id', targetUserId);

      if (error) throw error;
      toast.success('Unfollowed successfully');
    } catch (error) {
      console.error('Error unfollowing:', error);
      // Rollback on error
      setFollowing(prevFollowing);
      toast.error('Failed to unfollow');
    }
  };

  const UserCard = ({
  profile,
  showUnfollow = false,
  showFollow = false,
  showMessage = false,
}: {
  profile: FollowUser;
  showUnfollow?: boolean;
  showFollow?: boolean;
  showMessage?: boolean;
}) => {
  const vibeColors: Record<string, string> = {
    casual: "#9CA3AF",
    routine: "#3B82F6",
    driven: "#10B981",
    competitor: "#F97316",
    apex: "#EF4444",
  };

  const vibeKey = (profile.vibe || "casual").toLowerCase();
  const vibeColor = vibeColors[vibeKey] || "#9CA3AF";

  return (
    <Card
  className="p-4 flex items-center justify-between cursor-pointer hover:bg-muted/50 transition-colors"
  onClick={() => navigate(`/profile/${profile.id}`)}
>
      
      <div className="flex-1 min-w-0">
  <div className="flex items-center gap-3 min-w-0">
  <Avatar className="w-12 h-12 flex-shrink-0">
    <AvatarImage src={profile.avatar_url || undefined} />
    <AvatarFallback className="bg-primary text-primary-foreground">
      {profile.display_name?.charAt(0) || 'U'}
    </AvatarFallback>
  </Avatar>

  {profile.vibe && (
    <div
      className="h-1.5 w-10 rounded-full flex-shrink-0"
      style={{ backgroundColor: vibeColor }}
    ></div>
  )}

  <div className="min-w-0">
    <p className="font-medium text-foreground truncate">
      {profile.display_name || 'User'}
    </p>

    {profile.bio && (
      <p className="text-sm text-white truncate">
        {profile.bio}
      </p>
    )}
  </div>
</div>
  </div>
  <div className="flex items-center gap-2 ml™-3">
  {showFollow === true && (
  <button
    className="flex items-center justify-center p-1 hover:opacity-70 transition"
    onClick={(e) => {
      e.stopPropagation();
      // replace with your logic later (block, remove follower, etc.)
      console.log("Stop / Remove follower:", profile.id);
    }}
  >
    <Ban className="w-4 h-4" />
  </button>
)}


  

  {showUnfollow && (
  <button
    className="flex items-center justify-center p-1 hover:opacity-70 transition"
    onClick={(e) => {
      e.stopPropagation();
      handleUnfollow(profile.id);
    }}
  >
    <span className="text-white text-sm">−</span>
  </button>
)}
</div>

        </Card>
  );
};

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="bg-background min-h-screen">
      <div className="px-4 pt-6 pb-20">
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
            className="text-foreground"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-2xl font-bold">Connections</h1>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="followers">
              Followers ({followers.length})
            </TabsTrigger>
            <TabsTrigger value="following">
              Following ({following.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="followers" className="space-y-3">
            {followers.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-white">No followers yet</p>
              </div>
            ) : (
              followers.map(profile => (
                <UserCard key={profile.id} profile={profile} showFollow={true} />
              ))
            )}
          </TabsContent>

          <TabsContent value="following" className="space-y-3">
            {following.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-white">Not following anyone yet</p>
              </div>
            ) : (
              following.map(profile => (
                <UserCard key={profile.id} profile={profile} showUnfollow />
              ))
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Followers;
