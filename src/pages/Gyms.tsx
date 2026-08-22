import { useState, useEffect } from "react";
import {
  Search,
  MapPin,
  Loader2,
  AlertCircle,
  Sliders,
  Heart,
  ArrowLeft,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectTrigger, SelectValue, SelectItem } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { enhancedGooglePlacesService, EnhancedGymResult, FITNESS_FILTERS } from "@/services/EnhancedGooglePlacesService";
import { GymCard } from "@/components/gym/GymCard";
import { useGymFavorites } from "@/hooks/useGymFavorites";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import SpottersTab from "@/components/SpottersTab";
import { useNavigate } from "react-router-dom";

type PlaceVibe = "gyms" | "flow" | "combat" | "run" | "outdoor";

const vibeMap: Record<string, PlaceVibe> = {
  gym: "gyms",
health: "gyms",
fitness_center: "gyms",

  yoga_studio: "flow",
  spa: "flow",
  pilates_studio: "flow",

  boxing_gym: "combat",
  martial_arts_school: "combat",

  stadium: "run",
  track: "run",

  park: "outdoor",
  campground: "outdoor",
  hiking_area: "outdoor"
};

const getPlaceVibe = (place: any): PlaceVibe => {
  const types = place.types || [];

  for (const type of types) {
    if (vibeMap[type]) return vibeMap[type];
  }

  const name = (place.name || "").toLowerCase();

  if (name.includes("yoga") || name.includes("pilates")) return "flow";
  if (name.includes("boxing") || name.includes("mma") || name.includes("martial")) return "combat";
  if (name.includes("run") || name.includes("track")) return "run";
  if (name.includes("park") || name.includes("trail")) return "outdoor";

  return "gyms";
};
const LOCATION_CACHE_KEY = 'spotme_cached_location';
const LOCATION_CACHE_MAX_AGE_MS = 30 * 60 * 1000; // 30 minutes

interface CachedLocation {
  lat: number;
  lng: number;
  timestamp: number;
}
const getSelectedFilterVibe = (filterKey: string): PlaceVibe | null => {
  const map: Record<string, PlaceVibe> = {
    move: "gyms",
    gym: "gyms",
    fitness: "gyms",
    training: "gyms",

    flow: "flow",
    yoga: "flow",
    pilates: "flow",
    recovery: "flow",

    combat: "combat",
    boxing: "combat",
    mma: "combat",
    martial_arts: "combat",

    run: "run",
    running: "run",
    cardio: "run",
    track: "run",

    outdoor: "outdoor",
    park: "outdoor",
    hiking: "outdoor",
    trail: "outdoor",
  };

  return map[filterKey] || null;
};
const getCachedLocation = (): CachedLocation | null => {
  try {
    const cached = localStorage.getItem(LOCATION_CACHE_KEY);
    if (!cached) return null;
    return JSON.parse(cached);
  } catch {
    localStorage.removeItem(LOCATION_CACHE_KEY);
    return null;
  }
};

const setCachedLocation = (lat: number, lng: number) => {
  const cached: CachedLocation = { lat, lng, timestamp: Date.now() };
  localStorage.setItem(LOCATION_CACHE_KEY, JSON.stringify(cached));
};

const isCacheValid = (cached: CachedLocation): boolean => {
  return Date.now() - cached.timestamp < LOCATION_CACHE_MAX_AGE_MS;
};

