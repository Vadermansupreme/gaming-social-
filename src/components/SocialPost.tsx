
import { useState, useEffect, useRef, useCallback } from "react";
import { Repeat2, MessageCircle, Share, MoreVertical, Trash2, Play, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatDistanceToNow } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { StorageService } from "@/services/StorageService";
import CommentList from "./CommentList";
import CommentComposer from "./CommentComposer";
import MediaViewer from "./MediaViewer";
import { useNavigate } from "react-router-dom";
const BitHeart = ({
  filled = false,
  className = "",
}: {
  filled?: boolean;
  className?: string;
}) => (
  <span
    className={`inline-flex ${className}`}
    aria-hidden="true"
  >
    <Zap
      className="h-full w-full scale-x-[0.82] scale-y-[1.18]"
      fill={filled ? "currentColor" : "none"}
      strokeWidth={2.2}
    />
  </span>
);
interface SocialPostProps {
  post: {
    id: string;
    text?: string | null;
    created_at: string;
    author: {
      display_name: string;
      avatar_url?: string | null;
      verified?: boolean;
    };
    author_id: string;
    like_count?: number;
    comment_count?: number; 
    media_urls?: string[] | null;
    repost_of?: string | null;
    community?: {
  name: string;
  slug: string;
} | null;
  };
  currentUserId?: string;
  onLikeChange?: (delta: number) => void;
  onCommentChange?: (delta: number) => void;
  onDelete?: () => void;
  onOpenComments?: (post: SocialPostProps["post"]) => void;
  defaultShowComments?: boolean;
  canParticipate?: boolean;
}

