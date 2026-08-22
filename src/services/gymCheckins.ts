
import { supabase } from '@/integrations/supabase/client';

export interface GymCheckin {
  user_id: string;
  place_id: string;
  created_at: string;
}

export class GymCheckinsService {
  async checkIn(place_id: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { error } = await supabase
      .from('gym_checkins')
      .insert({
        user_id: user.id,
        place_id
      });

    if (error) throw error;
  }

  async getRecentCheckins(place_id: string, days = 14): Promise<GymCheckin[]> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const { data, error } = await supabase
      .from('gym_checkins')
      .select('*')
      .eq('place_id', place_id)
      .gte('created_at', cutoffDate.toISOString())
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  async getSpottersAtGym(place_id: string, _radiusMiles = 10): Promise<any[]> {
    // Get users who have this gym as home gym from public_profiles (RLS-safe)
    const { data: homeGymUsers, error } = await supabase
      .from('public_profiles')
      .select(`
        id, display_name, avatar_url, verified, fitness_level, 
        preferred_workouts, availability, home_gym_place_id
      `)
      .eq('home_gym_place_id', place_id);

    if (error) throw error;

    // Get user IDs who favorited this gym (no profile join - just IDs)
    const { data: favoriteRecords } = await supabase
      .from('gym_favorites')
      .select('user_id')
      .eq('place_id', place_id);

    // Get user IDs who checked in recently (no profile join - just IDs)
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 14);

    const { data: checkinRecords } = await supabase
      .from('gym_checkins')
      .select('user_id')
      .eq('place_id', place_id)
      .gte('created_at', cutoffDate.toISOString());

    // Collect all unique user IDs (excluding home gym users already fetched)
    const homeGymUserIds = new Set((homeGymUsers || []).map(u => u.id));
    const additionalUserIds = new Set<string>();

    favoriteRecords?.forEach(record => {
      if (!homeGymUserIds.has(record.user_id)) {
        additionalUserIds.add(record.user_id);
      }
    });

    checkinRecords?.forEach(record => {
      if (!homeGymUserIds.has(record.user_id)) {
        additionalUserIds.add(record.user_id);
      }
    });

    // Fetch profiles for additional users from public_profiles (RLS-safe)
    let additionalProfiles: any[] = [];
    if (additionalUserIds.size > 0) {
      const { data: profiles } = await supabase
        .from('public_profiles')
        .select(`
          id, display_name, avatar_url, verified, fitness_level,
          preferred_workouts, availability
        `)
        .in('id', Array.from(additionalUserIds));
      
      additionalProfiles = profiles || [];
    }

    // Determine connection type for each user
    const favoriteUserIds = new Set(favoriteRecords?.map(r => r.user_id) || []);
    const checkinUserIds = new Set(checkinRecords?.map(r => r.user_id) || []);

    // Combine all users with connection types
    const allUsers = new Map();
    
    homeGymUsers?.forEach(profile => {
      allUsers.set(profile.id, { ...profile, connection_type: 'home_gym' });
    });

    additionalProfiles.forEach(profile => {
      if (favoriteUserIds.has(profile.id)) {
        allUsers.set(profile.id, { ...profile, connection_type: 'favorite' });
      } else if (checkinUserIds.has(profile.id)) {
        allUsers.set(profile.id, { ...profile, connection_type: 'recent_checkin' });
      }
    });

    return Array.from(allUsers.values());
  }
}

export const gymCheckinsService = new GymCheckinsService();
