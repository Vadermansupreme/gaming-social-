import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Only accept POST
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ valid: false }),
        { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { token } = await req.json();

    // Validate token input
    if (!token || typeof token !== 'string' || token.trim() === '') {
      return new Response(
        JSON.stringify({ valid: false }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create Supabase client with service role for RLS bypass
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Query waitlist_signups for matching invite_token
    // Only check existence - do NOT return any PII
    const { data, error } = await supabase
      .from('waitlist_signups')
      .select('id')
      .eq('invite_token', token.trim())
      .maybeSingle();

    if (error) {
      console.error('Database query error:', error);
      return new Response(
        JSON.stringify({ valid: false }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Return only { valid: boolean } - never expose any user data
    const isValid = data !== null;
    
    console.log(`Invite token verification: ${isValid ? 'valid' : 'invalid'}`);

    return new Response(
      JSON.stringify({ valid: isValid }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in verify-invite:', error);
    return new Response(
      JSON.stringify({ valid: false }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
