
import { useState } from 'react';
import { searchGymsByLocation, searchGymsByText, gymDetails } from '@/services/gyms/api';
import { googlePlacesService } from '@/services/GooglePlacesService';

export const useGyms = () => {
  const [gyms, setGyms] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const searchNearby = async (lat?: number, lng?: number, miles = 10) => {
    try {
      setLoading(true);
      setError(null);

      let searchLat = lat;
      let searchLng = lng;

      if (!searchLat || !searchLng) {
        const location = await googlePlacesService.getCurrentLocation();
        searchLat = location.lat;
        searchLng = location.lng;
      }

      const results = await searchGymsByLocation(searchLat!, searchLng!, miles);
      setGyms(results.items || []);
      return results.items || [];
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to search nearby gyms';
      setError(errorMessage);
      console.error('Error searching nearby gyms:', error);
      return [];
    } finally {
      setLoading(false);
    }
  };

  const searchByText = async (query: string) => {
    try {
      setLoading(true);
      setError(null);

      const results = await searchGymsByText(query);
      setGyms(results.items || []);
      return results.items || [];
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to search gyms';
      setError(errorMessage);
      console.error('Error searching gyms:', error);
      return [];
    } finally {
      setLoading(false);
    }
  };

  const getDetails = async (placeId: string) => {
    try {
      setLoading(true);
      const details = await gymDetails(placeId);
      return details;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to get gym details';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  };

  return {
    gyms,
    loading,
    error,
    searchNearby,
    searchByText,
    getDetails,
  };
};
