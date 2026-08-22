import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { MapPin, Star, Shield, UserPlus, SquarePen, Loader2 } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import UserAvatar from "@/components/UserAvatar";
import { GymVibeBadge } from "@/components/GymVibeBadge";
import { type GymVibeType } from "@/lib/gymVibe";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

const getVibeColor = (vibe: string) => {
  switch (vibe) {
    case "Casual":
      return "#9CA3AF";
    case "Routine":
      return "#3B82F6";
    case "Driven":
      return "#10B981";
    case "Competitor":
      return "#F97316";
    case "Apex":
      return "#EF4444";
    default:
      return "#9CA3AF";
  }
};
const normalizeVibe = (vibe?: string) => {
  switch ((vibe || "").toLowerCase()) {
    case "casual":
      return "Casual";
    case "routine":
      return "Routine";
    case "driven":
      return "Driven";
    case "competitor":
      return "Competitor";
    case "apex":
      return "Apex";
    default:
      return "Casual";
  }
};
const SpottersTab = () => {
  const navigate = useNavigate();
  const location = useLocation();
const selectedPlace = location.state?.selectedPlace || "";
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [profiles, setProfiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVibes, setSelectedVibes] = useState<GymVibeType[]>([]);
  const [peopleSubTab, setPeopleSubTab] = useState<"all" | "myVibe">("all");
  const [userVibe, setUserVibe] = useState<string | null>(null);

  useEffect(() => {
    fetchProfiles();
  }, [user]);

  const fetchProfiles = async () => {
    if (!user) return;
    const { data: currentUserProfile } = await supabase
  .from("profiles")
  .select("vibe")
  .eq("id", user.id)
  .single();

setUserVibe(currentUserProfile?.vibe ?? null);
    setLoading(true);
    try {
      // Select only safe public fields from the public_profiles view
      const { data, error } = await supabase
        .from('public_profiles')
        .select(`
          id,
          display_name,
          first_name,
          last_name,
          avatar_url,
          bio,
          vibe,
          fitness_level,
          preferred_workouts,
          fitness_goals,
          availability,
          verified,
          followers_count,
          following_count,
          home_gym_name,
          home_gym_place_id
        `)
        .neq('id', user.id);

      if (error) throw error;
      setProfiles(data || []);
    } catch (error) {
      console.error('Error fetching profiles:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleVibeFilter = (vibe: GymVibeType) => {
    setSelectedVibes(prev => 
      prev.includes(vibe) 
        ? prev.filter(v => v !== vibe)
        : [...prev, vibe]
    );
  };

  const calculateMatchPercentage = (profile: any) => {
    let matchScore = 70;
    if (profile.fitness_level === 'Advanced') matchScore += 10;
    if (profile.preferred_workouts?.length > 0) matchScore += 10;
    if (profile.verified) matchScore += 10;
    return Math.min(matchScore, 99);
  };

  const calculateDistance = () => {
    return `${(Math.random() * 5).toFixed(1)} mi`;
  };

  const filteredSpotters = profiles
    .map(profile => ({
      id: profile.id,
      name: profile.display_name || `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || 'Anonymous User',
      distance: calculateDistance(),
      level: profile.fitness_level || 'Beginner',
      workouts: profile.preferred_workouts || [],
      vibe: normalizeVibe(profile.vibe),
      rating: 4.5 + Math.random() * 0.5,
      reviews: Math.floor(Math.random() * 150) + 20,
      image: profile.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile.id}`,
      verified: profile.verified || false,
      match: calculateMatchPercentage(profile)
    }))
    .filter((spotter) => {
      const searchMatch = spotter.name.toLowerCase().includes(searchTerm.toLowerCase());
      const vibeMatch = selectedVibes.length === 0 || selectedVibes.includes(normalizeVibe(spotter.vibe) as GymVibeType);
      const placeMatch = !selectedPlace || (spotter.workouts || []).some((spot: string) => spot.toLowerCase().trim() === selectedPlace.toLowerCase().trim());
      return searchMatch && vibeMatch && placeMatch;
    });


const allPeople = [...(filteredSpotters || [])].sort((a, b) => {
  const aMatch = a.vibe?.toLowerCase() === userVibe?.toLowerCase() ? 1 : 0;
  const bMatch = b.vibe?.toLowerCase() === userVibe?.toLowerCase() ? 1 : 0;
  return bMatch - aMatch;
});

const myVibePeople = allPeople.filter((person) => {
  return (
    userVibe &&
    person.vibe &&
    person.vibe.toLowerCase() === userVibe.toLowerCase()
  );
});

const displayedPeople =
  peopleSubTab === "myVibe" ? myVibePeople : allPeople;


  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search */}
      <Input
        placeholder="Search users..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="bg-black border border-white/20 text-white placeholder:text-gray-500"
      />
<Tabs
  value={peopleSubTab}
  onValueChange={(value) => setPeopleSubTab(value as "all" | "myVibe")}
  className="w-full"
>
  <TabsList className="grid w-full grid-cols-2">
    <TabsTrigger value="all">
      All ({allPeople.length})
    </TabsTrigger>
    <TabsTrigger value="myVibe">
      My Vibe ({myVibePeople.length})
    </TabsTrigger>
  </TabsList>
</Tabs>

    

      {/* Results */}
      {displayedPeople.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-sm text-gray-500">No users found</p>
        </div>
      ) : (
        displayedPeople.map((spotter) => (
  <Card key={spotter.id} className="p-4 rounded-[24px] bg-black border border-white/20 shadow-none">
    <div className="flex items-start justify-between gap-4">
      <div className="flex items-start gap-3 min-w-0">
        <div className="relative shrink-0">
          <UserAvatar
            src={spotter.image}
            fallback={spotter.name?.split(" ").map((n) => n[0]).join("")}
            size="lg"
            onClick={() => navigate(`/profile/${spotter.id}`)}
          />
          {spotter.verified && (
            <div className="absolute -top-1 -right-1 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
              <Shield className="w-3 h-3 text-white" />
            </div>
          )}
        </div>

        <div className="flex flex-col justify-center min-w-0 flex-1">
          <div className="flex items-center gap-2 min-w-0">
            <p className="font-semibold text-white truncate">{spotter.name}</p>
          </div>

          <div
  className="mt-2 h-2.5 w-28 rounded-full"
  style={{ backgroundColor: getVibeColor(normalizeVibe(spotter.vibe)) }}
/>

          {(spotter as any).bio && (
            <p className="text-sm text-gray-300 mt-1">
              {(spotter as any).bio}
            </p>
          )}

          {(spotter as any).tags?.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {(spotter as any).tags.map((tag: string, i: number) => (
                <span
                  key={i}
                  className="text-xs px-2 py-1 rounded-full bg-gray-800 text-gray-300"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          {(spotter as any).location && (
            <p className="text-xs text-gray-500 mt-2">
              📍 {(spotter as any).location}
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <button
  className="h-[44px] px-4 rounded-[14px] border border-white bg-black text-white text-sm font-semibold hover:border-emerald-400 hover:text-emerald-400 transition-colors"
  onClick={() => navigate(`/profile/${spotter.id}`)}
>
  Spot Me!
</button>

        <SquarePen
  className="h-5 w-5 text-white cursor-pointer ml-2"
  onClick={() => navigate(`/chat/${spotter.id}`)}
/>
      </div>
    </div>
  </Card>
))
)}
    </div>
  );
};

export default SpottersTab;
