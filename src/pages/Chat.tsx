import { useState, useEffect, useRef } from "react";
import { ArrowLeft, Send, Camera, MoreVertical } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useRealTimeMessages } from "@/hooks/useRealTimeMessages";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import UserAvatar from "@/components/UserAvatar";
import { formatLastSeen, isActiveNow } from "@/lib/lastSeen";

const Chat = () => {
  const navigate = useNavigate();
  const [message, setMessage] = useState("");
  const [user, setUser] = useState<any>(null);
  const [contact, setContact] = useState<any>(null);
  const [contactLoading, setContactLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const { id: chatUserId } = useParams();

  const { messages, loading, sendMessage } = useRealTimeMessages(chatUserId);

  useEffect(() => {
    const getUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        setUser(user);
        
        // Update last seen when entering chat
        if (user && chatUserId) {
  // mark messages from the other user as read
  await supabase
    .from('messages')
    .update({ is_read: true })
    .eq('sender_id', chatUserId)
    .eq('recipient_id', user.id)
    .eq('is_read', false);

  // keep your existing last seen
  await supabase
    .from('profiles')
    .update({ last_seen_at: new Date().toISOString() })
    .eq('id', user.id);
}
      } catch (error) {
        console.error('Error fetching user:', error);
      }
    };
    getUser();
  }, []);

  // Fetch real profile data for the contact (dual query: public_profiles + profiles for presence)
  useEffect(() => {
    const fetchContactProfile = async () => {
      if (!chatUserId) return;
      
      try {
        setContactLoading(true);
        
        // Fetch public profile data including allow_messages (bypasses RLS)
        const { data, error: publicError } = await supabase
          .from('profiles')
.select('id, display_name, avatar_url')
          .eq('id', chatUserId)
          .maybeSingle();

        if (publicError) {
          console.error('Error fetching public profile:', publicError);
          toast.error("Failed to load contact profile");
        }

        // Fetch last_seen_at from profiles for presence (not in public_profiles view)
        const { data: presenceData } = await supabase
          .from('profiles')
          .select('last_seen_at')
          .eq('id', chatUserId)
          .maybeSingle();

        const lastSeenAt = presenceData?.last_seen_at ?? null;
        // Use narrow cast to avoid TS errors; treat null/undefined as true (messages allowed)
        const p = data as any;
        const allowMessages = p?.allow_messages ?? true;

        if (data) {
          // Check if user has disabled messages
          if (allowMessages === false) {
            toast.error("This user has disabled messages");
            navigate(-1);
            return;
          }
          
          setContact({
            id: data.id || chatUserId,
            name: data.display_name || 'User',
            avatar: data.avatar_url || '',
            initials: (data.display_name || 'U').charAt(0).toUpperCase(),
            lastSeenAt: lastSeenAt,
            isOnline: isActiveNow(lastSeenAt),
          });
        } else {
          // Silent fallback for unknown user
          setContact({
            id: chatUserId,
            name: "User",
            avatar: "",
            initials: "U",
            lastSeenAt: null,
            isOnline: false,
          });
        }
      } catch (error) {
        console.error('Error fetching contact profile:', error);
        setContact({
          id: chatUserId,
          name: "User",
          avatar: "",
          initials: "U",
          lastSeenAt: null,
          isOnline: false,
        });
      } finally {
        setContactLoading(false);
      }
    };

    fetchContactProfile();
  }, [chatUserId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSend = async () => {
    if (!message.trim() || !user || !chatUserId) {
      return;
    }

    try {
      await sendMessage(message.trim());
      setMessage("");
      
      // Update last seen on send
      await supabase
        .from('profiles')
        .update({ last_seen_at: new Date().toISOString() })
        .eq('id', user.id);
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error("Failed to send message. Please try again.");
    }
  };

  const handleCameraClick = () => {
    toast.info("Camera feature coming soon!");
  };


  

  if (loading || contactLoading || !contact) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-background pb-16">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b border-white/10">
        <div className="flex items-center gap-3 px-4 py-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          
          <div
  className="rounded-full p-[2px]"
  style={{
    backgroundColor:
      (contact as any).vibeColor ||
      (contact as any).vibe_color ||
      "#10b981",
  }}
>
  <UserAvatar
    src={contact.avatar}
    fallback={contact.initials}
    size="md"
    onClick={() => navigate(`/profile/${contact.id}`)}
  />
</div>
          
          <div className="flex-1">
            <h2 className="font-semibold">{contact.name}</h2>
            <p className="text-sm text-white">
              {contact.isOnline ? (
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  Active now
                </span>
              ) : (
                formatLastSeen(contact.lastSeenAt)
              )}
            </p>
          </div>

          <Button variant="ghost" size="icon">
            <MoreVertical className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 pb-32">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <p className="text-white mb-2">No messages yet</p>
              <p className="text-sm text-white">Send a message to start chatting!</p>
            </div>
          </div>
        ) : (
          messages.map((msg, index) => {
            const isMe = msg.sender_id === user?.id;
            const time = new Date(msg.created_at).toLocaleTimeString([], { 
              hour: '2-digit', 
              minute: '2-digit' 
            });
            const dateLabel = new Date(msg.created_at).toLocaleDateString([], {
  month: 'short',
  day: 'numeric',
  year: 'numeric'
}).toUpperCase();
const previousMessage = messages[index - 1];

const previousDateLabel = previousMessage
  ? new Date(previousMessage.created_at).toLocaleDateString([], {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    }).toUpperCase()
  : null;

const showDateLabel = dateLabel !== previousDateLabel;
            
            return (
  <div key={msg.id}>
    {showDateLabel && (
  <div className="text-center text-[10px] text-white/35 my-6">
    {dateLabel}
  </div>
)}

    <div
      className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
    >
                <div
                  className={`max-w-[75%] px-4 py-3 rounded-2xl ${
                    isMe
                      ? 'bg-black text-white border border-emerald-500 rounded-br-md'
                      : 'bg-black text-white border border-white/40 rounded-bl-md'
                  }`}
                >
                  <p className="text-sm leading-relaxed">{msg.text}</p>
                  <p className={`text-xs mt-1 ${
                    isMe ? 'text-white/70' : 'text-white'
                  }`}>
                    {time}
                  </p>
                </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Fixed Input Area */}
      <div className="fixed bottom-16 left-0 right-0 ...">
        

        {/* Input */}
        <div className="p-4 pb-4">
          <div className="flex items-end gap-3">
            <Button 
              variant="ghost" 
              size="icon" 
              className="text-white mb-1"
              onClick={handleCameraClick}
            >
              <Camera className="w-5 h-5" />
            </Button>
            
            <div className="flex-1 relative">
              <Input
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Type a message..."
                className="pr-12 rounded-full border border-emerald-500 min-h-[44px] outline-none ring-0 ring-offset-0 focus:border-emerald-500 focus:ring-0 focus:ring-offset-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                maxLength={2000}
              />
              <button
  onClick={handleSend}
  disabled={!message.trim()}
  className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-500"
>
  <Send className="w-5 h-5" />
</button>
            </div>
            
          </div>
        </div>
      </div>
    </div>
  );
};

export default Chat;
