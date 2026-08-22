import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import SocialPost from '@/components/SocialPost';
import { LoadingSpinner } from '@/components/LoadingSpinner';

interface PostData {
  id: string;
  text: string | null;
  created_at: string;
  author_id: string;
  like_count: number | null;
  comment_count: number | null;
  media_urls: string[] | null;
  deleted_at: string | null;
}

interface AuthorProfile {
  display_name: string | null;
  avatar_url: string | null;
  verified: boolean | null;
}

const PostDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [post, setPost] = useState<PostData | null>(null);
  const [author, setAuthor] = useState<AuthorProfile | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!id) {
        setError('Invalid post ID');
        setLoading(false);
        return;
      }

      try {
        // Get current user
        const { data: { user } } = await supabase.auth.getUser();
        setCurrentUserId(user?.id || null);

        // Fetch the post
        const { data: postData, error: postError } = await supabase
          .from('posts')
          .select('*')
          .eq('id', id)
          .is('deleted_at', null)
          .maybeSingle();

        if (postError) {
          console.error('Error fetching post:', postError);
          setError('Failed to load post');
          setLoading(false);
          return;
        }

        if (!postData) {
          setError('Post not found');
          setLoading(false);
          return;
        }

        setPost(postData);

        // Fetch author profile
        const { data: profileData } = await supabase
          .from('public_profiles')
          .select('display_name, avatar_url, verified')
          .eq('id', postData.author_id)
          .maybeSingle();

        setAuthor(profileData);
      } catch (err) {
        console.error('Error:', err);
        setError('Something went wrong');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="min-h-screen bg-background">
        <div className="px-4 pt-6">
          <div className="flex items-center gap-3 mb-6">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-xl font-bold text-foreground">Post</h1>
          </div>
          
          <div className="text-center py-12">
            <h3 className="text-lg font-semibold text-foreground mb-2">
              {error || 'Post not found'}
            </h3>
            <p className="text-white mb-4">
              This post may have been deleted or doesn't exist.
            </p>
            <Button onClick={() => navigate('/app')} className="btn-primary">
              Go to Feed
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const formattedPost = {
    id: post.id,
    text: post.text,
    created_at: post.created_at,
    author_id: post.author_id,
    like_count: post.like_count ?? 0,
    comment_count: post.comment_count ?? 0,
    media_urls: post.media_urls,
    author: {
      display_name: author?.display_name || 'Unknown User',
      avatar_url: author?.avatar_url,
      verified: author?.verified ?? false,
    },
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="px-4 pt-6 pb-4">
        <div className="flex items-center gap-3 mb-6">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-xl font-bold text-foreground">Post</h1>
        </div>
        
        <div className="max-w-[500px] mx-auto px-4">
  <SocialPost
    post={formattedPost}
    currentUserId={currentUserId || undefined}
  />
</div>
      </div>
    </div>
  );
};

export default PostDetail;
