import { supabase } from '@/integrations/supabase/client';

export interface FilterMapping {
  key: string;
  label: string;
  type?: string;
  keyword?: string;
}

export const FITNESS_FILTERS = [
  { key: "gym", label: "Gyms" },
  {
  key: "nutrition",
  label: "Nutrition",
  type: "health",
  keyword: "health food store nutrition supplement smoothie juice wellness vitamin",
},
  { key: "yoga", label: "Flow" },
  { key: "boxing", label: "Combat" },
  { key: "running", label: "Run" },
  { key: "outdoor", label: "Outdoor" },
];

export interface PlaceReview {
  author_name: string;
  relative_time_description: string;
  text: string;
  rating: number;
}

export interface EnhancedGymResult {
  place_id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  rating?: number;
  user_ratings_total?: number;
  photos?: string[];
  distance?: number;
  amenities?: string[];
  opening_hours?: any;
  current_opening_hours?: any;
  utc_offset_minutes?: number;
  price_level?: number;
  phone?: string;
  website?: string;
  editorial_summary?: string;
  types?: string[];
  reviews?: PlaceReview[];
  isFavorite?: boolean;
  isOpen?: boolean;
  openingText?: string;
}

class EnhancedGooglePlacesService {
  async searchWithFilter(
    query: string, 
    filterKey: string, 
    lat?: number, 
    lng?: number, 
    radiusMiles: number = 5
  ): Promise<EnhancedGymResult[]> {
    try {
      const radiusMeters = radiusMiles * 1609;
      let results: any[] = [];

      if (query.trim()) {
        // Use text search for queries
        console.log('Using text search with query:', query);
        
        const { data, error } = await supabase.functions.invoke('text-search-gyms', {
          body: {
            query: query.trim(),
            lat,
            lng,
            radius: radiusMeters
          }
        });

        if (error) {
          console.error('Text search error:', error);
          throw error;
        }
        
        results = data?.gyms || [];
        console.log('Text search results:', results.length);
      } else if (lat && lng) {
        // Use nearby search when we have location but no query
        console.log('Using nearby search with location:', lat, lng, 'filter:', filterKey);
        
        // Get the filter config to use keyword if available
        const filterConfig = FITNESS_FILTERS.find(f => f.key === filterKey);
        
        const { data, error } = await supabase.functions.invoke('nearby-gyms', {
          body: {
            lat,
            lng,
            radius: radiusMeters,
            type:
  filterKey === "nutrition"
    ? "health"
    : filterConfig?.type || (filterKey === "gym" ? "gym" : undefined),
            keyword: filterConfig?.keyword
          }
        });

        if (error) {
          console.error('Nearby search error:', error);
          throw error;
        }
        
        results = data?.gyms || [];
        console.log('Nearby search results:', results.length);
      }

      // Apply basic filtering but keep it simple - don't over-filter
      const filteredResults = results.filter(gym => this.isValidFitnessPlace(gym, filterKey));
      console.log('Filtered results:', filteredResults.length);

      // Add amenities and distance
      return filteredResults.map(gym => ({
        ...gym,
        amenities: this.extractAmenities(gym),
        distance: lat && lng ? this.calculateDistance(lat, lng, gym.lat, gym.lng) : undefined,
        isOpen: this.calculateOpenStatus(gym),
        openingText: this.getOpeningText(gym)
      }));
    } catch (error) {
      console.error('Enhanced search failed:', error);
      throw error;
    }
  }

  private isValidFitnessPlace(gym: any, filterKey: string): boolean {
    const types = gym.types || [];
    const name = gym.name?.toLowerCase() || '';
    
    // For gym filter, be more lenient and include fitness-related places
    if (filterKey === 'gym') {
      // Include if it has fitness-related types OR name contains fitness keywords
      const fitnessTypes = ['gym', 'fitness_center', 'health', 'sports_activity_location'];
      const hasFitnessType = fitnessTypes.some(type => types.includes(type));
      
      const fitnessKeywords = ['gym', 'fitness', 'workout', 'training'];
      const hasFitnessKeyword = fitnessKeywords.some(keyword => name.includes(keyword));
      
      // Exclude obvious non-fitness places
      const excludeTypes = ['beauty_salon', 'hair_care', 'doctor'];
      const hasExcludedType = excludeTypes.some(type => types.includes(type));
      
      return (hasFitnessType || hasFitnessKeyword) && !hasExcludedType;
    }
    
    // For nutrition filter
    if (filterKey === 'nutrition') {
      const nutritionTypes = ['health', 'store', 'food', 'meal_delivery', 'meal_takeaway'];
      const hasNutritionType = nutritionTypes.some(type => types.includes(type));
      
      const nutritionKeywords = ['nutrition', 'supplement', 'health food', 'vitamin', 'protein', 'smoothie', 'juice'];
      const hasNutritionKeyword = nutritionKeywords.some(keyword => name.includes(keyword));
      
      return hasNutritionType || hasNutritionKeyword;
    }
    
    // For other filters, be more specific
    if (filterKey === 'park') {
      return types.includes('park') || types.includes('natural_feature');
    }
    
    // For specialized filters, allow broader matching
    return true;
  }

