
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (req.method !== "POST") {
      return new Response("Method Not Allowed", { status: 405, headers: corsHeaders });
    }

    const { post_id } = await req.json();
    if (!post_id) {
      return new Response("post_id required", { status: 400, headers: corsHeaders });
    }

    const url = Deno.env.get("SUPABASE_URL")!;
    const anon = Deno.env.get("SUPABASE_ANON_KEY")!;
    const service = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const jwt = req.headers.get("Authorization")?.replace("Bearer ", "");

    if (!jwt) {
      return new Response("Authorization required", { status: 401, headers: corsHeaders });
    }

    const userClient = createClient(url, anon, {
      global: { headers: { Authorization: `Bearer ${jwt}` } },
    });
    const admin = createClient(url, service);

    // Verify ownership and fetch media URLs
    const { data: post, error: fetchError } = await userClient
      .from("posts")
      .select("id, author_id, media_urls")
      .eq("id", post_id)
      .single();

    if (fetchError || !post) {
      return new Response("Post not found", { status: 404, headers: corsHeaders });
    }

    // Soft delete the post (RLS ensures only author can do this)
    const { error: deleteError } = await userClient
      .from("posts")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", post_id);

    if (deleteError) {
      return new Response(JSON.stringify({ error: deleteError.message }), { 
        status: 400, 
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // Best effort cleanup of associated media files
    if (post.media_urls && Array.isArray(post.media_urls)) {
      const filePaths: string[] = [];
      
      for (const url of post.media_urls) {
        try {
          const urlObj = new URL(url);
          const pathMatch = urlObj.pathname.match(/\/post-media\/(.+)$/);
          if (pathMatch && pathMatch[1]) {
            filePaths.push(pathMatch[1]);
          }
        } catch {
          // Skip invalid URLs
        }
      }

      if (filePaths.length > 0) {
        try {
          await admin.storage.from("post-media").remove(filePaths);
        } catch (storageError) {
          console.warn("Storage cleanup failed:", storageError);
          // Don't fail the request for storage cleanup issues
        }
      }
    }

    return new Response(JSON.stringify({ success: true }), { 
      status: 200, 
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  } catch (err) {
    console.error("Delete post error:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), { 
      status: 500, 
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});
