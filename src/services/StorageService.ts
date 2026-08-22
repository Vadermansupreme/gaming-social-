
import { supabase } from "@/integrations/supabase/client";

const SUPABASE_URL = "https://jtfmswgrhnjdunghqygf.supabase.co";

export class StorageService {
  /**
   * Create a signed URL for private user uploads
   * This is needed now that user-uploads bucket is private
   */
  static async getSignedUserUploadUrl(userId: string, filename: string, expiresIn: number = 600): Promise<string> {
    const { data, error } = await supabase.storage
      .from('user-uploads')
      .createSignedUrl(`${userId}/${filename}`, expiresIn);
    
    if (error) {
      throw new Error(`Failed to create signed URL: ${error.message}`);
    }
    
    return data.signedUrl;
  }

  /**
   * Upload a file to the user's private directory
   */
  static async uploadUserFile(userId: string, file: File, filename?: string): Promise<string> {
    const actualFilename = filename || `${Date.now()}_${file.name}`;
    const filePath = `${userId}/${actualFilename}`;

    const { error } = await supabase.storage
      .from('user-uploads')
      .upload(filePath, file, {
        upsert: false
      });

    if (error) {
      throw new Error(`Upload failed: ${error.message}`);
    }

    // Return the signed URL for immediate access
    return await this.getSignedUserUploadUrl(userId, actualFilename);
  }

  /**
   * Delete a post using soft delete and clean up associated media
   */
  static async deletePost(postId: string): Promise<void> {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.access_token) {
      throw new Error('Authentication required');
    }

    try {
      // First get the post to check ownership and get media URLs
      const { data: post, error: fetchError } = await supabase
        .from('posts')
        .select('id, author_id, media_urls')
        .eq('id', postId)
        .single();

      if (fetchError || !post) {
        throw new Error('Post not found');
      }

      // Delete media files from storage if they exist
      if (post.media_urls && post.media_urls.length > 0) {
        const filePaths = post.media_urls.map((url: string) => {
          try {
            const urlObj = new URL(url);
            // Extract file path from the public URL
            const pathMatch = urlObj.pathname.match(/\/post-media\/(.+)$/);
            return pathMatch ? pathMatch[1] : null;
          } catch {
            return null;
          }
        }).filter(Boolean);

        if (filePaths.length > 0) {
          await supabase.storage
            .from('post-media')
            .remove(filePaths);
        }
      }

      // Soft delete the post by setting deleted_at
      const { error: deleteError } = await supabase
        .from('posts')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', postId);

      if (deleteError) {
        throw new Error(`Failed to delete post: ${deleteError.message}`);
      }
    } catch (error) {
      console.error('Error in deletePost:', error);
      throw error;
    }
  }

  /**
   * Search places using the secure proxy
   */
  static async searchPlaces(query: string): Promise<any[]> {
    const { data: { session } } = await supabase.auth.getSession();
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    
    if (session?.access_token) {
      headers['Authorization'] = `Bearer ${session.access_token}`;
    }

    const response = await fetch(
      `${SUPABASE_URL}/functions/v1/places/autocomplete?q=${encodeURIComponent(query)}`,
      { headers }
    );

    if (!response.ok) {
      throw new Error('Places search failed');
    }

    const data = await response.json();
    return data.items || [];
  }

  /**
   * Get place details using the secure proxy
   */
  static async getPlaceDetails(placeId: string): Promise<any> {
    const { data: { session } } = await supabase.auth.getSession();
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    
    if (session?.access_token) {
      headers['Authorization'] = `Bearer ${session.access_token}`;
    }

    const response = await fetch(
      `${SUPABASE_URL}/functions/v1/places/details?place_id=${encodeURIComponent(placeId)}`,
      { headers }
    );

    if (!response.ok) {
      throw new Error('Place details fetch failed');
    }

    return await response.json();
  }
}
