
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { formatDistanceToNow } from "date-fns";
import { Loader2, Trash2 } from "lucide-react";

interface Comment {
  id: string;
  text: string;
  created_at: string;
  author_id: string;
  author: {
    display_name: string;
    avatar_url?: string;
    verified?: boolean;
  };
}

interface CommentListProps {
  postId: string;
  currentUserId?: string;
  onCommentDeleted?: () => void;
}

const CommentList = ({ postId, currentUserId, onCommentDeleted }: CommentListProps) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchComments();
    
    // Subscribe to real-time comment updates
    const channel = supabase
      .channel(`comments-${postId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'comments',
          filter: `post_id=eq.${postId}`
        },
        () => {
          fetchComments();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [postId]);
const handleDeleteComment = async (commentId: string) => {
  if (!currentUserId) return;

  const { error } = await supabase
    .from("comments")
    .delete()
    .eq("id", commentId)
    .eq("author_id", currentUserId);

  if (error) {
    console.error("Error deleting comment:", error);
    return;
  }

  setComments((prev) => prev.filter((comment) => comment.id !== commentId));
  onCommentDeleted?.();
};
  const fetchComments = async () => {
    try {
      const { data, error } = await supabase
        .from('comments')
        .select(`
          id,
          text,
          created_at,
          author_id,
          author:profiles (
  display_name,
  avatar_url

)
        `)
        .eq('post_id', postId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setComments(data || []);
    } catch (error) {
      console.error('Error fetching comments:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-4">
        <Loader2 className="w-4 h-4 animate-spin text-white" />
      </div>
    );
  }

  if (comments.length === 0) {
    return (
      <div className="text-center py-4">
        <p className="text-sm text-white">No comments yet. Be the first to comment!</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {comments.map((comment) => (
        <div key={comment.id} className="group flex gap-3">
          <Avatar className="w-8 h-8 flex-shrink-0">
            <AvatarImage src={comment.author?.avatar_url} />
            <AvatarFallback className="bg-gradient-to-r from-[hsl(var(--primary))] to-[hsl(var(--primary-end))] text-primary-foreground text-xs">
              {comment.author?.display_name?.charAt(0) || 'U'}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
  <div className="flex items-center gap-2">
    <h4 className="font-semibold text-sm text-white">
      {comment.author?.display_name}
    </h4>

    {comment.author?.verified && (
      <div className="w-3 h-3 rounded-full bg-blue-500 flex items-center justify-center">
        <svg className="w-2 h-2 text-white" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
            clipRule="evenodd"
          />
        </svg>
      </div>
    )}

    <span className="text-xs text-white/50">
      {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
    </span>
  </div>

  {comment.author_id === currentUserId && (
    <button
      type="button"
      onClick={() => handleDeleteComment(comment.id)}
      className="rounded-full p-1 text-red-400 opacity-0 transition-opacity duration-75 hover:bg-red-500/10 hover:text-red-300 group-hover:opacity-100"
      aria-label="Delete comment"
    >
      <Trash2 className="h-3.5 w-3.5" />
    </button>
  )}
</div>
            <p className="text-sm text-white/90 mt-1 whitespace-pre-wrap">
              {comment.text}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
};

export default CommentList;
