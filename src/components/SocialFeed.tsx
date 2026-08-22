import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import SocialPost from "./SocialPost";
import {
  Loader2,
  Home,
  Flame,
  Search,
  MessageSquare,
  User,
  Settings,
  Image,
Video,
  
} from "lucide-react";

import CommentList from "./CommentList";
import CommentComposer from "./CommentComposer";
import { Link } from "react-router-dom";

interface Post {
  id: string;
  author_id: string;
  created_at: string;
  text: string | null;
  media_urls: string[] | null;
  repost_of?: string | null;
  like_count: number;
  comment_count: number;
  author: {
    display_name: string;
    avatar_url: string | null;
    vibe: string | null;
    verified: boolean;
  };
}

interface NewPostData {
  id: string;
  author_id: string;
  created_at: string;
  text: string | null;
  media_urls: string[] | null;
  like_count: number;
  comment_count: number;
  deleted_at?: string | null;
}

interface SocialFeedProps {
  currentUserId?: string;
  newPost?: NewPostData | null;
  onOpenCreatePost?: (action?: "photo" | "video" | null) => void;
  authorProfile?: {
    display_name: string;
    avatar_url: string | null;
    vibe: string | null;
    verified: boolean;
  } | null;
}

const SocialFeed = ({
  currentUserId,
  newPost,
  authorProfile,
  onOpenCreatePost,
}: SocialFeedProps) => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [selectedCommentPost, setSelectedCommentPost] = useState<any | null>(
    null
  );
  const [loading, setLoading] = useState(true);

  const loadMoreRef = useRef<HTMLDivElement | null>(null);
  const storiesRowRef = useRef<HTMLDivElement | null>(null);
  const initialLoadRef = useRef(true);
  const processedNewPostIds = useRef<Set<string>>(new Set());

  const PAGE_SIZE = 10;

  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  useEffect(() => {
    if (window.innerWidth < 1024) return;

    if (selectedCommentPost) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [selectedCommentPost]);

  // Update a single post's like count without refetching all posts
  const updatePostLikeCount = useCallback(
    (postId: string, delta: number) => {
      setPosts((prev) =>
        prev.map((post) =>
          post.id === postId
            ? {
                ...post,
                like_count: Math.max(0, post.like_count + delta),
              }
            : post
        )
      );
    },
    []
  );

  // Update a single post's comment count without refetching all posts
  const updatePostCommentCount = useCallback(
    (postId: string, delta: number) => {
      setPosts((prev) =>
        prev.map((post) =>
          post.id === postId
            ? {
                ...post,
                comment_count: Math.max(0, post.comment_count + delta),
              }
            : post
        )
      );
    },
    []
  );

  const fetchPosts = useCallback(
    async (
      showLoading = false,
      offset = 0,
      append = false
    ) => {
      try {
        if (showLoading) setLoading(true);

        const { data, error } = await supabase.rpc("get_post_feed", {
          p_offset: offset,
          p_limit: PAGE_SIZE,
        });

        if (error) throw error;

        const sb: any = supabase;

        const { data: repostRows, error: repostError } = await sb
          .from("post_reposts")
          .select("post_id");

        if (repostError) throw repostError;

        const repostMap: Record<string, number> = {};

        repostRows?.forEach((row: any) => {
          repostMap[row.post_id] =
            (repostMap[row.post_id] || 0) + 1;
        });

        const transformedPosts: Post[] = (data || []).map(
          (item: any) => ({
            id: item.id,
            author_id: item.author_id,
            created_at: item.created_at,
            text: item.text,
            media_urls: item.media_urls,
            like_count: item.like_count ?? 0,
            comment_count: item.comment_count ?? 0,
            repost_count: repostMap[item.post_id] || 0,
            repost_of: item.repost_of,
            author: {
              display_name: item.author_display_name,
              avatar_url: item.author_avatar_url,
              vibe: item.author_vibe,
              verified: item.author_verified,
            },
          })
        );

        // Sort DESC (newest first)
        const sortedPosts = transformedPosts.sort(
          (a, b) =>
            new Date(b.created_at).getTime() -
            new Date(a.created_at).getTime()
        );

        if (sortedPosts.length < PAGE_SIZE) {
          setHasMore(false);
        }

        if (append) {
          setPosts((prev) => [...prev, ...sortedPosts]);
        } else {
          setPosts(sortedPosts);
        }
      } catch (error) {
        console.error("Error fetching posts:", error);
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    []
  );

  useEffect(() => {
    const currentRef = loadMoreRef.current;

    if (!currentRef || loading || loadingMore || !hasMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          const nextOffset = offset + PAGE_SIZE;

          setOffset(nextOffset);
          setLoadingMore(true);

          console.log("Loading more posts:", nextOffset);

          fetchPosts(false, nextOffset, true);
        }
      },
      {
        rootMargin: "300px",
      }
    );

    observer.observe(currentRef);

    return () => {
      observer.unobserve(currentRef);
    };
  }, [
    offset,
    loading,
    loadingMore,
    hasMore,
    fetchPosts,
  ]);

  // Handle new post prop - optimistic prepend + background refetch
  useEffect(() => {
    if (!newPost || !authorProfile) return;

    // Prevent processing the same post twice
    if (processedNewPostIds.current.has(newPost.id)) return;

    processedNewPostIds.current.add(newPost.id);

    const fullPost: Post = {
      id: newPost.id,
      author_id: newPost.author_id,
      created_at: newPost.created_at,
      text: newPost.text,
      media_urls: newPost.media_urls,
      like_count: newPost.like_count ?? 0,
      comment_count: newPost.comment_count ?? 0,
      repost_of: (newPost as any).repost_of ?? null,
      author: {
        display_name: authorProfile.display_name,
        avatar_url: authorProfile.avatar_url,
        vibe: authorProfile.vibe,
        verified: authorProfile.verified,
      },
    };

    setPosts((prev) => {
      if (prev.some((p) => p.id === fullPost.id)) {
        return prev;
      }

      return [fullPost, ...prev];
    });

    const timer = setTimeout(() => {
      fetchPosts(false);
    }, 500);

    return () => clearTimeout(timer);
  }, [newPost, authorProfile, fetchPosts]);

  useEffect(() => {
    // Initial fetch with loading indicator
    if (initialLoadRef.current) {
      initialLoadRef.current = false;
      fetchPosts(true);
    }

    // Subscribe only to NEW posts
    const postsChannel = supabase
      .channel("posts-feed-new")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "posts",
        },
        () => {
          fetchPosts(false);
        }
      )
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "posts",
        },
        (payload) => {
          if (payload.old && "id" in payload.old) {
            setPosts((prev) =>
              prev.filter(
                (p) => p.id !== payload.old.id
              )
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(postsChannel);
    };
  }, [fetchPosts]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div className="px-4 py-12 text-center">
        <p className="text-white">
          No posts yet. Be the first to share something!
        </p>
      </div>
    );
  }

  const sortedPosts = [...posts].sort(
    (a, b) =>
      new Date(b.created_at).getTime() -
      new Date(a.created_at).getTime()
  );

  return (
    <div className="w-full flex justify-center pb-4 lg:grid lg:grid-cols-[260px_minmax(0,680px)_360px] lg:gap-8 lg:items-start lg:justify-center lg:px-6">
      {/* Desktop Left Nav */}
      <aside className="hidden lg:flex lg:col-start-1 sticky top-24 h-fit flex-col">
        <div className="space-y-2">
          <Link
            to="/"
            className="flex items-center gap-3 rounded-2xl bg-white/5 px-4 py-3 font-semibold text-green-400"
          >
            <Home className="h-5 w-5" />
            <span>Home</span>
          </Link>

          <Link
            to="/gyms"
            className="flex items-center gap-3 rounded-2xl px-4 py-3 text-white transition hover:bg-white/5"
          >
            <Search className="h-5 w-5" />
            <span>Explore</span>
          </Link>

          <Link
            to="/messages"
            className="flex items-center gap-3 rounded-2xl px-4 py-3 text-white transition hover:bg-white/5"
          >
            <MessageSquare className="h-5 w-5" />
            <span>Messages</span>
          </Link>

          <Link
            to="/profile"
            className="flex items-center gap-3 px-4 py-3 rounded-2xl text-white transition hover:bg-white/5"
          >
            <User className="h-5 w-5" />
            <span>Profile</span>
          </Link>

          <Link
            to="/pulse"
            className="flex items-center gap-3 rounded-2xl px-4 py-3 text-white transition hover:bg-white/5"
          >
            <Flame className="h-5 w-5" />
            <span>Pulse</span>
          </Link>

          <Link
            to="/settings"
            className="flex items-center gap-3 rounded-2xl px-4 py-3 text-white transition hover:bg-white/5"
          >
            <Settings className="h-5 w-5" />
            <span>Settings</span>
          </Link>
        </div>

        <Link
          to="/profile"
          className="mt-5 flex items-center gap-3 rounded-2xl px-4 py-3 text-white/80 transition hover:bg-white/5"
        >
          {authorProfile?.avatar_url ? (
            <img
              src={authorProfile.avatar_url}
              alt={authorProfile.display_name}
              className="h-10 w-10 rounded-full object-cover"
            />
          ) : (
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-500 text-black font-bold">
              {authorProfile?.display_name?.charAt(0) ||
                "U"}
            </div>
          )}

          <div className="min-w-0">
            <div className="truncate text-sm font-semibold text-white">
              {authorProfile?.display_name || "User"}
            </div>

            <div className="truncate text-xs text-white/45">
              @
              {authorProfile?.display_name
                ?.toLowerCase()
                .replace(/\s+/g, "_") || "profile"}
            </div>
          </div>
        </Link>
      </aside>

      <div className="w-full max-w-[680px] px-0 sm:px-4 lg:col-start-2 lg:px-0 lg:translate-x-10">
        <>
          <div className="mb-4">
            <div className="px-1 pt-1 pb-2">
              
<div className="mb-5 flex items-center gap-3 rounded-2xl border border-white bg-white/[0.03] px-4 py-1.5">
  {authorProfile?.avatar_url ? (
    <img
      src={authorProfile.avatar_url}
      alt={authorProfile.display_name || "Profile"}
      className="h-9 w-9 shrink-0 rounded-full object-cover"
    />
  ) : (
    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-green-500 font-bold text-black">
      {authorProfile?.display_name?.charAt(0) || "U"}
    </div>
  )}

  <button
  type="button"
  onClick={() => onOpenCreatePost?.(null)}
  className="flex-1 px-2 py-3 text-left text-sm font-medium text-white hover:text-white"
>
  Share something...
</button>
<div className="ml-auto -translate-x-1 flex items-center gap-2 md:gap-3 md:translate-x-0">
  <button
    type="button"
    onClick={() => onOpenCreatePost?.("photo")}
    aria-label="Add photo"
    className="p-0 min-w-0 w-auto md:p-1 text-white/55 transition hover:text-white"
  >
    <Image className="h-5 w-5 -translate-x-3 md:translate-x-0 text-white" />
  </button>

  <button
    type="button"
    onClick={() => onOpenCreatePost?.("video")}
    aria-label="Add video"
    className="p-0 min-w-0 w-auto md:p-1 text-white/55 transition hover:text-white"
  >
    <Video className="h-6 w-6 text-white" />
  </button>
</div>
</div>
              <div className="relative">
                <div
                  ref={storiesRowRef}
                  className="flex gap-3 overflow-x-auto pb-1 pr-12 scrollbar-hide"
                >
                  <button
                    type="button"
                    className="flex h-[250px] w-[165px] shrink-0 flex-col items-center justify-center rounded-2xl border border-white/10 bg-black/30"
                  >
                    <div className="flex h-20 w-20 items-center justify-center rounded-full border-2 border-dashed border-white/20 text-4xl text-lime-400">
                      +
                    </div>

                    <p className="mt-8 text-sm font-semibold text-white">
                      Create story
                    </p>

                    <p className="mt-1 text-xs text-white/40">
                      Share a moment
                    </p>
                  </button>

                  {[
                    {
                      name: "Lena",
                      time: "Just now",
                      image:
                        "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=500&h=700&fit=crop",
                    },
                    {
                      name: "Marcus",
                      time: "15m ago",
                      image:
                        "https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=500&h=700&fit=crop",
                    },
                    {
                      name: "Run Club",
                      time: "42m ago",
                      image:
                        "https://images.unsplash.com/photo-1552674605-db6ffd4facb5?w=500&h=700&fit=crop",
                    },
                    {
                      name: "Jamal",
                      time: "1h ago",
                      image:
                        "https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?w=500&h=700&fit=crop",
                    },
                  ].map((story) => (
                    <button
                      key={story.name}
                      type="button"
                      className="relative h-[250px] w-[165px] shrink-0 overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-b from-white/10 to-black"
                    >
                      <img
                        src={story.image}
                        alt={story.name}
                        className="h-full w-full object-cover"
                        onError={(e) => {
                          (
                            e.target as HTMLImageElement
                          ).src =
                            "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=500&h=700&fit=crop";
                        }}
                      />

                      <div className="absolute left-3 top-3 flex h-10 w-10 items-center justify-center rounded-full border-2 border-lime-400 bg-black text-sm font-bold text-white">
                        {story.name.charAt(0)}
                      </div>

                      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black via-black/75 to-transparent px-3 pb-3 pt-16 text-left">
                        <p className="truncate text-sm font-semibold text-white">
                          {story.name}
                        </p>

                        <p className="mt-1 text-xs text-white/45">
                          {story.time}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => {
                    storiesRowRef.current?.scrollBy({
                      left: 320,
                      behavior: "smooth",
                    });
                  }}
                  aria-label="Scroll stories right"
                  className="absolute right-2 top-1/2 z-10 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-white/10 bg-black/80 text-2xl text-white shadow-lg backdrop-blur transition hover:scale-105 hover:bg-black"
                >
                  ›
                </button>
              </div>
            </div>
          </div>
        </>

        {sortedPosts.map((post) => (
          <div
            id={`post-${post.id}`}
            key={post.id}
            className="mb-0 sm:mb-4"
          >
            <SocialPost
              post={post}
              currentUserId={currentUserId}
              onLikeChange={(delta) =>
                updatePostLikeCount(post.id, delta)
              }
              onCommentChange={(delta) =>
                updatePostCommentCount(post.id, delta)
              }
              onOpenComments={(post) => {
                document
                  .getElementById(`post-${post.id}`)
                  ?.scrollIntoView({
                    behavior: "smooth",
                    block: "center",
                  });

                setSelectedCommentPost(post);
              }}
            />
          </div>
        ))}

        <div ref={loadMoreRef} className="h-24" />
      </div>

      {/* Desktop Right Comments Panel */}
      {selectedCommentPost && (
        <aside className="hidden lg:flex fixed right-10 top-24 bottom-10 w-[360px] z-40 flex-col rounded-[28px] border border-white/25 bg-[#05070b]/80 animate-in fade-in slide-in-from-right-4 duration-200 ease-out">
          <div className="flex items-start justify-between border-b border-white/10 px-6 py-5">
            <div>
              <h2 className="text-xl font-bold text-white">
                Comments
              </h2>

              <div className="mt-3 flex items-center gap-3">
                {selectedCommentPost.author?.avatar_url ? (
                  <img
                    src={
                      selectedCommentPost.author
                        .avatar_url
                    }
                    alt={
                      selectedCommentPost.author
                        .display_name
                    }
                    className="h-9 w-9 rounded-full object-cover"
                  />
                ) : (
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-green-500 text-sm font-bold text-black">
                    {selectedCommentPost.author?.display_name?.charAt(
                      0
                    ) || "U"}
                  </div>
                )}

                <div className="min-w-0">
                  <p className="text-xs font-medium uppercase tracking-wide text-white/40">
                    Commenting on
                  </p>

                  <p className="truncate text-sm font-semibold text-white">
                    {selectedCommentPost.author
                      ?.display_name
                      ? `${selectedCommentPost.author.display_name}'s post`
                      : "this post"}
                  </p>
                </div>
              </div>
            </div>

            <button
              className="text-white/50 hover:text-white text-2xl leading-none"
              onClick={() =>
                setSelectedCommentPost(null)
              }
            >
              ×
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-6 py-5">
            <CommentList
              postId={selectedCommentPost.id}
              currentUserId={currentUserId}
              onCommentDeleted={() =>
                updatePostCommentCount(
                  selectedCommentPost.id,
                  -1
                )
              }
            />
          </div>

          <div className="border-t border-white/10 p-5">
            <CommentComposer
              postId={selectedCommentPost.id}
              currentUserId={currentUserId}
              compact
              onCommentAdded={() =>
                updatePostCommentCount(
                  selectedCommentPost.id,
                  1
                )
              }
            />
          </div>
        </aside>
      )}
    </div>
  );
};

export default SocialFeed;