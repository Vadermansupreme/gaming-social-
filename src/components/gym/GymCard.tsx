
import { useState } from "react";
import { Heart, Share2, MapPin, Star, Phone, Globe, Clock, MoreVertical } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { gymFavoritesService } from "@/services/gymFavorites";
import { enhancedGooglePlacesService, EnhancedGymResult } from "@/services/EnhancedGooglePlacesService";
import { useNavigate } from "react-router-dom";

interface GymCardProps {
  gym: EnhancedGymResult;
  onFavoriteChange?: (placeId: string, isFavorite: boolean) => void;
  compact?: boolean;
}

export const GymCard = ({ gym, onFavoriteChange, compact = false }: GymCardProps) => {
  const [isFavorite, setIsFavorite] = useState(gym.isFavorite || false);
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckedIn, setIsCheckedIn] = useState((gym as any).is_checked_in || false);
  const [localEnergyLevel, setLocalEnergyLevel] = useState((gym as any).energy_level || 12);
  const navigate = useNavigate();
const handleCheckIn = async (e: React.MouseEvent) => {
  e.stopPropagation();

  try {
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      toast.error("Please log in to check in");
      return;
    }

  const { error } = await supabase.from("gym_checkins").upsert(
  {
    user_id: user.id,
    place_id: gym.place_id,
    gym_name: gym.name,
    created_at: new Date().toISOString(),
    expires_at: new Date(Date.now() + 90 * 60 * 1000).toISOString(),
  },
  {
    onConflict: "user_id,place_id",
  }
);

    if (error) {
      console.error("Check-in error:", error);
      toast.error("Could not check in");
      return;
    }

    toast.success(`Checked in at ${gym.name}`);
    setIsCheckedIn(true);
    setLocalEnergyLevel(28);
  } catch (error) {
    console.error("Check-in failed:", error);
    toast.error("Check-in failed");
  }
};
  const toggleFavorite = async (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setIsLoading(true);
    
    try {
      if (isFavorite) {
        await gymFavoritesService.removeFavorite(gym.place_id);
        toast.success('Removed from favorites');
      } else {
        await gymFavoritesService.addFavorite({
  place_id: gym.place_id,
  place_name: gym.name,
  address: gym.address,
  lat: gym.lat,
  lng: gym.lng,
  rating: gym.rating,
user_ratings_total: gym.user_ratings_total,
distance: gym.distance,
google_map_url: (gym as any).google_map_url,
opening_hours: gym.opening_hours,
amenities: gym.amenities,
photos: gym.photos,
  photo_ref: gym.photos?.[0],
});
        toast.success('Added to favorites');
      }
      
      const newFavoriteState = !isFavorite;
      setIsFavorite(newFavoriteState);
      onFavoriteChange?.(gym.place_id, newFavoriteState);
    } catch (error) {
      console.error('Favorite toggle failed:', error);
      toast.error('Failed to update favorites');
    } finally {
      setIsLoading(false);
    }
  };

  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    try {
      const wasShared = await enhancedGooglePlacesService.shareGym(gym);
      if (!wasShared) {
        toast.success('Link copied to clipboard');
      }
    } catch (error) {
      console.error('Share failed:', error);
      toast.error('Failed to share gym');
    }
  };

  const handleCardClick = () => {
    navigate(`/gym/${gym.place_id}`);
  };
