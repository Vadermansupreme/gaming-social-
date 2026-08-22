import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import {
  corsHeaders,
  isPlacesDisabled,
  killSwitchResponse,
  createServiceClient,
  checkRateLimit,
  recordRateLimitHit,
  rateLimitResponse,
  getSearchCache,
  setSearchCache,
  sha256,
  calculateDistance,
  mapTypesToAmenities,
} from "../_shared/places-utils.ts";

const ENDPOINT = 'nearby-gyms';

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Kill switch check
  if (isPlacesDisabled()) {
    console.log('Places API disabled via kill switch');
    return killSwitchResponse();
  }

  // SECURITY: Require valid JWT token
  const authHeader = req.headers.get("Authorization") ?? "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
  
  if (!token) {
    return new Response(
      JSON.stringify({ error: "Authentication required" }), 
      { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: `Bearer ${token}` } }
  });
  
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    console.error('Authentication error:', authError);
    return new Response(
      JSON.stringify({ error: "Invalid or expired token" }), 
      { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  // Create service client for cache operations
  const adminClient = createServiceClient();

  // Rate limit check (counts ALL requests including cache hits)
  const withinLimit = await checkRateLimit(adminClient, user.id, ENDPOINT);
  if (!withinLimit) {
    console.log(`Rate limit exceeded for user ${user.id} on ${ENDPOINT}`);
    return rateLimitResponse(ENDPOINT);
  }

  // Record this request for rate limiting
  await recordRateLimitHit(adminClient, user.id, ENDPOINT);

  try {
    const { lat, lng, radius = 5000, type, keyword } = await req.json();
    
    console.log('Request received:', { lat, lng, radius, type, keyword });
    
    // Input validation
    if (!lat || !lng || typeof lat !== 'number' || typeof lng !== 'number') {
      console.log('Invalid input parameters');
      return new Response(JSON.stringify({ error: 'Valid latitude and longitude are required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Validate coordinates are within realistic bounds
    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      console.log('Coordinates out of bounds');
      return new Response(JSON.stringify({ error: 'Invalid coordinates' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Generate cache key
    const cacheKeyRaw = `nearby:${lat.toFixed(3)}:${lng.toFixed(3)}:${radius}:${type || 'default'}:${keyword || 'none'}`;
    const cacheKey = await sha256(cacheKeyRaw);

    // Check cache first (10 min TTL)
    const cached = await getSearchCache(adminClient, cacheKey);
    if (cached) {
      console.log('Cache hit for nearby search');
      return new Response(JSON.stringify(cached), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Cache miss for nearby search');

    const googleApiKey = Deno.env.get('GOOGLE_PLACES_API_KEY');
    if (!googleApiKey) {
      console.error('Google Places API key not found in environment');
      return new Response(JSON.stringify({ error: 'Google API key not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    let gyms: any[];

    // If keyword is provided (e.g., for nutrition), use text search instead of nearby search
    if (keyword) {
      console.log('Using text search with keyword:', keyword);
      
      const searchUrl = `https://places.googleapis.com/v1/places:searchText`;
      const requestBody = {
        textQuery: keyword,
        maxResultCount: 20,
        locationBias: {
          circle: {
            center: {
              latitude: lat,
              longitude: lng
            },
            radius: Math.min(Math.max(radius, 100), 50000)
          }
        }
      };

      const searchResp = await fetch(searchUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': googleApiKey,
          'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress,places.location,places.rating,places.userRatingCount,places.photos,places.types,places.currentOpeningHours,places.priceLevel,places.googleMapsUri'
        },
        body: JSON.stringify(requestBody)
      });

      const searchData = await searchResp.json();
      console.log('Text search API response status:', searchResp.status);

      if (!searchResp.ok) {
        console.error('Google Places API error:', searchData);
        return new Response(JSON.stringify({ 
          error: `Google Places API error: ${searchData.error?.message || 'Unknown error'}`,
          details: searchData
        }), {
          status: searchResp.status,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      gyms = processPlaces(searchData.places || [], lat, lng, googleApiKey);
      console.log(`Processed ${gyms.length} results from text search`);
    } else {
      console.log('Using Google Places API (New) for nearby search');

      // Use Google Places API (New) - Nearby Search endpoint
      const nearbyUrl = `https://places.googleapis.com/v1/places:searchNearby`;
      
      const requestBody = {
        includedTypes: ["gym", "fitness_center", "spa"],
        maxResultCount: 20,
        locationRestriction: {
          circle: {
            center: {
              latitude: lat,
              longitude: lng
            },
            radius: Math.min(Math.max(radius, 100), 50000)
          }
        }
      };

      console.log('Making request to Google Places API (New)');
      
      const nearbyResp = await fetch(nearbyUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': googleApiKey,
          'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress,places.location,places.rating,places.userRatingCount,places.photos,places.types,places.currentOpeningHours,places.priceLevel,places.googleMapsUri'
        },
        body: JSON.stringify(requestBody)
      });

      const nearbyData = await nearbyResp.json();
      console.log('Google Places API response status:', nearbyResp.status);

      if (!nearbyResp.ok) {
        console.error('Google Places API error:', nearbyData);
        return new Response(JSON.stringify({ 
          error: `Google Places API error: ${nearbyData.error?.message || 'Unknown error'}`,
          details: nearbyData
        }), {
          status: nearbyResp.status,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      gyms = processPlaces(nearbyData.places || [], lat, lng, googleApiKey);
      console.log(`Processed ${gyms.length} gyms`);
    }

    const response = { gyms };

    // Cache the result (10 min TTL)
    await setSearchCache(adminClient, cacheKey, response, 10);

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in nearby-gyms function:', error);
    return new Response(JSON.stringify({ 
      error: "Internal server error"
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

function processPlaces(places: any[], userLat: number, userLng: number, googleApiKey: string): any[] {
  const results = [];
  for (const place of places) {
    let photoUrl = null;
    if (place.photos && place.photos.length > 0) {
      const photo = place.photos[0];
      photoUrl = `https://places.googleapis.com/v1/${photo.name}/media?maxWidthPx=400&key=${googleApiKey}`;
    }

    results.push({
      place_id: place.id,
      name: place.displayName?.text || place.displayName,
      address: place.formattedAddress,
      lat: place.location?.latitude,
      lng: place.location?.longitude,
      rating: place.rating,
      user_ratings_total: place.userRatingCount,
      photos: photoUrl ? [photoUrl] : [],
      amenities: mapTypesToAmenities(place.types || []),
      distance: calculateDistance(userLat, userLng, place.location?.latitude, place.location?.longitude),
      opening_hours: place.currentOpeningHours,
      price_level: place.priceLevel,
      google_maps_uri: place.googleMapsUri,
      types: place.types || []
    });
  }
  return results;
}
