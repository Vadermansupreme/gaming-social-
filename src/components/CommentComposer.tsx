
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Send } from "lucide-react";

interface CommentComposerProps {
  postId: string;
  currentUserId?: string;
  onCommentAdded?: () => void;
  compact?: boolean;
}

const CommentComposer = ({ postId, currentUserId, onCommentAdded, compact = false }: CommentComposerProps) => {
  const [text, setText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!text.trim() || !currentUserId) return;

    try {
      setIsSubmitting(true);
      
      const { error } = await supabase
        .from('comments')
        .insert({
          post_id: postId,
          author_id: currentUserId,
          text: text.trim()
        });

      if (error) throw error;
      
      setText("");
      toast.success("Comment posted!");
      
      // Notify parent to update comment count
      onCommentAdded?.();
    } catch (error) {
      console.error('Error posting comment:', error);
      toast.error("Failed to post comment");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!currentUserId) {
    return null;
  }

  return (
    <form
  onSubmit={handleSubmit}
  className={compact ? "space-y-2" : "space-y-3"}
>
      <Textarea
        placeholder="Write a comment..."
        value={text}
        onChange={(e) => setText(e.target.value)}
        className={
  compact
    ? "min-h-[40px] resize-none rounded-2xl border-white bg-black text-sm py-2.5 placeholder:text-white/35 focus-visible:border-white focus-visible:ring-0"
    : "min-h-[80px] resize-none border-white bg-black placeholder:text-white/35 focus-visible:border-white focus-visible:ring-0"
}
        disabled={isSubmitting}
        maxLength={1000}
      />
      <div className="flex justify-end">
        <Button 
          type="submit" 
          size="sm"
          disabled={!text.trim() || isSubmitting}
          className={
  compact
    ? "mt-2 rounded-full bg-white px-5 py-2.5 text-sm font-bold text-black shadow-lg shadow-black/20 hover:bg-zinc-200 disabled:opacity-100"
    : "bg-gradient-to-r from-[hsl(var(--primary))] to-[hsl(var(--primary-end))]"
}

        >
          {isSubmitting ? (
            "Posting..."
          ) : (
            <>
              <Send className={compact ? "w-4 h-4 mr-1.5" : "w-4 h-4 mr-2"} />
{compact ? "Post" : "Post Comment"}
            </>
          )}
        </Button>
      </div>
    </form>
  );
};

export default CommentComposer;
