import {
  useState,
  useEffect,
  useCallback,
} from "react";

import { supabase } from "@/integrations/supabase/client";

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

export interface EnrichedNotification
  extends Notification {
  actorProfile?: ActorProfile;
}

type DatabaseNotification = {
  id: string;
  user_id: string;
  actor_id: string | null;
  type: string;
  message: string | null;
  is_read: boolean;
  related_id: string | null;
  link: string | null;
  created_at: string;
};

const getNotificationTitle = (
  type: string
) => {
  switch (type) {
    case "follow":
      return "New follower";

    case "follow_request":
      return "New follow request";

    case "follow_accepted":
      return "Follow request accepted";

    case "like":
      return "New like";

    case "comment":
      return "New comment";

    case "message":
      return "New message";

    default:
      return "Notification";
  }
};

const convertNotification = (
  row: DatabaseNotification
): Notification => {
  return {
    id: row.id,

    user_id: row.user_id,

    type: row.type,

    title: getNotificationTitle(
      row.type
    ),

    message:
      row.message || undefined,

    read: row.is_read,

    data: {
      actor_id: row.actor_id,
      related_id: row.related_id,
      link: row.link,
    },

    created_at: row.created_at,
  };
};

export const useNotifications = (
  userId?: string
) => {
  const [
    notifications,
    setNotifications,
  ] = useState<
    EnrichedNotification[]
  >([]);

  const [loading, setLoading] =
    useState(true);

  const [
    unreadCount,
    setUnreadCount,
  ] = useState(0);

  const [
    followingActorIds,
    setFollowingActorIds,
  ] = useState<Set<string>>(
    new Set()
  );

  // Get the profiles belonging to
  // people who triggered notifications
  const fetchActorProfiles =
    useCallback(
      async (
        actorIds: string[]
      ): Promise<
        Map<
          string,
          ActorProfile
        >
      > => {
        if (
          actorIds.length === 0
        ) {
          return new Map();
        }

        try {
          const {
            data,
            error,
          } = await supabase
            .from("profiles")
            .select(
              "id, display_name, avatar_url"
            )
            .in(
              "id",
              actorIds
            );

          if (error) {
            throw error;
          }

          const profileMap =
            new Map<
              string,
              ActorProfile
            >();

          (data || []).forEach(
            (profile) => {
              profileMap.set(
                profile.id,
                {
                  id: profile.id,

                  display_name:
                    profile.display_name,

                  avatar_url:
                    profile.avatar_url,
                }
              );
            }
          );

          return profileMap;
        } catch (error) {
          console.error(
            "Error fetching actor profiles:",
            error
          );

          return new Map();
        }
      },
      []
    );

  // Check which notification actors
  // the current user already follows
  const fetchFollowingState =
    useCallback(
      async (
        currentUserId: string,
        actorIds: string[]
      ): Promise<
        Set<string>
      > => {
        if (
          actorIds.length === 0
        ) {
          return new Set();
        }

        try {
          const {
            data,
            error,
          } = await supabase
            .from("follows")
            .select(
              "following_id"
            )
            .eq(
              "follower_id",
              currentUserId
            )
            .in(
              "following_id",
              actorIds
            );

          if (error) {
            throw error;
          }

          return new Set(
            (data || []).map(
              (follow) =>
                follow.following_id
            )
          );
        } catch (error) {
          console.error(
            "Error fetching following state:",
            error
          );

          return new Set();
        }
      },
      []
    );

  // Follow somebody directly from
  // the Notification Center
  const followActor =
    useCallback(
      async (
        actorId: string
      ) => {
        if (!userId) {
          return false;
        }

        setFollowingActorIds(
          (prev) =>
            new Set([
              ...prev,
              actorId,
            ])
        );

        try {
          const { error } =
            await supabase
              .from("follows")
              .insert({
                follower_id:
                  userId,

                following_id:
                  actorId,
              });

          if (
            error &&
            error.code !==
              "23505"
          ) {
            throw error;
          }

          return true;
        } catch (error) {
          console.error(
            "Error following actor:",
            error
          );

          setFollowingActorIds(
            (prev) => {
              const next =
                new Set(prev);

              next.delete(
                actorId
              );

              return next;
            }
          );

          return false;
        }
      },
      [userId]
    );

  useEffect(() => {
    if (!userId) {
      setNotifications([]);
      setUnreadCount(0);
      setLoading(false);

      return;
    }

    const fetchNotifications =
      async () => {
        try {
          setLoading(true);

          const {
            data,
            error,
          } = await (
            supabase as any
          )
            .from(
              "notifications"
            )
            .select("*")
            .eq(
              "user_id",
              userId
            )
            .order(
              "created_at",
              {
                ascending:
                  false,
              }
            )
            .limit(50);

          if (error) {
            throw error;
          }

          const rows =
            (data ||
              []) as DatabaseNotification[];

          const actorIds =
            Array.from(
              new Set(
                rows
                  .map(
                    (row) =>
                      row.actor_id
                  )
                  .filter(
                    (
                      id
                    ): id is string =>
                      !!id
                  )
              )
            );

          const [
            profileMap,
            followingSet,
          ] =
            await Promise.all([
              fetchActorProfiles(
                actorIds
              ),

              fetchFollowingState(
                userId,
                actorIds
              ),
            ]);

          const enriched:
            EnrichedNotification[] =
            rows.map(
              (row) => {
                const notification =
                  convertNotification(
                    row
                  );

                return {
                  ...notification,

                  actorProfile:
                    row.actor_id
                      ? profileMap.get(
                          row.actor_id
                        )
                      : undefined,
                };
              }
            );

          setNotifications(
            enriched
          );

          setUnreadCount(
            enriched.filter(
              (notification) =>
                !notification.read
            ).length
          );

          setFollowingActorIds(
            followingSet
          );
        } catch (error) {
          console.error(
            "Error fetching notifications:",
            error
          );
        } finally {
          setLoading(false);
        }
      };

    fetchNotifications();

    // Listen for live notification changes
    const channel = supabase
      .channel(
        `notifications:${userId}`
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table:
            "notifications",
          filter: `user_id=eq.${userId}`,
        },
        async (
          payload
        ) => {
          if (
            payload.eventType ===
            "INSERT"
          ) {
            const row =
              payload.new as DatabaseNotification;

            const notification =
              convertNotification(
                row
              );

            let actorProfile:
              | ActorProfile
              | undefined;

            if (
              row.actor_id
            ) {
              const profileMap =
                await fetchActorProfiles(
                  [
                    row.actor_id,
                  ]
                );

              actorProfile =
                profileMap.get(
                  row.actor_id
                );
            }

            const enrichedNotification:
              EnrichedNotification =
              {
                ...notification,

                actorProfile,
              };

            setNotifications(
              (prev) => [
                enrichedNotification,
                ...prev,
              ]
            );

            if (
              !notification.read
            ) {
              setUnreadCount(
                (prev) =>
                  prev + 1
              );
            }
          }

          if (
            payload.eventType ===
            "UPDATE"
          ) {
            const row =
              payload.new as DatabaseNotification;

            const updated =
              convertNotification(
                row
              );

            setNotifications(
              (prev) =>
                prev.map(
                  (
                    notification
                  ) =>
                    notification.id ===
                    updated.id
                      ? {
                          ...notification,
                          ...updated,
                        }
                      : notification
                )
            );

            setUnreadCount(
              (prev) => {
                const unread =
                  notifications.filter(
                    (notification) =>
                      notification.id ===
                      updated.id
                        ? !updated.read
                        : !notification.read
                  ).length;

                return unread;
              }
            );
          }

          if (
            payload.eventType ===
            "DELETE"
          ) {
            const deletedId =
              (
                payload.old as {
                  id?: string;
                }
              ).id;

            if (
              deletedId
            ) {
              setNotifications(
                (prev) =>
                  prev.filter(
                    (
                      notification
                    ) =>
                      notification.id !==
                      deletedId
                  )
              );
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(
        channel
      );
    };
  }, [
    userId,
    fetchActorProfiles,
    fetchFollowingState,
  ]);

  const markAsRead =
    async (
      notificationId: string
    ) => {
      try {
        const { error } =
          await (
            supabase as any
          )
            .from(
              "notifications"
            )
            .update({
              is_read: true,
            })
            .eq(
              "id",
              notificationId
            );

        if (error) {
          throw error;
        }

        setNotifications(
          (prev) =>
            prev.map(
              (
                notification
              ) =>
                notification.id ===
                notificationId
                  ? {
                      ...notification,

                      read: true,
                    }
                  : notification
            )
        );

        setUnreadCount(
          (prev) =>
            Math.max(
              0,
              prev - 1
            )
        );
      } catch (error) {
        console.error(
          "Error marking notification as read:",
          error
        );
      }
    };

  const deleteNotification =
    async (
      notificationId: string
    ) => {
      try {
        const { error } =
          await (
            supabase as any
          )
            .from(
              "notifications"
            )
            .delete()
            .eq(
              "id",
              notificationId
            );

        if (error) {
          throw error;
        }

        setNotifications(
          (prev) =>
            prev.filter(
              (
                notification
              ) =>
                notification.id !==
                notificationId
            )
        );
      } catch (error) {
        console.error(
          "Error deleting notification:",
          error
        );
      }
    };

  const markAllAsRead =
    async () => {
      if (!userId) {
        return;
      }

      try {
        const { error } =
          await (
            supabase as any
          )
            .from(
              "notifications"
            )
            .update({
              is_read: true,
            })
            .eq(
              "user_id",
              userId
            )
            .eq(
              "is_read",
              false
            );

        if (error) {
          throw error;
        }

        setNotifications(
          (prev) =>
            prev.map(
              (
                notification
              ) => ({
                ...notification,

                read: true,
              })
            )
        );

        setUnreadCount(0);
      } catch (error) {
        console.error(
          "Error marking all notifications as read:",
          error
        );
      }
    };

  const isFollowingActor =
    useCallback(
      (
        actorId: string
      ) => {
        return followingActorIds.has(
          actorId
        );
      },
      [
        followingActorIds,
      ]
    );

  return {
    notifications,
    loading,
    unreadCount,
    markAsRead,
    deleteNotification,
    markAllAsRead,
    followActor,
    isFollowingActor,
  };
};