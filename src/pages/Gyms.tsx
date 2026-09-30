




import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  Compass,
  Gamepad2,
  Loader2,
  MessageCircle,
  Search,
  Users,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
type DiscoverTab = "people" | "explore";
type GameCategory = "Action" | "Battle Royale" | "Sports" | "Sandbox";
interface Player {
  id: string;
  displayName: string;
  username: string;
  avatarUrl: string;
}
interface Game {
  id: string;
  name: string;
  category: GameCategory;
  posts: string;
  players: string;
  coverUrl?: string;
  trend?: string;
  trendType?: "primary" | "hot" | "growth";
}

interface Community {
  id: string;
  name: string;
  slug: string;
  description: string;
  image_url: string | null;
  category: string;
  member_count: number;
}
interface Discussion {
  id: string;
  tag: string;
  title: string;
  preview: string;
  author: string;
  age: string;
  votes: string;
  comments: string;
  image: string;
}
const discussions: Discussion[] = [
  {
    id: "games-and-perspective",
    tag: "Discussion",
    title: "What game taught you the most about yourself?",
    preview:
      "Not just fun, but a game that genuinely changed your perspective, habits, or how you see the world.",
    author: "Nova",
    age: "8h ago",
    votes: "2.4K",
    comments: "412 comments",
    image: "/game-covers/apex-legends.jpg",
  },
  {
    id: "gaming-motivation",
    tag: "Question",
    title: "How do you stay motivated to game these days?",
    preview:
      "Between work, life, and everything else, what keeps you coming back: routines, friends, or certain genres?",
    author: "Kai",
    age: "1d ago",
    votes: "1.1K",
    comments: "268 comments",
    image: "/game-covers/fortnite.jpg",
  },
  {
    id: "small-communities",
    tag: "Culture",
    title: "The rise of smaller gaming communities is a win",
    preview:
      "Indie games and niche communities are creating some of the most welcoming spaces online right now.",
    author: "Rift",
    age: "2d ago",
    votes: "876",
    comments: "193 comments",
    image: "/game-covers/minecraft.jpg",
  },
];
const interests = [
  "Action",
  "RPG",
  "Sports",
  "Indie",
  "Horror",
  "Cozy",
  "Esports",
  "Retro",
];
const games: Game[] = [
  {
    id: "call-of-duty",
    name: "Call of Duty",
    category: "Action",
    posts: "142K posts",
    players: "12.4K players",
    coverUrl: "/game-covers/call-of-duty.png",
    trend: "#1 trending",
    trendType: "primary",
  },
  {
    id: "fortnite",
    name: "Fortnite",
    category: "Battle Royale",
    posts: "128K posts",
    players: "15.7K players",
    coverUrl: "/game-covers/fortnite.jpg",
    trend: "Trending",
    trendType: "hot",
  },
  {
    id: "apex-legends",
    name: "Apex Legends",
    category: "Battle Royale",
    posts: "96K posts",
    players: "11.2K players",
    coverUrl: "/game-covers/apex-legends.jpg",
    trend: "+12%",
    trendType: "growth",
  },
  {
    id: "minecraft",
    name: "Minecraft",
    category: "Sandbox",
    posts: "74K posts",
    players: "18.6K players",
    coverUrl: "/game-covers/minecraft.jpg",
    trend: "Trending",
    trendType: "primary",
  },
  {
    id: "madden",
    name: "Madden NFL",
    category: "Sports",
    posts: "68K posts",
    players: "9.3K players",
    coverUrl: "/game-covers/madden-nfl.jpg",
    trend: "+8%",
    trendType: "growth",
  },
  {
    id: "nba-2k",
    name: "NBA 2K",
    category: "Sports",
    posts: "52K posts",
    players: "8.1K players",
    coverUrl: "/game-covers/nba-2k.jpg",
    trend: "+6%",
    trendType: "growth",
  },
];
const Gyms = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<DiscoverTab>("people");
  const [searchQuery, setSearchQuery] = useState("");
  const [players, setPlayers] = useState<Player[]>([]);
  const [loadingPlayers, setLoadingPlayers] = useState(true);
  const [trendingDiscussions, setTrendingDiscussions] =
  useState<Discussion[]>(discussions);
  const [communities, setCommunities] = useState<Community[]>([]);
  useEffect(() => {
    const fetchPlayers = async () => {
      setLoadingPlayers(true);
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        let query = supabase
          .from("profiles")
          .select("id, display_name, username, avatar_url")
          .limit(12);
        if (user) {
          query = query.neq("id", user.id);
        }
        const { data, error } = await query;
        if (error) throw error;
        setPlayers(
          (data || []).map((profile) => ({
            id: profile.id,
            displayName:
              profile.display_name || profile.username || "Bit member",
            username: profile.username || "",
            avatarUrl: profile.avatar_url || "",
          }))
        );
      } catch (error) {
        console.error("Error loading players:", error);
      } finally {
        setLoadingPlayers(false);
      }
    };
    fetchPlayers();
  }, []);

  useEffect(() => {
  const fetchCommunities = async () => {
    const { data, error } = await (supabase as any)
      .from("communities")
      .select(
        "id, name, slug, description, image_url, category, member_count"
      )
      .order("member_count", { ascending: false })
      .limit(3);

    if (error) {
      console.error("Error loading communities:", error);
      return;
    }

    setCommunities((data ?? []) as Community[]);
  };

  fetchCommunities();
}, []);
  useEffect(() => {
  const fetchTrendingDiscussions = async () => {
    try {
      const { data, error } = await (supabase as any)
        .from("posts")
        .select(`
          id,
          text,
          created_at,
          media_urls,
          like_count,
          comment_count,
          author:profiles (
            display_name,
            avatar_url
          )
        `)
        .not("text", "is", null)
        .is("repost_of", null)
        .order("like_count", { ascending: false })
        .limit(3);

      if (error) throw error;
      if (!data?.length) return;

      const mappedDiscussions: Discussion[] = data.map((post: any) => {
        const text = post.text?.trim() || "Untitled discussion";
        const author = Array.isArray(post.author)
          ? post.author[0]
          : post.author;
        const mediaUrl = post.media_urls?.[0];
        const isVideo = /\.(mp4|webm|mov)(\?|$)/i.test(mediaUrl || "");

        return {
          id: post.id,
          tag: "Discussion",
          title: text.length > 85 ? `${text.slice(0, 85)}…` : text,
          preview: text,
          author: author?.display_name || "Bit member",
          age: new Date(post.created_at).toLocaleDateString(undefined, {
            month: "short",
            day: "numeric",
          }),
          votes: String(post.like_count || 0),
          comments: `${post.comment_count || 0} comments`,
          image:
            mediaUrl && !isVideo
              ? mediaUrl
              : "/game-covers/apex-legends.jpg",
        };
      });

      setTrendingDiscussions(mappedDiscussions);
    } catch (error) {
      console.error("Error loading trending discussions:", error);
    }
  };

  fetchTrendingDiscussions();
}, []);
  const filteredPlayers = useMemo(() => {
    const term = searchQuery.trim().toLowerCase();
    if (!term) return players;
    return players.filter(
      (player) =>
        player.displayName.toLowerCase().includes(term) ||
        player.username.toLowerCase().includes(term)
    );
  }, [players, searchQuery]);
  const filteredGames = useMemo(() => {
    const term = searchQuery.trim().toLowerCase();
    if (!term) return games;
    return games.filter(
      (game) =>
        game.name.toLowerCase().includes(term) ||
        game.category.toLowerCase().includes(term),
    );
  }, [searchQuery]);

  const filteredDiscussions = useMemo(() => {
  const term = searchQuery.trim().toLowerCase();
  if (!term) return trendingDiscussions;

  return trendingDiscussions.filter(
    (discussion) =>
      discussion.title.toLowerCase().includes(term) ||
      discussion.preview.toLowerCase().includes(term) ||
      discussion.tag.toLowerCase().includes(term),
  );
}, [searchQuery, trendingDiscussions]);
  const selectTab = (tab: DiscoverTab) => {
    setActiveTab(tab);
    setSearchQuery("");
  };
  return (
    <div className="relative min-h-screen overflow-hidden bg-background pb-20">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[420px] overflow-hidden">
        <div className="absolute -left-24 top-12 h-72 w-72 rounded-full bg-violet-700/15 blur-[120px]" />
        <div className="absolute right-0 top-0 h-80 w-80 rounded-full bg-cyan-500/10 blur-[140px]" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/40 to-background" />
      </div>
      <main className="relative mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="mb-6 flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-muted-foreground transition hover:bg-white/5 hover:text-foreground"
        >
          <ArrowLeft className="h-5 w-5" />
          Back
        </button>
        <section className="mb-8">
          <h1 className="bg-gradient-to-r from-white via-violet-400 to-cyan-400 bg-clip-text text-5xl font-black tracking-tight text-transparent sm:text-6xl">
            Discover
          </h1>
          <p className="mt-2 text-lg text-muted-foreground">
            Find conversations, communities, and people.
          </p>
        </section>
        <section className="mb-7 grid gap-3 lg:grid-cols-[1.6fr_1fr]">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder={
                activeTab === "people"
                  ? "Search people"
                  : "Search Bit"
              }
              className="h-14 rounded-2xl border border-white/10 bg-white/[0.03] pl-12 text-base text-foreground shadow-inner shadow-black/20 transition focus-visible:border-violet-400/60 focus-visible:ring-2 focus-visible:ring-violet-500/20"
            />
          </div>
          <div className="grid grid-cols-2 gap-2 rounded-2xl border border-white/10 bg-white/[0.03] p-1">
            <button
              type="button"
              onClick={() => selectTab("people")}
              className={`flex h-12 items-center justify-center gap-2 rounded-xl font-semibold transition-all ${
                activeTab === "people"
                  ? "bg-gradient-to-r from-violet-600 to-cyan-500 text-white shadow-lg shadow-violet-950/30"
                  : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
              }`}
            >
              <Users className="h-4 w-4" />
              People
            </button>
            <button
              type="button"
              onClick={() => selectTab("explore")}
              className={`flex h-12 items-center justify-center gap-2 rounded-xl font-semibold transition-all ${
                activeTab === "explore"
                  ? "bg-gradient-to-r from-violet-600 to-cyan-500 text-white shadow-lg shadow-violet-950/30"
                  : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
              }`}
            >
              <Gamepad2 className="h-4 w-4" />
              Explore
            </button>
          </div>
        </section>
        {activeTab === "people" ? (
          <section>
            <div className="mb-5 flex items-end justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-violet-400">
                  Meet the community
                </p>
                <h2 className="mt-1 text-2xl font-bold tracking-tight text-foreground">
                  Discover people
                </h2>
              </div>
              <span className="text-sm text-muted-foreground">
                {filteredPlayers.length}{" "}
{filteredPlayers.length === 1 ? "person" : "people"}
              </span>
            </div>
            {loadingPlayers ? (
              <div className="flex justify-center py-16">
                <Loader2 className="h-7 w-7 animate-spin text-violet-400" />
              </div>
            ) : filteredPlayers.length > 0 ? (
              <div className="grid gap-5 md:grid-cols-2">
                {filteredPlayers.map((player) => (
                  <article
                    key={player.id}
                    className="group relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-slate-900 via-[#10131d] to-[#080a0f] p-5 shadow-lg shadow-black/25 transition-all duration-300 hover:-translate-y-1 hover:border-violet-400/40 hover:shadow-[0_20px_55px_rgba(76,29,149,0.18)]"
                  >
                    <div className="pointer-events-none absolute -right-16 -top-16 h-44 w-44 rounded-full bg-gradient-to-br from-violet-500/20 to-cyan-400/10 blur-3xl transition-opacity duration-300 group-hover:opacity-100" />
                    <div className="relative flex items-center gap-5">
                      <button
                        type="button"
                        onClick={() =>
                          navigate(`/profile/${player.id}`)
                        }
                        className="rounded-full"
                      >
                        <Avatar className="h-20 w-20 border border-white/10 bg-slate-800 ring-2 ring-violet-400/20 transition duration-300 group-hover:ring-violet-400/60">
                          <AvatarImage src={player.avatarUrl} />
                          <AvatarFallback className="bg-gradient-to-br from-slate-800 to-slate-900 text-lg font-semibold text-white">
                            {player.displayName
                              .slice(0, 2)
                              .toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                      </button>
                      <div className="min-w-0 flex-1">
                        <button
                          type="button"
                          onClick={() =>
                            navigate(`/profile/${player.id}`)
                          }
                          className="block max-w-full text-left"
                        >
                          <p className="truncate font-bold text-foreground">
                            {player.displayName}
                          </p>
                          <p className="truncate text-sm text-muted-foreground">
                            {player.username
                              ? `@${player.username}`
                              : "Bit member"}
                          </p>
                          <div className="mt-2 flex items-center gap-2">
                            <span className="h-2 w-2 rounded-full bg-gradient-to-r from-violet-400 to-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.65)]" />
                            <span className="text-xs font-medium text-muted-foreground">
                              Ready to connect
                            </span>
                          </div>
                        </button>
                        <div className="mt-4 flex flex-wrap gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              navigate(`/profile/${player.id}`)
                            }
                            className="rounded-xl border-white/10 bg-white/[0.04] hover:border-white/20 hover:bg-white/[0.08]"
                          >
                            View profile
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              navigate(`/chat/${player.id}`)
                            }
                            className="rounded-xl border-violet-400/20 bg-violet-500/10 hover:border-violet-400/50 hover:bg-violet-500/20"
                          >
                            <MessageCircle className="mr-2 h-4 w-4" />
                            Message
                          </Button>
                        </div>
                      </div>
                    </div>
                  </article>
                ))}
                {!searchQuery.trim() && filteredPlayers.length <= 2 && (
                  <div className="relative overflow-hidden rounded-2xl border border-violet-400/20 bg-gradient-to-r from-violet-500/10 via-white/[0.03] to-cyan-500/10 p-6 md:col-span-2">
                    <div className="pointer-events-none absolute -right-20 -top-24 h-52 w-52 rounded-full bg-cyan-400/10 blur-3xl" />
                    <div className="relative flex items-center gap-4">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600 to-cyan-500 text-white shadow-lg shadow-violet-950/40">
                        <Users className="h-6 w-6" />
                      </div>
                      <div>
                        <h3 className="font-bold text-foreground">
                          The Bit community is growing
                        </h3>
                        <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                          More people will appear here as the Bit community grows.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-12 text-center">
                <Users className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
                <p className="font-semibold text-foreground">
                  No people found
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Try searching for another display name or username.
                </p>
              </div>
            )}
          </section>
        ) : (
          <section className="space-y-4">
            <div className="grid gap-4 lg:grid-cols-[1.65fr_1fr]">
              <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-slate-950 via-[#0d1420] to-[#080a0f] p-5 shadow-xl shadow-black/20">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-2xl font-bold tracking-tight text-foreground">
                    Trending discussions
                  </h2>
                  <button className="flex items-center gap-1 text-sm text-muted-foreground transition hover:text-white">
                    View all <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
                <div className="space-y-3">
                  {filteredDiscussions.map((discussion) => (
                    <article
                      key={discussion.id}
                      onClick={() => navigate(`/post/${discussion.id}`)}
                      className="group grid cursor-pointer grid-cols-[48px_1fr] overflow-hidden rounded-xl border border-white/10 bg-white/[0.025] transition hover:border-violet-400/30 hover:bg-white/[0.045] sm:grid-cols-[48px_1fr_150px]"
                    >
                      <div className="flex flex-col items-center justify-center gap-1 border-r border-white/10 py-3 text-sm font-semibold text-muted-foreground">
                        <ArrowUp className="h-5 w-5 text-violet-400" />
                        {discussion.votes}
                      </div>
                      <div className="min-w-0 p-4">
                        <span className="rounded-full border border-violet-400/30 bg-violet-500/10 px-2.5 py-1 text-[11px] font-semibold text-violet-300">
                          {discussion.tag}
                        </span>
                        <h3 className="mt-2 font-bold text-foreground transition group-hover:text-violet-100">
                          {discussion.title}
                        </h3>
                        <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
                          {discussion.preview}
                        </p>
                        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                          <span className="font-semibold text-foreground">{discussion.author}</span>
                          <span>·</span>
                          <span>{discussion.age}</span>
                          <MessageCircle className="ml-2 h-4 w-4" />
                          <span>{discussion.comments}</span>
                        </div>
                      </div>
                      <img
                        src={discussion.image}
                        alt=""
                        className="hidden h-full min-h-32 w-full object-cover opacity-80 transition duration-500 group-hover:scale-105 group-hover:opacity-100 sm:block"
                      />
                    </article>
                  ))}
                  {filteredDiscussions.length === 0 && (
                    <p className="rounded-xl border border-white/10 p-8 text-center text-sm text-muted-foreground">
                      No discussions match your search.
                    </p>
                  )}
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-slate-950 via-[#0d1420] to-[#080a0f] p-5 shadow-xl shadow-black/20">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-2xl font-bold tracking-tight text-foreground">
                    Communities for you
                  </h2>
                  <button className="flex items-center gap-1 text-sm text-muted-foreground transition hover:text-white">
                    View all <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
                <div className="space-y-3">
                  {communities.map((community) => (
                    <article
                      key={community.id}
                      className="group flex gap-3 rounded-xl border border-white/10 bg-white/[0.025] p-3 transition hover:border-cyan-400/30 hover:bg-white/[0.045]"
                    >
                      <img
                        src={community.image_url ?? ""}
                        alt={`${community.name} community`}
                        className="h-20 w-20 shrink-0 rounded-lg object-cover"
                      />
                      <div className="min-w-0 flex-1">
                        <h3 className="truncate font-bold text-foreground">{community.name}</h3>
                        <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Users className="h-3.5 w-3.5" /> {community.member_count} {community.member_count === 1 ? "member" : "members"}
                        </p>
                        <p className="mt-1 line-clamp-1 text-xs text-muted-foreground">
                          {community.description}
                        </p>
                      </div>
                      <Button
                        type="button"
                        onClick={() => navigate(`/community/${community.slug}`)}
                        variant="outline"
                        size="sm"
                        className="self-center rounded-xl border-violet-400/30 bg-violet-500/10 text-xs hover:bg-violet-500/20"
                      >
                        View community
                      </Button>
                    </article>
                  ))}
                  {communities.length === 0 && (
                    <p className="rounded-xl border border-white/10 p-8 text-center text-sm text-muted-foreground">
                      No communities match your search.
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-gradient-to-r from-[#0b1019] via-[#0d1420] to-[#090b12] p-5">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-xl font-bold text-foreground">Browse interests</h2>
                <span className="text-sm text-muted-foreground">Find your corner of Bit</span>
              </div>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-8">
                {interests.map((interest) => (
                  <button
                    key={interest}
                    type="button"
                    
                    onClick={() => setSearchQuery(interest)}
                    className="flex items-center justify-center gap-2 rounded-full border border-white/10 bg-white/[0.025] px-4 py-2.5 text-sm font-medium text-muted-foreground transition hover:border-violet-400/50 hover:bg-violet-500/10 hover:text-white"
                  >
                    <Compass className="h-4 w-4 text-violet-400" />
                    {interest}
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-slate-950 via-[#0d1420] to-[#080a0f] p-5">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-xl font-bold text-foreground">Popular this week</h2>
                <button className="flex items-center gap-1 text-sm text-muted-foreground transition hover:text-white">
                  View all <ArrowRight className="h-4 w-4" />
                </button>
              </div>
              <div className="grid gap-3 md:grid-cols-3">
                <article className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.025] p-3">
                  <img src="/game-covers/fortnite.jpg" alt="" className="h-16 w-24 rounded-lg object-cover" />
                  <div className="min-w-0 flex-1">
                    <span className="text-[11px] font-semibold text-violet-300">Discussion</span>
                    <p className="truncate font-semibold text-foreground">Co-op games that bring people closer</p>
                    <p className="text-xs text-muted-foreground">1.8K votes · 320 comments</p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                </article>
                <article className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.025] p-3">
                  <div className="flex h-16 w-24 items-center justify-center rounded-lg bg-gradient-to-br from-violet-600/50 to-cyan-500/40">
                    <Gamepad2 className="h-7 w-7 text-white" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="text-[11px] font-semibold text-cyan-300">Community</span>
                    <p className="truncate font-semibold text-foreground">Indie Game Club</p>
                    <p className="text-xs text-muted-foreground">129K members</p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                </article>
                <article className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.025] p-3">
                  <Avatar className="h-16 w-16 border border-cyan-400/30">
                    <AvatarFallback className="bg-gradient-to-br from-violet-600 to-cyan-500 font-bold text-white">LU</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <span className="text-[11px] font-semibold text-cyan-300">Person</span>
                    <p className="truncate font-semibold text-foreground">Luna</p>
                    <p className="text-xs text-muted-foreground">43K followers</p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                </article>
              </div>
            </div>
          </section>
        )}
      </main>
    </div>
      );
};

export default Gyms;