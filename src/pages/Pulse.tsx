import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import {
  Bell,
  Bookmark,
  Flame,
  Home,
  MessageSquare,
  Search,
  Settings,
  User,
} from "lucide-react";

const categories = [
  "For You",
  "All",
  "Gym",
  "Football",
  "Basketball",
  "Soccer",
  "Mma",
  "Running",
  "Baseball",
  "Golf",
  "Nutrition",
];

const trendingPosts = [
  { id: 1, title: "Training camp storylines heating up", views: "28.7K views", image: "https://images.unsplash.com/photo-1579952363873-27f3bade9f55?auto=format&fit=crop&w=900&q=85" },
  { id: 2, title: "The offseason work nobody sees", views: "41.6K views", image: "https://images.unsplash.com/photo-1546519638-68e109498ffc?auto=format&fit=crop&w=900&q=85" },
  { id: 3, title: "The science behind building muscle", views: "12.4K views", image: "https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?auto=format&fit=crop&w=900&q=85" },
  { id: 4, title: "Inside a high-intensity running session", views: "19.2K views", image: "https://images.unsplash.com/photo-1552674605-db6ffd4facb5?auto=format&fit=crop&w=900&q=85" },
  { id: 5, title: "Matchday energy from the stands", views: "33.9K views", image: "https://images.unsplash.com/photo-1526232761682-d26e03ac148e?auto=format&fit=crop&w=900&q=85" },
  { id: 6, title: "How athletes recover after competition", views: "24.8K views", image: "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=900&q=85" },
];

const discussions = [
  { id: 1, initial: "C", title: "Should creatine be taken before or after workouts?", author: "@liftheavy", time: "8h ago", replies: 342 },
  { id: 2, initial: "F", title: "Is the tush push ruining football?", author: "@gridironfan", time: "5h ago", replies: 276 },
  { id: 3, initial: "P", title: "Best pre-workout of 2026 so far?", author: "@gymrat247", time: "10h ago", replies: 189 },
];

const trendingTopics = [
  { name: "LeBron James", posts: "42.3K posts" },
  { name: "Arnold Classic", posts: "31.8K posts" },
  { name: "CrossFit Games", posts: "21.6K posts" },
];

const upcomingEvents = [
  { date: "AUG 2", title: "DC Fitness Expo", location: "Washington Convention Center" },
  { date: "AUG 10", title: "Summer Strength Meet", location: "Alexandria, Virginia" },
];

const sidebarItems = [
  { label: "Home", icon: Home, path: "/app" },
  { label: "Pulse", icon: Flame, path: "/pulse", active: true },
  { label: "Explore", icon: Search, path: "/gyms" },
  { label: "Messages", icon: MessageSquare, path: "/messages" },
  { label: "Profile", icon: User, path: "/profile" },
  { label: "Settings", icon: Settings, path: "/settings" },
];

