
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, MapPin, Phone, Globe, Clock, Users, Star, Share2, Heart, MoreVertical, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { toast } from "sonner";
import { enhancedGooglePlacesService, EnhancedGymResult } from "@/services/EnhancedGooglePlacesService";
import { gymCheckinsService } from "@/services/gymCheckins";
import { gymFavoritesService } from "@/services/gymFavorites";
import { useAuth } from "@/hooks/useAuth";

const PublicGymDetail = () => {
  const { place_id } = useParams<{ place_id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [gym, setGym] = useState<EnhancedGymResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [spotters, setSpotters] = useState<any[]>([]);
  const [spottersLoading, setSpottersLoading] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [isHoursOpen, setIsHoursOpen] = useState(false);

  useEffect(() => {
    if (place_id) {
      loadGymDetails();
      checkFavoriteStatus();
    }
  }, [place_id, user]);

  const checkFavoriteStatus = async () => {
    if (!place_id || !user) return;
    
    try {
      const status = await gymFavoritesService.isFavorite(place_id);
      setIsFavorite(status);
    } catch (error) {
      console.error('Failed to check favorite status:', error);
    }
  };

  const loadGymDetails = async () => {
    if (!place_id) return;
    
    setLoading(true);
    try {
      const details = await enhancedGooglePlacesService.getPlaceDetails(place_id);
      setGym(details);
    } catch (error) {
      console.error('Failed to load gym details:', error);
      toast.error('Failed to load gym details');
    } finally {
      setLoading(false);
    }
  };

  const loadSpotters = async () => {
    if (!place_id) return;
    
    setSpottersLoading(true);
    try {
      const spottersList = await gymCheckinsService.getSpottersAtGym(place_id);
      setSpotters(spottersList);
    } catch (error) {
      console.error('Failed to load spotters:', error);
    } finally {
      setSpottersLoading(false);
    }
  };

  const toggleFavorite = async () => {
    if (!user || !place_id || !gym) {
      toast.info('Please sign in to save favorites');
      navigate('/auth');
      return;
    }

    try {
      if (isFavorite) {
        await gymFavoritesService.removeFavorite(place_id);
        toast.success('Removed from favorites');
      } else {
        await gymFavoritesService.addFavorite({
          place_id: place_id,
          place_name: gym.name,
          address: gym.address,
          lat: gym.lat,
          lng: gym.lng,
          photo_ref: gym.photos?.[0]
        });
        toast.success('Added to favorites');
      }
      setIsFavorite(!isFavorite);
    } catch (error) {
      console.error('Favorite toggle failed:', error);
      toast.error('Failed to update favorites');
    }
  };

  const handleShare = async () => {
    if (!gym) return;
    
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

  const handleCheckIn = async () => {
    if (!user || !place_id) {
      toast.info('Please sign in to check in');
      navigate('/auth');
      return;
    }

    try {
      await gymCheckinsService.checkIn(place_id);
      toast.success('Checked in successfully!');
      loadSpotters();
    } catch (error) {
      console.error('Check-in failed:', error);
      toast.error('Check-in failed');
    }
  };

  if (loading) {
    return (
      <div className="pb-20 bg-background min-h-screen">
        <div className="px-4 pt-6">
          <div className="flex items-center gap-3 mb-6">
            <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <Skeleton className="h-8 w-48" />
          </div>
          
          <div className="space-y-4">
            <Skeleton className="h-48 w-full rounded-lg" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <div className="flex gap-2">
              <Skeleton className="h-8 w-20" />
              <Skeleton className="h-8 w-24" />
              <Skeleton className="h-8 w-28" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!gym) {
    return (
      <div className="pb-20 bg-background min-h-screen">
        <div className="px-4 pt-6">
          <div className="flex items-center gap-3 mb-6">
            <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <h1 className="text-xl font-semibold">Gym Not Found</h1>
          </div>
          
          <Card className="p-6 text-center">
            <p className="text-white">
              The gym you're looking for could not be found.
            </p>
            <Button className="mt-4" onClick={() => navigate('/gyms')}>
              Browse Gyms
            </Button>
          </Card>
        </div>
      </div>
    );
  }

  const weekdayText = gym.opening_hours?.weekday_text || gym.current_opening_hours?.weekday_text || [];
  const actualOpeningHours = gym.opening_hours || gym.current_opening_hours;

  return (
    <div className="pb-20 bg-background min-h-screen">
      <div className="px-4 pt-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <h1 className="text-xl font-semibold text-foreground flex-1">{gym.name}</h1>
          
          <div className="flex items-center gap-1">
            {user && (
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleFavorite}
                className="p-2 h-8 w-8"
              >
                <Heart className={`w-4 h-4 ${isFavorite ? 'fill-red-500 text-red-500' : 'text-white'}`} />
              </Button>
            )}
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="p-2 h-8 w-8">
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleShare}>
                  <Share2 className="w-4 h-4 mr-2" />
                  Share
                </DropdownMenuItem>
                {user && isFavorite && (
                  <DropdownMenuItem onClick={toggleFavorite}>
                    <Heart className="w-4 h-4 mr-2" />
                    Remove from Favorites
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Main Image */}
        {gym.photos && gym.photos.length > 0 && (
          <div className="mb-6">
            <img 
              src={gym.photos[0]} 
              alt={gym.name}
              className="w-full h-48 rounded-lg object-cover"
              loading="lazy"
              onError={(e) => {
                (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=200&fit=crop';
              }}
            />
          </div>
        )}

        {/* Find Spotters CTA */}
        <Card className="p-4 mb-4 bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-foreground flex items-center gap-2">
                <Users className="w-5 h-5" />
                Find Trainers at this Gym
              </h3>
              <p className="text-sm text-white">
                Trainer listings coming soon for this location
              </p>
            </div>
            <Button
  disabled
  className="btn-primary opacity-50 cursor-not-allowed"
>
  {spottersLoading ? 'Loading...' : 'Find Trainers'}
</Button>
          </div>
        </Card>

        {/* Spotters Results */}
        {spotters.length > 0 && (
          <Card className="p-4 mb-4">
            <h3 className="font-semibold text-foreground mb-3">Workout Partners ({spotters.length})</h3>
            <div className="space-y-3">
              {spotters.slice(0, 5).map((spotter) => (
                <div key={spotter.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      {spotter.avatar_url ? (
                        <img src={spotter.avatar_url} alt={spotter.display_name} className="w-10 h-10 rounded-full" />
                      ) : (
                        <span className="font-medium text-primary">
                          {spotter.display_name?.[0]?.toUpperCase() || '?'}
                        </span>
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{spotter.display_name}</span>
                        {spotter.verified && <Badge variant="secondary" className="text-xs">✓</Badge>}
                      </div>
                      <div className="text-xs text-white">
                        {spotter.fitness_level} • {spotter.connection_type === 'home_gym' ? 'Home gym' : 
                         spotter.connection_type === 'favorite' ? 'Favorited' : 'Recent visit'}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex gap-1">
                    <Button variant="outline" size="sm" onClick={() => navigate(`/profile/${spotter.id}`)}>
                      View
                    </Button>
                    {user && (
                      <Button size="sm" onClick={() => navigate(`/chat/${spotter.id}`)}>
                        Message
                      </Button>
                    )}
                  </div>
                </div>
              ))}
              
              {spotters.length > 5 && (
                <p className="text-sm text-white text-center">
                  +{spotters.length - 5} more spotters at this gym
                </p>
              )}
            </div>
          </Card>
        )}

        {/* Basic Info */}
        <Card className="p-4 mb-4">
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1">
              <h2 className="text-lg font-semibold text-foreground mb-2">{gym.name}</h2>
              
              {gym.rating && (
                <div className="flex items-center gap-2 mb-2">
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 text-yellow-500 fill-current" />
                    <span className="font-medium">{gym.rating}</span>
                  </div>
                  {gym.user_ratings_total && (
                    <span className="text-white text-sm">
                      ({gym.user_ratings_total} reviews)
                    </span>
                  )}
                </div>
              )}

              <div className="flex items-start gap-1 text-white mb-2">
                <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span className="text-sm">{gym.address}</span>
              </div>

              <div className="flex items-center gap-2 text-sm mb-2">
                <Clock className="w-4 h-4" />
                <span className={`font-medium ${gym.isOpen ? 'text-green-600' : 'text-red-600'}`}>
                  {gym.openingText || (gym.isOpen ? 'Open now' : 'Closed')}
                </span>
              </div>
            </div>
          </div>

          {gym.editorial_summary && (
            <p className="text-sm text-white mb-3">
              {gym.editorial_summary}
            </p>
          )}

          {/* Amenities */}
          {gym.amenities && gym.amenities.length > 0 && (
            <div className="mb-3">
              <div className="flex flex-wrap gap-1">
                {gym.amenities.map((amenity) => (
                  <Badge key={amenity} variant="secondary" className="text-xs">
                    {amenity}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-2">
            {gym.phone && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open(`tel:${gym.phone}`)}
                className="flex items-center gap-1"
              >
                <Phone className="w-4 h-4" />
                Call
              </Button>
            )}

            {gym.website && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open(gym.website, '_blank')}
                className="flex items-center gap-1"
              >
                <Globe className="w-4 h-4" />
                Website
              </Button>
            )}

            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(gym.name)}&query_place_id=${gym.place_id}`;
                window.open(mapsUrl, '_blank');
              }}
              className="flex items-center gap-1"
            >
              <MapPin className="w-4 h-4" />
              Directions
            </Button>

            {user && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleCheckIn}
                className="flex items-center gap-1"
              >
                Check In
              </Button>
            )}
          </div>
        </Card>

        {/* Reviews */}
        {gym.reviews && gym.reviews.length > 0 && (
          <Card className="p-4 mb-4">
            <h3 className="font-semibold text-foreground mb-3">Recent Reviews</h3>
            <div className="space-y-3">
              {gym.reviews.map((review, index) => (
                <div key={index} className="border-b border-border last:border-0 pb-3 last:pb-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-sm">{review.author_name}</span>
                    <div className="flex items-center">
                      {[...Array(5)].map((_, i) => (
                        <Star 
                          key={i} 
                          className={`w-3 h-3 ${i < review.rating ? 'text-yellow-500 fill-current' : 'text-gray-300'}`} 
                        />
                      ))}
                    </div>
                    <span className="text-xs text-white">{review.relative_time_description}</span>
                  </div>
                  <p className="text-sm text-white line-clamp-2">{review.text}</p>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Hours */}
        {weekdayText.length > 0 && (
          <Card className="p-4">
            <Collapsible open={isHoursOpen} onOpenChange={setIsHoursOpen}>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" className="w-full justify-between p-0 h-auto">
                  <h3 className="font-semibold text-foreground flex items-center gap-2">
                    <Clock className="w-5 h-5" />
                    Hours
                  </h3>
                  {isHoursOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-3">
                <div className="space-y-1">
                  {weekdayText.map((hours, index) => (
                    <div key={index} className="flex justify-between text-sm">
                      <span className="text-white">{hours.split(': ')[0]}</span>
                      <span className="text-foreground">{hours.split(': ')[1]}</span>
                    </div>
                  ))}
                </div>
              </CollapsibleContent>
            </Collapsible>
          </Card>
        )}
      </div>
    </div>
  );
};

export default PublicGymDetail;
