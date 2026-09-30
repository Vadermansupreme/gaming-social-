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
SlidersHorizontal
  
} from "lucide-react";

import CommentList from "./CommentList";
import CommentComposer from "./CommentComposer";
import { Link } from "react-router-dom";
interface Story {
  id: string;
  author_id: string;
  media_url: string;
  media_type: "image" | "video";
  created_at: string;
  expires_at: string;
  author: {
    display_name: string;
    avatar_url: string | null;
  };
}
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
  const [stories, setStories] = useState<Story[]>([]);
  const [selectedStory, setSelectedStory] = useState<Story | null>(null);
  const [selectedCommentPost, setSelectedCommentPost] = useState<any | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [feedTab, setFeedTab] = useState<"for-you" | "following">("for-you");
  const [followingIds, setFollowingIds] = useState<string[]>([]);

  const loadMoreRef = useRef<HTMLDivElement | null>(null);
  const storiesRowRef = useRef<HTMLDivElement | null>(null);
  const storyFileInputRef = useRef<HTMLInputElement | null>(null);
  const initialLoadRef = useRef(true);
  const processedNewPostIds = useRef<Set<string>>(new Set());
const handleStoryFileChange = async (
  event: React.ChangeEvent<HTMLInputElement>
) => {
  const file = event.target.files?.[0];
  event.target.value = "";

  if (!file) return;

  const mediaType = file.type.startsWith("video/") ? "video" : "image";
  const safeFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const filePath = `${currentUserId}/${Date.now()}-${safeFileName}`;

  const { error: uploadError } = await supabase.storage
    .from("story-media")
    .upload(filePath, file);

  if (uploadError) {
    console.error("Error uploading story:", uploadError);
    return;
  }

  const { data: publicUrlData } = supabase.storage
    .from("story-media")
    .getPublicUrl(filePath);

  const { data, error: insertError } = await (supabase as any)
    .from("stories")
    .insert({
      author_id: currentUserId,
      media_url: publicUrlData.publicUrl,
      media_type: mediaType,
    })
    .select("id, author_id, media_url, media_type, created_at, expires_at")
    .single();

  if (insertError) {
    console.error("Error creating story:", insertError);
    await supabase.storage.from("story-media").remove([filePath]);
    return;
  }

  setStories((currentStories) => [
    {
      ...data,
      author: {
        display_name: authorProfile?.display_name ?? "User",
        avatar_url: authorProfile?.avatar_url ?? null,
      },
    } as Story,
    ...currentStories,
  ]);
};
  const PAGE_SIZE = 10;
  const handleDeleteStory = async (story: Story) => {
  if (story.author_id !== currentUserId) return;

  const { error } = await (supabase as any)
    .from("stories")
    .delete()
    .eq("id", story.id);

  if (error) {
    console.error("Error deleting story:", error);
    return;
  }

  const pathMarker = "/story-media/";
  const encodedPath = story.media_url.split(pathMarker)[1];

  if (encodedPath) {
    await supabase.storage
      .from("story-media")
      .remove([decodeURIComponent(encodedPath)]);
  }

  setStories((currentStories) =>
    currentStories.filter((currentStory) => currentStory.id !== story.id)
  );
  setSelectedStory(null);
};

  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
 useEffect(() => {
  const fetchStories = async () => {
    const { data, error } = await (supabase as any)
      .from("stories")
      .select(`
        id,
        author_id,
        media_url,
        media_type,
        created_at,
        expires_at,
        author:profiles!stories_author_id_fkey (
          display_name,
          avatar_url
        )
      `)
      .gt("expires_at", new Date().toISOString())
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching stories:", error);
      return;
    }

    setStories((data ?? []) as unknown as Story[]);
  };

  fetchStories();
}, []); 
  useEffect(() => {
  const fetchFollowingIds = async () => {
    const { data, error } = await supabase
      .from("follows")
      .select("following_id")
      .eq("follower_id", currentUserId);

    if (error) {
      console.error("Error fetching follows:", error);
      return;
    }

    setFollowingIds(
  ((data ?? []) as unknown as { following_id: string }[]).map(
    (row) => row.following_id
  )
);

  };

  if (currentUserId) {
    fetchFollowingIds();
  }
}, [currentUserId]);

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
                like_count: Math.max(0, (post.like_count || 0) + delta),
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
            id: item.post_id ?? item.id,
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

  

  const sortedPosts = [...posts].sort(
    (a, b) =>
      new Date(b.created_at).getTime() -
      new Date(a.created_at).getTime()
  );

  return (
    <div className="w-full flex justify-center pt-6 pb-4 lg:grid lg:grid-cols-[260px_minmax(0,680px)_360px] lg:gap-8 lg:items-start lg:justify-center lg:px-6">
      {selectedStory && (
  <div
    className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 p-4"
    onClick={() => setSelectedStory(null)}
  >
    <button
      type="button"
      onClick={() => setSelectedStory(null)}
      aria-label="Close story"
      className="absolute right-6 top-6 text-4xl text-white"
    >
      ×
    </button>
{selectedStory.author_id === currentUserId && (
  <button
    type="button"
    onClick={() => {
      if (window.confirm("Delete this story?")) {
        handleDeleteStory(selectedStory);
      }
    }}
    className="absolute right-6 top-20 rounded-full bg-red-600 px-4 py-2 text-sm font-semibold text-white"
  >
    Delete
  </button>
)}
    <div
      className="flex max-h-[90vh] w-full max-w-lg flex-col items-center"
      onClick={(event) => event.stopPropagation()}
    >
      <div className="mb-3 flex w-full items-center gap-3 text-white">
        {selectedStory.author.avatar_url ? (
          <img
            src={selectedStory.author.avatar_url}
            alt={selectedStory.author.display_name}
            className="h-10 w-10 rounded-full object-cover"
          />
        ) : (
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-lime-400 font-bold text-black">
            {selectedStory.author.display_name.charAt(0)}
          </div>
        )}

        <span className="font-semibold">
          {selectedStory.author.display_name}
        </span>
      </div>

      {selectedStory.media_type === "video" ? (
        <video
          src={selectedStory.media_url}
          controls
          autoPlay
          className="max-h-[80vh] max-w-full rounded-2xl object-contain"
        />
      ) : (
        <img
          src={selectedStory.media_url}
          alt={`${selectedStory.author.display_name}'s story`}
          className="max-h-[80vh] max-w-full rounded-2xl object-contain"
        />
      )}
    </div>
  </div>
)}
      {/* Desktop Left Nav */}
      <aside className="hidden lg:flex lg:col-start-1 sticky top-24 min-h-[620px] w-[280px] flex-col rounded-2xl border border-white/10 bg-white/[0.02] p-4">
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
            <span>Games</span>
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
          className="mt-auto flex items-center gap-3 rounded-2xl px-4 py-3 text-white/80 transition hover:bg-white/5"
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
              

{/* For You / Following */}
<div className="mb-3 flex items-center justify-between border-b border-white/10 px-2">
  <div className="flex items-center gap-8">
    <button
  type="button"
  onClick={() => setFeedTab("for-you")}
  className={`pb-3 text-sm font-semibold transition ${
    feedTab === "for-you"
      ? "border-b-2 border-white text-white"
      : "text-white/50 hover:text-white"
  }`}
>
  For You
</button>

    <button
  type="button"
  onClick={() => setFeedTab("following")}
  className={`pb-3 text-sm font-semibold transition ${
    feedTab === "following"
      ? "border-b-2 border-white text-white"
      : "text-white/50 hover:text-white"
  }`}
>
  Following
</button>
  </div>

  <button
    type="button"
    className="pb-3 text-white/60 transition hover:text-white"
    aria-label="Feed options"
  >
    <SlidersHorizontal className="h-5 w-5" />
  </button>
</div>

{/* Composer */}
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
                  className="flex gap-2 overflow-x-auto pb-1 pr-12 scrollbar-hide"
                >
                  <input
  ref={storyFileInputRef}
  type="file"
  accept="image/*,video/*"
  className="hidden"
  onChange={handleStoryFileChange}
/>
                  <button
                    type="button"
                    onClick={() => storyFileInputRef.current?.click()}
                    className="flex h-[185px] w-[110px] shrink-0 flex-col items-center justify-center rounded-2xl border border-white/10 bg-black/30"
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

                  {stories.map((story) => (
                    <button
                      key={story.id}
                      type="button"
                      onClick={() => setSelectedStory(story)}
                      
                      className="relative flex h-[170px] w-[130px] shrink-0 flex-col items-center justify-center rounded-2xl border border-white/10 bg-white/[0.03] px-3"
                    >
                      <img
                        src={story.media_url}
                        alt={story.author.display_name}
                        className="h-24 w-24 rounded-full object-cover border-2 border-lime-400"
                        onError={(e) => {
                          (
                            e.target as HTMLImageElement
                          ).src =
                            "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=500&h=700&fit=crop";
                        }}
                      />

                      

                      <div className="absolute inset-x-0 bottom-0 rounded-b-2xl bg-gradient-to-t from-black via-black/75 to-transparent px-3 pb-3 pt-16 text-left">
                        <p className="mt-3 w-full truncate text-center text-sm font-semibold text-white">
  {story.author.display_name}
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

        {sortedPosts
  .filter((post) =>
    feedTab === "for-you"
      ? true
      : followingIds.includes(post.author_id)
  )
  .map((post) => (
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
     {/* Desktop Right Sidebar */}
      <aside className="hidden xl:block xl:col-start-3 w-[320px] xl:translate-x-9">
        <div className="sticky top-24 space-y-5">
          {/* Trending Games */}
          <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-base font-semibold text-white">
                Trending Games
              </h3>

              <button
                type="button"
                className="text-sm font-medium text-lime-400 transition hover:text-lime-300"
              >
                View all
              </button>
            </div>

            <div className="space-y-1">
              {[
                {
                  name: "Call of Duty: MWIII",
                  posts: "128K posts",
                  direction: "up",
                  image:
                    "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=160&h=160&fit=crop",
                },
                {
                  name: "Fortnite",
                  posts: "96K posts",
                  direction: "up",
                  image:
                    "https://images.unsplash.com/photo-1511512578047-dfb367046420?w=160&h=160&fit=crop",
                },
                {
                  name: "Apex Legends",
                  posts: "74K posts",
                  direction: "up",
                  image:
                    "https://images.unsplash.com/photo-1598550476439-6847785fcea6?w=160&h=160&fit=crop",
                },
                {
                  name: "Minecraft",
                  posts: "58K posts",
                  direction: "up",
                  image:
                    "https://images.unsplash.com/photo-1493711662062-fa541adb3fc8?w=160&h=160&fit=crop",
                },
                {
                  name: "EA Sports FC 24",
                  posts: "42K posts",
                  direction: "down",
                  image:
                    "https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=160&h=160&fit=crop",
                },
              ].map((game) => (
                <button
                  key={game.name}
                  type="button"
                  className="flex w-full items-center gap-3 rounded-xl py-1.5 text-left transition hover:bg-white/[0.04]"
                >
                  <img
                    src={game.image}
                    alt={game.name}
                    className="h-10 w-10 shrink-0 rounded-lg object-cover"
                  />

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-white">
                      {game.name}
                    </p>
                    <p className="text-xs text-white/40">
                      {game.posts}
                    </p>
                  </div>

                  <span
                    className={`text-sm font-semibold ${
                      game.direction === "down"
                        ? "text-red-500"
                        : "text-lime-400"
                    }`}
                  >
                    {game.direction === "down" ? "↓" : "↗"}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Live Now */}
          <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-base font-semibold text-white">
                Live Now
              </h3>

              <button
                type="button"
                className="text-sm font-medium text-lime-400 transition hover:text-lime-300"
              >
                View all
              </button>
            </div>

            <div className="space-y-2">
              {[
                {
                  name: "TimTheTatman",
                  game: "Call of Duty: MWIII",
                  viewers: "28.7K",
                  image:
                    "https://images.unsplash.com/photo-1542751110-97427bbecf20?w=220&h=140&fit=crop",
                },
                {
                  name: "Nadeshot",
                  game: "Apex Legends",
                  viewers: "14.2K",
                  image:
                    "https://images.unsplash.com/photo-1560419015-7c427e8ae5ba?w=220&h=140&fit=crop",
                },
                {
                  name: "DrLupo",
                  game: "Fortnite",
                  viewers: "9.1K",
                  image:
                    "https://images.unsplash.com/photo-1593305841991-05c297ba4575?w=220&h=140&fit=crop",
                },
              ].map((stream) => (
                <button
                  key={stream.name}
                  type="button"
                  className="flex w-full items-center gap-3 rounded-xl py-1.5 text-left transition hover:bg-white/[0.04]"
                >
                  <img
                    src={stream.image}
                    alt={stream.name}
                    className="h-10 w-14 shrink-0 rounded-lg object-cover"
                  />

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-white">
                      {stream.name}
                    </p>
                    <p className="truncate text-xs text-white/40">
                      {stream.game}
                    </p>
                  </div>

                  <div className="flex shrink-0 items-center gap-2">
                    <span className="text-xs text-white/55">
                      {stream.viewers}
                    </span>
                    <span className="rounded bg-red-600 px-1.5 py-0.5 text-[10px] font-bold text-white">
                      LIVE
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Friends Online */}
          <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-base font-semibold text-white">
                Friends Online
              </h3>

              <button
                type="button"
                className="text-sm font-medium text-lime-400 transition hover:text-lime-300"
              >
                View all
              </button>
            </div>

            <div className="space-y-2">
              {[
                {
                  name: "Nadeshot",
                  status: "In a match",
                  image:
                    "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&h=120&fit=crop",
                },
                {
                  name: "TimTheTatman",
                  status: "In a match",
                  image:
                    "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=120&h=120&fit=crop",
                },
                {
                  name: "DrLupo",
                  status: "Online",
                  image:
                    "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&h=120&fit=crop",
                },
                {
                  name: "CouRageJD",
                  status: "In lobby",
                  image:
                    "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&h=120&fit=crop",
                },
              ].map((friend) => (
                <button
                  key={friend.name}
                  type="button"
                  className="flex w-full items-center gap-3 rounded-xl py-1.5 text-left transition hover:bg-white/[0.04]"
                >
                  <div className="relative shrink-0">
                    <img
                      src={friend.image}
                      alt={friend.name}
                      className="h-9 w-9 rounded-full object-cover"
                    />
                    <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-black bg-lime-400" />
                  </div>

                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-white">
                      {friend.name}
                    </p>
                    <p className="truncate text-xs text-white/40">
                      {friend.status}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </aside>

      {/* Desktop Right Comments Panel */}
      {selectedCommentPost && (
        <aside className="hidden lg:flex fixed right-10 top-24 bottom-10 w-[360px] z-40 !bg-black flex-col rounded-[28px] border border-white/25 bg-[#05070b]/80 animate-in fade-in slide-in-from-right-4 duration-200 ease-out">
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