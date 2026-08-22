
import { useState } from 'react';
import { googlePlacesService, NearbyGymResult } from '@/services/GooglePlacesService';
import { toast } from 'sonner';

interface UseGooglePlacesProps {
  autoFetch?: boolean;
}

export const useGooglePlaces = ({ autoFetch = false }: UseGooglePlacesProps = {}) => {
  const [gyms, setGyms] = useState<NearbyGymResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);

  const getCurrentLocation = async () => {
    try {
      setLoading(true);
      setError(null);
      const userLocation = await googlePlacesService.getCurrentLocation();
      setLocation(userLocation);
      return userLocation;
    } catch (error) {
      const errorMessage = 'Unable to get your location. Please enable location services or search by ZIP code.';
      setError(errorMessage);
      console.error('Geolocation error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const searchNearbyGyms = async (lat?: number, lng?: number, radius?: number) => {
    try {
      setLoading(true);
      setError(null);

      let searchLat = lat;
      let searchLng = lng;

      if (!searchLat || !searchLng) {
        if (location) {
          searchLat = location.lat;
          searchLng = location.lng;
        } else {
          const userLocation = await getCurrentLocation();
          searchLat = userLocation.lat;
          searchLng = userLocation.lng;
        }
      }

      const nearbyGyms = await googlePlacesService.searchNearbyGyms(
        searchLat!,
        searchLng!,
        radius
      );

      setGyms(nearbyGyms);
      return nearbyGyms;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to search for nearby gyms';
      setError(errorMessage);
      console.error('Error searching nearby gyms:', error);
      return [];
    } finally {
      setLoading(false);
    }
  };

  const searchGyms = async (query: string) => {
    try {
      setLoading(true);
      setError(null);

      const results = await googlePlacesService.searchGyms(query, location?.lat, location?.lng);
      setGyms(results);
      return results;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to search for gyms';
      setError(errorMessage);
      console.error('Error searching gyms:', error);
      return [];
    } finally {
      setLoading(false);
    }
  };

  const getGymDetails = async (placeId: string) => {
    try {
      setLoading(true);
      const details = await googlePlacesService.getPlaceDetails(placeId);
      return details;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to get gym details';
      toast.error(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  };

  return {
    gyms,
    loading,
    error,
    location,
    getCurrentLocation,
    searchNearbyGyms,
    searchGyms,
    getGymDetails,
  };
};
