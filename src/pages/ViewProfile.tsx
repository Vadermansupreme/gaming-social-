import { useEffect, useState, useCallback } from "react";

import {
  Link,
  useNavigate,
  useParams,
} from "react-router-dom";

import {
  ArrowLeft,
  MessageCircle,
  UserPlus,
  Shield,
  AlertCircle,
  Loader2,
  Lock,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/ui/tabs";

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
repost_of: string | null;
repost_count: number;

author: {
    display_name: string;
    avatar_url: string | null;
    verified: boolean;
  };
};

const ViewProfile = () => {
  const { id } = useParams<{ id: string }>();

  const navigate = useNavigate();

  const [profile, setProfile] = useState<any>(null);

  const [loading, setLoading] = useState(true);

  const [currentUser, setCurrentUser] =
    useState<any>(null);

  const [isFollowing, setIsFollowing] =
    useState(false);

  const [isRequested, setIsRequested] =
    useState(false);

  const [isOwnProfile, setIsOwnProfile] =
    useState(false);

  const [isFollowLoading, setIsFollowLoading] =
    useState(false);

  const [profilePosts, setProfilePosts] =
    useState<ProfilePost[]>([]);

  const [postsLoading, setPostsLoading] =
    useState(false);

  const vibeColors: Record<string, string> = {
    casual: "#9CA3AF",
    routine: "#3B82F6",
    driven: "#10B981",
    competitor: "#F97316",
    apex: "#EF4444",
  };

  const vibeKey = (
    profile?.vibe || "casual"
  ).toLowerCase();

  const vibeColor =
    vibeColors[vibeKey] || "#9CA3AF";

  const updatePostLikeCount = useCallback(
    (postId: string, delta: number) => {
      setProfilePosts((prev) =>
        prev.map((p) =>
          p.id === postId
            ? {
                ...p,
                like_count: Math.max(
                  0,
                  p.like_count + delta
                ),
              }
            : p
        )
      );
    },
    []
  );

  const updatePostCommentCount =
    useCallback(
      (
        postId: string,
        delta: number
      ) => {
        setProfilePosts((prev) =>
          prev.map((p) =>
            p.id === postId
              ? {
                  ...p,
                  comment_count: Math.max(
                    0,
                    p.comment_count +
                      delta
                  ),
                }
              : p
          )
        );
      },
      []
    );

  useEffect(() => {
    if (!id) {
      navigate("/search");
      return;
    }

    fetchProfile();
    getCurrentUser();
  }, [id]);
useEffect(() => {
  const handleFollowRelationshipUpdated = () => {
    fetchProfile();
    getCurrentUser();
  };

  window.addEventListener(
    "follow-relationship-updated",
    handleFollowRelationshipUpdated
  );

  return () => {
    window.removeEventListener(
      "follow-relationship-updated",
      handleFollowRelationshipUpdated
    );
  };
}, [id]);
  const getCurrentUser = async () => {
    try {
      const {
        data: { user },
      } =
        await supabase.auth.getUser();

      setCurrentUser(user);

      if (!user) {
        setIsOwnProfile(false);
        setIsFollowing(false);
        setIsRequested(false);
        return;
      }

      // Viewing own profile
      if (id === user.id) {
        setIsOwnProfile(true);
        setIsFollowing(false);
        setIsRequested(false);
        return;
      }

      setIsOwnProfile(false);

      if (
        id &&
        !id.startsWith("demo-")
      ) {
        // Check whether already following
        const {
          data: followData,
          error: followError,
        } = await supabase
          .from("follows")
          .select("follower_id")
          .eq(
            "follower_id",
            user.id
          )
          .eq(
            "following_id",
            id
          )
          .maybeSingle();

        if (followError) {
          console.error(
            "Error checking follow:",
            followError
          );
        }

        setIsFollowing(
          !!followData
        );

        // Check whether request is pending
        const {
          data: requestData,
          error: requestError,
        } =
          await (
            supabase as any
          )
            .from(
              "follow_requests"
            )
            .select("id")
            .eq(
              "requester_id",
              user.id
            )
            .eq(
              "requested_id",
              id
            )
            .maybeSingle();

        if (requestError) {
          console.error(
            "Error checking follow request:",
            requestError
          );
        }

        setIsRequested(
          !!requestData
        );
      }
    } catch (error) {
      console.error(
        "Error getting current user:",
        error
      );
    }
  };

  const fetchProfile = async () => {
    try {
      setLoading(true);

      if (!id) return;

      // Demo profile
      if (
        id.startsWith("demo-")
      ) {
        const mockProfile =
          getMockProfile(id);

        if (mockProfile) {
          setProfile(
            mockProfile
          );

          setLoading(false);

          return;
        }
      }

      // "as any" temporarily lets us use
      // the new is_private column before
      // regenerating Supabase TS types
      const {
        data: profileData,
        error: profileError,
      } =
        await (
          supabase as any
        )
          .from("profiles")
          .select(`
            id,
            display_name,
            username,
            avatar_url,
            bio,
            is_private
          `)
          .eq("id", id)
          .maybeSingle();
          console.log("VIEWED PROFILE DATA:", profileData);

      if (profileError) {
        console.error(
          "Error fetching profile:",
          profileError
        );

        toast.error(
          "Failed to load profile"
        );

        setProfile(null);

        setLoading(false);

        return;
      }

      if (!profileData) {
        console.log(
          "Profile not found or not visible"
        );

        setProfile(null);

        setLoading(false);

        return;
      }

      const [
        {
          count: followersCount,
          error:
            followersCountError,
        },
        {
          count: followingCount,
          error:
            followingCountError,
        },
      ] = await Promise.all([
        supabase
          .from("follows")
          .select("*", {
            count: "exact",
            head: true,
          })
          .eq(
            "following_id",
            id
          ),

        supabase
          .from("follows")
          .select("*", {
            count: "exact",
            head: true,
          })
          .eq(
            "follower_id",
            id
          ),
      ]);

      if (
        followersCountError
      ) {
        throw followersCountError;
      }

      if (
        followingCountError
      ) {
        throw followingCountError;
      }

      setProfile({
        ...profileData,

        followers_count:
          followersCount ?? 0,

        following_count:
          followingCount ?? 0,

        allow_messages: true,

        is_private:
          profileData.is_private ??
          false,
      });
    } catch (error) {
      console.error(
        "Error fetching profile:",
        error
      );

      toast.error(
        "Failed to load profile"
      );

      setProfile(null);
    } finally {
      setLoading(false);
    }
  };

  // Can this viewer see private content?
  const canViewPrivateContent =
    isOwnProfile ||
    !profile?.is_private ||
    isFollowing;

  useEffect(() => {
    if (
      !id ||
      !profile ||
      id.startsWith("demo-")
    ) {
      setProfilePosts([]);
      return;
    }

    // Do not load posts from a private
    // profile unless viewer follows it
    if (
      profile.is_private &&
      !isOwnProfile &&
      !isFollowing
    ) {
      setProfilePosts([]);
      setPostsLoading(false);
      return;
    }

    let cancelled = false;

    const fetchProfilePosts =
      async () => {
        setPostsLoading(true);

        try {
          const {
            data: rows,
            error,
          } =
            await supabase
              .from("posts")
              .select(
                "id, text, created_at, media_urls, like_count, comment_count, repost_of, repost_count, author_id"
              )
              .eq(
                "author_id",
                id
              )
              .is(
                "deleted_at",
                null
              )
              .order(
                "created_at",
                {
                  ascending:
                    false,
                }
              );

          if (cancelled) {
            return;
          }

          if (error) {
            throw error;
          }

          const author = {
            display_name:
              profile.display_name ||
              "User",

            avatar_url:
              profile.avatar_url ??
              null,

            verified:
              profile.verified ??
              false,
          };

          const posts:
            ProfilePost[] = (
            rows || []
          ).map(
            (row: any) => ({
              id: row.id,

              author_id:
                row.author_id,

              text: row.text,

              created_at:
                row.created_at,

              media_urls:
                row.media_urls,

              like_count:
                row.like_count ??
                0,

              comment_count:
  row.comment_count ??
  0,

repost_of:
  row.repost_of ??
  null,

repost_count:
  row.repost_count ??
  0,

author,
            })
          );

          setProfilePosts(
            posts
          );
        } catch (err) {
          if (!cancelled) {
            console.error(
              "Error fetching profile posts:",
              err
            );

            setProfilePosts(
              []
            );
          }
        } finally {
          if (!cancelled) {
            setPostsLoading(
              false
            );
          }
        }
      };

    fetchProfilePosts();

    return () => {
      cancelled = true;
    };
  }, [
    id,
    profile,
    isFollowing,
    isOwnProfile,
  ]);

  const handleFollow =
    async () => {
      if (
        !currentUser ||
        isFollowLoading
      ) {
        return;
      }

      if (isOwnProfile) {
        toast.error(
          "You can't follow yourself"
        );

        return;
      }

      // Demo profiles
      if (
        id?.startsWith(
          "demo-"
        )
      ) {
        setIsFollowing(
          !isFollowing
        );

        toast.success(
          isFollowing
            ? "Unfollowed demo user"
            : "Following demo user"
        );

        return;
      }

      if (!id) return;

      setIsFollowLoading(
        true
      );

      try {
        // Already following:
        // clicking again unfollows
        if (isFollowing) {
          const { error } =
            await supabase
              .from(
                "follows"
              )
              .delete()
              .eq(
                "follower_id",
                currentUser.id
              )
              .eq(
                "following_id",
                id
              );

          if (error) {
            throw error;
          }

          setIsFollowing(
            false
          );

          setProfile(
            (prev: any) =>
              prev
                ? {
                    ...prev,

                    followers_count:
                      Math.max(
                        0,
                        (
                          prev.followers_count ||
                          0
                        ) - 1
                      ),
                  }
                : prev
          );

          toast.success(
            "Unfollowed successfully"
          );

          return;
        }

        // Request already pending:
        // clicking Requested cancels it
        if (isRequested) {
          const { error } =
            await (
              supabase as any
            )
              .from(
                "follow_requests"
              )
              .delete()
              .eq(
                "requester_id",
                currentUser.id
              )
              .eq(
                "requested_id",
                id
              );

          if (error) {
            throw error;
          }

          setIsRequested(
            false
          );

          toast.success(
            "Follow request canceled"
          );

          return;
        }

        // PRIVATE PROFILE:
        // create pending request
        if (
          profile?.is_private
        ) {
          const { error } =
            await (
              supabase as any
            )
              .from(
                "follow_requests"
              )
              .insert({
                requester_id:
                  currentUser.id,

                requested_id:
                  id,
              });

          // Duplicate request = already requested
          if (
            error &&
            error.code !==
              "23505"
          ) {
            throw error;
          }

        const { error: notificationError } =
  await (supabase as any)
    .from("notifications")
    .insert({
      user_id: id,
      actor_id: currentUser.id,
      type: "follow_request",
      message: "requested to follow you",
      is_read: false,
      related_id: null,
      link: `/profile/${currentUser.id}`,
    });

if (notificationError) {
  console.error(
    "Error creating follow request notification:",
    notificationError
  );
}

          setIsRequested(
            true
          );

          toast.success(
            "Follow request sent"
          );

          return;
        }

        // PUBLIC PROFILE:
        // follow immediately
        const { error } =
          await supabase
            .from("follows")
            .insert({
              follower_id:
                currentUser.id,

              following_id:
                id,
            });

        if (
          error &&
          error.code !==
            "23505"
        ) {
          throw error;
        }

        setIsFollowing(true);

        setProfile(
          (prev: any) =>
            prev
              ? {
                  ...prev,

                  followers_count:
                    (
                      prev.followers_count ||
                      0
                    ) + 1,
                }
              : prev
        );

        toast.success(
          "Following successfully"
        );
      } catch (
        error: any
      ) {
        console.error(
          "Error updating follow status:",
          error
        );

        toast.error(
          error?.message ||
            "Failed to update follow status"
        );
      } finally {
        setTimeout(
          () =>
            setIsFollowLoading(
              false
            ),
          300
        );
      }
    };

  const handleMessage =
    async () => {
      if (!currentUser) {
        toast.error(
          "Please log in to send messages"
        );

        return;
      }

      if (isOwnProfile) {
        toast.error(
          "You can't message yourself"
        );

        return;
      }

      try {
        const {
          data:
            existingConv,
        } =
          await supabase
            .from(
              "conversations"
            )
            .select("id")
            .or(
              `and(participant_1.eq.${currentUser.id},participant_2.eq.${id}),and(participant_1.eq.${id},participant_2.eq.${currentUser.id})`
            )
            .maybeSingle();

        if (!existingConv) {
          const { error } =
            await supabase
              .from(
                "conversations"
              )
              .insert({
                participant_1:
                  currentUser.id,

                participant_2:
                  id,
              });

          if (error) {
            throw error;
          }
        }

        navigate(
          `/chat/${id}`
        );
      } catch (error) {
        console.error(
          "Error creating conversation:",
          error
        );

        navigate(
          `/chat/${id}`
        );
      }
    };

  if (loading) {
    return (
      <LoadingSpinner />
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-background">
        <div className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
          <div className="flex items-center justify-between px-4 py-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() =>
                navigate(
                  "/search"
                )
              }
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>

            <h1 className="text-lg font-semibold">
              Profile
            </h1>

            <div className="w-9" />
          </div>
        </div>

        <EmptyState
          icon={AlertCircle}
          title="Profile Not Found"
          description="This profile doesn't exist or is no longer available."
          action={{
            label:
              "Find Other Spotters",

            onClick: () =>
              navigate(
                "/search"
              ),
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
          <Button
            variant="ghost"
            size="icon"
            onClick={() =>
              navigate(-1)
            }
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>

          <h1 className="text-lg font-semibold">
            Profile
          </h1>

          <div className="w-9" />
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 py-6 space-y-6">
        {/* Profile Header */}
        <Card className="p-6 border-white/20">
          <div className="flex items-start gap-4">
            <UserAvatar
              src={
                profile.avatar_url
              }
              fallback={
                profile.display_name ||
                profile.first_name
              }
              size="xl"
              className="ring-0"
            />

            <div className="flex-1 min-w-0">
              <div className="mb-2 w-full">
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold w-full break-words">
                    {
                      profile.display_name
                    }
                  </h2>

                  {profile.is_private && (
                    <Lock className="w-4 h-4 text-white/60 flex-shrink-0" />
                  )}

                  {profile.verified && (
                    <Shield className="w-4 h-4 text-blue-500 flex-shrink-0" />
                  )}
                </div>

                <div
                  className="mt-2 mb-3 h-3 w-24 rounded-full"
                  style={{
                    backgroundColor:
                      vibeColor,
                  }}
                />
              </div>

              <div className="flex items-center gap-4 text-sm text-white mb-3">
                <button
                  type="button"
                  onClick={() =>
                    navigate(
                      `/followers?tab=followers&userId=${profile.id}`
                    )
                  }
                  className="hover:text-white transition-colors"
                >
                  {profile.followers_count ||
                    0}{" "}
                  followers
                </button>

                <button
                  type="button"
                  onClick={() =>
                    navigate(
                      `/followers?tab=following&userId=${profile.id}`
                    )
                  }
                  className="hover:text-white transition-colors"
                >
                  {profile.following_count ||
                    0}{" "}
                  following
                </button>
              </div>

              {profile.bio && (
                <p className="text-sm text-foreground mb-3">
                  {
                    profile.bio
                  }
                </p>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          {!isOwnProfile && (
            <div className="flex gap-2 mt-4">
              <Button
                onClick={
                  handleFollow
                }
                variant={
                  isFollowing ||
                  isRequested
                    ? "outline"
                    : "default"
                }
                className="flex-1"
                disabled={
                  !currentUser ||
                  isFollowLoading
                }
              >
                <UserPlus className="w-4 h-4 mr-2" />

                {isFollowing
                  ? "Following"
                  : isRequested
                    ? "Requested"
                    : "Follow"}
              </Button>

              {profile.allow_messages ===
              false ? (
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
                  onClick={
                    handleMessage
                  }
                  variant="outline"
                  className="flex-1"
                  disabled={
                    !currentUser
                  }
                >
                  <MessageCircle className="w-4 h-4 mr-2" />
                  Message
                </Button>
              )}
            </div>
          )}

          {/* Own profile edit button */}
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

        {/* PRIVATE PROFILE LOCK */}
        {!canViewPrivateContent ? (
          <Card className="p-10 text-center border-white/10">
            <Lock className="w-8 h-8 mx-auto mb-4 text-white/60" />

            <h3 className="font-semibold mb-2">
              This account is private
            </h3>

            <p className="text-sm text-white/60">
              Follow this account to see their posts, photos, videos and spots.
            </p>
          </Card>
        ) : (
          <Tabs
            defaultValue="posts"
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-4 gap-2 bg-transparent p-0">
              <TabsTrigger
                className="!bg-transparent"
                value="posts"
              >
                Posts
              </TabsTrigger>

              <TabsTrigger
                className="!bg-transparent"
                value="pics"
              >
                Photos
              </TabsTrigger>

              <TabsTrigger
                className="!bg-transparent"
                value="videos"
              >
                Videos
              </TabsTrigger>

              <TabsTrigger
                className="!bg-transparent"
                value="spotlight"
              >
                Respawns
              </TabsTrigger>
            </TabsList>

            <TabsContent
              value="posts"
              className="mt-4"
            >
              {postsLoading ? (
                <div className="flex justify-center items-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                </div>
              ) : profilePosts.length ===
                0 ? (
                <p className="text-sm text-white py-6 text-center">
                  No posts yet
                </p>
              ) : (
                <div className="space-y-4 pb-4">
                  {profilePosts.map(
                    (post) => (
                      <SocialPost
                        key={
                          post.id
                        }
                        post={
                          post
                        }
                        currentUserId={
                          currentUser?.id
                        }
                        onLikeChange={(
                          delta
                        ) =>
                          updatePostLikeCount(
                            post.id,
                            delta
                          )
                        }
                        onCommentChange={(
                          delta
                        ) =>
                          updatePostCommentCount(
                            post.id,
                            delta
                          )
                        }
                      />
                    )
                  )}
                </div>
              )}
            </TabsContent>

            <TabsContent
              value="pics"
              className="mt-4"
            >
              <div className="grid grid-cols-3 gap-1">
                {profilePosts.flatMap(
                  (post) =>
                    (
                      post.media_urls ||
                      []
                    )
                      .filter(
                        (url) =>
                          !url
                            .toLowerCase()
                            .includes(
                              ".mp4"
                            ) &&
                          !url
                            .toLowerCase()
                            .includes(
                              ".mov"
                            ) &&
                          !url
                            .toLowerCase()
                            .includes(
                              ".webm"
                            )
                      )
                      .map(
                        (
                          url,
                          index
                        ) => (
                          <div
                            key={`${post.id}-photo-${index}`}
                            className="aspect-square bg-muted rounded-lg overflow-hidden"
                          >
                            <img
                              src={
                                url
                              }
                              alt="Post photo"
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )
                      )
                )}
              </div>

              {profilePosts.flatMap(
                (post) =>
                  (
                    post.media_urls ||
                    []
                  ).filter(
                    (url) =>
                      !url
                        .toLowerCase()
                        .includes(
                          ".mp4"
                        ) &&
                      !url
                        .toLowerCase()
                        .includes(
                          ".mov"
                        ) &&
                      !url
                        .toLowerCase()
                        .includes(
                          ".webm"
                        )
                  )
              ).length === 0 && (
                <p className="text-sm text-white py-6 text-center">
                  No photos yet
                </p>
              )}
            </TabsContent>

            <TabsContent
              value="videos"
              className="mt-4"
            >
              <div className="grid grid-cols-3 gap-1">
                {profilePosts.flatMap(
                  (post) =>
                    (
                      post.media_urls ||
                      []
                    )
                      .filter(
                        (url) =>
                          url
                            .toLowerCase()
                            .includes(
                              ".mp4"
                            ) ||
                          url
                            .toLowerCase()
                            .includes(
                              ".mov"
                            ) ||
                          url
                            .toLowerCase()
                            .includes(
                              ".webm"
                            )
                      )
                      .map(
                        (
                          url,
                          index
                        ) => (
                          <div
                            key={`${post.id}-video-${index}`}
                            className="aspect-square bg-muted rounded-lg overflow-hidden"
                          >
                            <video
                              src={
                                url
                              }
                              className="w-full h-full object-cover"
                              controls
                            />
                          </div>
                        )
                      )
                )}
              </div>

              {profilePosts.flatMap(
                (post) =>
                  (
                    post.media_urls ||
                    []
                  ).filter(
                    (url) =>
                      url
                        .toLowerCase()
                        .includes(
                          ".mp4"
                        ) ||
                      url
                        .toLowerCase()
                        .includes(
                          ".mov"
                        ) ||
                      url
                        .toLowerCase()
                        .includes(
                          ".webm"
                        )
                  )
              ).length === 0 && (
                <p className="text-sm text-white py-6 text-center">
                  No videos yet
                </p>
              )}
            </TabsContent>

            <TabsContent
              value="spotlight"
              className="mt-4"
            >
              {postsLoading ? (
                <div className="flex justify-center items-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                </div>
              ) : profilePosts.filter(
                  (post) => post.repost_of
                ).length === 0 ? (
                <p className="text-sm text-white py-6 text-center">
                  No Respawns yet
                </p>
              ) : (
                <div className="space-y-4 pb-4">
                  {profilePosts
                    .filter(
                      (post) => post.repost_of
                    )
                    .map((post) => (
                      <SocialPost
                        key={post.id}
                        post={post}
                        currentUserId={
                          currentUser?.id
                        }
                        onLikeChange={(delta) =>
                          updatePostLikeCount(
                            post.id,
                            delta
                          )
                        }
                        onCommentChange={(delta) =>
                          updatePostCommentCount(
                            post.id,
                            delta
                          )
                        }
                      />
                    ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  );
};

export default ViewProfile;