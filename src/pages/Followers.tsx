import { useState, useEffect } from "react";

import {
  ArrowLeft,
  Ban,
  MoreHorizontal,
  Loader2,
} from "lucide-react";

import {
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

import {
  Avatar,
  AvatarImage,
  AvatarFallback,
} from "@/components/ui/avatar";

import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface FollowUser {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  vibe?: string | null;
  bio: string | null;
  followed_at?: string | null;
}

const Followers = () => {
  const navigate = useNavigate();
  const { userId } = useParams();
  const [searchParams] = useSearchParams();

  const initialTab =
    searchParams.get("tab") || "followers";

  const { user } = useAuth();

  const [followers, setFollowers] =
    useState<FollowUser[]>([]);

  const [following, setFollowing] =
    useState<FollowUser[]>([]);

  const [requests, setRequests] =
    useState<FollowUser[]>([]);

  const [loading, setLoading] = useState(true);

  const [activeTab, setActiveTab] =
    useState(initialTab);

  const [sortBy, setSortBy] =
    useState("recent");

  const [openMenuId, setOpenMenuId] =
    useState<string | null>(null);

  const profileId = userId || user?.id;

  useEffect(() => {
    if (profileId) {
      fetchFollowData();
    }
  }, [profileId]);

  useEffect(() => {
  const channel = supabase
    .channel("connections-changes")

    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "follows",
      },
      () => {
        fetchFollowData();
      }
    )

    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "follow_requests",
      },
      () => {
        fetchFollowData();
      }
    )

    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}, [profileId]);

  const fetchFollowData = async () => {
    if (!profileId) return;

    setLoading(true);

    try {
      // Followers: people who follow this profile
      const {
        data: followersData,
        error: followersError,
      } = await supabase
        .from("follows")
        .select("follower_id, created_at")
        .eq("following_id", profileId);

      if (followersError) {
        throw followersError;
      }

      // Following: people this profile follows
      const {
        data: followingData,
        error: followingError,
      } = await supabase
        .from("follows")
        .select("following_id, created_at")
        .eq("follower_id", profileId);

      if (followingError) {
        throw followingError;
      }

      // Get follower profiles
      if (
        followersData &&
        followersData.length > 0
      ) {
        const followerIds =
          followersData.map(
            (f) => f.follower_id
          );

        const {
          data: followerProfiles,
          error: profilesError,
        } = await supabase
          .from("profiles")
          .select(
            "id, display_name, avatar_url, bio"
          )
          .in("id", followerIds);

        if (profilesError) {
          throw profilesError;
        }

        setFollowers(
          (followerProfiles || []).map(
            (profile) => ({
              ...profile,

              followed_at:
                followersData.find(
                  (f) =>
                    f.follower_id ===
                    profile.id
                )?.created_at || null,
            })
          )
        );
      } else {
        setFollowers([]);
      }

      // Get following profiles
      if (
        followingData &&
        followingData.length > 0
      ) {
        const followingIds =
          followingData.map(
            (f) => f.following_id
          );

        const {
          data: followingProfiles,
          error: profilesError,
        } = await supabase
          .from("profiles")
          .select(
            "id, display_name, avatar_url, bio"
          )
          .in("id", followingIds);

        if (profilesError) {
          throw profilesError;
        }

        setFollowing(
          (followingProfiles || []).map(
            (profile) => ({
              ...profile,

              followed_at:
                followingData.find(
                  (f) =>
                    f.following_id ===
                    profile.id
                )?.created_at || null,
            })
          )
        );
      } else {
        setFollowing([]);
      }

      // Incoming follow requests
      if (user) {
        const {
          data: requestData,
          error: requestError,
        } = await (supabase as any)
          .from("follow_requests")
          .select(
            "requester_id, created_at"
          )
          .eq("requested_id", user.id);

        if (requestError) {
          throw requestError;
        }
        

        if (
          requestData &&
          requestData.length > 0
        ) {
          const requesterIds =
            requestData.map(
              (request: any) =>
                request.requester_id
            );

          const {
            data: requestProfiles,
            error: requestProfilesError,
          } = await supabase
            .from("profiles")
            .select(
              "id, display_name, avatar_url, bio"
            )
            .in("id", requesterIds);

          if (requestProfilesError) {
            throw requestProfilesError;
          }

          setRequests(
            (requestProfiles || []).map(
              (profile) => ({
                ...profile,

                followed_at:
                  requestData.find(
                    (request: any) =>
                      request.requester_id ===
                      profile.id
                  )?.created_at || null,
              })
            )
          );
        } else {
          setRequests([]);
        }
      } else {
        setRequests([]);
      }
    } catch (error) {
      console.error(
        "Error fetching follow data:",
        error
      );

      toast.error(
        String(
          (error as any)?.message || error
        )
      );
    } finally {
      setLoading(false);
    }
  };

  const handleUnfollow = async (
    targetUserId: string
  ) => {
    if (!user) return;

    const prevFollowing = [...following];

    setFollowing((prev) =>
      prev.filter(
        (u) => u.id !== targetUserId
      )
    );

    try {
      const { error } = await supabase
        .from("follows")
        .delete()
        .eq("follower_id", user.id)
        .eq(
          "following_id",
          targetUserId
        );

      if (error) throw error;

      toast.success(
        "Unfollowed successfully"
      );
    } catch (error) {
      console.error(
        "Error unfollowing:",
        error
      );

      setFollowing(prevFollowing);

      toast.error(
        "Failed to unfollow"
      );
    }
  };

  const handleRemoveFollower = async (
    followerUserId: string
  ) => {
    if (!user) return;

    const prevFollowers = [...followers];

    setFollowers((prev) =>
      prev.filter(
        (u) => u.id !== followerUserId
      )
    );

    try {
      const { error } = await supabase
        .from("follows")
        .delete()
        .eq(
          "follower_id",
          followerUserId
        )
        .eq("following_id", user.id);

      if (error) throw error;

      toast.success(
        "Follower removed"
      );
    } catch (error) {
      console.error(
        "Error removing follower:",
        error
      );

      setFollowers(prevFollowers);

      toast.error(
        "Failed to remove follower"
      );
    }
  };

  const handleDeclineRequest = async (
    requesterId: string
  ) => {
    if (!user) return;

    const prevRequests = [...requests];

    setRequests((prev) =>
      prev.filter(
        (request) =>
          request.id !== requesterId
      )
    );

    try {
      const { error } =
        await (supabase as any)
          .from("follow_requests")
          .delete()
          .eq(
            "requester_id",
            requesterId
          )
          .eq(
            "requested_id",
            user.id
          );

      if (error) throw error;

      toast.success(
        "Request declined"
      );
    } catch (error) {
      console.error(
        "Error declining request:",
        error
      );

      setRequests(prevRequests);

      toast.error(
        "Failed to decline request"
      );
    }
  };
  const handleAcceptRequest = async (requesterId: string) => {
  if (!user) return;

  const prevRequests = [...requests];
  const acceptedProfile = requests.find(
    (request) => request.id === requesterId
  );

  // Instant UI update
  setRequests((prev) =>
    prev.filter((request) => request.id !== requesterId)
  );

  if (acceptedProfile) {
    setFollowers((prev) => [
      acceptedProfile,
      ...prev.filter((f) => f.id !== requesterId),
    ]);
  }

  try {
    const { error: followError } = await supabase
      .from("follows")
      .insert({
        follower_id: requesterId,
        following_id: user.id,
      });

    if (followError) throw followError;

    const { error: requestError } = await (supabase as any)
      .from("follow_requests")
      .delete()
      .eq("requester_id", requesterId)
      .eq("requested_id", user.id);

    if (requestError) throw requestError;

    toast.success("Request accepted");
  } catch (error) {
    console.error("Error accepting request:", error);

    // Roll back
    setRequests(prevRequests);

    if (acceptedProfile) {
      setFollowers((prev) =>
        prev.filter((f) => f.id !== requesterId)
      );
    }

    toast.error("Failed to accept request");
  }
};

  const sortUsers = (
    users: FollowUser[]
  ) => {
    if (sortBy === "name") {
      return [...users].sort(
        (a, b) =>
          (
            a.display_name || ""
          ).localeCompare(
            b.display_name || ""
          )
      );
    }

    if (sortBy === "recent") {
      return [...users].sort(
        (a, b) => {
          const aTime =
            a.followed_at
              ? new Date(
                  a.followed_at
                ).getTime()
              : 0;

          const bTime =
            b.followed_at
              ? new Date(
                  b.followed_at
                ).getTime()
              : 0;

          return bTime - aTime;
        }
      );
    }

    return users;
  };

  const UserCard = ({
    profile,
    showUnfollow = false,
    showFollow = false,
    showRequestActions = false,
  }: {
    profile: FollowUser;
    showUnfollow?: boolean;
    showFollow?: boolean;
    showRequestActions?: boolean;
  }) => {
    return (
      <Card
        className="rounded-none border-0 border-b border-white/10 bg-transparent px-5 py-4 flex items-center justify-between cursor-pointer hover:bg-white/[0.03] transition-colors last:border-b-0"
        onClick={() =>
          navigate(
            `/profile/${profile.id}`
          )
        }
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 min-w-0">
            <Avatar className="w-12 h-12 flex-shrink-0">
              <AvatarImage
                src={
                  profile.avatar_url ||
                  undefined
                }
              />

              <AvatarFallback className="bg-primary text-primary-foreground">
                {profile.display_name?.charAt(
                  0
                ) || "U"}
              </AvatarFallback>
            </Avatar>

            <div className="min-w-0">
              <p className="font-medium text-foreground truncate">
                {profile.display_name ||
                  "User"}
              </p>

              <div className="flex items-center gap-2 text-sm truncate">
                <span className="text-white/50">
                  @
                  {profile.id.slice(
                    0,
                    8
                  )}
                </span>

                {profile.bio && (
                  <>
                    <span className="text-white/30">
                      ·
                    </span>

                    <span className="text-white/60 truncate">
                      {profile.bio}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 ml-3">
          {showFollow && (
            <button
              className="flex items-center justify-center p-2 hover:opacity-70 transition"
              onClick={(e) => {
                e.stopPropagation();

                console.log(
                  "Stop / Remove follower:",
                  profile.id
                );
              }}
            >
              <Ban className="w-4 h-4" />
            </button>
          )}

          {showUnfollow && (
            <button
              className="flex items-center justify-center hover:opacity-70 transition"
              onClick={(e) => {
                e.stopPropagation();

                handleUnfollow(
                  profile.id
                );
              }}
            >
              <span className="text-emerald-400 text-sm px-5 py-1.5 rounded-full border border-emerald-500">
                Following
              </span>
            </button>
          )}

          {showRequestActions && (
            <div className="flex items-center gap-2">
              <button
                className="px-4 py-1.5 rounded-full border border-emerald-500 text-emerald-400 text-sm hover:bg-emerald-500/10 transition"
                onClick={(e) => {
                  e.stopPropagation();

                  handleAcceptRequest(profile.id);
                }}
              >
                Accept
              </button>

              <button
                className="px-4 py-1.5 rounded-full border border-white/20 text-white/70 text-sm hover:bg-white/5 transition"
                onClick={(e) => {
                  e.stopPropagation();

                  handleDeclineRequest(
                    profile.id
                  );
                }}
              >
                Decline
              </button>
            </div>
          )}

          <div className="relative">
            <button
              className="flex items-center justify-center p-2 hover:opacity-70 transition"
              onClick={(e) => {
                e.stopPropagation();

                setOpenMenuId(
                  (current) =>
                    current ===
                    profile.id
                      ? null
                      : profile.id
                );
              }}
            >
              <MoreHorizontal className="w-4 h-4 text-white/70" />
            </button>

            {openMenuId ===
              profile.id && (
              <div
                className="absolute right-0 top-full mt-2 w-44 rounded-xl border border-white/10 bg-black shadow-xl z-50 overflow-hidden"
                onClick={(e) =>
                  e.stopPropagation()
                }
              >
                <button
                  className="w-full px-4 py-3 text-left text-sm text-white hover:bg-white/5"
                  onClick={() => {
                    handleRemoveFollower(
                      profile.id
                    );

                    setOpenMenuId(
                      null
                    );
                  }}
                >
                  Remove follower
                </button>

                <button
                  className="w-full px-4 py-3 text-left text-sm text-white hover:bg-white/5"
                  onClick={() => {
                    console.log(
                      "Block:",
                      profile.id
                    );

                    setOpenMenuId(
                      null
                    );
                  }}
                >
                  Block
                </button>

                <button
                  className="w-full px-4 py-3 text-left text-sm text-red-400 hover:bg-white/5"
                  onClick={() => {
                    console.log(
                      "Report:",
                      profile.id
                    );

                    setOpenMenuId(
                      null
                    );
                  }}
                >
                  Report
                </button>
              </div>
            )}
          </div>
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
      <div className="px-10 pt-8 pb-20">
        <div className="flex items-center gap-4 mb-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() =>
              navigate(-1)
            }
            className="text-foreground"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>

          <h1 className="text-2xl font-bold">
            Connections
          </h1>
        </div>

        <Tabs
          value={activeTab}
          onValueChange={
            setActiveTab
          }
          className="w-full"
        >
          <div className="flex items-center justify-between mb-4">
            <TabsList className="flex w-fit gap-3 bg-transparent p-0">
              <TabsTrigger
                value="followers"
                className="rounded-full border border-white/20 bg-transparent px-5 py-2 text-white data-[state=active]:border-emerald-500 data-[state=active]:bg-transparent"
              >
                Followers

                <span className="ml-2 rounded-full bg-white/10 px-2 py-0.5 text-xs">
                  {followers.length}
                </span>
              </TabsTrigger>

              <TabsTrigger
                value="following"
                className="rounded-full border border-white/20 bg-transparent px-5 py-2 text-white data-[state=active]:border-emerald-500 data-[state=active]:bg-transparent"
              >
                Following

                <span className="ml-2 rounded-full bg-white/10 px-2 py-0.5 text-xs">
                  {following.length}
                </span>
              </TabsTrigger>

              <TabsTrigger
                value="requests"
                className="rounded-full border border-white/20 bg-transparent px-5 py-2 text-white data-[state=active]:border-emerald-500 data-[state=active]:bg-transparent"
              >
                Requests

                <span className="ml-2 rounded-full bg-white/10 px-2 py-0.5 text-xs">
                  {requests.length}
                </span>
              </TabsTrigger>
            </TabsList>

            <select
              value={sortBy}
              onChange={(e) =>
                setSortBy(
                  e.target.value
                )
              }
              className="bg-transparent text-sm text-white/60 outline-none cursor-pointer"
            >
              <option
                value="recent"
                className="bg-black"
              >
                Sort by: Recent
              </option>

              <option
                value="name"
                className="bg-black"
              >
                Sort by: Name
              </option>
            </select>
          </div>

          <TabsContent
            value="followers"
            className="mt-4 overflow-hidden rounded-xl border border-white/10"
          >
            {followers.length ===
            0 ? (
              <div className="text-center py-12">
                <p className="text-white">
                  No followers yet
                </p>
              </div>
            ) : (
              sortUsers(
                followers
              ).map((profile) => (
                <UserCard
                  key={
                    profile.id
                  }
                  profile={
                    profile
                  }
                  showFollow
                />
              ))
            )}
          </TabsContent>

          <TabsContent
            value="following"
            className="mt-4 overflow-visible rounded-xl border border-white/10"
          >
            {following.length ===
            0 ? (
              <div className="text-center py-12">
                <p className="text-white">
                  Not following
                  anyone yet
                </p>
              </div>
            ) : (
              sortUsers(
                following
              ).map((profile) => (
                <UserCard
                  key={
                    profile.id
                  }
                  profile={
                    profile
                  }
                  showUnfollow
                />
              ))
            )}
          </TabsContent>

          <TabsContent
            value="requests"
            className="mt-4 overflow-hidden rounded-xl border border-white/10"
          >
            {requests.length ===
            0 ? (
              <div className="text-center py-12">
                <p className="text-white">
                  No requests yet
                </p>
              </div>
            ) : (
              sortUsers(
                requests
              ).map((profile) => (
                <UserCard
                  key={
                    profile.id
                  }
                  profile={
                    profile
                  }
                  showRequestActions
                />
              ))
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Followers;