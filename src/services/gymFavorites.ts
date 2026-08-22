
import { supabase } from '@/integrations/supabase/client';

export interface GymFavorite {
  user_id: string;
  place_id: string;
  place_name: string;
  photo_ref?: string;
  address?: string;
  lat?: number;
  lng?: number;
  created_at: string;
}

export class GymFavoritesService {
  async getFavorites(): Promise<GymFavorite[]> {
    const { data, error } = await supabase
      .from('gym_favorites')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  async addFavorite(
  favorite: Omit<GymFavorite, 'user_id' | 'created_at'> & {
    rating?: number;
    user_ratings_total?: number;
    distance?: number;
    google_map_url?: string;
    opening_hours?: any;
    amenities?: any;
    photos?: any;
  }
): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { error } = await supabase
      .from('gym_favorites')
      .insert({
        user_id: user.id,
        ...favorite
      });

    if (error) throw error;
  }

  async removeFavorite(place_id: string): Promise<void> {
    const { error } = await supabase
      .from('gym_favorites')
      .delete()
      .eq('place_id', place_id);

    if (error) throw error;
  }

  async isFavorite(place_id: string): Promise<boolean> {
    const { data } = await supabase
      .from('gym_favorites')
      .select('place_id')
      .eq('place_id', place_id)
      .maybeSingle();

    return !!data;
  }
}

export const gymFavoritesService = new GymFavoritesService();
