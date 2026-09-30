import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import SocialPost from "@/components/SocialPost";

interface CommunityData {
  id: string;
  name: string;
  slug: string;
  description: string;
  image_url: string | null;
  category: string;
  member_count: number;
}
interface CommunityDiscussion {
  id: string;
  text: string | null;
  created_at: string;
  author_id: string;
  like_count?: number;
  comment_count?: number;
  media_urls?: string[] | null;
  repost_of?: string | null;
  community?: {
  name: string;
  slug: string;
} | null;
  author: {
    display_name: string;
    avatar_url?: string | null;
    verified?: boolean;
  };
}
const Community = () => {
  const { slug } = useParams<{ slug: string }>();
  const [community, setCommunity] = useState<CommunityData | null>(null);
const [loading, setLoading] = useState(true);
const [isMember, setIsMember] = useState(false);
const [membershipLoading, setMembershipLoading] = useState(false);
const [newDiscussion, setNewDiscussion] = useState("");
const [postingDiscussion, setPostingDiscussion] = useState(false);
const [discussions, setDiscussions] = useState<CommunityDiscussion[]>([]);
const [currentUserId, setCurrentUserId] = useState<string>();
useEffect(() => {
  const fetchCommunity = async () => {
    if (!slug) {
      setLoading(false);
      return;
    }

    setLoading(true);

    const { data, error } = await (supabase as any)
      .from("communities")
      .select(
        "id, name, slug, description, image_url, category, member_count"
      )
      .eq("slug", slug)
      .single();

    if (error) {
      console.error("Error loading community:", error);
      setCommunity(null);
    } else {
      setCommunity(data as CommunityData);
    }

    setLoading(false);
  };

  fetchCommunity();
}, [slug]);
useEffect(() => {
  const checkMembership = async () => {
    if (!community) return;

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;
    setCurrentUserId(user.id);

    const { data, error } = await (supabase as any)
      .from("community_members")
      .select("community_id")
      .eq("community_id", community.id)
      .eq("user_id", user.id)
      .maybeSingle();

    if (error) {
      console.error("Error checking community membership:", error);
      return;
    }

    setIsMember(Boolean(data));
  };

  checkMembership();
}, [community]);
useEffect(() => {
  const fetchDiscussions = async () => {
    if (!community) return;

    const { data, error } = await (supabase as any)
      .from("posts")
      .select(`
  id,
  text,
  created_at,
  author_id,
  like_count,
  comment_count,
  media_urls,
  repost_of,
  community:communities (
  name,
  slug
),
  
  author:profiles (
    display_name,
    avatar_url
  )
`)
      .eq("community_id", community.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error loading community discussions:", error);
      return;
    }

    setDiscussions((data ?? []) as CommunityDiscussion[]);
  };

  fetchDiscussions();
}, [community]);
const handleMembership = async () => {
  if (!community || membershipLoading) return;

  setMembershipLoading(true);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    setMembershipLoading(false);
    return;
  }

  const { error } = isMember
    ? await (supabase as any)
        .from("community_members")
        .delete()
        .eq("community_id", community.id)
        .eq("user_id", user.id)
    : await (supabase as any).from("community_members").insert({
        community_id: community.id,
        user_id: user.id,
      });

  if (error) {
    console.error("Error updating community membership:", error);
  } else {
    setIsMember(!isMember);
    setCommunity((current) =>
      current
        ? {
            ...current,
            member_count: Math.max(
              0,
              current.member_count + (isMember ? -1 : 1)
            ),
          }
        : current
    );
  }

  setMembershipLoading(false);
};
const handleCreateDiscussion = async () => {
  if (
    !community ||
    !isMember ||
    !newDiscussion.trim() ||
    postingDiscussion
  ) {
    return;
  }

  setPostingDiscussion(true);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    setPostingDiscussion(false);
    return;
  }

  const { data, error } = await (supabase as any)
  .from("posts")
  .insert({
    author_id: user.id,
    text: newDiscussion.trim(),
    media_urls: null,
    community_id: community.id,
  })
  .select(`
  id,
  text,
  created_at,
  author_id,
  like_count,
  comment_count,
  media_urls,
  repost_of,
  community:communities (
    name,
    slug
  ),
  author:profiles (
    display_name,
    avatar_url
  )
`)
  .single();

  if (error) {
    console.error("Error creating community discussion:", error);
  } else {
    setNewDiscussion("");
    setDiscussions((current) => [
  data as CommunityDiscussion,
  ...current,
]);
  }

  setPostingDiscussion(false);
};

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="mx-auto max-w-4xl px-4 py-8">
        {loading ? (
  <p className="text-zinc-400">Loading community...</p>
) : community ? (
  <div className="rounded-3xl border border-purple-500/20 bg-gradient-to-br from-purple-950/60 via-zinc-950 to-cyan-950/30 p-6 shadow-xl shadow-purple-950/20">
    {community.image_url ? (
  <img
    src={community.image_url}
    alt={community.name}
    className="mb-5 h-20 w-20 rounded-2xl border border-white/10 object-cover"
  />
) : (
  <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-2xl border border-purple-400/30 bg-purple-500/20 text-3xl font-bold">
    {community.name.charAt(0)}
  </div>
)}
    <p className="text-sm font-medium text-cyan-400">
      {community.category}
    </p>
    <h1 className="mt-2 text-2xl font-bold">{community.name}</h1>
    <p className="mt-3 text-zinc-400">{community.description}</p>
    <p className="mt-4 text-sm text-zinc-500">
      {community.member_count.toLocaleString()}{" "}
{community.member_count === 1 ? "member" : "members"}
    </p>
    <button
  type="button"
  onClick={handleMembership}
  disabled={membershipLoading}
  className={`mt-6 rounded-xl px-5 py-2.5 text-sm font-semibold transition ${
    isMember
      ? "border border-white/15 bg-white/5 text-white hover:bg-white/10"
      : "bg-gradient-to-r from-purple-500 to-cyan-400 text-black hover:opacity-90"
  } disabled:cursor-not-allowed disabled:opacity-50`}
>
  {membershipLoading ? "Please wait..." : isMember ? "Joined" : "Join community"}
</button>
{isMember ? (
  <div className="mt-6 border-t border-white/10 pt-6">
    <h2 className="text-lg font-semibold">Start a discussion</h2>
    <p className="mt-1 text-sm text-zinc-500">
      Share something with the {community.name} community.
    </p>

    <textarea
      value={newDiscussion}
      onChange={(event) => setNewDiscussion(event.target.value)}
      placeholder="What do you want to discuss?"
      rows={4}
      className="mt-4 w-full resize-none rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none transition placeholder:text-zinc-600 focus:border-cyan-400/50"
    />

    <button
      type="button"
      onClick={handleCreateDiscussion}
      disabled={!newDiscussion.trim() || postingDiscussion}
      className="mt-3 rounded-xl bg-gradient-to-r from-purple-500 to-cyan-400 px-5 py-2.5 text-sm font-semibold text-black transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
    >
      {postingDiscussion ? "Posting..." : "Post discussion"}
    </button>
  </div>
) : (
  <p className="mt-6 border-t border-white/10 pt-5 text-sm text-zinc-500">
    Join this community to start a discussion.
  </p>
)}
{discussions.length > 0 && (
  <div className="mt-8 border-t border-white/10 pt-6">
    <h2 className="text-lg font-semibold">Community discussions</h2>

    <div className="mt-4 space-y-3">
      {discussions.map((discussion) => (
        <SocialPost
  key={discussion.id}
  post={discussion}
  currentUserId={currentUserId}
  defaultShowComments
  canParticipate={isMember}
  onDelete={() =>
    setDiscussions((current) =>
      current.filter((item) => item.id !== discussion.id)
    )
  }
/>
      ))}
    </div>
  </div>
)}
  </div>
) : (
  <h1 className="text-2xl font-bold">Community not found</h1>
)}
      </div>
    </div>
  );
};

export default Community;