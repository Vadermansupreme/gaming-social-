
import { serve } from "https://deno.land/std/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const PLACES_KEY = Deno.env.get("GOOGLE_PLACES_API_KEY")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ANON = Deno.env.get("SUPABASE_ANON_KEY")!;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

// Rate limits per endpoint (requests per hour)
const RATE_LIMITS: Record<string, number> = {
  search: 60,
  autocomplete: 120,
  details: 60,
};

// --- Helpers
function toRad(v: number) { return (v * Math.PI) / 180; }
function haversineMiles(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 3958.7613; // miles
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat/2)**2 + Math.cos(toRad(lat1))*Math.cos(toRad(lat2))*Math.sin(dLon/2)**2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

async function photoUrl(name: string, maxWidthPx = 256) {
  // name is like "places/XXX/photos/YYY"
  const u = new URL("https://places.googleapis.com/v1/" + name + "/media");
  u.searchParams.set("key", PLACES_KEY);
  u.searchParams.set("maxWidthPx", String(maxWidthPx));
  return u.toString();
}

function normalizePlace(p: any) {
  const id = p.id ?? p.placeId ?? p.name; // v1 uses "id" for searchNearby/searchText
  const displayName = p.displayName?.text ?? p.displayName ?? p.name ?? "";
  const lat = p.location?.latitude ?? p.location?.latLng?.latitude ?? null;
  const lng = p.location?.longitude ?? p.location?.latLng?.longitude ?? null;
  const rating = p.rating ?? null;
  const userRatings = p.userRatingCount ?? p.userRatingsTotal ?? null;
  const address = p.formattedAddress ?? p.shortFormattedAddress ?? "";
  const website = p.websiteUri ?? "";
  const phone = p.nationalPhoneNumber ?? "";
  const types: string[] = p.types ?? [];
  const openNow = p.regularOpeningHours?.openNow ?? p.openingHours?.openNow ?? null;
  const photoRef = p.photos?.[0]?.name ?? null;
  return { place_id: id, name: displayName, lat, lng, rating, userRatings, address, website, phone, types, openNow, photoRef };
}

function isGym(p: any) {
  if (p.businessStatus && p.businessStatus !== "OPERATIONAL") return false;
  const types: string[] = p.types ?? [];
  return types.includes("gym");
}

