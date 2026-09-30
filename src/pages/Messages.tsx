import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { formatDistanceToNow } from "date-fns";
import { ArrowLeft, MessageCircle, Users } from "lucide-react";
import UserAvatar from "@/components/UserAvatar";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { EmptyState } from "@/components/EmptyState";
const vibeColors: Record<string, string> = {
  APEX: "#ef4444",
  COMPETITOR: "#f59e0b",
  FLOW: "#8b5cf6",
  RUN: "#3b82f6",
  OUTDOOR: "#22c55e",
  NUTRITION: "#f59e0b",
  "GYM VIBE": "#10b981",
};

// Updated mock data with demo user IDs
const mockConversations = [
  {
    id: "1",
    otherUser: {
      id: "550e8400-e29b-41d4-a716-446655440001",
      display_name: "Ryan Martinez",
      avatar_url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face"
    },
    lastMessage: "Great workout today! Same time tomorrow?",
    timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    unread: true
  },
  {
    id: "2", 
    otherUser: {
      id: "550e8400-e29b-41d4-a716-446655440002",
      display_name: "Sarah Chen",
      avatar_url: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face"
    },
    lastMessage: "Thanks for spotting me on bench press!",
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    unread: false
  },
  {
    id: "3",
    otherUser: {
      id: "550e8400-e29b-41d4-a716-446655440003", 
      display_name: "Marcus Johnson",
      avatar_url: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face"
    },
    lastMessage: "Want to try that new HIIT class next week?",
    timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    unread: false
  }
];

const Messages = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [conversations, setConversations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        setUser(user);
        
        if (user) {
          await fetchConversations(user.id);
          
          // Subscribe to new messages to update conversation list
          const channel = supabase
            .channel('user-messages')
            .on(
              'postgres_changes',
              {
                event: 'INSERT',
                schema: 'public',
                table: 'messages'
              },
              (payload) => {
                const newMessage = payload.new as any;
                
                // Check if this message involves the current user
                if (newMessage.sender_id === user.id || newMessage.recipient_id === user.id) {
                  // Refresh conversations to show updated last message
                  fetchConversations(user.id);
                }
              }
            )
            .subscribe();

          return () => {
            supabase.removeChannel(channel);
          };
        }
      } catch (error) {
        console.error('Error fetching user:', error);
      } finally {
        setLoading(false);
      }
    };
    getUser();
  }, []);

  const fetchConversations = async (userId: string) => {
    try {
      // First get all conversations for this user
      const { data: conversationsData, error: conversationsError } = await supabase
        .from('conversations')
        .select('*')
        .or(`participant_1.eq.${userId},participant_2.eq.${userId}`)
        .order('last_message_at', { ascending: false });

      if (conversationsError) throw conversationsError;

      if (!conversationsData || conversationsData.length === 0) {
        setConversations([]);
        return;
      }

      // Get the other participants' profiles and last messages
      const conversationsWithDetails = await Promise.all(
        conversationsData.map(async (conv) => {
          const otherUserId = conv.participant_1 === userId ? conv.participant_2 : conv.participant_1;
          
          // Get other user's profile
          const { data: profile } = await supabase
            .from('profiles')
            .select('id, display_name, avatar_url')
            .eq('id', otherUserId)
            .maybeSingle();
            console.log("MESSAGE PROFILE:", profile);

          // Get last message
          const { data: lastMessage } = await supabase
            .from('messages')
            .select('text, created_at, sender_id, is_read')
            .or(`and(sender_id.eq.${userId},recipient_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},recipient_id.eq.${userId})`)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

          return {
            id: conv.id,
            otherUser: {
  id: otherUserId,
  display_name: profile?.display_name || 'User',
  avatar_url: profile?.avatar_url,
  
},
            lastMessage: lastMessage?.text || 'No messages yet',
            timestamp: lastMessage?.created_at || conv.last_message_at || conv.created_at,
            unread: lastMessage ? String(lastMessage.sender_id) !== String(userId) && !lastMessage.is_read : false,
          };
        })
      );

      setConversations(conversationsWithDetails);
    } catch (error) {
      console.error('Error fetching conversations:', error);
      // Fallback to mock data if there's an error
      setConversations([]);
    }
  };

  const startNewConversation = () => {
  navigate('/search?mode=chat');
};

  return (
    <div className="px-4 pt-6 bg-background min-h-screen pb-24">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
  <button
    type="button"
    onClick={() => navigate(-1)}
    className="flex h-10 w-10 items-center justify-center rounded-full text-white/70 transition hover:bg-white/5 hover:text-white"
    aria-label="Go back"
  >
    <ArrowLeft className="h-5 w-5" />
  </button>

  <h1 className="text-2xl font-bold text-white">
    Messages
  </h1>
</div>
        <Button
          variant="outline"
          size="sm"
          onClick={startNewConversation}
          className="flex items-center gap-2"
        >
          <Users className="w-4 h-4" />
          New Chat
        </Button>
      </div>
      
      <div className="space-y-4">
        {loading ? (
          <LoadingSpinner />
        ) : conversations.length === 0 ? (
          <EmptyState
            icon={MessageCircle}
            title="No conversations yet"
            description="Find workout partners and start chatting!"
            action={{
              label: "Find People to Chat With",
              onClick: startNewConversation
            }}
          />
        ) : (
          [...conversations]
  .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
.map((conversation) => (
            <div
  key={conversation.id}
  className={`flex items-center gap-4 p-4 rounded-xl cursor-pointer transition-colors ${
    conversation.unread
      ? "bg-emerald-500/10 hover:bg-emerald-500/15"
      : "bg-black hover:bg-emerald-500/5"
  }`}
  onClick={() => navigate(`/chat/${conversation.otherUser.id}`)}
>
  <div className="relative">
    <div
      className="rounded-full p-[2px]"
      style={{
        backgroundColor: vibeColors[String(conversation.otherUser.vibe || "").trim().toUpperCase()] || "#6b7280",
      }}
    >
      <UserAvatar
  src={conversation.otherUser.avatar_url || undefined}
  fallback={conversation.otherUser.display_name}
  size="lg"
  className={!conversation.otherUser.avatar_url ? "bg-emerald-500 text-white" : ""}
/>
    </div>
  </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="font-semibold text-base truncate text-white">
                    {conversation.otherUser.display_name || 'User'}
                  </h3>
                  <div className="flex flex-col items-end gap-1 text-xs text-white self-start">
  {conversation.unread && (
    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_10px_2px_rgba(52,211,153,0.95)]"></span>
  )}
  <span>
    {formatDistanceToNow(new Date(conversation.timestamp), { addSuffix: true })}
  </span>
</div>
                </div>
                <p className="text-sm truncate text-gray-400">
                  {conversation.lastMessage}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Messages;
