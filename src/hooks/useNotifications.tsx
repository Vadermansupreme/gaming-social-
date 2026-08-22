import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface Notification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  message?: string;
  read: boolean;
  data?: any;
  created_at: string;
}

export interface ActorProfile {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  vibe?: string | null;
}

export interface EnrichedNotification extends Notification {
  actorProfile?: ActorProfile;
}

export const useNotifications = (userId?: string) => {
  const [notifications, setNotifications] = useState<EnrichedNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const [followingActorIds, setFollowingActorIds] = useState<Set<string>>(new Set());

  // Fetch actor profiles for notifications
  const fetchActorProfiles = useCallback(async (actorIds: string[]): Promise<Map<string, ActorProfile>> => {
    if (actorIds.length === 0) return new Map();
    
    try {
      const { data, error } = await supabase
        .from('public_profiles')
        .select('id, display_name, avatar_url, vibe')
        .in('id', actorIds);
      
      if (error) throw error;
      
      const profileMap = new Map<string, ActorProfile>();
      (data || []).forEach(profile => {
        profileMap.set(profile.id, profile);
      });
      return profileMap;
    } catch (error) {
      console.error('Error fetching actor profiles:', error);
      return new Map();
    }
  }, []);

  // Fetch which actors the current user is following
  const fetchFollowingState = useCallback(async (currentUserId: string, actorIds: string[]): Promise<Set<string>> => {
    if (actorIds.length === 0) return new Set();
    
    try {
      const { data, error } = await supabase
        .from('follows')
        .select('followed_id')
        .eq('follower_id', currentUserId)
        .in('followed_id', actorIds);
      
      if (error) throw error;
      
      return new Set((data || []).map(f => f.followed_id));
    } catch (error) {
      console.error('Error fetching following state:', error);
      return new Set();
    }
  }, []);

  // Follow an actor (optimistic update)
  const followActor = useCallback(async (actorId: string) => {
    if (!userId) return false;
    
    // Optimistically update UI
    setFollowingActorIds(prev => new Set([...prev, actorId]));
    
    try {
      const { error } = await supabase
        .from('follows')
        .insert({ follower_id: userId, followed_id: actorId });
      
      // Ignore duplicate key errors (already following)
      if (error && !error.message.includes('duplicate')) {
        throw error;
      }
      
      return true;
    } catch (error) {
      console.error('Error following actor:', error);
      // Revert optimistic update on error
      setFollowingActorIds(prev => {
        const next = new Set(prev);
        next.delete(actorId);
        return next;
      });
      return false;
    }
  }, [userId]);

  useEffect(() => {
    if (!userId) return;

    // Fetch existing notifications
    const fetchNotifications = async () => {
      try {
        const { data, error } = await supabase
          .from('notifications')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(50);

        if (error) throw error;
        
        const notifs = data || [];
        
        // Helper to safely extract actor ID from notification data
        const getActorIdFromData = (notifData: any): string | null => {
          if (!notifData || typeof notifData !== 'object') return null;
          return notifData.follower_id || notifData.actor_id || null;
        };
        
        // Extract unique actor IDs from notification data
        const actorIds = new Set<string>();
        notifs.forEach(n => {
          const actorId = getActorIdFromData(n.data);
          if (actorId) {
            actorIds.add(actorId);
          }
        });
        
        const actorIdArray = Array.from(actorIds);
        
        // Fetch actor profiles and following state in parallel
        const [profileMap, followingSet] = await Promise.all([
          fetchActorProfiles(actorIdArray),
          fetchFollowingState(userId, actorIdArray)
        ]);
        
        // Enrich notifications with actor profiles
        const enrichedNotifs: EnrichedNotification[] = notifs.map(n => {
          const actorId = getActorIdFromData(n.data);
          return {
            ...n,
            actorProfile: actorId ? profileMap.get(actorId) : undefined
          };
        });
        
        setNotifications(enrichedNotifs);
        setUnreadCount(enrichedNotifs.filter(n => !n.read).length);
        setFollowingActorIds(followingSet);
      } catch (error) {
        console.error('Error fetching notifications:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();

    // Subscribe to real-time updates
    const channel = supabase
      .channel(`notifications:${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`
        },
        async (payload) => {
          if (payload.eventType === 'INSERT') {
            const newNotif = payload.new as Notification;
            
            // Safely extract actor ID from notification data
            const notifData = newNotif.data as any;
            const actorId = (notifData?.follower_id || notifData?.actor_id) as string | undefined;
            let actorProfile: ActorProfile | undefined;
            
            if (actorId) {
              const profileMap = await fetchActorProfiles([actorId]);
              actorProfile = profileMap.get(actorId);
            }
            
            const enrichedNotif: EnrichedNotification = {
              ...newNotif,
              actorProfile
            };
            
            setNotifications(prev => [enrichedNotif, ...prev]);
            setUnreadCount(prev => prev + 1);
          } else if (payload.eventType === 'UPDATE') {
            const updatedNotif = payload.new as Notification;
            setNotifications(prev => prev.map(notif => 
              notif.id === updatedNotif.id 
                ? { ...notif, ...updatedNotif }
                : notif
            ));
            if (updatedNotif.read) {
              setUnreadCount(prev => Math.max(0, prev - 1));
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, fetchActorProfiles, fetchFollowingState]);

  const markAsRead = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', notificationId);

      if (error) throw error;
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };
const deleteNotification = async (notificationId: string) => {
  try {
    const { error } = await supabase
      .from("notifications")
      .delete()
      .eq("id", notificationId);

    if (error) throw error;

    setNotifications((prev) =>
      prev.filter((notification) => notification.id !== notificationId)
    );
  } catch (error) {
    console.error("Error deleting notification:", error);
  }
};
  const markAllAsRead = async () => {
    if (!userId) return;

    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', userId)
        .eq('read', false);

      if (error) throw error;
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  // Check if user is following a specific actor
  const isFollowingActor = useCallback((actorId: string) => {
    return followingActorIds.has(actorId);
  }, [followingActorIds]);

  return {
    notifications,
    loading,
    unreadCount,
    markAsRead,
    deleteNotification,
    markAllAsRead,
    followActor,
    isFollowingActor
  };
};