const Pulse = () => {
    const navigate = useNavigate();
  const [showMoreCategories, setShowMoreCategories] = useState(false);
  const [hotSpot, setHotSpot] = useState<any>(null);
  const categoryRowRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
  const fetchHotSpot = async () => {
    const { data, error } = await (supabase as any).rpc(
      "get_trending_spot_for_feed",
      {
        p_user_id: null,
      }
    );

    if (error) {
      console.error("Error fetching hot spot:", error);
      return;
    }

    const spot = data?.[0] ?? null;

    if (!spot) {
      setHotSpot(null);
      return;
    }

    const { data: fullSpot } = await (supabase as any)
      .from("places")
      .select(
        "id, name, address, rating, review_count, distance, open_now, image_url"
      )
      .eq("name", spot.name)
      .maybeSingle();

    setHotSpot({
  ...spot,
  ...(fullSpot ?? {}),
});
  };

  fetchHotSpot();
}, []);

  const visibleCategories = showMoreCategories ? categories : categories.slice(0, 8);

  const handleCategoryArrow = () => {
    const willOpen = !showMoreCategories;
    setShowMoreCategories(willOpen);

    window.setTimeout(() => {
      categoryRowRef.current?.scrollTo({
        left: willOpen ? categoryRowRef.current.scrollWidth : 0,
        behavior: "smooth",
      });
    }, 0);
  };

  return (
    <main className="min-h-screen bg-black px-6 py-8 text-white">
      <div className="mx-auto grid w-full max-w-[1500px] gap-6 lg:grid-cols-[220px_minmax(0,1fr)_320px]">
        <aside className="hidden lg:block">
          <div className="sticky top-24 flex min-h-[calc(100vh-22rem)] flex-col">
            <nav className="space-y-2">
              {sidebarItems.map(({ label, icon: Icon, active, path }) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => path && navigate(path)}
                  className={
                    active
                      ? "flex w-full items-center gap-3 rounded-xl bg-zinc-900 px-4 py-3 text-left font-semibold text-lime-400"
                      : "flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-zinc-300 transition hover:bg-zinc-900"
                  }
                >
                  <Icon className="h-5 w-5 shrink-0" />
                  <span>{label}</span>
                </button>
              ))}
            </nav>

            <div className="mt-auto mb-24 pt-5">
              <button
                type="button"
                onClick={() => navigate("/profile")}
                className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition hover:bg-zinc-900"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-zinc-800 text-sm font-bold text-white">DM</div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-white">Devan Miles</p>
                  <p className="truncate text-xs text-zinc-500">@devan_miles</p>
                </div>
                
              </button>
            </div>
          </div>
        </aside>

        <section className="min-w-0">
          <h1 className="text-3xl font-bold tracking-tight">Pulse</h1>
          <p className="mt-1 text-sm text-zinc-400">The pulse of sports & fitness. Stay informed. Stay inspired.</p>

          <div ref={categoryRowRef} className="mt-5 flex flex-nowrap items-center gap-3 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {visibleCategories.map((category, index) => (
              <button
                key={category}
                type="button"
                className={
                  index === 0
                    ? "shrink-0 whitespace-nowrap rounded-full border border-lime-500 bg-lime-500/10 px-5 py-2 text-sm font-semibold text-lime-400"
                    : "shrink-0 whitespace-nowrap rounded-full border border-zinc-700 px-5 py-2 text-sm font-semibold text-zinc-200 transition hover:border-zinc-500"
                }
              >
                {category}
              </button>
            ))}

            <button
              type="button"
              onClick={handleCategoryArrow}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-zinc-700 text-xl text-zinc-200 transition hover:border-zinc-500 hover:bg-zinc-900"
              aria-label={showMoreCategories ? "Show fewer categories" : "Show more categories"}
            >
              {showMoreCategories ? "‹" : "›"}
            </button>
          </div>
<button
  type="button"
  onClick={() => hotSpot?.id && navigate(`/gym/${hotSpot.id}`)}
  className="mt-6 flex w-full items-center justify-between rounded-2xl border border-zinc-800 bg-zinc-950 px-4 py-4 text-left transition hover:bg-zinc-900"
>
  <div className="flex min-w-0 items-center gap-3">
    <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-zinc-900">
  {hotSpot?.image_url || hotSpot?.photos?.[0] || hotSpot?.photo_refs?.[0] ? (
    <img
      src={
        hotSpot?.image_url ||
        hotSpot?.photos?.[0] ||
        hotSpot?.photo_refs?.[0]
      }
      alt={hotSpot?.name || "Hot Spot"}
      className="h-full w-full object-cover"
      onError={(e) => {
  e.currentTarget.src =
    "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=150&h=150&fit=crop";
}}
    />
  ) : (
    <div className="flex h-full w-full items-center justify-center text-2xl">
      🔥
    </div>
  )}
</div>

    <div className="min-w-0">
      <p className="text-xs font-semibold text-orange-500">
        Hot Spot
      </p>

      <p className="truncate text-base font-semibold text-white">
  {hotSpot?.name || "Hot Spot"}
