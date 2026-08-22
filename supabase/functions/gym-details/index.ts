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
  getGymCache,
  setGymCache,
  mapTypesToAmenities,
} from "../_shared/places-utils.ts";

const ENDPOINT = 'gym-details';

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
    const { place_id } = await req.json();
    
    console.log('Gym details request received for place_id:', place_id);
    
    if (!place_id || typeof place_id !== 'string') {
      console.log('Invalid place ID provided');
      return new Response(JSON.stringify({ error: 'Valid place ID is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check cache first (7 day TTL)
    const cached = await getGymCache(adminClient, place_id);
    if (cached) {
      console.log('Cache hit for place_id:', place_id);
      // Return cached data in the expected format
      const gymData = {
        place_id: cached.place_id,
        name: cached.name,
        address: cached.address,
        lat: cached.lat,
        lng: cached.lng,
        rating: cached.rating,
        user_ratings_total: cached.user_ratings_total,
        phone: cached.phone,
        website: cached.website,
        ...(cached.raw || {}) // Spread any additional cached fields
      };
      return new Response(JSON.stringify({ gym: gymData }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Cache miss for place_id:', place_id);

    const googleApiKey = Deno.env.get('GOOGLE_PLACES_API_KEY');
    if (!googleApiKey) {
      console.error('Google Places API key not found in environment');
      return new Response(JSON.stringify({ error: 'Google API key not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Using Google Places API (New) for place details');

    // Use Google Places API (New) - Place Details endpoint
    const detailsUrl = `https://places.googleapis.com/v1/places/${place_id}`;
    
    const detailsResp = await fetch(detailsUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': googleApiKey,
        'X-Goog-FieldMask': 'id,displayName,formattedAddress,location,internationalPhoneNumber,websiteUri,currentOpeningHours,types,rating,photos,priceLevel,userRatingCount,googleMapsUri'
      }
    });

    const detailsData = await detailsResp.json();
    console.log('Google Places API details response status:', detailsResp.status);

    if (!detailsResp.ok) {
      console.error('Google Places API error:', detailsData);
      return new Response(JSON.stringify({ 
        error: `Google Places API error: ${detailsData.error?.message || 'Unknown error'}`,
        details: detailsData
      }), {
        status: detailsResp.status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const place = detailsData;
    if (!place) {
      console.log('No place data found in response');
      return new Response(JSON.stringify({ error: 'Place not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get photo URLs if available
    const photoUrls = [];
    if (place.photos && place.photos.length > 0) {
      for (const photo of place.photos.slice(0, 5)) { // Limit to 5 photos
        const photoUrl = `https://places.googleapis.com/v1/${photo.name}/media?maxWidthPx=400&key=${googleApiKey}`;
        photoUrls.push(photoUrl);
      }
    }

    // Prepare gym data
    const gymData = {
      place_id: place.id,
      name: place.displayName?.text || place.displayName,
      address: place.formattedAddress,
      lat: place.location?.latitude,
      lng: place.location?.longitude,
      rating: place.rating,
      user_ratings_total: place.userRatingCount,
      phone: place.internationalPhoneNumber,
      website: place.websiteUri,
      opening_hours: place.currentOpeningHours,
      photos: photoUrls,
      amenities: mapTypesToAmenities(place.types || []),
      hours: place.currentOpeningHours?.weekdayDescriptions || [],
      price_level: place.priceLevel,
      google_maps_uri: place.googleMapsUri,
    };

    console.log('Processed gym details successfully');

    // Cache the result (7 day TTL)
    await setGymCache(adminClient, {
      place_id: gymData.place_id,
      name: gymData.name,
      lat: gymData.lat,
      lng: gymData.lng,
      address: gymData.address,
      phone: gymData.phone,
      website: gymData.website,
      rating: gymData.rating,
      user_ratings_total: gymData.user_ratings_total,
      raw: {
        opening_hours: gymData.opening_hours,
        photos: gymData.photos,
        amenities: gymData.amenities,
        hours: gymData.hours,
        price_level: gymData.price_level,
        google_maps_uri: gymData.google_maps_uri,
      }
    });

    return new Response(JSON.stringify({ gym: gymData }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in gym-details function:', error);
    return new Response(JSON.stringify({ 
      error: "Internal server error"
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
