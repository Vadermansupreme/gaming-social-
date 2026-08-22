import { formatDistanceToNow, differenceInMinutes } from "date-fns";

export const formatLastSeen = (lastSeenAt: string | null): string => {
  if (!lastSeenAt) return "Offline";

  const lastSeenDate = new Date(lastSeenAt);
  const minutesAgo = differenceInMinutes(new Date(), lastSeenDate);

  // Active now if seen within 5 minutes
  if (minutesAgo < 5) {
    return "Active now";
  }

  // Use relative time for recent activity
  return `Last seen ${formatDistanceToNow(lastSeenDate, { addSuffix: false })} ago`;
};

export const isActiveNow = (lastSeenAt: string | null): boolean => {
  if (!lastSeenAt) return false;
  const minutesAgo = differenceInMinutes(new Date(), new Date(lastSeenAt));
  return minutesAgo < 5;
};