</p>
      <p className="truncate text-xs text-zinc-500">
  {hotSpot?.address || "Location unavailable"}
</p>
    </div>
  </div>

  <div className="ml-3 flex shrink-0 items-center gap-3">
    <div className="text-right">
      <p className="text-sm font-semibold text-lime-400">
        12%
      </p>

      <p className="text-[11px] text-zinc-500">
        busy now
      </p>
    </div>

    <span className="text-lg text-zinc-500">
      ›
    </span>
  </div>
</button>
          <section className="mt-7">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-bold">Trending</h2>
              <button type="button" className="text-sm font-semibold text-lime-400 hover:text-lime-300">View All</button>
            </div>

            <div className="grid grid-cols-2 gap-1 md:grid-cols-3">
              {trendingPosts.map((post) => (
                <article key={post.id} className="group relative aspect-square cursor-pointer overflow-hidden bg-zinc-900">
                  <img src={post.image} alt={post.title} className="h-full w-full object-cover transition duration-300 group-hover:scale-105" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/10 to-transparent" />
                  <div className="absolute inset-x-0 bottom-0 p-3">
                    <p className="text-sm font-semibold text-white">{post.title}</p>
                    <p className="mt-1 text-xs text-white/70">{post.views}</p>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section className="mt-8">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-bold">Trending Discussions</h2>
              <button type="button" className="text-sm font-semibold text-lime-400 hover:text-lime-300">View All</button>
            </div>

            <div className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950">
              {discussions.map((discussion, index) => (
                <article key={discussion.id} className={`flex items-center gap-4 px-5 py-4 ${index !== discussions.length - 1 ? "border-b border-zinc-800" : ""}`}>
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-zinc-900 text-sm font-bold">{discussion.initial}</div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-white">{discussion.title}</p>
                    <p className="mt-1 text-sm text-zinc-500">Started by {discussion.author} · {discussion.time}</p>
                  </div>
                  <div className="shrink-0 text-sm text-zinc-400">○ {discussion.replies}</div>
                  <span className="text-zinc-500">›</span>
                </article>
              ))}
            </div>
          </section>
        </section>

        <aside className="hidden space-y-5 lg:block">
          <section className="rounded-2xl border border-zinc-800 bg-zinc-950 p-5">
            <h2 className="text-xl font-bold">What&apos;s Trending</h2>
            <div className="mt-5 space-y-5">
              {trendingTopics.map((topic) => (
                <div key={topic.name} className="flex items-center justify-between gap-4">
                  <div>
                    <p className="font-medium text-white">{topic.name}</p>
                    <p className="mt-1 text-sm text-zinc-500">{topic.posts}</p>
                  </div>
                  <span className="text-2xl text-lime-400">↗</span>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-2xl border border-zinc-800 bg-zinc-950 p-5">
            <h2 className="text-xl font-bold">Upcoming Events</h2>
            <div className="mt-5 space-y-5">
              {upcomingEvents.map((event, index) => (
                <div key={event.title} className={index !== upcomingEvents.length - 1 ? "border-b border-zinc-800 pb-5" : ""}>
                  <p className="text-sm font-bold text-lime-400">{event.date}</p>
                  <p className="mt-2 font-medium text-white">{event.title}</p>
                  <p className="mt-1 text-sm text-zinc-500">{event.location}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-2xl border border-zinc-800 bg-zinc-950 p-5">
            <h2 className="text-xl font-bold">Videos You Might Like</h2>
            <article className="mt-5 overflow-hidden rounded-xl border border-zinc-800">
              <img src="https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?auto=format&fit=crop&w=900&q=85" alt="Athlete lifting weights" className="h-40 w-full object-cover" />
              <div className="p-4">
                <p className="font-medium text-white">The science behind building muscle</p>
                <p className="mt-1 text-sm text-zinc-500">8:42</p>
              </div>
            </article>
          </section>
        </aside>
      </div>
    </main>
  );
};

export default Pulse;