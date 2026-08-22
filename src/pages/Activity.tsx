import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

type ActivityItem = {
  id: string;
  created_at: string;
  user_id: string;
  post_id: string;
  type: "like" | "repost";
};

export default function Activity() {
  const [activity, setActivity] = useState<ActivityItem[]>([]);

  useEffect(() => {
    fetchActivity();
  }, []);

  const fetchActivity = async () => {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return;


  const { data: likes, error: likesError } = await (supabase as any)
  .from("likes")
  .select("id, created_at, user_id, post_id")
  .eq("user_id", user.id)
  .order("created_at", { ascending: false });

  const { data: reposts, error: repostsError } = await (supabase as any)
  .from("reposts")
  .select("id, created_at, user_id, post_id")
  .eq("user_id", user.id)
  .order("created_at", { ascending: false });

  if (likesError || repostsError) {
    console.error("Error loading activity:", likesError || repostsError);
    return;
  }

  const combined: ActivityItem[] = [
    ...((likes || []) as any[]).map((item: any) => ({
      id: item.id,
      created_at: item.created_at,
      user_id: item.user_id,
      post_id: item.post_id,
      type: "like" as const,
    })),
    ...((reposts || []) as any[]).map((item: any) => ({
      id: item.id,
      created_at: item.created_at,
      user_id: item.user_id,
      post_id: item.post_id,
      type: "repost" as const,
    })),
  ];

  combined.sort(
    (a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  setActivity(combined);
};

  return (
    <div className="min-h-screen bg-black text-white px-4 py-6">
      <h1 className="text-2xl font-semibold mb-4">Activity</h1>

      <div className="space-y-3">
        {activity.length === 0 ? (
          <div className="text-gray-400">No activity yet.</div>
        ) : (
          activity.map((item) => (
            <div
              key={`${item.type}-${item.id}`}
              className="rounded-xl border border-white/20 bg-black px-4 py-3"
            >
              {item.type === "like" ? (
  <span>❤️ You liked a post</span>
) : (
  <span>🔁 You reposted a post</span>
)}
            </div>
          ))
        )}
      </div>
    </div>
  );
}