if (compact) {
  return (
    <Card
      className="relative cursor-pointer overflow-hidden rounded-[28px] border border-white/10 bg-[#070a10]"
      onClick={handleCardClick}
    >
      {gym.photos && gym.photos.length > 0 && (
        <div className="relative h-[360px] w-full overflow-hidden rounded-[28px]">
          <img
            src={gym.photos[0]}
            alt={gym.name}
            className="h-full w-full object-cover object-center"
            onError={(e) => {
              (e.target as HTMLImageElement).src =
                "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=150&h=150&fit=crop";
            }}
          />

          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-black/25" />

          <div className="absolute left-5 right-5 top-5 flex items-start justify-between gap-4">
            <div className="min-w-0">
              <h3 className="text-[28px] font-black leading-tight text-white">
                {gym.name}
              </h3>

              <div className="mt-3 flex items-center gap-2 text-white/90">
  <MapPin className="h-4 w-4 shrink-0" />
  <p className="text-[15px] leading-snug">
    Port Charlotte, FL
  </p>
</div>
            </div>

            <div className="flex items-center gap 0 shrink-0">
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleFavorite}
                disabled={isLoading}
                className="p-0 h-8 w-7"
              >
                <Heart
  className={`w-5 h-5 translate-x-4 ${
    isFavorite ? "fill-red-500 text-red-500" : "text-white"
  }`}
/>
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={handleShare}
                className="p-0 h-8 w-7 text-white"
              >
                <MoreVertical className="w-5 h-5" />
              </Button>
            </div>
          </div>

          <div className="absolute bottom-5 left-5 right-5">
            <p className="mb-4 -translate-y-3 text-[11px] font-black uppercase tracking-[0.12em] text-white/90 whitespace-nowrap">
  Popular for lifting · Cardio · Open gym
</p>

            <div className="mb-5 -translate-y-3 flex items-center gap-3">
              <div className="text-[11px] font-black uppercase tracking-wide text-white/60">
                Energy Level
              </div>

              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/20">
                <div
                  className="h-full rounded-full bg-[#8EE000]"
                  style={{ width: `${localEnergyLevel}%` }}
                />
              </div>
            </div>

            <div className="flex items-end justify-between gap-4">
              <div className="-translate-y-2">
                <div className="text-[42px] font-black leading-none text-white">
                  {localEnergyLevel}%
                </div>
                <div className="relative -top-1.5 mt-2 text-sm font-semibold leading-tight text-white/60">
  Busy right now
</div>
              </div>

              <div className="flex w-[140px] flex-col gap-3 -translate-y-7">
  <Button
    variant="outline"
    size="sm"
    onClick={(e) => {
      e.stopPropagation();
      handleCardClick();
    }}
    className="flex !h-9 !min-h-0 w-full items-center justify-center rounded-full border border-[#8EE000] bg-[#8EE000] px-0 py-0 text-[14px] font-black text-black hover:bg-[#8EE000]/90"
  >
    View Gym
  </Button>
</div>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}
  return (
    <Card
  className="relative cursor-pointer rounded-[22px] border border-white/10 bg-gradient-to-br from-[#05070b] to-[#080b12] px-5 py-5 shadow-[0_0_35px_rgba(0,0,0,0.45)] transition"
  onClick={handleCardClick}
>
      <div
  className={
    compact
      ? "flex flex-col gap-4"
      : "flex flex-col gap-4 xl:flex-row xl:justify-between xl:items-start xl:mb-3"
  }
>
        <div
  className={
    compact
      ? "mt-4 flex-1"
      : "mt-4 flex-1 xl:mt-0 xl:pl-[380px] xl:pr-[360px]"
  }
>
          <div className="flex items-start justify-between mb-2">
            <h3 className="text-[22px] font-black tracking-[-0.02em] text-white">
              {gym.name}
              {gym.isFavorite && (
                <Badge variant="secondary" className="ml-2 text-xs bg-yellow-100 text-yellow-800">
                  ⭐ Favorited
                </Badge>
              )}
            </h3>
            
            <div className="flex items-center gap-1 ml-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleFavorite}
                disabled={isLoading}
                className="p-1 h-8 w-8"
              >
                <Heart 
                  className={`w-4 h-4 ${isFavorite ? 'fill-red-500 text-red-500' : 'text-white'}`} 
                />
              </Button>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="p-1 h-8 w-8"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <MoreVertical className="w-4 h-4 text-white" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={handleShare}>
                    <Share2 className="w-4 h-4 mr-2" />
                    Share
                  </DropdownMenuItem>
                  {isFavorite && (
                    <DropdownMenuItem onClick={toggleFavorite}>
                      <Heart className="w-4 h-4 mr-2" />
                      Remove from Favorites
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          <div className="flex items-center gap-1 text-white text-sm mb-2">
            <MapPin className="w-3 h-3" />
            <span>{gym.address}</span>
          </div>

          <div className="flex items-center gap-4 text-sm">
            {gym.rating && (
              <div className="flex items-center gap-1">
                <Star className="w-4 h-4 text-yellow-500 fill-current" />
                <span className="text-white font-medium">
                  {gym.rating}
                  </span>
                {gym.user_ratings_total && (
                  <span className="text-white">
                    ({gym.user_ratings_total})
                  </span>
                )}
              </div>
            )}
            
            {gym.distance && (
              <span className="text-white">
                {gym.distance.toFixed(1)} mi
              </span>
            )}

            {gym.isOpen !== undefined && (
              <div className="flex items-center gap-1">
                <Clock className="w-3 h-3 text-white" />
                <span className={`text-xs font-medium ${gym.isOpen ? 'text-green-600' : 'text-red-600'}`}>
                  {gym.openingText || (gym.isOpen ? 'Open' : 'Closed')}
                </span>
              </div>
            )}
            
            
            {/* Show detailed hours if available */}
            {(gym.opening_hours?.weekday_text || gym.current_opening_hours?.weekdayDescriptions) && (
              <div className="text-xs text-white mt-1">
                {(() => {
                  const today = new Date().getDay();
                  const dayIndex = today === 0 ? 6 : today - 1;
                  const hours = gym.current_opening_hours?.weekdayDescriptions || gym.opening_hours?.weekday_text;
                  const todayHours = hours?.[dayIndex];
                  if (todayHours) {
                    const timeMatch = todayHours.match(/:\s*(.+)$/);
                    return timeMatch ? timeMatch[1] : 'Hours not available';
                  }
                  return null;
                })()}
              </div>
            )}
          </div>
<p className="mt-3 text-[13px] font-black uppercase tracking-[0.08em] text-white/90">
  Popular for lifting • Cardio • Open gym
</p>
          {gym.editorial_summary && (
            <p className="text-sm text-white mt-2 line-clamp-2">
              {gym.editorial_summary}
            </p>
          )}
        </div>
        
        {gym.photos && gym.photos.length > 0 && (
  <>
    <img
      src={gym.photos[0]}
      alt={gym.name}
      className={
  compact
    ? "relative h-[150px] w-full rounded-[16px] object-cover object-[center_35%]"
    : "relative h-[190px] w-full rounded-[16px] object-cover object-[center_35%] xl:absolute xl:left-2 xl:top-[6px] xl:h-[163px] xl:w-[362px]"
}
      onError={(e) => {
        (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=150&h=150&fit=crop';
      }}
    />

    <div
  className={
    compact
      ? "relative mt-3 w-full border-t border-white/10 pt-3"
      : "relative mt-4 w-full border-t border-white/10 pt-4 xl:absolute xl:right-5 xl:top-1/2 xl:mt-0 xl:w-[250px] xl:-translate-y-1/2 xl:border-l xl:border-t-0 xl:pl-6 xl:pt-0"
  }
>
      <div
  className={
    compact
      ? "flex translate-y-3 items-center gap-2"
      : "flex items-center gap-2"
  }
>
  <div className="text-[11px] font-black uppercase tracking-wide text-white/45">
    Energy Level
  </div>

  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/10">
    <div
      className="h-full rounded-full bg-[#8EE000]"
      style={{ width: `${localEnergyLevel}%` }}
    />
  </div>
</div>

      <div
  className={
    compact
      ? "mt-4 flex translate-y-1 items-center justify-between gap-4"
      : "mt-4 flex items-center justify-between gap-4"
  }
>
  <div>
    <div className="text-[30px] font-black leading-none text-white">
      {localEnergyLevel}%
    </div>
    <div className=" mt-1 text-xs font-semibold leading-tight text-white/50">
      Busy right now
    </div>
  </div>

        

<div className="mt-3 ml-auto flex w-[96px] flex-col gap-2">
  <Button
    variant="outline"
    size="sm"
    onClick={handleCheckIn}
    className="flex h-8 w-full items-center justify-center rounded-full border border-[#8EE000] bg-[#8EE000] px-0 text-[11px] font-black text-black hover:border-[#8EE000] hover:bg-[#8EE000] hover:text-black transition"
  >
    {isCheckedIn ? "Checked In" : "Check In"}
  </Button>

  <Button
    variant="outline"
    size="sm"
    onClick={(e) => {
      e.stopPropagation();
      const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(gym.name)}&query_place_id=${gym.place_id}`;
      window.open(mapsUrl, "_blank");
    }}
    className="flex h-8 w-[96px] items-center justify-center gap-1 rounded-full border border-white/15 bg-black/30 px-0 text-[10px] font-black text-white hover:border-[#8EE000] hover:bg-[#8EE000] hover:text-black transition"
  >
    <MapPin className="h-3.5 w-3.5" />
    Directions
  </Button>
</div>
</div>
    </div>
  </>
)}
      </div>
      

      <div className="flex items-center gap-2 mt-4">
        {gym.phone && (
          <Button
            variant="outline"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              window.open(`tel:${gym.phone}`);
            }}
            className="flex items-center gap-1 text-xs"
          >
            <Phone className="w-3 h-3" />
            Call
          </Button>
        )}

        {gym.website && (
          <Button
            variant="outline"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              window.open(gym.website, '_blank');
            }}
            className="flex items-center gap-1 text-xs"
          >
            <Globe className="w-3 h-3" />
            Website
          </Button>
        )}

        
      </div>
    </Card>
  );
};
