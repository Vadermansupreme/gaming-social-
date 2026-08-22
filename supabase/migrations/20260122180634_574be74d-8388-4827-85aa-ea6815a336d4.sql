-- Create gyms_cache table for caching gym details (7 day TTL)
CREATE TABLE IF NOT EXISTS public.gyms_cache (
  place_id text PRIMARY KEY,
  name text,
  lat double precision,
  lng double precision,
  address text,
  phone text,
  website text,
  rating numeric,
  user_ratings_total integer,
  raw jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.gyms_cache ENABLE ROW LEVEL SECURITY;

-- Service role ONLY - no authenticated user access
CREATE POLICY "service_role_all_gyms_cache" ON public.gyms_cache
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Create geocode_cache table for caching ZIP code lookups (30 day TTL)
CREATE TABLE IF NOT EXISTS public.geocode_cache (
  zipcode text PRIMARY KEY,
  lat double precision NOT NULL,
  lng double precision NOT NULL,
  created_at timestamptz DEFAULT now(),
  expires_at timestamptz DEFAULT (now() + interval '30 days')
);

ALTER TABLE public.geocode_cache ENABLE ROW LEVEL SECURITY;

-- Service role ONLY
CREATE POLICY "service_role_all_geocode_cache" ON public.geocode_cache
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Performance index for cleanup queries
CREATE INDEX IF NOT EXISTS idx_geocode_cache_expires_at ON public.geocode_cache (expires_at);

-- Create search_cache table for caching nearby/text search results (10 min TTL)
CREATE TABLE IF NOT EXISTS public.search_cache (
  cache_key text PRIMARY KEY,
  payload jsonb NOT NULL,
  created_at timestamptz DEFAULT now(),
  expires_at timestamptz DEFAULT (now() + interval '10 minutes')
);

ALTER TABLE public.search_cache ENABLE ROW LEVEL SECURITY;

-- Service role ONLY
CREATE POLICY "service_role_all_search_cache" ON public.search_cache
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Performance index for cleanup queries
CREATE INDEX IF NOT EXISTS idx_search_cache_expires_at ON public.search_cache (expires_at);

-- Cleanup function for expired cache entries
-- Schedule via pg_cron: SELECT cron.schedule('cleanup-places-caches', '0 3 * * *', 'SELECT public.cleanup_expired_caches()');
CREATE OR REPLACE FUNCTION public.cleanup_expired_caches()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  DELETE FROM public.search_cache WHERE expires_at < now();
  DELETE FROM public.geocode_cache WHERE expires_at < now();
  DELETE FROM public.gyms_cache WHERE updated_at < now() - interval '7 days';
END;
$$;