  private extractAmenities(gym: any): string[] {
    const amenities: string[] = [];
    const types = gym.types || [];
    const summary = gym.editorial_summary?.toLowerCase() || '';
    const name = gym.name?.toLowerCase() || '';

    // Map types to amenities
    if (types.includes('swimming_pool') || summary.includes('pool') || name.includes('pool')) {
      amenities.push('Pool');
    }
    
    if (summary.includes('personal training') || summary.includes('personal trainer')) {
      amenities.push('Personal Training');
    }
    
    if (summary.includes('sauna') || types.includes('sauna')) {
      amenities.push('Sauna');
    }
    
    if (summary.includes('locker') || summary.includes('changing room')) {
      amenities.push('Locker Rooms');
    }
    
    if (summary.includes('group class') || summary.includes('classes') || summary.includes('studio')) {
      amenities.push('Group Classes');
    }
    
    if (summary.includes('free weights') || summary.includes('strength') || summary.includes('barbell') || types.includes('gym')) {
      amenities.push('Free Weights');
    }
    
    if (summary.includes('cardio') || summary.includes('treadmill') || summary.includes('elliptical') || types.includes('fitness_center')) {
      amenities.push('Cardio Equipment');
    }

    // Add common amenities for gyms if none found
    if (amenities.length === 0 && (types.includes('gym') || types.includes('fitness_center'))) {
      amenities.push('Free Weights', 'Cardio Equipment');
    }

    return amenities;
  }

  private calculateOpenStatus(gym: any): boolean {
    // Check for openNow field first (most reliable)
    if (gym.openNow !== undefined) {
      return gym.openNow;
    }

    // Prefer current_opening_hours.open_now (Google Places API New format)
    if (gym.currentOpeningHours?.openNow !== undefined) {
      return gym.currentOpeningHours.openNow;
    }
// New Google Places format stored under opening_hours
if (gym.opening_hours?.openNow !== undefined) {
  return gym.opening_hours.openNow;
}
    // Fallback to opening_hours.open_now (legacy format)
    if (gym.opening_hours?.open_now !== undefined) {
      return gym.opening_hours.open_now;
    }

    // If we have periods and utc_offset, compute status
    if (gym.opening_hours?.periods && gym.utc_offset_minutes !== undefined) {
      return this.computeOpenStatusFromPeriods(gym.opening_hours.periods, gym.utc_offset_minutes);
    }

    // If we have currentOpeningHours periods, try to compute from that
    if (gym.currentOpeningHours?.periods) {
      return this.computeOpenStatusFromNewPeriods(gym.currentOpeningHours.periods);
    }

    // For testing purposes, assume some gyms are open during business hours
    const currentHour = new Date().getHours();
    if (currentHour >= 6 && currentHour <= 22) {
      return true;
    }

    return false;
  }

  private computeOpenStatusFromPeriods(periods: any[], utcOffsetMinutes: number): boolean {
    const now = new Date();
    const localTime = new Date(now.getTime() + (utcOffsetMinutes * 60000));
    const currentDay = localTime.getDay();
    const currentTimeMinutes = localTime.getHours() * 60 + localTime.getMinutes();

    const todayPeriods = periods.filter(period => period.open?.day === currentDay);
    
    for (const period of todayPeriods) {
      const openTime = period.open.time;
      const closeTime = period.close?.time;
      
      if (!openTime) continue;
      
      const openMinutes = this.timeStringToMinutes(openTime);
      const closeMinutes = closeTime ? this.timeStringToMinutes(closeTime) : 24 * 60;
      
      if (closeMinutes > openMinutes) {
        // Same day close
        if (currentTimeMinutes >= openMinutes && currentTimeMinutes < closeMinutes) {
          return true;
        }
      } else {
        // Next day close
        if (currentTimeMinutes >= openMinutes || currentTimeMinutes < closeMinutes) {
          return true;
        }
      }
    }

    return false;
  }

  private timeStringToMinutes(timeString: string): number {
    const hours = parseInt(timeString.substring(0, 2));
    const minutes = parseInt(timeString.substring(2, 4));
    return hours * 60 + minutes;
  }

