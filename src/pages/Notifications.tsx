import { useState, useEffect } from 'react';
import { ArrowLeft, Check, Bell, UserPlus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { useNotifications, EnrichedNotification } from '@/hooks/useNotifications';
import { supabase } from '@/integrations/supabase/client';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';

const Notifications = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    getUser();
  }, []);

  const { 
    notifications, 
    loading, 
    unreadCount, 
    markAsRead, 
    markAllAsRead,
    followActor,
    isFollowingActor
  } = useNotifications(user?.id);

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'spot_request':
        return '💪';
      case 'message':
        return '💬';
      case 'follow':
        return '👥';
      case 'like':
        return '❤️';
      case 'comment':
        return '💭';
      default:
        return '🔔';
    }
  };

  const getActorId = (notification: EnrichedNotification): string | null => {
    return notification.data?.follower_id || notification.data?.actor_id || null;
  };

  const handleNotificationClick = async (notification: EnrichedNotification) => {
    // Mark as read first
    if (!notification.read) {
      await markAsRead(notification.id);
    }
    
    // Navigate based on notification type
    const actorId = getActorId(notification);
    
    if (notification.type === 'follow' && actorId) {
      navigate(`/profile/${actorId}`);
    } else if (notification.data?.post_id) {
      // Future: navigate to post
      navigate(`/post/${notification.data.post_id}`);
    } else if (actorId) {
      navigate(`/profile/${actorId}`);
    }
  };

  const handleFollowBack = async (e: React.MouseEvent, actorId: string) => {
    e.stopPropagation(); // Prevent card click
    
    const success = await followActor(actorId);
    if (success) {
      toast.success('Following!');
    } else {
      toast.error('Failed to follow');
    }
  };

  return (    <div className="bg-black px-6 pt-6 pb-24">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-4xl font-bold text-red-500">
  NOTIFICATIONS TEST
</h1>
        </div>
        
        
  {unreadCount > 0 && (
  <div className="shrink-0">
    <Button
      variant="outline"
      size="sm"
      onClick={markAllAsRead}
      className="border border-white/20 bg-black text-white hover:bg-black hover:text-emerald-400"
    >
      <Check className="w-4 h-4 mr-1" />
      Mark all read
    </Button>
  </div>
)}

      <div className="space-y-3 pb-6"></div>
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-12">
            <Bell className="w-16 h-16 text-white mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">No notifications yet</h3>
            <p className="text-white">You'll see notifications here when you get them</p>
          </div>
        ) : (
          notifications.map((notification) => {
  const actorId = getActorId(notification);
  const showFollowBack = notification.type === 'follow' && actorId && !isFollowingActor(actorId);
  const vibeColor = '#00ff88';

  return (
   <div
  key={notification.id}
  className="mb-6 cursor-pointer rounded-xl bg-black px-6 py-5 transition-colors border border-white/10"
  style={{ borderColor: 'transparent' }}
  onClick={() => handleNotificationClick(notification)}
>

                <div className="flex items-start gap-4">
                  {/* Avatar or notification icon */}
                  {notification.actorProfile ? (
                    <Avatar
  className="w-14 h-14 flex-shrink-0 border-2"
  style={{ borderColor: vibeColor }}
>
  <AvatarImage src={notification.actorProfile.avatar_url || undefined} />
  <AvatarFallback className="bg-emerald-500 text-white font-semibold">
    {notification.actorProfile.display_name?.charAt(0) || '?'}
  </AvatarFallback>
</Avatar>
                  ) : (
                    <div className="text-2xl flex-shrink-0 w-14 h-14 flex items-center justify-center rounded-full border border-white/20 bg-black text-white">
                      {getNotificationIcon(notification.type)}
                    </div>
                  )}
                  
                  <div className="flex-1 min-w-0">
                    <h4 className="text-2xl font-bold text-white">{notification.title}</h4>
                    {notification.message && (
                      <p className="mt-2 text-xl text-zinc-400">{notification.message}</p>
                    )}
                    <p className="mt-3 text-base text-zinc-500">
                      {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {/* Follow Back button */}
                    {showFollowBack && (
                      <Button
  size="sm"
  onClick={(e) => handleFollowBack(e, actorId!)}
  className="border border-emerald-500 text-emerald-400 bg-black hover:bg-emerald-500 hover:text-black px-4 py-2 text-sm"
>
  <UserPlus className="w-4 h-4 mr-2" />
  Follow
</Button>
                    )}
                    
                    {/* Following indicator (when already following) */}
                    {notification.type === 'follow' && actorId && isFollowingActor(actorId) && (
                      <span className="px-3 py-1 text-sm border border-white/20 text-white bg-black rounded-full">
  Following
</span>
                    )}
                    
                    {/* Unread indicator */}
                    {!notification.read && (
                      <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full ml-2" />
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default Notifications;