const Gyms = () => {
  const navigate = useNavigate();
  const [gyms, setGyms] = useState<EnhancedGymResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [userProfile, setUserProfile] = useState<any>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [selectedFilter, setSelectedFilter] = useState<string>("fitness");
  const [radiusMiles, setRadiusMiles] = useState<number>(5);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [activeGymTab, setActiveGymTab] = useState("all");
  const [mainTab, setMainTab] = useState<"gyms" | "spotters">("gyms");
 const [selectedCategory, setSelectedCategory] = useState<"gyms" | "nutrition" | "flow" | "combat" | "run" | "outdoor">("gyms");
  const { favorites, loading: favoritesLoading, isFavorite } = useGymFavorites();

  useEffect(() => {
    fetchUserProfile();
  }, []);

  useEffect(() => {
    if (userProfile !== null && mainTab === "gyms") {
      loadInitialGyms();
    }
  }, [userProfile, selectedFilter, radiusMiles, mainTab]);

  const fetchUserProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
        
        setUserProfile(profile);
        
        if (profile?.lat && profile?.lng) {
          setUserLocation({ lat: profile.lat, lng: profile.lng });
        }
      } else {
        setUserProfile({});
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
      setUserProfile({});
    }
  };

  // Background refresh of location (no prompt if permission already granted)
  const refreshLocationInBackground = async () => {
    try {
      const location = await enhancedGooglePlacesService.getCurrentLocation();
      setCachedLocation(location.lat, location.lng);
      setUserLocation(location);
    } catch {
      // Silently fail - we'll use the stale cache
    }
  };

  const loadInitialGyms = async () => {
    setLoading(true);
    setLocationError(null);
    
    try {
      let location = userLocation;
      
      // 1. Check profile location
      if (!location && userProfile?.lat && userProfile?.lng) {
        location = { lat: userProfile.lat, lng: userProfile.lng };
        setUserLocation(location);
      }
      
      // 2. Check cached location
      if (!location) {
        const cached = getCachedLocation();
        if (cached) {
          location = { lat: cached.lat, lng: cached.lng };
          setUserLocation(location);
          
          // If cache is stale, refresh in background (no UI blocking)
          if (!isCacheValid(cached)) {
            refreshLocationInBackground();
          }
        }
      }
      
      // 3. Only prompt for location if we have nothing cached
      if (!location) {
        try {
          const freshLocation = await enhancedGooglePlacesService.getCurrentLocation();
          setCachedLocation(freshLocation.lat, freshLocation.lng);
          location = freshLocation;
          setUserLocation(location);
        } catch (error) {
          console.log('Could not get current location, will show search prompt');
          setLocationError('Please search by ZIP code or city name to find gyms near you.');
          setLoading(false);
          return;
        }
      }
      
      const searchFilter =
  selectedCategory === "gyms" ? "fitness" : selectedCategory;

const results = await enhancedGooglePlacesService.searchWithFilter(
  "",
  searchFilter,
  location?.lat,
  location?.lng,
  radiusMiles
);
      
      const categoryFilteredResults = results.filter((place) => {
  const name = place.name?.toLowerCase() || "";
  const types = place.types?.join(" ").toLowerCase() || "";

  if (selectedCategory === "gyms") {
  const isGym =
    name.includes("gym") ||
    name.includes("fitness") ||
    name.includes("crossfit") ||
    name.includes("training") ||
    name.includes("workout") ||
    name.includes("strength") ||
    name.includes("conditioning") ||
    name.includes("athletic club") ||
    name.includes("barbell") ||
    types.includes("gym");

  return isGym;
}

  // NUTRITION
  if (selectedCategory === "nutrition") {
    const blockedGym =
      name.includes("gym") ||
      name.includes("fitness") ||
      types.includes("gym");

    const allowedNutrition =
      name.includes("spa") ||
      name.includes("massage") ||
      name.includes("vitamin") ||
      name.includes("supplement") ||
      name.includes("smoothie") ||
      name.includes("juice") ||
      name.includes("acai") ||
      name.includes("poke");

    return allowedNutrition && !blockedGym;
  }

  // FLOW
  if (selectedCategory === "flow") {
    const blockedGym =
      name.includes("gym") ||
      name.includes("fitness") ||
      types.includes("gym");

    const allowedFlow =
      name.includes("yoga") ||
      name.includes("pilates") ||
      name.includes("barre") ||
      name.includes("stretch") ||
      name.includes("mobility") ||
      name.includes("meditation");

    return allowedFlow && !blockedGym;
  }

  // COMBAT
  if (selectedCategory === "combat") {
    const allowedCombat =
      name.includes("boxing") ||
      name.includes("mma") ||
      name.includes("jiujitsu") ||
      name.includes("karate") ||
      name.includes("taekwondo") ||
      name.includes("wrestling") ||
      name.includes("judo") ||
      name.includes("muay thai");

    return allowedCombat;
  }

  // RUN
  if (selectedCategory === "run") {
    const blocked =
      name.includes("gym") ||
      name.includes("spa") ||
      name.includes("massage");

    const allowedRun =
      name.includes("track") ||
      name.includes("trail") ||
      name.includes("running") ||
      name.includes("path");

    return allowedRun && !blocked;
  }

  // OUTDOOR
  if (selectedCategory === "outdoor") {
    const blocked =
      name.includes("gym") ||
      name.includes("fitness");

    const allowedOutdoor =
  name.includes("park") ||
  name.includes("beach") ||
  name.includes("coast") ||
  name.includes("shore") ||
  name.includes("ocean") ||
  name.includes("trail") ||
  name.includes("hiking") ||
  name.includes("nature") ||
  name.includes("reserve") ||
  name.includes("island") ||
  name.includes("lake") ||
  name.includes("river") ||
  types.includes("park") ||
  types.includes("natural_feature");

    return allowedOutdoor && !blocked;
  }

  return true;
});

const placeIds = categoryFilteredResults.map(gym => gym.place_id);

const { data: energyRows } = await (supabase as any)
  .from("gym_energy_levels")
  .select("place_id, active_checkins, energy_level")
  .in("place_id", placeIds);

  const {
  data: { user },
} = await supabase.auth.getUser();

const { data: myCheckins } = user
  ? await (supabase as any)
      .from("gym_checkins")
      .select("place_id")
      .eq("user_id", user.id)
      .gt("expires_at", new Date().toISOString())
      .in("place_id", placeIds)
  : { data: [] };

const energyMap = new Map<string, any>(
  (energyRows || []).map((row: any) => [row.place_id, row])
);

const checkedInPlaceIds = new Set(
  (myCheckins || []).map((row: any) => row.place_id)
);

const enrichedResults = categoryFilteredResults.map(gym => {
  const energy = energyMap.get(gym.place_id);

  return {
    ...gym,
    isFavorite: isFavorite(gym.place_id),
    active_checkins: energy?.active_checkins || 0,
    energy_level: energy?.energy_level || 12,
    is_checked_in: checkedInPlaceIds.has(gym.place_id),
  };
});

setGyms(enrichedResults);
      
      if (categoryFilteredResults.length === 0) {
  setLocationError('No places found in this category. Try expanding your search radius or searching a different location.');
}
    } catch (error) {
      console.error('Error loading gyms:', error);
      setLocationError('Failed to load gyms. Please try searching manually or check your internet connection.');
    } finally {
      setLoading(false);
    }
  };

  const geocodeQuery = async (query: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('geocode-zipcode', {
        body: { zipCode: query.trim() }
      });
      
      if (!error && data.location) {
        return data.location;
      }
    } catch (error) {
      console.error('Geocoding failed:', error);
    }
    return null;
  };

  const handleSearch = async () => {
    if (!searchQuery.trim() && !userLocation) {
      await loadInitialGyms();
      return;
    }

    setLoading(true);
    setLocationError(null);
    
    try {
      let location = userLocation;
      const isZipCode = /^\d{5}$/.test(searchQuery.trim());
      
      if (searchQuery.trim() && (isZipCode || !location)) {
        const geocodedLocation = await geocodeQuery(searchQuery);
        if (geocodedLocation) {
          location = geocodedLocation;
          setUserLocation(location);
        }
      }
      
      const results = await enhancedGooglePlacesService.searchWithFilter(
        searchQuery.trim(),
        selectedFilter,
        location?.lat,
        location?.lng,
        radiusMiles
      );
      
      if (results.length === 0) {
        setLocationError(`No ${FITNESS_FILTERS.find(f => f.key === selectedFilter)?.label.toLowerCase()} found. Try increasing the radius or changing the filter.`);
      }
      
      const placeIds = results.map(gym => gym.place_id);

const { data: energyRows } = await (supabase as any)
  .from("gym_energy_levels")
  .select("place_id, active_checkins, energy_level")
  .in("place_id", placeIds);

const energyMap = new Map<string, any>(
  (energyRows || []).map((row: any) => [row.place_id, row])
);

const enrichedResults = results.map(gym => {
  const energy = energyMap.get(gym.place_id);

  return {
    ...gym,
    isFavorite: isFavorite(gym.place_id),
    active_checkins: energy?.active_checkins || 0,
    energy_level: energy?.energy_level || 12,
  };
});

setGyms(enrichedResults);
    } catch (error) {
      console.error('Error searching gyms:', error);
      toast.error('Search failed. Please try again.');
      setLocationError('Search failed. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const useCurrentLocation = async () => {
    setLoading(true);
    setLocationError(null);
    
    try {
      const location = await enhancedGooglePlacesService.getCurrentLocation();
      setCachedLocation(location.lat, location.lng);
      setUserLocation(location);
      
      const results = await enhancedGooglePlacesService.searchWithFilter(
        searchQuery || "",
        selectedFilter,
        location.lat,
        location.lng,
        radiusMiles
      );
      
      const placeIds = results.map(gym => gym.place_id);

const { data: energyRows } = await (supabase as any)
  .from("gym_energy_levels")
  .select("place_id, active_checkins, energy_level")
  .in("place_id", placeIds);

const energyMap = new Map<string, any>(
  (energyRows || []).map((row: any) => [row.place_id, row])
);

const enrichedResults = results.map(gym => {
  const energy = energyMap.get(gym.place_id);

  return {
    ...gym,
    isFavorite: isFavorite(gym.place_id),
    active_checkins: energy?.active_checkins || 0,
    energy_level: energy?.energy_level || 12,
  };
});

setGyms(enrichedResults);
      toast.success('Updated to show results near your current location');
    } catch (error) {
      console.error('Error getting current location:', error);
      if (error instanceof GeolocationPositionError && error.code === error.PERMISSION_DENIED) {
        toast.error('Location access denied. Please enable location services or search manually.');
      } else {
        toast.error('Unable to access location. Please search manually.');
      }
      setLocationError('Unable to access location. Please enable location services or search manually.');
    } finally {
      setLoading(false);
    }
  };

  const handleFavoriteChange = (placeId: string, isFavorite: boolean) => {
    setGyms(prev => prev.map(gym => 
      gym.place_id === placeId ? { ...gym, isFavorite } : gym
    ));
  };

  const getFilteredGyms = () => {
    if (activeGymTab === "favorites") {
      return gyms.filter(gym => isFavorite(gym.place_id));
    }
    
    const favoriteGyms = gyms.filter(gym => isFavorite(gym.place_id));
    const otherGyms = gyms.filter(gym => !isFavorite(gym.place_id));
    
    return [...favoriteGyms, ...otherGyms];
  };
const filteredGyms = getFilteredGyms();
  const selectedVibe = getSelectedFilterVibe(selectedFilter);

const vibeMatchedGyms = filteredGyms.filter((gym) => {
  if (!selectedVibe) return false;
  const vibe = getPlaceVibe(gym);

let score = vibe === selectedVibe ? 2 : 0;

// soft matches (this is where it gets intelligent)
if (selectedVibe === "gyms" && (vibe === "run" || vibe === "combat")) score += 1;
if (selectedVibe === "flow" && vibe === "outdoor") score += 1;
if (selectedVibe === "combat" && vibe === "gyms") score += 1;

return score > 0;
});

const favoriteCount = vibeMatchedGyms.length;

  return (
    <div className="pb-20 bg-background min-h-screen">
      <div className="px-4 pt-6">
        <button
  type="button"
  onClick={() => navigate(-1)}
  className="mb-4 flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-white/80 transition hover:bg-white/5 hover:text-white"
>
  <ArrowLeft className="h-5 w-5" />
  Back
</button>
        {/* Main Tab Switcher: Gyms / Spotters */}
        <Tabs value={mainTab} onValueChange={(v) => setMainTab(v as "gyms" | "spotters")} className="mb-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger
  value="gyms"
  className="border border-emerald-500/30 data-[state=active]:border-emerald-500"
>
  Places
</TabsTrigger>

<TabsTrigger
  value="spotters"
  className="border border-emerald-500/30 data-[state=active]:border-emerald-500"
>
  People
</TabsTrigger>
          </TabsList>

          <TabsContent value="gyms" className="mt-4">
            {/* Search Section */}
            <div className="mb-6">
              <div className="flex gap-2 mb-3">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white" />
                  <Input
                    placeholder="Search ZIP code, city, or place..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyPress={handleKeyPress}
                    className="pl-10 pr-12 bg-black border border-white/20 text-foreground"
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={useCurrentLocation}
                    disabled={loading}
                    className="absolute right-1 top-1/2 -translate-y-1/2 p-1 h-8 w-8 hover:bg-black"
                    title="Use current location"
                  >
                    <MapPin className="w-4 h-4" />
                  </Button>
                </div>
                <Button 
                  onClick={handleSearch}
                  disabled={loading}
                  className="h-11 rounded-[16px] bg-[#8EE000] px-7 font-black text-black hover:bg-[#9EFF00] transition"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Search"}
                </Button>
              </div>

              {/* Filter Controls */}
              <div className="flex gap-2 mb-3">
                <div className="flex gap-2 overflow-x-auto pb-2 flex-1">
                  {FITNESS_FILTERS.map((filter) => (
                    <Button
                      key={filter.key}
                      variant={selectedFilter === filter.key ? "default" : "outline"}
                      size="sm"
                      onClick={() => {
  setSelectedFilter(filter.key);
  setSelectedCategory(
    filter.key === "gym" ? "gyms" :
    filter.key === "yoga" ? "flow" :
    filter.key === "boxing" ? "combat" :
    filter.key === "running" ? "run" :
    filter.key === "outdoor" ? "outdoor" :
    filter.key === "nutrition" ? "nutrition" :
    "gyms"
  );
}}
                      className={`whitespace-nowrap flex-shrink-0 border ${
  selectedFilter === filter.key
  ? "!border-[#8EE000] !bg-[#8EE000] !text-black"
  : "!border-white/20 !bg-black !text-white hover:!border-[#8EE000]"
}`}
                    >
                      {filter.label}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Radius Control */}
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-white" />
                <span className="text-sm text-white">Radius:</span>
                <Select value={radiusMiles.toString()} onValueChange={(value) => setRadiusMiles(Number(value))}>
                  <SelectTrigger className="w-20 h-8 border border-white/40 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="3">3mi</SelectItem>
                    <SelectItem value="5">5mi</SelectItem>
                    <SelectItem value="10">10mi</SelectItem>
                    <SelectItem value="25">25mi</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Location Error Alert */}
            {locationError && (
              <Alert className="mb-4 border-orange-200 bg-orange-50 dark:bg-orange-900/20 dark:border-orange-500/30">
                <AlertCircle className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                <AlertDescription className="text-orange-800 dark:text-orange-300">
                  {locationError}
                </AlertDescription>
              </Alert>
            )}

            {/* Loading State */}
            {loading && (
              <div className="flex justify-center items-center py-12">
                <div className="text-center">
                  <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-2" />
                  <p className="text-white">Finding locations near you...</p>
                </div>
              </div>
            )}

            {/* Empty State */}
            {!loading && gyms.length === 0 && locationError && (
              <Card className="p-8 text-center">
                <Search className="w-12 h-12 text-white mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  No {FITNESS_FILTERS.find(f => f.key === selectedFilter)?.label.toLowerCase()} found
                </h3>
                <p className="text-white mb-4">
                  Try increasing the radius or search a different location.
                </p>
              </Card>
            )}

            {/* Results */}
            {!loading && gyms.length > 0 && (
              <Tabs value={activeGymTab} onValueChange={setActiveGymTab} className="w-full">
                <TabsList className="mt-7 grid w-full grid-cols-2 rounded-[22px] border border-white/5 bg-[#07090f] p-1">
  <TabsTrigger
    value="all"
    className="rounded-[18px] py-3 text-[15px] font-black data-[state=active]:bg-black data-[state=active]:text-white data-[state=inactive]:text-white/45"
  >
    All ({gyms.length})
  </TabsTrigger>

  <TabsTrigger
    value="favorites"
    className="rounded-[18px] py-3 text-[15px] font-black data-[state=active]:bg-black data-[state=active]:text-white data-[state=inactive]:text-white/45"
  >
    Favorites ({favoriteCount})
  </TabsTrigger>
</TabsList>
                
                <TabsContent value="all" className="space-y-4 mt-4">
  {filteredGyms.map((gym) => (
    <GymCard
      key={gym.place_id}
      gym={gym}
      onFavoriteChange={handleFavoriteChange}
    />
  ))}
</TabsContent>
                
                <TabsContent value="favorites" className="space-y-4 mt-4">
  {vibeMatchedGyms.length > 0 ? (
    vibeMatchedGyms.map((gym) => (
      <GymCard
        key={gym.place_id}
        gym={gym}
        onFavoriteChange={handleFavoriteChange}
      />
    ))
  ) : (
    <Card className="p-8 text-center">
      <Search className="w-12 h-12 text-white mx-auto mb-4" />
      <h3 className="text-lg font-semibold text-foreground mb-2">
        No vibe matches yet
      </h3>
      <p className="text-white mb-4">
        Try changing your search area or radius to find places that match your vibe.
      </p>
    </Card>
  )}
</TabsContent>
</Tabs>
)}
</TabsContent>

<TabsContent value="spotters" className="mt-4">
  <SpottersTab />
</TabsContent>
</Tabs>
</div>
</div>
);
};

export default Gyms;
