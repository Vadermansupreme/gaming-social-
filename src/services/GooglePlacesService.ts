import { supabase } from '@/integrations/supabase/client';

export interface PlaceResult {
  place_id: string;
  name: string;
  formatted_address: string;
  geometry: {
    location: {
      lat: number;
      lng: number;
    };
  };
  rating?: number;
  price_level?: number;
  photos?: Array<{
    photo_reference: string;
  }>;
  types: string[];
  opening_hours?: {
    open_now: boolean;
  };
}

export interface NearbyGymResult {
  place_id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  rating?: number;
  photos?: string[];
  distance?: number;
  amenities?: string[];
  user_ratings_total?: number;
  opening_hours?: any;
  price_level?: number;
}

class GooglePlacesService {
  async searchGyms(query: string, lat?: number, lng?: number): Promise<NearbyGymResult[]> {
    try {
      console.log('Searching gyms with query:', query, 'at location:', { lat, lng });
      
      // Check if query is a ZIP code (5 digits)
      const isZipCode = /^\d{5}$/.test(query.trim());
      
      if (isZipCode) {
        // First geocode the ZIP code to get coordinates
        const location = await this.geocodeZipCode(query.trim());
        if (location) {
          return await this.searchNearbyGyms(location.lat, location.lng);
        }
      }
      
      // Text search for gym names or addresses
      return await this.textSearchGyms(query, lat, lng);
    } catch (error) {
      console.error('Error searching gyms:', error);
      throw error;
    }
  }

  async searchGymsByLocation(lat: number, lng: number): Promise<NearbyGymResult[]> {
    try {
      return await this.searchNearbyGyms(lat, lng);
    } catch (error) {
      console.error('Error searching gyms by location:', error);
      throw error;
    }
  }

  async searchGymsByZip(zipCode: string): Promise<NearbyGymResult[]> {
    try {
      const location = await this.geocodeZipCode(zipCode);
      if (!location) {
        throw new Error('Invalid ZIP code or location not found');
      }
      return await this.searchNearbyGyms(location.lat, location.lng);
    } catch (error) {
      console.error('Error searching gyms by ZIP:', error);
      throw error;
    }
  }

  async geocodeZipCode(zipCode: string): Promise<{ lat: number; lng: number } | null> {
    try {
      // Use Google Geocoding API to convert ZIP code to coordinates
      const { data, error } = await supabase.functions.invoke('geocode-zipcode', {
        body: { zipCode }
      });

      if (error) {
        console.error('Geocoding error:', error);
        return null;
      }

      return data.location;
    } catch (error) {
      console.error('Geocoding failed:', error);
      return null;
    }
  }

  async textSearchGyms(query: string, lat?: number, lng?: number): Promise<NearbyGymResult[]> {
    try {
      const { data, error } = await supabase.functions.invoke('text-search-gyms', {
        body: { query, lat, lng }
      });

      if (error) {
        console.error('Text search error:', error);
        throw new Error(`Text search failed: ${error.message}`);
      }

      return data.gyms || [];
    } catch (error) {
      console.error('Text search failed:', error);
      throw error;
    }
  }

  async searchNearbyGyms(lat: number, lng: number, radius: number = 5000): Promise<NearbyGymResult[]> {
    try {
      console.log('Searching for gyms near:', { lat, lng, radius });
      
      const { data, error } = await supabase.functions.invoke('nearby-gyms', {
        body: { lat, lng, radius }
      });

      if (error) {
        console.error('API response error:', error);
        throw new Error(`Function error: ${error.message}`);
      }
      
      console.log('Received gym data:', data);
      
      if (data.error) {
        throw new Error(data.error);
      }
      
      return data.gyms || [];
    } catch (error) {
      console.error('Error searching nearby gyms:', error);
      throw error;
    }
  }

  async getPlaceDetails(placeId: string) {
    try {
      const { data, error } = await supabase.functions.invoke('gym-details', {
        body: { place_id: placeId }
      });

      if (error) {
        throw new Error(`Function error: ${error.message}`);
      }

      return data.gym;
    } catch (error) {
      console.error('Error fetching place details:', error);
      throw error;
    }
  }

  calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 3959; // Earth's radius in miles
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  getCurrentLocation(): Promise<{ lat: number; lng: number }> {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          console.log('Got user location:', position.coords);
          resolve({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => {
          console.error('Geolocation error:', error);
          reject(error);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 }
      );
    });
  }

  async getLocationWithFallback(userProfile?: { zip_code?: string; home_lat?: number; home_lng?: number }): Promise<{ lat: number; lng: number } | null> {
    try {
      // First try to get device location
      try {
        const deviceLocation = await this.getCurrentLocation();
        return deviceLocation;
      } catch (deviceError) {
        console.log('Device location failed, trying profile location');
      }

      // Fallback to saved home coordinates
      if (userProfile?.home_lat && userProfile?.home_lng) {
        return { lat: userProfile.home_lat, lng: userProfile.home_lng };
      }

      // Fallback to ZIP code
      if (userProfile?.zip_code) {
        const zipLocation = await this.geocodeZipCode(userProfile.zip_code);
        if (zipLocation) {
          return zipLocation;
        }
      }

      return null;
    } catch (error) {
      console.error('Error getting location with fallback:', error);
      return null;
    }
  }
}

export const googlePlacesService = new GooglePlacesService();
