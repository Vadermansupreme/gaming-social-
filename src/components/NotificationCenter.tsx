import { useState } from 'react';
import { Bell, Check, UserPlus, Trash2 } from "lucide-react";
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Sheet, SheetContent, SheetClose, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { useNotifications, EnrichedNotification } from '@/hooks/useNotifications';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';

interface NotificationCenterProps {
  userId?: string;
}

const NotificationCenter = ({ userId }: NotificationCenterProps) => {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const { 
    notifications, 
    loading, 
    unreadCount, 
    markAsRead, 
    markAllAsRead,
    deleteNotification,
    followActor,
    isFollowingActor
  } = useNotifications(userId);

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'spot_request':
        return '💪';
        case 'trending_spot':
  return '🔥';
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
    
    // Close sheet before navigating
    setOpen(false);
    
    if (notification.type === 'follow' && actorId) {
      navigate(`/profile/${actorId}`);
    } else if (notification.data?.post_id) {
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

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
  variant="ghost"
  size="icon"
  className="relative w-6 h-6 p-0"
>
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <Badge className="absolute -top-1 -right-1 w-5 h-5 text-xs bg-accent text-accent-foreground flex items-center justify-center p-0">
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      
      <SheetContent className="w-full sm:max-w-md bg-black border-l border-white/10 pt-16 [&>button]:hidden">
        <SheetHeader className="px-4">
  <div className="flex items-center justify-between pr-2">
    <SheetTitle className="text-white text-2xl font-bold">
      Notifications
    </SheetTitle>

    <SheetClose asChild>
  <button className="text-white/90 hover:text-white w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/10 transition -mt-1 translate-x-2">
    <span className="text-3xl leading-none">×</span>
  </button>
</SheetClose>
  </div>
</SheetHeader>

        <div className="mt-6 space-y-3 px-4">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : notifications.length === 0 ? (
            <div className="text-center py-8">
              <Bell className="w-12 h-12 text-white mx-auto mb-2" />
              <p className="text-white">No notifications yet</p>
            </div>
          ) : (
            notifications.map((notification) => {
              
              const actorId = getActorId(notification);
              const showFollowBack = notification.type === 'follow' && actorId && !isFollowingActor(actorId);
              const isTrendingSpot = notification.type === 'trending_spot';
              const vibeColors: Record<string, string> = {
  casual: '#9CA3AF',
  routine: '#3B82F6',
  driven: '#10B981',
  competitor: '#F97316',
  apex: '#EF4444',
};
              const vibeKey = ((notification.actorProfile as any)?.vibe || 'casual').toLowerCase();
const vibeColor = vibeColors[vibeKey] || '#00ff88';
const actorName = notification.actorProfile?.display_name || 'Someone';
const notificationEmoji =
  notification.type === "like"
    ? "❤️"
    : notification.type === "comment"
    ? "💬"
    : notification.type === "follow"
    ? "👤"
    : notification.type === "repost"
    ? "🔥"
    : "🔔";

const notificationText =
  notification.type === "trending_spot"
    ? notification.message?.replace(
        " is getting attention right now.",
        " is trending"
      ) || "A gym is trending"
    : notification.type === "like"
    ? `${actorName} liked your workout`
    : notification.type === "comment"
    ? `${actorName} commented on your workout`
    : notification.type === "follow"
    ? `${actorName} followed you`
    : notification.type === "repost"
    ? `${actorName} spotlighted your workout`
    : notification.message || "You have a new notification";
              return (
                <Card
  key={notification.id}
  className="group cursor-pointer rounded-none border-0 bg-transparent px-4 py-4 shadow-none transition-colors hover:bg-white/[0.03]"
  
  onClick={() => handleNotificationClick(notification)}
>
                  <div className="flex items-start gap-3">
                    {/* Actor avatar or notification icon */}
                    {notification.actorProfile ? (
                      <Avatar
  className="w-9 h-9 flex-shrink-0 border-2"
  style={{ borderColor: vibeColor }}
>
  <AvatarImage src={notification.actorProfile.avatar_url || undefined} />
  <AvatarFallback className="bg-emerald-500 text-white text-xs font-semibold">
    {notification.actorProfile.display_name?.charAt(0) || '?'}
  </AvatarFallback>
</Avatar>
                    ) : (
                      <div className="text-sm flex-shrink-0 w-9 h-9 flex items-center justify-center ...">
                        {getNotificationIcon(notification.type)}
                      </div>
                    )}
                    
                    <div className="flex-1 min-w-0 space-y-1">
                      <h4 className="text-sm font-semibold leading-snug text-white">
  <span>{notificationText}</span>
</h4>
                      {notification.type !== "trending_spot" &&
  notification.message &&
  notification.message !== notificationText && (
    <p className="mt-1 text-sm text-white/65">
      {notification.message}
    </p>
  )}
                      <p className="mt-1 text-xs text-white">
                        {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                      </p>
                    </div>
                    
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button
  type="button"
  onClick={(e) => {
    e.stopPropagation();
    deleteNotification(notification.id);
  }}
  className="opacity-0 group-hover:opacity-100 transition-opacity text-zinc-500 hover:text-red-500 p-2"
  aria-label="Delete notification"
>
  <Trash2 className="h-4 w-4" />
</button>
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
                      
                      {/* Following indicator */}
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
                </Card>
              );
            })
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default NotificationCenter;