  private getOpeningText(gym: any): string {
    // Check if we have currentOpeningHours from Google Places API (New)
    if (gym.currentOpeningHours?.weekdayDescriptions?.length > 0) {
      const today = new Date().getDay();
      const dayIndex = today === 0 ? 6 : today - 1; // Convert Sunday (0) to index 6, Monday (1) to 0, etc.
      const todayHours = gym.currentOpeningHours.weekdayDescriptions[dayIndex];
      
      if (todayHours) {
        // Extract time from format like "Monday: 5:00 AM – 11:00 PM"
        const timeMatch = todayHours.match(/:\s*(.+)$/);
        if (timeMatch) {
          const timeString = timeMatch[1];
          
          if (timeString.includes('Closed')) {
            return 'Closed today';
          }
          
          if (gym.currentOpeningHours.openNow) {
            // Find when it closes today
            const closeMatch = timeString.match(/–\s*(.+)$/);
            if (closeMatch) {
              return `Open until ${closeMatch[1]}`;
            }
            return 'Open now';
          } else {
            // Find when it opens
            const openMatch = timeString.match(/^(.+?)\s*–/);
            if (openMatch) {
              return `Opens at ${openMatch[1]}`;
            }
            return 'Closed';
          }
        }
      }
    }

    // Legacy opening_hours format
    if (gym.opening_hours?.weekday_text?.length > 0) {
      const today = new Date().getDay();
      const dayIndex = today === 0 ? 6 : today - 1;
      const todayHours = gym.opening_hours.weekday_text[dayIndex];
      
      if (todayHours) {
        const timeMatch = todayHours.match(/:\s*(.+)$/);
        if (timeMatch) {
          const timeString = timeMatch[1];
          
          if (timeString.includes('Closed')) {
            return 'Closed today';
          }
          
          if (gym.opening_hours.open_now) {
            const closeMatch = timeString.match(/–\s*(.+)$/);
            if (closeMatch) {
              return `Open until ${closeMatch[1]}`;
            }
            return 'Open now';
          } else {
            const openMatch = timeString.match(/^(.+?)\s*–/);
            if (openMatch) {
              return `Opens at ${openMatch[1]}`;
            }
            return 'Closed';
          }
        }
      }
    }

    // Fallback to basic open/closed
    const isOpen = this.calculateOpenStatus(gym);
    return isOpen ? 'Open now' : 'Closed';
  }

  private normalizeOpeningHours(gym: any): any {
    // Prioritize current_opening_hours, then opening_hours
    const openingHours = gym.current_opening_hours || gym.opening_hours;
    
    if (!openingHours) return null;

    return {
      open_now: this.calculateOpenStatus(gym),
      weekday_text: openingHours.weekday_text || openingHours.weekday_descriptions || [],
      periods: openingHours.periods || []
    };
  }

  async getPlaceDetails(placeId: string): Promise<EnhancedGymResult | null> {
    try {
      const { data, error } = await supabase.functions.invoke('gym-details', {
        body: { 
          place_id: placeId,
          fields: 'place_id,name,formatted_address,international_phone_number,website,editorial_summary,rating,user_ratings_total,opening_hours,current_opening_hours,utc_offset_minutes,types,photos,geometry,reviews'
        }
      });

      if (error) throw error;
      
      const gym = data.gym;
      if (!gym) return null;

      return {
        ...gym,
        amenities: this.extractAmenities(gym),
        isOpen: this.calculateOpenStatus(gym),
        openingText: this.getOpeningText(gym),
        reviews: gym.reviews?.slice(0, 2) || []
      };
    } catch (error) {
      console.error('Place details failed:', error);
      throw error;
    }
  }

  async shareGym(gym: EnhancedGymResult): Promise<boolean> {
    const shareData = {
      title: gym.name,
      text: `Check out ${gym.name} on SpotMe - ${gym.address}`,
      url: `${window.location.origin}/gym/${gym.place_id}`
    };

    if (navigator.share && navigator.canShare?.(shareData)) {
      try {
        await navigator.share(shareData);
        return true;
      } catch (error) {
        if (error instanceof Error && error.name !== 'AbortError') {
          console.error('Share failed:', error);
        }
      }
    }

    // Fallback to clipboard
    try {
      await navigator.clipboard.writeText(shareData.url);
      return false;
    } catch (error) {
      console.error('Clipboard write failed:', error);
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
        reject(new Error('Geolocation not supported'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => {
          reject(error);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 }
      );
    });
  }
  private computeOpenStatusFromNewPeriods(periods: any[]): boolean {
    const now = new Date();
    const currentDay = now.getDay();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const currentTimeMinutes = currentHour * 60 + currentMinute;

    // Find periods for today
    const todayPeriods = periods.filter(period => {
      // In the new API, day is 0-6 where 0 = Sunday
      return period.open?.day === currentDay;
    });

    for (const period of todayPeriods) {
      if (!period.open) continue;
      
      const openHour = period.open.hour || 0;
      const openMinute = period.open.minute || 0;
      const openTimeMinutes = openHour * 60 + openMinute;
      
      let closeTimeMinutes = 24 * 60; // Default to end of day
      
      if (period.close) {
        const closeHour = period.close.hour || 0;
        const closeMinute = period.close.minute || 0;
        closeTimeMinutes = closeHour * 60 + closeMinute;
        
        // Handle next day closing
        if (closeTimeMinutes <= openTimeMinutes) {
          closeTimeMinutes += 24 * 60;
        }
      }
      
      // Check if current time is within open hours
      if (currentTimeMinutes >= openTimeMinutes && currentTimeMinutes < closeTimeMinutes) {
        return true;
      }
    }
    
    return false;
  }
}

export const enhancedGooglePlacesService = new EnhancedGooglePlacesService();
