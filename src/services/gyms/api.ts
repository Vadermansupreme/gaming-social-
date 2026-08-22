
import { supabase } from '@/integrations/supabase/client';

const SUPABASE_URL = "https://jtfmswgrhnjdunghqygf.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp0Zm1zd2dyaG5qZHVuZ2hxeWdmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUzOTM4MzgsImV4cCI6MjA3MDk2OTgzOH0.c-4HYxEcPlXXWdLRGiEX-xvGKlPSvczWUwLlSXpHysg";

export async function searchGymsByLocation(lat: number, lng: number, miles = 10) {
  const { data: { session } } = await supabase.auth.getSession();
  
  const res = await supabase.functions.invoke('places', {
    body: null,
    headers: session?.access_token ? { 
      Authorization: `Bearer ${session.access_token}` 
    } : undefined,
  });

  if (res.error) throw new Error('gym search failed');
  
  // Use the /search endpoint with lat/lng
  const searchRes = await fetch(`${SUPABASE_URL}/functions/v1/places/search?lat=${lat}&lng=${lng}&miles=${miles}`, {
    headers: session?.access_token ? { 
      Authorization: `Bearer ${session.access_token}`,
      'apikey': SUPABASE_ANON_KEY
    } : {
      'apikey': SUPABASE_ANON_KEY
    }
  });
  
  if (!searchRes.ok) throw new Error('gym search failed');
  return searchRes.json() as Promise<{ items: Array<any> }>;
}

export async function searchGymsByText(q: string) {
  const { data: { session } } = await supabase.auth.getSession();
  
  const searchRes = await fetch(`${SUPABASE_URL}/functions/v1/places/search?q=${encodeURIComponent(q)}`, {
    headers: session?.access_token ? { 
      Authorization: `Bearer ${session.access_token}`,
      'apikey': SUPABASE_ANON_KEY
    } : {
      'apikey': SUPABASE_ANON_KEY
    }
  });
  
  if (!searchRes.ok) throw new Error('gym search failed');
  return searchRes.json() as Promise<{ items: Array<any> }>;
}

export async function gymDetails(place_id: string) {
  const { data: { session } } = await supabase.auth.getSession();
  
  const res = await fetch(`${SUPABASE_URL}/functions/v1/places/details?place_id=${encodeURIComponent(place_id)}`, {
    headers: session?.access_token ? { 
      Authorization: `Bearer ${session.access_token}`,
      'apikey': SUPABASE_ANON_KEY
    } : {
      'apikey': SUPABASE_ANON_KEY
    }
  });
  
  if (!res.ok) throw new Error('details failed');
  return res.json();
}