const SocialPost = ({
  post,
  currentUserId,
  onLikeChange,
  onCommentChange,
  onDelete,
  onOpenComments,
  defaultShowComments = false,
  canParticipate = true,
}: SocialPostProps) => {
  const navigate = useNavigate();
  const [liked, setLiked] = useState(false);
  const [showBigHeart, setShowBigHeart] = useState(false);
  const [animateLikeCount, setAnimateLikeCount] = useState(false);
  const [animateHeartIcon, setAnimateHeartIcon] = useState(false);
  const lastTapRef = useRef(0);
  const mediaClickTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [likeCount, setLikeCount] = useState(post.like_count || 0);
  const [repostCount, setRepostCount] = useState((post as any).repost_count || 0);
  const handleLike = () => {
  if (liked) return;

  setLiked(true);
  setLikeCount(prev => prev + 1);
  setAnimateHeartIcon(true);

setTimeout(() => {
  setAnimateHeartIcon(false);
}, 250);
  setAnimateLikeCount(true);

setTimeout(() => {
  setAnimateLikeCount(false);
}, 300);

  setShowBigHeart(true);

setTimeout(() => {
  setShowBigHeart(false);
}, 600);

  if (onLikeChange) {
    onLikeChange(1);
  }
};
  
  const [commentCount, setCommentCount] = useState(post.comment_count || 0);
  const [showComments, setShowComments] = useState(false);
  const [showMediaViewer, setShowMediaViewer] = useState(false);
  const [selectedMediaIndex, setSelectedMediaIndex] = useState(0);
  const [isLikeLoading, setIsLikeLoading] = useState(false);
  const videoRefs = useRef<{ [key: number]: HTMLVideoElement | null }>({});
  const postRef = useRef<HTMLDivElement | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const likeCheckDone = useRef(false);
  const [originalPost, setOriginalPost] = useState<any>(null);

  // Sync like count from parent props
  useEffect(() => {
    setLikeCount(post.like_count || 0);
  }, [post.like_count]);

  // Sync comment count from parent props
  useEffect(() => {
    setCommentCount(post.comment_count || 0);
  }, [post.comment_count]);

  useEffect(() => {
  setRepostCount((post as any).repost_count || 0);
}, [(post as any).repost_count]);
useEffect(() => {
  const el = postRef.current;
  if (!el) return;

  const observer = new IntersectionObserver(
    ([entry]) => {
      setIsVisible(entry.isIntersecting);
    },
    { threshold: 0.75 }
  );

  observer.observe(el);

  return () => observer.disconnect();
}, []);
useEffect(() => {
  Object.values(videoRefs.current).forEach((video) => {
    if (!video) return;

    if (isVisible) {
      video.play().catch(() => {});
    } else {
      video.pause();
    }
  });
}, [isVisible]);


useEffect(() => {
  const fetchOriginalPost = async () => {
    if (!(post as any).repost_of) return;

    const { data, error } = await supabase
      .from("posts")
      .select(`
        id,
        text,
        media_urls,
        created_at,
        community:communities (
  name,
  slug
),
        author:profiles (
  display_name,
  avatar_url
)
      `)
      .eq("id", (post as any).repost_of)
      .single();

    if (error) {
      console.error("Failed to load original repost:", error);
      return;
    }

    setOriginalPost(data);
  };

  fetchOriginalPost();
}, [post]);

  // Check initial like status only once
  useEffect(() => {
    if (currentUserId && !likeCheckDone.current) {
      likeCheckDone.current = true;
      checkIfLiked();
    }
  }, [currentUserId, post.id]);

  const checkIfLiked = async () => {
    if (!currentUserId) return;
    
    try {
      const { data } = await supabase
        .from('likes')
        .select('id')
        .eq('post_id', post.id)
        .eq('user_id', currentUserId)
        .maybeSingle();
      
      setLiked(!!data);
    } catch (error) {
      // Ignore errors - default to not liked
    }
  };

  const toggleLike = useCallback(async () => {
    if (!currentUserId || isLikeLoading) return;

    // Prevent rapid re-taps
    setIsLikeLoading(true);

    // Save previous state for rollback
    const wasLiked = liked;
    const prevCount = likeCount;

    // Optimistic update - instant UI feedback
    const newLiked = !wasLiked;
    const delta = newLiked ? 1 : -1;
    setLiked(newLiked);
    setLikeCount(prev => Math.max(0, prev + delta));
    onLikeChange?.(delta);

    try {
      if (wasLiked) {
        // Unlike - delete from likes
        const { error } = await supabase
          .from('likes')
          .delete()
          .eq('post_id', post.id)
          .eq('user_id', currentUserId);
        
        if (error) {
          console.error('Unlike error:', { code: error.code, message: error.message });
          throw error;
        }
      } else {
        // Like - insert into likes
        const { error } = await supabase
  .from('likes')
  .insert({
    post_id: post.id,
    user_id: currentUserId
  });

if (error) {
  if (error.code === '23505') {
    console.log('Like already exists, keeping liked state');
  } else {
    console.error('Like error:', {
      code: error.code,
      message: error.message
    });
    throw error;
  }
} else if (currentUserId !== post.author_id) {
  const { error: notificationError } =
    await (supabase as any)
      .from("notifications")
      .insert({
        user_id: post.author_id,
        actor_id: currentUserId,
        type: "like",
        message: "liked your workout",
        is_read: false,
        related_id: post.id,
        link: `/post/${post.id}`,
      });

  if (notificationError) {
    console.error(
      "Error creating like notification:",
      notificationError
    );
  }
}
      }
    } catch (error: any) {
      // Rollback optimistic update on error
      console.error('Error toggling like:', error);
      setLiked(wasLiked);
      setLikeCount(prevCount);
      onLikeChange?.(-delta);
      toast.error('Failed to update like');
    } finally {
      // 300ms delay to prevent rapid re-taps
      setTimeout(() => setIsLikeLoading(false), 300);
    }
  }, [currentUserId, liked, likeCount, isLikeLoading, post.id, onLikeChange]);

  const handleCommentAdded = useCallback(() => {
    setCommentCount(prev => prev + 1);
    onCommentChange?.(1);
  }, [onCommentChange]);

  const handleDelete = async () => {
  try {
    await StorageService.deletePost((post as any).post_id || post.id);
    onDelete?.();
    toast.success('Post deleted successfully');
  } catch (error) {
    console.error('Error deleting post:', error);
    toast.error('Failed to delete post');
  }
};

  const handleShare = async () => {
    try {
      const shareUrl = `${window.location.origin}/post/${post.id}`;
      
      if (navigator.share) {
        await navigator.share({
          title: `${post.author.display_name}'s post on SpotMe`,
          text: post.text || 'Check out this post on SpotMe!',
          url: shareUrl
        });
      } else {
        await navigator.clipboard.writeText(shareUrl);
        toast.success('Link copied to clipboard!');
      }
    } catch (error: any) {
      if (error?.name !== 'AbortError') {
        try {
          await navigator.clipboard.writeText(`${window.location.origin}/post/${post.id}`);
          toast.success('Link copied to clipboard!');
        } catch {
          toast.error('Failed to share post');
        }
      }
    }
  };
  const handleRepost = async () => {
  if (!currentUserId) {
    toast.error("You must be signed in to Respawn");
    return;
  }

  const sb: any = supabase;

  try {
    const { data: existing, error: checkError } = await sb
      .from("post_reposts")
      .select("id")
      .eq("post_id", post.id)
      .eq("user_id", currentUserId)
      .maybeSingle();

    if (checkError) throw checkError;

    if (existing) {
      const { error: feedDeleteError } = await sb
        .from("posts")
        .delete()
        .eq("author_id", currentUserId)
        .eq("repost_of", post.id);

      if (feedDeleteError) throw feedDeleteError;

      const { error: respawnDeleteError } = await sb
        .from("post_reposts")
        .delete()
        .eq("id", existing.id);

      if (respawnDeleteError) throw respawnDeleteError;

      setRepostCount((prev) => Math.max(0, prev - 1));
      toast.success("Respawn removed");
      return;
    }

    const { error: insertError } = await sb
      .from("post_reposts")
      .insert({
        post_id: post.id,
        user_id: currentUserId,
      });

    if (insertError) throw insertError;

    const { error: feedInsertError } = await sb
      .from("posts")
      .insert({
        author_id: currentUserId,
        text: null,
        media_urls: null,
        repost_of: post.id,
      });

    if (feedInsertError) {
      await sb
        .from("post_reposts")
        .delete()
        .eq("post_id", post.id)
        .eq("user_id", currentUserId);

      throw feedInsertError;
    }
if (currentUserId !== post.author_id) {
  const { error: notificationError } = await sb
    .from("notifications")
    .insert({
      user_id: post.author_id,
      actor_id: currentUserId,
      type: "repost",
      message: "respawned your post",
      is_read: false,
      related_id: post.id,
      link: `/post/${post.id}`,
    });

  if (notificationError) {
    console.error(
      "Error creating Respawn notification:",
      notificationError
    );
  }
}
    setRepostCount((prev) => prev + 1);
    toast.success("Respawned");
  } catch (error) {
    console.error("Respawn error:", error);
    toast.error("Failed to update Respawn");
  }
};
 const handleMediaClick = (index: number) => {
  const now = Date.now();

  if (now - lastTapRef.current < 300) {
    if (mediaClickTimeoutRef.current) {
      clearTimeout(mediaClickTimeoutRef.current);
      mediaClickTimeoutRef.current = null;
    }

    handleLike();
    lastTapRef.current = 0;
    return;
  }

  lastTapRef.current = now;

  mediaClickTimeoutRef.current = setTimeout(() => {
    setSelectedMediaIndex(index);
    setShowMediaViewer(true);
    mediaClickTimeoutRef.current = null;
  }, 300);
};

  const isVideo = (url: string) => {
    return url.includes('.mp4') || url.includes('.webm') || url.includes('.mov') || url.match(/\.(mp4|webm|mov)(\?|$)/i);
  };

  const handleVideoClick = (index: number, event: React.MouseEvent) => {
    event.stopPropagation();
    const video = videoRefs.current[index];
    if (video) {
      if (video.paused) {
        video.play();
      } else {
        video.pause();
      }
    }
  };

  const canDelete = currentUserId === post.author_id;

function formatPostTime(createdAt: string) {
  const now = new Date();
  const posted = new Date(createdAt);
  const diff = now.getTime() - posted.getTime();

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (days === 0) return "Today";
  if (days < 7) return `${days}d`;

  const weeks = Math.floor(days / 7);
  if (weeks < 5) return `${weeks}w`;

  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo`;

  const years = Math.floor(days / 365);
  return `${years}y`;
}
  return (
   <Card
  ref={postRef}
  className="w-full gap-0 py-0 rounded-none border-x-0 border-t-0 sm:rounded-2xl sm:border"
>
      {/* Header */}
      <div className="flex items-start justify-between gap-3 px-4 pt-3 pb-1 -translate-y-1 sm:translate-y-0 sm:pb-3 sm:pt-4">
        <div className="flex min-w-0 items-center gap-3">
          <Avatar
            className="h-10 w-10 shrink-0 cursor-pointer"
            onClick={() => navigate(`/profile/${post.author_id}`)}
          >
            <AvatarImage src={post.author.avatar_url || undefined} />
            <AvatarFallback className="bg-gradient-to-r from-[hsl(var(--primary))] to-[hsl(var(--primary-end))] font-semibold text-primary-foreground">
              {post.author.display_name?.charAt(0) || "U"}
            </AvatarFallback>
          </Avatar>

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-x-2">
  <h3
    className="truncate text-[15px] font-semibold text-white hover:underline cursor-pointer"
    onClick={() => navigate(`/profile/${post.author_id}`)}
  >
    {post.author.display_name}
  </h3>

  <span className="text-xs text-white/45">
    @devan_miles
  </span>

  <span className="text-xs text-white/45">·</span>

  <span className="text-xs text-white/45">
    {formatPostTime(post.created_at)}
  </span>

            </div>
          </div>
        </div>

        {canDelete && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 shrink-0 rounded-full text-white/60 hover:bg-white/10 hover:text-white"
              >
                <MoreVertical className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleDelete} className="text-destructive">
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Post
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
{post.community && (
  <button
    type="button"
    onClick={() => navigate(`/community/${post.community?.slug}`)}
    className="mx-4 mb-2 text-xs font-semibold text-cyan-400 transition hover:text-cyan-300 hover:underline"
  >
    From the {post.community.name} community
  </button>
)}
      {/* Caption */}
{post.text && (
  <div className="px-4 pt-1 pb-3">
    <p className="whitespace-pre-wrap text-[15px] leading-6 text-white/90">
      {post.text}
    </p>
  </div>
)}

      {/* Repost */}
      {(post as any).repost_of && (
        <div className="px-4 pb-4">
          <div className="mb-3 flex items-center gap-2">
  <span className="h-2 w-2 rounded-full bg-lime-400" />

  <p className="text-xs font-semibold uppercase tracking-wide text-lime-400">
    Respawned post
  </p>
</div>

          {originalPost && (
            <div className="overflow-hidden rounded-xl border border-white/10 bg-black">
             <div className="flex items-center gap-3 px-3 py-4">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={originalPost.author?.avatar_url || ""} />
                  <AvatarFallback>
                    {originalPost.author?.display_name?.charAt(0) || "U"}
                  </AvatarFallback>
                </Avatar>

                <div className="min-w-0">
  <p className="truncate text-sm font-medium text-white">
    {originalPost.author?.display_name || "User"}
  </p>

  <p className="mt-0.5 text-xs text-white/45">
    {originalPost.created_at
      ? new Date(originalPost.created_at).toLocaleDateString(undefined, {
          month: "short",
          day: "numeric",
        })
      : "Original post"}
  </p>
</div>
              </div>
{originalPost.community && (
  <button
    type="button"
    onClick={() =>
      navigate(`/community/${originalPost.community.slug}`)
    }
    className="mx-3 mb-2 text-xs font-semibold text-cyan-400 transition hover:text-cyan-300 hover:underline"
  >
    From the {originalPost.community.name} community
  </button>
)}
              {originalPost.text && (
                <p className="whitespace-pre-wrap px-3 pb-3 text-sm leading-relaxed text-white/85">
                  {originalPost.text}
                </p>
              )}

              {originalPost.media_urls?.length > 0 && (
  <div className="w-full">
    <img
      src={originalPost.media_urls[0]}
      alt="Respawned content"
      className="max-h-[620px] w-full object-cover"
      onError={(e) => {
        e.currentTarget.parentElement?.remove();
      }}
    />
  </div>
)}
            </div>
          )}
        </div>
      )}

      {/* Media — touches the card's left and right edges */}
      {post.media_urls && post.media_urls.length > 0 && (
        <div className="relative w-full">
          {post.media_urls.length === 1 ? (
            <div className="relative w-full overflow-hidden bg-black">
              {isVideo(post.media_urls[0]) ? (
                <div
                  className="relative cursor-pointer"
                  onClick={() => handleMediaClick(0)}
                >
                  <video
                    ref={(el) => {
                      videoRefs.current[0] = el;
                    }}
                    src={post.media_urls[0]}
                    className="max-h-[760px] w-full object-cover"
                    preload="metadata"
                    playsInline
                    muted
                    onClick={(event) => handleVideoClick(0, event)}
                  />

                  <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                    <div className="rounded-full bg-black/50 p-3">
                      <Play className="h-8 w-8 fill-white text-white" />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="relative w-full overflow-hidden">
  <img
    src={post.media_urls[0]}
    alt="Post content"
    className="h-[460px] w-full cursor-pointer object-cover object-top transition-opacity hover:opacity-95 sm:h-[600px]"
    loading="lazy"
    onClick={() => handleMediaClick(0)}
  />

                  {showBigHeart && (
                    <div className="pointer-events-none absolute inset-0 z-50 flex items-center justify-center">
                      <BitHeart
  filled
  className="h-36 w-36 animate-[heartPop_600ms_ease-out] text-lime-400"
/>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div
              className={`grid w-full gap-0 overflow-hidden ${
                post.media_urls.length === 2
                  ? "grid-cols-2"
                  : post.media_urls.length === 3
                    ? "grid-cols-3"
                    : "grid-cols-2"
              }`}
            >
              {post.media_urls.map((url, index) => (
                <div key={url} className="relative overflow-hidden bg-black">
                  {isVideo(url) ? (
                    <div
                      className="relative cursor-pointer"
                      onClick={() => handleMediaClick(index)}
                    >
                      <video
                        ref={(el) => {
                          videoRefs.current[index] = el;
                        }}
                        src={url}
                        className={`w-full object-cover ${
                          post.media_urls!.length === 4 && index >= 2
                            ? "h-40"
                            : "h-64 md:h-72"
                        }`}
                        preload="metadata"
                        playsInline
                        muted
                        autoPlay
                        loop
                        onClick={(event) => handleVideoClick(index, event)}
                      />

                      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                        <div className="rounded-full bg-black/50 p-2">
                          <Play className="h-6 w-6 fill-white text-white" />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <img
                      src={url}
                      alt={`Post content ${index + 1}`}
                      className={`w-full cursor-pointer object-cover transition-opacity hover:opacity-95 ${
                        post.media_urls!.length === 4 && index >= 2
                          ? "h-40"
                          : "h-64 md:h-72"
                      }`}
                      loading="lazy"
                      onClick={() => handleMediaClick(index)}
                    />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between px-4 pt-2 pb-0 -translate-y-1 sm:translate-y-0 sm:py-3">
        <div className="flex items-center gap-5">
          <button
            type="button"
            onClick={toggleLike}
            disabled={isLikeLoading}
            className="flex items-center gap-2 text-sm text-white/70 transition hover:text-white disabled:opacity-50"
            aria-label={liked ? "Unlike post" : "Like post"}
          >
            <BitHeart
  filled={liked}
  className={`h-6 w-6 transition-all duration-200 ${
    liked
      ? animateHeartIcon
        ? "scale-110 text-lime-400"
        : "scale-100 text-lime-400"
      : "text-white/80"
  }`}
/>
            <span
              className={`transition-all duration-300 ${
                animateLikeCount ? "scale-125 text-green-400" : ""
              }`}
            >
              {likeCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
  if (!canParticipate) return;

  onOpenComments
    ? onOpenComments(post)
    : setShowComments((current) => !current);
}}
            className="flex items-center gap-2 text-sm text-white/70 transition hover:text-white"
            aria-label="Open comments"
          >
            <MessageCircle className="h-6 w-6" />
            <span>{commentCount}</span>
          </button>

          <button
            type="button"
            onClick={handleRepost}
            className="flex items-center gap-2 text-sm text-white/70 transition hover:text-white"
            aria-label="Respawn post"
          >
            <Repeat2 className="h-6 w-6" />
            <span>{repostCount}</span>
          </button>
        </div>

        <button
          type="button"
          onClick={handleShare}
          className="rounded-full p-1 text-white/70 transition hover:bg-white/10 hover:text-white"
          aria-label="Share post"
        >
          <Share className="h-5 w-5" />
        </button>
      </div>

      {/* Comments */}
{(defaultShowComments || showComments) && (
  <div className="border-t border-white/10 bg-black/25 px-4 pb-4">
    <div className="space-y-4 pt-4">
      <CommentList postId={post.id} />
      {!canParticipate && (
  <p className="rounded-xl border border-purple-400/20 bg-purple-500/10 px-4 py-3 text-sm text-purple-200">
    Join this community to participate.
  </p>
)}

      {showComments && canParticipate && (
  <CommentComposer
          postId={post.id}
          currentUserId={currentUserId}
          onCommentAdded={handleCommentAdded}
        />
      )}
    </div>
  </div>
)}

      {/* Media Viewer */}
      {post.media_urls && (
        <MediaViewer
          media={post.media_urls}
          initialIndex={selectedMediaIndex}
          isOpen={showMediaViewer}
          onClose={() => setShowMediaViewer(false)}
        />
      )}
    </Card>
  );
};


export default SocialPost;
