
import { useState, useEffect } from "react";
import { gymFavoritesService, GymFavorite } from "@/services/gymFavorites";
import { useAuth } from "@/hooks/useAuth";

export const useGymFavorites = () => {
  const [favorites, setFavorites] = useState<GymFavorite[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const loadFavorites = async () => {
    if (!user) {
      setFavorites([]);
      setLoading(false);
      return;
    }

    try {
      const data = await gymFavoritesService.getFavorites();
      setFavorites(data);
    } catch (error) {
      console.error('Failed to load favorites:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFavorites();
  }, [user]);

  const addFavorite = async (favorite: Omit<GymFavorite, 'user_id' | 'created_at'>) => {
    try {
      await gymFavoritesService.addFavorite(favorite);
      await loadFavorites(); // Refresh the list
    } catch (error) {
      console.error('Failed to add favorite:', error);
      throw error;
    }
  };

  const removeFavorite = async (place_id: string) => {
    try {
      await gymFavoritesService.removeFavorite(place_id);
      await loadFavorites(); // Refresh the list
    } catch (error) {
      console.error('Failed to remove favorite:', error);
      throw error;
    }
  };

  const isFavorite = (place_id: string): boolean => {
    return favorites.some(fav => fav.place_id === place_id);
  };

  return {
    favorites,
    loading,
    addFavorite,
    removeFavorite,
    isFavorite,
    refetch: loadFavorites
  };
};
