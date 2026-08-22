import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Star,
  Phone,
  Globe,
  MapPin,
  Navigation,
  Heart,
  Share,
  Clock,
  Users,
  AlertCircle,
  MapPinned,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { enhancedGooglePlacesService } from "@/services/EnhancedGooglePlacesService";
import { toast } from "sonner";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { EmptyState } from "@/components/EmptyState";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface GymDetails {
  place_id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  rating?: number;
  user_ratings_total?: number;
  phone?: string;
  website?: string;
  opening_hours?: any;
  current_opening_hours?: any;
  photos?: string[];
  amenities?: string[];
  price_level?: number;
  google_maps_uri?: string;
  isOpen?: boolean;
  openingText?: string;
}

const GymDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [gym, setGym] = useState<GymDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [isFavorited, setIsFavorited] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchGymDetails = async () => {
      if (!id) {
        setError("No gym ID provided");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const details =
          await enhancedGooglePlacesService.getPlaceDetails(id);

        if (!details) {
          setError("Gym not found");
          setGym(null);
        } else {
          setGym(details);
        }
      } catch (error) {
        console.error("Error fetching gym details:", error);
        setError("Failed to load gym details");
        toast.error("Failed to load gym details");
      } finally {
        setLoading(false);
      }
    };

    fetchGymDetails();
  }, [id]);

  const handleAddToMySpots = async () => {
    if (!user || !gym?.name) return;

    const { data: profile, error: fetchError } = await supabase
      .from("profiles")
      .select("preferred_workouts")
      .eq("id", user.id)
      .single();

    if (fetchError) {
      console.error("Error loading profile:", fetchError);
      toast.error("Could not load your spots");
      return;
    }

    const currentSpots = Array.isArray(profile?.preferred_workouts)
      ? profile.preferred_workouts
      : [];

    const spotLabel = gym.address
      ? `${gym.name} - ${gym.address}`
      : gym.name;

    const alreadySaved = currentSpots.some(
      (spot: string) =>
        spot.toLowerCase().trim() === spotLabel.toLowerCase().trim()
    );

    if (alreadySaved) {
      toast.success("Already in My Spots");
      return;
    }

    const updatedSpots = [...currentSpots, spotLabel];

    const { error: updateError } = await supabase
      .from("profiles")
      .update({ preferred_workouts: updatedSpots })
      .eq("id", user.id);

    if (updateError) {
      console.error("Error saving My Spot:", updateError);
      toast.error("Could not save to My Spots");
      return;
    }

    toast.success("Added to My Spots");
  };

  const handleGetDirections = () => {
    if (gym?.lat && gym?.lng) {
      const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${gym.lat},${gym.lng}&destination_place_id=${gym.place_id}`;
      window.open(mapsUrl, "_blank");
    } else if (gym?.google_maps_uri) {
      window.open(gym.google_maps_uri, "_blank");
    } else {
      toast.error("Location not available for directions");
    }
  };

  const handleShare = async () => {
    const shareData = {
      title: gym?.name || "Gym Details",
      text: `Check out ${gym?.name} on SpotMe!`,
      url: window.location.href,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch {
        // User cancelled sharing
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success("Link copied to clipboard!");
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error || !gym) {
    return (
      <div className="min-h-screen bg-background">
        <div className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="flex items-center justify-between px-4 py-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/gyms")}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>

            <h1 className="text-lg font-semibold">Gym Details</h1>

            <div className="w-9" />
          </div>
        </div>

        <EmptyState
          icon={AlertCircle}
          title="Gym Not Found"
          description="This gym doesn't exist or couldn't be loaded. It may have been removed or is temporarily unavailable."
          action={{
            label: "Browse Other Gyms",
            onClick: () => navigate("/gyms"),
          }}
        />
      </div>
    );
  }

  const hours =
  gym.current_opening_hours?.weekdayDescriptions ||
  gym.opening_hours?.weekdayDescriptions ||
  gym.opening_hours?.weekday_text ||
  [];

  return (
    <div className="min-h-screen bg-background text-white">
      {/* Header */}
      <div className="relative z-10 border-b border-white/10 bg-background">
        <div className="flex items-center justify-between px-4 py-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="h-6 w-6" />
          </Button>

          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsFavorited(!isFavorited)}
            >
              <Heart
                className={`h-6 w-6 ${
                  isFavorited ? "fill-lime-400 text-lime-400" : ""
                }`}
              />
            </Button>

            <Button
              variant="ghost"
              size="icon"
              onClick={handleShare}
            >
              <Share className="h-6 w-6" />
            </Button>
          </div>
        </div>
      </div>

      {/* Hero Image */}
      {gym.photos && gym.photos.length > 0 && (
        <div className="relative h-[260px] overflow-hidden sm:h-[320px] md:h-[360px]">
          <img
            src={gym.photos[0]}
            alt={gym.name}
            className="h-full w-full object-cover"
          />

          <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-black/10" />

          {gym.photos.length > 1 && (
            <div className="absolute bottom-4 left-4 rounded-xl border border-white/20 bg-black/70 px-4 py-2 text-sm font-medium backdrop-blur">
              {gym.photos.length} Photos
            </div>
          )}
        </div>
      )}

      <div className="mx-auto max-w-[1440px] space-y-6 px-4 py-6 md:px-8">
        {/* Gym Info + Main Actions */}
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          {/* Basic Info */}
          <div className="min-w-0">
            <h1 className="mb-2 text-2xl font-bold md:text-3xl">
              {gym.name}
            </h1>

            <p className="mb-4 flex items-center gap-2 text-white/75">
              <MapPin className="h-4 w-4 shrink-0" />
              <span>{gym.address}</span>
            </p>

            {gym.rating && (
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1">
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  <span className="font-semibold">
                    {gym.rating}
                  </span>
                </div>

                {gym.user_ratings_total && (
                  <span className="text-white/65">
                    ({gym.user_ratings_total} reviews)
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="grid w-full grid-cols-2 gap-3 md:w-auto md:min-w-[520px]">
            <Button
              variant="outline"
              onClick={handleGetDirections}
              className="flex items-center justify-center gap-2 border-white/20 bg-transparent hover:bg-white/5"
            >
              <Navigation className="h-4 w-4" />
              Directions
            </Button>

            <Button
              variant="outline"
              onClick={() =>
                navigate("/search", {
                  state: {
                    selectedPlace: gym.name,
                  },
                })
              }
              className="flex items-center justify-center gap-2 border-lime-400 bg-lime-400 font-semibold text-black hover:bg-lime-300 hover:text-black"
            >
              <Users className="h-4 w-4" />
              Train with Me!
            </Button>
          </div>
        </div>

        {/* Information Cards */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {/* Contact */}
          <Card className="min-h-[190px] border-white/10 bg-black p-5">
            <h3 className="mb-5 flex items-center gap-2 font-semibold text-white">
              <Phone className="h-5 w-5" />
              Contact Information
            </h3>

            <div className="space-y-4">
              {gym.phone ? (
                <div className="flex items-center gap-3">
                  <Phone className="h-4 w-4 text-white/70" />
                  <a
                    href={`tel:${gym.phone}`}
                    className="text-lime-400 hover:underline"
                  >
                    {gym.phone}
                  </a>
                </div>
              ) : (
                <p className="text-sm text-white/40">
                  Phone unavailable
                </p>
              )}

              {gym.website ? (
                <div className="flex items-center gap-3">
                  <Globe className="h-4 w-4 text-white/70" />
                  <a
                    href={gym.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-lime-400 hover:underline"
                  >
                    Visit Website
                  </a>
                </div>
              ) : (
                <p className="text-sm text-white/40">
                  Website unavailable
                </p>
              )}
            </div>
          </Card>

          {/* Status */}
          <Card className="min-h-[190px] border-white/10 bg-black p-5">
            <h3 className="mb-5 flex items-center gap-2 font-semibold text-white">
              <Clock className="h-5 w-5" />
              Status
            </h3>

            <div className="flex items-start gap-3">
              <div
                className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${
                  gym.isOpen ? "bg-lime-400" : "bg-red-500"
                }`}
              />

              <div>
                <p
                  className={`font-medium ${
                    gym.isOpen ? "text-lime-400" : "text-red-500"
                  }`}
                >
                  {gym.openingText ||
                    (gym.isOpen ? "Open now" : "Closed")}
                </p>

                {gym.isOpen && (
                  <p className="mt-1 text-sm text-white/50">
                    Currently open
                  </p>
                )}
              </div>
            </div>
          </Card>

          {/* Hours */}
          <Card className="min-h-[190px] border-white/10 bg-black p-5">
            <h3 className="mb-5 flex items-center gap-2 font-semibold text-white">
              <Clock className="h-5 w-5" />
              Hours
            </h3>

            {hours.length > 0 ? (
              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-x-4">
  <div>
    {hours.slice(0, 4).map((hour, index) => (
      <p key={index} className="text-xs text-white/70">
        {hour}
      </p>
    ))}
  </div>

  <div>
    {hours.slice(4).map((hour, index) => (
      <p key={index + 4} className="text-xs text-white/70">
        {hour}
      </p>
    ))}
  </div>
</div>
                
  
</div>
                  

                
              
            ) : (
              <p className="text-sm text-white/40">
                Hours unavailable
              </p>
            )}
          </Card>
        </div>

        {/* Amenities */}
        {gym.amenities && gym.amenities.length > 0 && (
          <Card className="border-white/10 bg-black p-5">
            <h3 className="mb-4 font-semibold">Amenities</h3>

            <div className="flex flex-wrap gap-2">
              {gym.amenities.map((amenity, index) => (
                <Badge
                  key={index}
                  variant="secondary"
                  className="border border-white/10 bg-white/5"
                >
                  {amenity}
                </Badge>
              ))}
            </div>
          </Card>
        )}

        {/* This Is My Spot */}
        <Card className="border-lime-400/20 bg-gradient-to-r from-lime-400/10 via-lime-400/5 to-transparent p-5">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-lime-400/30 bg-lime-400/10">
                <Users className="h-6 w-6 text-lime-400" />
              </div>

              <div>
                <h3 className="mb-1 font-semibold text-white">
                  This is My Spot 📍
                </h3>

                <p className="text-sm text-white/65">
                  Connect with users who love this place!
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={handleAddToMySpots}
                className="border-white/20 bg-transparent hover:bg-white/5"
              >
                <MapPinned className="h-4 w-4" />
              </Button>

              <Button
                variant="outline"
                onClick={() =>
                  navigate("/search", {
                    state: {
                      selectedPlace: gym.name,
                    },
                  })
                }
                className="flex items-center gap-2 border-white/20 bg-transparent hover:bg-white/5"
              >
                <Users className="h-4 w-4" />
                Search Members
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default GymDetails;
