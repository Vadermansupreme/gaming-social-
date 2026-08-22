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
  getGeocodeCache,
  setGeocodeCache,
} from "../_shared/places-utils.ts";

const ENDPOINT = 'geocode-zipcode';

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
    const { zipCode } = await req.json();
    
    console.log('Geocoding request for ZIP code:', zipCode);
    
    if (!zipCode || typeof zipCode !== 'string') {
      console.log('Invalid ZIP code provided');
      return new Response(JSON.stringify({ error: 'Valid ZIP code is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Normalize ZIP code (trim whitespace, remove hyphens for 9-digit zips)
    const normalizedZip = zipCode.trim().split('-')[0];

    // Check cache first
    const cached = await getGeocodeCache(adminClient, normalizedZip);
    if (cached) {
      console.log('Cache hit for ZIP code:', normalizedZip);
      return new Response(JSON.stringify({ 
        location: {
          lat: cached.lat,
          lng: cached.lng
        }
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Cache miss for ZIP code:', normalizedZip);

    const googleApiKey = Deno.env.get('GOOGLE_PLACES_API_KEY');
    if (!googleApiKey) {
      console.error('Google Places API key not found in environment');
      return new Response(JSON.stringify({ error: 'Google API key not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Using Google Geocoding API for ZIP code lookup');

    // Use Google Geocoding API to convert ZIP code to coordinates
    const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(normalizedZip)}&key=${googleApiKey}`;
    
    const geocodeResp = await fetch(geocodeUrl);
    const geocodeData = await geocodeResp.json();
    
    console.log('Geocoding API response status:', geocodeResp.status);

    if (!geocodeResp.ok || geocodeData.status !== 'OK') {
      console.error('Geocoding API error:', geocodeData);
      return new Response(JSON.stringify({ 
        error: `Geocoding failed: ${geocodeData.error_message || geocodeData.status}`,
        details: geocodeData
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!geocodeData.results || geocodeData.results.length === 0) {
      console.log('No results found for ZIP code');
      return new Response(JSON.stringify({ error: 'ZIP code not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const location = geocodeData.results[0].geometry.location;
    console.log('Successfully geocoded ZIP code to:', location);

    // Cache the result (30 day TTL)
    await setGeocodeCache(adminClient, normalizedZip, location.lat, location.lng);

    return new Response(JSON.stringify({ 
      location: {
        lat: location.lat,
        lng: location.lng
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in geocode-zipcode function:', error);
    return new Response(JSON.stringify({ 
      error: "Internal server error"
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