// --- SHA-256 hashing for cache keys
async function sha256(message: string): Promise<string> {
  const msgBuffer = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// --- Rate limiting helpers
async function checkRateLimit(
  admin: any, 
  userId: string, 
  endpoint: string
): Promise<{ allowed: boolean; count: number; limit: number }> {
  const limit = RATE_LIMITS[endpoint] ?? 60;
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  
  const { count, error } = await admin
    .from('api_rate_limits')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('endpoint', endpoint)
    .gte('created_at', oneHourAgo);
  
  if (error) {
    console.error('Rate limit check error:', error);
    return { allowed: true, count: 0, limit }; // Fail open on error
  }
  
  return { allowed: (count ?? 0) < limit, count: count ?? 0, limit };
}

async function recordApiCall(admin: any, userId: string, endpoint: string): Promise<void> {
  const { error } = await admin.from('api_rate_limits').insert({ user_id: userId, endpoint });
  if (error) {
    console.error('Failed to record API call:', error);
  }
}

// --- Caching helpers (10-minute TTL)
async function getCached(admin: any, cacheKey: string): Promise<any | null> {
  const { data, error } = await admin
    .from('places_cache')
    .select('payload')
    .eq('cache_key', cacheKey)
    .gt('expires_at', new Date().toISOString())
    .maybeSingle();
  
  if (error) {
    console.error('Cache lookup error:', error);
    return null;
  }
  return data?.payload ?? null;
}

async function setCache(admin: any, cacheKey: string, payload: any): Promise<void> {
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString(); // 10 minutes
  const { error } = await admin.from('places_cache').upsert({
    cache_key: cacheKey,
    payload,
    expires_at: expiresAt,
  }, { onConflict: 'cache_key' });
  
  if (error) {
    console.error('Cache write error:', error);
  }
}

async function cleanupExpiredCache(admin: any): Promise<void> {
  // 1% chance to run cleanup
  if (Math.random() > 0.01) return;
  
  console.log('Running expired cache cleanup');
  const { error } = await admin
    .from('places_cache')
    .delete()
    .lt('expires_at', new Date().toISOString());
  
  if (error) {
    console.error('Cache cleanup error:', error);
  }
}

// --- Server
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // SECURITY FIX: Properly verify JWT token
  const authHeader = req.headers.get("Authorization") ?? "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
  
  if (!token) {
    return new Response(
      JSON.stringify({ error: "Authentication required" }), 
      { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  // Verify the JWT token
  const userClient = createClient(SUPABASE_URL, ANON, {
    global: { headers: { Authorization: `Bearer ${token}` } }
  });
  
  const { data: { user }, error: authError } = await userClient.auth.getUser();
  if (authError || !user) {
    console.error('Authentication error:', authError);
    return new Response(
      JSON.stringify({ error: "Invalid or expired token" }), 
      { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  const userId = user.id;
  const admin = createClient(SUPABASE_URL, SERVICE);

  try {
    const url = new URL(req.url);
    const path = url.pathname;

    // -------- Autocomplete (kept for your UI chip search)
    if (path.endsWith("/autocomplete")) {
      const q = url.searchParams.get("q");
      if (!q) return new Response("q required", { status: 400, headers: corsHeaders });
      
      // Rate limit check
      const rl = await checkRateLimit(admin, userId, "autocomplete");
      if (!rl.allowed) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded", limit: rl.limit, count: rl.count, retryAfter: "1 hour" }), 
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Record API call (counts all requests, including cached)
      await recordApiCall(admin, userId, "autocomplete");

      // Check cache
      const cacheKey = await sha256(`${userId}/autocomplete/${JSON.stringify({ q })}`);
      const cached = await getCached(admin, cacheKey);
      if (cached) {
        console.log('Returning cached autocomplete result');
        return new Response(JSON.stringify(cached), { 
          status: 200, 
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }

      const resp = await fetch(
        `https://places.googleapis.com/v1/places:autocomplete`,
        {
          method: "POST",
          headers: {
            "X-Goog-Api-Key": PLACES_KEY,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            input: q,
            includedPrimaryTypes: ["gym"],
            languageCode: "en",
          }),
        }
      );
      const json = await resp.json();
      const items = (json?.suggestions ?? [])
        .map((s: any) => ({
          place_id: s.placePrediction?.placeId,
          text: s.placePrediction?.text?.text ?? "",
          secondary: s.placePrediction?.structuredFormat?.secondaryText ?? "",
        }))
        .filter((x: any) => x.place_id);

      const responsePayload = { items };
      
      // Cache the result
      await setCache(admin, cacheKey, responsePayload);
      
      // Occasionally cleanup expired cache
      await cleanupExpiredCache(admin);

      return new Response(JSON.stringify(responsePayload), { 
        status: 200, 
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // -------- Search: nearby (lat/lng) or text (ZIP/city)
    if (path.endsWith("/search")) {
      const lat = url.searchParams.get("lat");
      const lng = url.searchParams.get("lng");
      const q   = url.searchParams.get("q");      // e.g., "32907" or "Palm Bay, FL"
      const milesStr = url.searchParams.get("miles") ?? "10";
      const miles = Math.max(1, Math.min(50, parseInt(milesStr, 10) || 10));

      if (!lat && !lng && !q) {
        return new Response("lat/lng or q required", { 
          status: 400, 
          headers: corsHeaders 
        });
      }

      // Rate limit check
      const rl = await checkRateLimit(admin, userId, "search");
      if (!rl.allowed) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded", limit: rl.limit, count: rl.count, retryAfter: "1 hour" }), 
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Record API call (counts all requests, including cached)
      await recordApiCall(admin, userId, "search");

      // Check cache
      const cacheKey = await sha256(`${userId}/search/${JSON.stringify({ lat, lng, q, miles })}`);
      const cached = await getCached(admin, cacheKey);
      if (cached) {
        console.log('Returning cached search result');
        return new Response(JSON.stringify(cached), { 
          status: 200, 
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }

      // Google requires meters for locationRestriction
      const radiusMeters = Math.min(50000, Math.max(500, Math.floor(miles * 1609.34)));

      let data: any = null;

      if (lat && lng) {
        // GPS flow → searchNearby (rank by distance)
        const resp = await fetch("https://places.googleapis.com/v1/places:searchNearby", {
          method: "POST",
          headers: { "X-Goog-Api-Key": PLACES_KEY, "Content-Type": "application/json" },
          body: JSON.stringify({
            includedPrimaryTypes: ["gym"],
            maxResultCount: 20,
            rankPreference: "DISTANCE",
            locationRestriction: {
              circle: { center: { latitude: Number(lat), longitude: Number(lng) }, radius: radiusMeters }
            },
          }),
        });
        data = await resp.json();
      } else if (q) {
        // Text flow → searchText (bias to gyms)
        const resp = await fetch("https://places.googleapis.com/v1/places:searchText", {
          method: "POST",
          headers: { "X-Goog-Api-Key": PLACES_KEY, "Content-Type": "application/json" },
          body: JSON.stringify({
            textQuery: q,
            includedPrimaryTypes: ["gym"],
            maxResultCount: 20,
            languageCode: "en",
          }),
        });
        data = await resp.json();
      }

      let results: any[] = (data?.places ?? []).map(normalizePlace).filter(isGym);

      // Distance (if caller provided lat/lng)
      if (lat && lng) {
        const ulat = Number(lat), ulng = Number(lng);
        for (const r of results) {
          if (r.lat != null && r.lng != null) {
            r.distanceMiles = Number(haversineMiles(ulat, ulng, r.lat, r.lng).toFixed(1));
          }
        }
        results.sort((a, b) => (a.distanceMiles ?? 1e9) - (b.distanceMiles ?? 1e9));
      }

      // Photo URLs (small thumbs)
      for (const r of results) {
        if (r.photoRef) {
          r.photoUrl = await photoUrl(r.photoRef, 256);
        }
      }

      const responsePayload = { items: results };
      
      // Cache the result
      await setCache(admin, cacheKey, responsePayload);
      
      // Occasionally cleanup expired cache
      await cleanupExpiredCache(admin);

      return new Response(JSON.stringify(responsePayload), { 
        status: 200, 
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // -------- Details (normalized + cache)
    if (path.endsWith("/details")) {
      const place_id = url.searchParams.get("place_id");
      if (!place_id) return new Response("place_id required", { 
        status: 400, 
        headers: corsHeaders 
      });

      // Rate limit check (before checking gyms_cache to prevent abuse)
      const rl = await checkRateLimit(admin, userId, "details");
      if (!rl.allowed) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded", limit: rl.limit, count: rl.count, retryAfter: "1 hour" }), 
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Record API call (counts all requests, including cached)
      await recordApiCall(admin, userId, "details");

      // try cache (existing gyms_cache with 7-day TTL)
      const { data: cached } = await admin.from("gyms_cache").select("*").eq("place_id", place_id).maybeSingle();
      if (cached && cached.updated_at && Date.now() - new Date(cached.updated_at).getTime() < 1000 * 60 * 60 * 24 * 7) {
        // attach a fresh photo url if present
        if ((cached as any).raw?.photos?.[0]?.name) {
          (cached as any).photoUrl = await photoUrl((cached as any).raw.photos[0].name, 800);
        }
        return new Response(JSON.stringify(cached), { 
          status: 200, 
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }

      const resp = await fetch(
        `https://places.googleapis.com/v1/places/${encodeURIComponent(place_id)}?languageCode=en&fields=id,displayName,location,formattedAddress,nationalPhoneNumber,websiteUri,rating,userRatingCount,regularOpeningHours,photos,types,businessStatus`,
        { headers: { "X-Goog-Api-Key": PLACES_KEY } }
      );
      if (!resp.ok) return new Response(await resp.text(), { 
        status: resp.status, 
        headers: corsHeaders 
      });

      const j = await resp.json();
      const n = normalizePlace(j);
      if (!isGym({ ...n, businessStatus: j.businessStatus, types: j.types })) {
        return new Response("Not a gym", { 
          status: 404, 
          headers: corsHeaders 
        });
      }

      const doc = {
        place_id,
        name: n.name,
        lat: n.lat,
        lng: n.lng,
        address: n.address,
        phone: n.phone,
        website: n.website,
        rating: n.rating,
        raw: j,
        updated_at: new Date().toISOString(),
      };
      await admin.from("gyms_cache").upsert(doc);

      // Occasionally cleanup expired cache
      await cleanupExpiredCache(admin);

      // Attach large photo URL for detail view
      const photoUrlLarge = n.photoRef ? await photoUrl(n.photoRef, 1200) : null;
      return new Response(JSON.stringify({ 
        ...doc, 
        photoUrl: photoUrlLarge, 
        userRatings: n.userRatings, 
        openNow: n.openNow, 
        types: n.types 
      }), {
        status: 200, 
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    return new Response("Not Found", { status: 404, headers: corsHeaders });
  } catch (err) {
    console.error('Places function error:', err);
    return new Response(JSON.stringify({ error: "Internal server error" }), { 
      status: 500, 
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});
