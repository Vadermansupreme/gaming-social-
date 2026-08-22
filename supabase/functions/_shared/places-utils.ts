import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

// Rate limits per endpoint (requests per hour)
export const RATE_LIMITS: Record<string, number> = {
  'nearby-gyms': 120,
  'text-search-gyms': 120,
  'gym-details': 60,
  'geocode-zipcode': 30,
};

// CORS headers for all responses
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * Check if the Places API kill switch is enabled
 */
export function isPlacesDisabled(): boolean {
  return Deno.env.get("PLACES_DISABLED") === "true";
}

/**
 * Return a 503 response when kill switch is active
 */
export function killSwitchResponse(): Response {
  return new Response(
    JSON.stringify({ error: "Places search temporarily unavailable" }),
    { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

/**
 * Create a Supabase client with service role for cache operations
 */
export function createServiceClient(): SupabaseClient {
  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
}

/**
 * Check rate limit for a user on an endpoint
 * Returns true if within limit, false if rate limited
 */
export async function checkRateLimit(
  adminClient: SupabaseClient,
  userId: string,
  endpoint: string
): Promise<boolean> {
  const limit = RATE_LIMITS[endpoint] || 60;
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();

  const { count, error } = await adminClient
    .from('api_rate_limits')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('endpoint', endpoint)
    .gte('created_at', oneHourAgo);

  if (error) {
    console.error('Rate limit check error:', error);
    // Fail open on error to not block legitimate requests
    return true;
  }

  return (count || 0) < limit;
}

/**
 * Record a rate limit hit (called for every request)
 */
export async function recordRateLimitHit(
  adminClient: SupabaseClient,
  userId: string,
  endpoint: string
): Promise<void> {
  const { error } = await adminClient
    .from('api_rate_limits')
    .insert({ user_id: userId, endpoint });

  if (error) {
    console.error('Failed to record rate limit hit:', error);
  }
}

/**
 * Return a 429 rate limit exceeded response
 */
export function rateLimitResponse(endpoint: string): Response {
  const limit = RATE_LIMITS[endpoint] || 60;
  return new Response(
    JSON.stringify({ 
      error: "Rate limit exceeded",
      limit: limit,
      window: "1 hour",
      retry_after: 3600
    }),
    { 
      status: 429, 
      headers: { 
        ...corsHeaders, 
        'Content-Type': 'application/json',
        'Retry-After': '3600'
      } 
    }
  );
}

/**
 * Generate SHA-256 hash for cache keys
 */
export async function sha256(message: string): Promise<string> {
  const msgBuffer = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Get cached search results from search_cache table
 */
export async function getSearchCache(
  adminClient: SupabaseClient,
  cacheKey: string
): Promise<any | null> {
  try {
    const { data, error } = await adminClient
      .from('search_cache')
      .select('payload')
      .eq('cache_key', cacheKey)
      .gt('expires_at', new Date().toISOString())
      .single();

    if (error || !data) return null;
    return data.payload;
  } catch {
    return null;
  }
}

/**
 * Set cached search results in search_cache table
 */
export async function setSearchCache(
  adminClient: SupabaseClient,
  cacheKey: string,
  payload: any,
  ttlMinutes: number = 10
): Promise<void> {
  try {
    const expiresAt = new Date(Date.now() + ttlMinutes * 60 * 1000).toISOString();
    await adminClient
      .from('search_cache')
      .upsert({
        cache_key: cacheKey,
        payload,
        expires_at: expiresAt,
        created_at: new Date().toISOString()
      });
  } catch (error) {
    console.error('Failed to set search cache:', error);
  }
}

/**
 * Get cached gym details from gyms_cache table
 */
export async function getGymCache(
  adminClient: SupabaseClient,
  placeId: string
): Promise<any | null> {
  try {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const { data, error } = await adminClient
      .from('gyms_cache')
      .select('*')
      .eq('place_id', placeId)
      .gt('updated_at', sevenDaysAgo)
      .single();

    if (error || !data) return null;
    return data;
  } catch {
    return null;
  }
}

/**
 * Set cached gym details in gyms_cache table
 */
export async function setGymCache(
  adminClient: SupabaseClient,
  gymData: {
    place_id: string;
    name?: string;
    lat?: number;
    lng?: number;
    address?: string;
    phone?: string;
    website?: string;
    rating?: number;
    user_ratings_total?: number;
    raw?: any;
  }
): Promise<void> {
  try {
    await adminClient
      .from('gyms_cache')
      .upsert({
        ...gymData,
        updated_at: new Date().toISOString()
      });
  } catch (error) {
    console.error('Failed to set gym cache:', error);
  }
}

/**
 * Get cached geocode result from geocode_cache table
 */
export async function getGeocodeCache(
  adminClient: SupabaseClient,
  zipcode: string
): Promise<{ lat: number; lng: number } | null> {
  try {
    const { data, error } = await adminClient
      .from('geocode_cache')
      .select('lat, lng')
      .eq('zipcode', zipcode)
      .gt('expires_at', new Date().toISOString())
      .single();

    if (error || !data) return null;
    return { lat: data.lat, lng: data.lng };
  } catch {
    return null;
  }
}

/**
 * Set cached geocode result in geocode_cache table
 */
export async function setGeocodeCache(
  adminClient: SupabaseClient,
  zipcode: string,
  lat: number,
  lng: number
): Promise<void> {
  try {
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(); // 30 days
    await adminClient
      .from('geocode_cache')
      .upsert({
        zipcode,
        lat,
        lng,
        expires_at: expiresAt,
        created_at: new Date().toISOString()
      });
  } catch (error) {
    console.error('Failed to set geocode cache:', error);
  }
}

/**
 * Calculate distance between two points in miles using Haversine formula
 */
export function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 3959; // Earth's radius in miles
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

/**
 * Map Google Places types to amenities
 */
export function mapTypesToAmenities(types: string[]): string[] {
  const amenityMap: Record<string, string> = {
    'spa': 'Sauna',
    'health': 'Personal Training',
    'gym': 'Free Weights',
    'fitness_center': 'Cardio Equipment',
    'swimming_pool': 'Pool',
    'establishment': 'Locker Rooms',
    'beauty_salon': 'Towel Service',
  };

  const amenities = ['24/7 Access', 'Group Classes']; // Default amenities
  
  types.forEach(type => {
    if (amenityMap[type]) {
      amenities.push(amenityMap[type]);
    }
  });

  return [...new Set(amenities)]; // Remove duplicates
}
