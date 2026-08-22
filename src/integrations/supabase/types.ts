export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      amenity_defs: {
        Row: {
          id: number
          key: string
          label: string
        }
        Insert: {
          id?: number
          key: string
          label: string
        }
        Update: {
          id?: number
          key?: string
          label?: string
        }
        Relationships: []
      }
      api_rate_limits: {
        Row: {
          created_at: string
          endpoint: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          endpoint: string
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string
          endpoint?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      comments: {
        Row: {
          author_id: string
          created_at: string
          id: string
          post_id: string
          text: string
        }
        Insert: {
          author_id: string
          created_at?: string
          id?: string
          post_id: string
          text: string
        }
        Update: {
          author_id?: string
          created_at?: string
          id?: string
          post_id?: string
          text?: string
        }
        Relationships: [
          {
            foreignKeyName: "comments_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "discoverable_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "v_profile_match"
            referencedColumns: ["match_id"]
          },
          {
            foreignKeyName: "comments_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "v_profile_match"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          created_at: string
          id: string
          last_message_at: string | null
          participant_1: string
          participant_2: string
        }
        Insert: {
          created_at?: string
          id?: string
          last_message_at?: string | null
          participant_1: string
          participant_2: string
        }
        Update: {
          created_at?: string
          id?: string
          last_message_at?: string | null
          participant_1?: string
          participant_2?: string
        }
        Relationships: []
      }
      follows: {
        Row: {
          created_at: string
          followed_id: string
          follower_id: string
        }
        Insert: {
          created_at?: string
          followed_id: string
          follower_id: string
        }
        Update: {
          created_at?: string
          followed_id?: string
          follower_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "follows_followed_id_fkey"
            columns: ["followed_id"]
            isOneToOne: false
            referencedRelation: "discoverable_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "follows_followed_id_fkey"
            columns: ["followed_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "follows_followed_id_fkey"
            columns: ["followed_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "follows_followed_id_fkey"
            columns: ["followed_id"]
            isOneToOne: false
            referencedRelation: "v_profile_match"
            referencedColumns: ["match_id"]
          },
          {
            foreignKeyName: "follows_followed_id_fkey"
            columns: ["followed_id"]
            isOneToOne: false
            referencedRelation: "v_profile_match"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "follows_follower_id_fkey"
            columns: ["follower_id"]
            isOneToOne: false
            referencedRelation: "discoverable_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "follows_follower_id_fkey"
            columns: ["follower_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "follows_follower_id_fkey"
            columns: ["follower_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "follows_follower_id_fkey"
            columns: ["follower_id"]
            isOneToOne: false
            referencedRelation: "v_profile_match"
            referencedColumns: ["match_id"]
          },
          {
            foreignKeyName: "follows_follower_id_fkey"
            columns: ["follower_id"]
            isOneToOne: false
            referencedRelation: "v_profile_match"
            referencedColumns: ["user_id"]
          },
        ]
      }
      geocode_cache: {
        Row: {
          created_at: string | null
          expires_at: string | null
          lat: number
          lng: number
          zipcode: string
        }
        Insert: {
          created_at?: string | null
          expires_at?: string | null
          lat: number
          lng: number
          zipcode: string
        }
        Update: {
          created_at?: string | null
          expires_at?: string | null
          lat?: number
          lng?: number
          zipcode?: string
        }
        Relationships: []
      }
      gym_amenities: {
        Row: {
          amenity_id: number
          gym_id: string
        }
        Insert: {
          amenity_id: number
          gym_id: string
        }
        Update: {
          amenity_id?: number
          gym_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "gym_amenities_amenity_id_fkey"
            columns: ["amenity_id"]
            isOneToOne: false
            referencedRelation: "amenity_defs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gym_amenities_gym_id_fkey"
            columns: ["gym_id"]
            isOneToOne: false
            referencedRelation: "gyms"
            referencedColumns: ["id"]
          },
        ]
      }
      gym_checkins: {
        Row: {
          created_at: string | null
          place_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          place_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          place_id?: string
          user_id?: string
        }
        Relationships: []
      }
      gym_favorites: {
        Row: {
          address: string | null
          created_at: string | null
          lat: number | null
          lng: number | null
          photo_ref: string | null
          place_id: string
          place_name: string
          user_id: string
        }
        Insert: {
          address?: string | null
          created_at?: string | null
          lat?: number | null
          lng?: number | null
          photo_ref?: string | null
          place_id: string
          place_name: string
          user_id: string
        }
        Update: {
          address?: string | null
          created_at?: string | null
          lat?: number | null
          lng?: number | null
          photo_ref?: string | null
          place_id?: string
          place_name?: string
          user_id?: string
        }
        Relationships: []
      }
      gyms: {
        Row: {
          address: string | null
          created_at: string | null
          google_map_url: string | null
          id: string
          lat: number | null
          lng: number | null
          name: string
          opening_hours: Json | null
          phone: string | null
          photo_refs: Json | null
          place_id: string
          rating: number | null
          updated_at: string | null
          user_ratings_total: number | null
          website: string | null
        }
        Insert: {
          address?: string | null
          created_at?: string | null
          google_map_url?: string | null
          id?: string
          lat?: number | null
          lng?: number | null
          name: string
          opening_hours?: Json | null
          phone?: string | null
          photo_refs?: Json | null
          place_id: string
          rating?: number | null
          updated_at?: string | null
          user_ratings_total?: number | null
          website?: string | null
        }
        Update: {
          address?: string | null
          created_at?: string | null
          google_map_url?: string | null
          id?: string
          lat?: number | null
          lng?: number | null
          name?: string
          opening_hours?: Json | null
          phone?: string | null
          photo_refs?: Json | null
          place_id?: string
          rating?: number | null
          updated_at?: string | null
          user_ratings_total?: number | null
          website?: string | null
        }
        Relationships: []
      }
      gyms_cache: {
        Row: {
          address: string | null
          created_at: string | null
          lat: number | null
          lng: number | null
          name: string | null
          phone: string | null
          place_id: string
          rating: number | null
          raw: Json | null
          updated_at: string | null
          user_ratings_total: number | null
          website: string | null
        }
        Insert: {
          address?: string | null
          created_at?: string | null
          lat?: number | null
          lng?: number | null
          name?: string | null
          phone?: string | null
          place_id: string
          rating?: number | null
          raw?: Json | null
          updated_at?: string | null
          user_ratings_total?: number | null
          website?: string | null
        }
        Update: {
          address?: string | null
          created_at?: string | null
          lat?: number | null
          lng?: number | null
          name?: string | null
          phone?: string | null
          place_id?: string
          rating?: number | null
          raw?: Json | null
          updated_at?: string | null
          user_ratings_total?: number | null
          website?: string | null
        }
        Relationships: []
      }
      likes: {
        Row: {
          created_at: string
          id: string
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          post_id?: string
          user_id?: string
        }
        Relationships: []
      }
      locations: {
        Row: {
          lat: number
          lng: number
          share_location: boolean | null
          updated_at: string
          user_id: string
        }
        Insert: {
          lat: number
          lng: number
          share_location?: boolean | null
          updated_at?: string
          user_id: string
        }
        Update: {
          lat?: number
          lng?: number
          share_location?: boolean | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "locations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "discoverable_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "locations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "locations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "locations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "v_profile_match"
            referencedColumns: ["match_id"]
          },
          {
            foreignKeyName: "locations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "v_profile_match"
            referencedColumns: ["user_id"]
          },
        ]
      }
      meetups: {
        Row: {
          created_at: string
          creator_id: string
          duration_mins: number | null
          id: string
          notes: string | null
          place_id: string
          start_time: string
          title: string | null
          updated_at: string
          workout_type: string | null
        }
        Insert: {
          created_at?: string
          creator_id: string
          duration_mins?: number | null
          id?: string
          notes?: string | null
          place_id: string
          start_time: string
          title?: string | null
          updated_at?: string
          workout_type?: string | null
        }
        Update: {
          created_at?: string
          creator_id?: string
          duration_mins?: number | null
          id?: string
          notes?: string | null
          place_id?: string
          start_time?: string
          title?: string | null
          updated_at?: string
          workout_type?: string | null
        }
        Relationships: []
      }
      messages: {
        Row: {
  created_at: string
  id: string
  is_read: boolean
  recipient_id: string
  sender_id: string
  text: string
}
        Insert: {
  created_at?: string
  id?: string
  is_read?: boolean
  recipient_id: string
  sender_id: string
  text: string
}
        Update: {
  created_at?: string
  id?: string
  is_read?: boolean
  recipient_id?: string
  sender_id?: string
  text?: string
}
        Relationships: [
          {
            foreignKeyName: "messages_recipient_id_fkey"
            columns: ["recipient_id"]
            isOneToOne: false
            referencedRelation: "discoverable_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_recipient_id_fkey"
            columns: ["recipient_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_recipient_id_fkey"
            columns: ["recipient_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_recipient_id_fkey"
            columns: ["recipient_id"]
            isOneToOne: false
            referencedRelation: "v_profile_match"
            referencedColumns: ["match_id"]
          },
          {
            foreignKeyName: "messages_recipient_id_fkey"
            columns: ["recipient_id"]
            isOneToOne: false
            referencedRelation: "v_profile_match"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "discoverable_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "v_profile_match"
            referencedColumns: ["match_id"]
          },
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "v_profile_match"
            referencedColumns: ["user_id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          data: Json | null
          id: string
          message: string | null
          read: boolean | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          data?: Json | null
          id?: string
          message?: string | null
          read?: boolean | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          created_at?: string
          data?: Json | null
          id?: string
          message?: string | null
          read?: boolean | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      places_cache: {
        Row: {
          cache_key: string
          created_at: string | null
          expires_at: string
          payload: Json
        }
        Insert: {
          cache_key: string
          created_at?: string | null
          expires_at?: string
          payload: Json
        }
        Update: {
          cache_key?: string
          created_at?: string | null
          expires_at?: string
          payload?: Json
        }
        Relationships: []
      }
      post_comments: {
        Row: {
          created_at: string | null
          id: string
          post_id: string
          text: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          post_id: string
          text: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          post_id?: string
          text?: string
          user_id?: string
        }
        Relationships: []
      }
      post_likes: {
        Row: {
          created_at: string | null
          id: string
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          post_id?: string
          user_id?: string
        }
        Relationships: []
      }
      posts: {
        Row: {
          author_id: string
          comment_count: number | null
          created_at: string
          deleted_at: string | null
          id: string
          like_count: number
          media_urls: string[] | null
          text: string | null
        }
        Insert: {
          author_id: string
          comment_count?: number | null
          created_at?: string
          deleted_at?: string | null
          id?: string
          like_count?: number
          media_urls?: string[] | null
          text?: string | null
        }
        Update: {
          author_id?: string
          comment_count?: number | null
          created_at?: string
          deleted_at?: string | null
          id?: string
          like_count?: number
          media_urls?: string[] | null
          text?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "posts_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "discoverable_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "posts_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "posts_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "posts_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "v_profile_match"
            referencedColumns: ["match_id"]
          },
          {
            foreignKeyName: "posts_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "v_profile_match"
            referencedColumns: ["user_id"]
          },
        ]
      }
      profile_links: {
        Row: {
          created_at: string | null
          id: string
          label: string
          url: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          label: string
          url: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          label?: string
          url?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profile_links_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "discoverable_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profile_links_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profile_links_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profile_links_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_profile_match"
            referencedColumns: ["match_id"]
          },
          {
            foreignKeyName: "profile_links_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_profile_match"
            referencedColumns: ["user_id"]
          },
        ]
      }
      profiles: {
        Row: {
          activities: string[] | null
          allow_messages: boolean | null
          availability: string[] | null
          avatar_url: string | null
          bio: string | null
          cover_image_url: string | null
          created_at: string
          discoverable: boolean | null
          display_name: string | null
          experience_level: string | null
          first_name: string | null
          fitness_goals: string[] | null
          fitness_level: string | null
          followers_count: number | null
          following_count: number | null
          goals: string[] | null
          home_gym_address: string | null
          home_gym_name: string | null
          home_gym_place_id: string | null
          id: string
          intensity_level: number | null
          is_visible: boolean | null
          last_name: string | null
          last_seen_at: string | null
          lat: number | null
          lng: number | null
          notify_comments: boolean | null
          notify_likes: boolean | null
          notify_meetup_reminders: boolean | null
          notify_messages: boolean | null
          notify_new_followers: boolean | null
          notify_spot_requests: boolean | null
          onboarding_completed: boolean | null
          phone: string | null
          preferred_distance_miles: number | null
          preferred_workouts: string[] | null
          spotlight_post_ids: string[] | null
          username: string | null
          verified: boolean | null
          vibe: string | null
          zip_code: string | null
        }
        Insert: {
          activities?: string[] | null
          allow_messages?: boolean | null
          availability?: string[] | null
          avatar_url?: string | null
          bio?: string | null
          cover_image_url?: string | null
          created_at?: string
          discoverable?: boolean | null
          display_name?: string | null
          experience_level?: string | null
          first_name?: string | null
          fitness_goals?: string[] | null
          fitness_level?: string | null
          followers_count?: number | null
          following_count?: number | null
          goals?: string[] | null
          home_gym_address?: string | null
          home_gym_name?: string | null
          home_gym_place_id?: string | null
          id?: string
          intensity_level?: number | null
          is_visible?: boolean | null
          last_name?: string | null
          last_seen_at?: string | null
          lat?: number | null
          lng?: number | null
          notify_comments?: boolean | null
          notify_likes?: boolean | null
          notify_meetup_reminders?: boolean | null
          notify_messages?: boolean | null
          notify_new_followers?: boolean | null
          notify_spot_requests?: boolean | null
          onboarding_completed?: boolean | null
          phone?: string | null
          preferred_distance_miles?: number | null
          preferred_workouts?: string[] | null
          spotlight_post_ids?: string[] | null
          username?: string | null
          verified?: boolean | null
          vibe?: string | null
          zip_code?: string | null
        }
        Update: {
          activities?: string[] | null
          allow_messages?: boolean | null
          availability?: string[] | null
          avatar_url?: string | null
          bio?: string | null
          cover_image_url?: string | null
          created_at?: string
          discoverable?: boolean | null
          display_name?: string | null
          experience_level?: string | null
          first_name?: string | null
          fitness_goals?: string[] | null
          fitness_level?: string | null
          followers_count?: number | null
          following_count?: number | null
          goals?: string[] | null
          home_gym_address?: string | null
          home_gym_name?: string | null
          home_gym_place_id?: string | null
          id?: string
          intensity_level?: number | null
          is_visible?: boolean | null
          last_name?: string | null
          last_seen_at?: string | null
          lat?: number | null
          lng?: number | null
          notify_comments?: boolean | null
          notify_likes?: boolean | null
          notify_meetup_reminders?: boolean | null
          notify_messages?: boolean | null
          notify_new_followers?: boolean | null
          notify_spot_requests?: boolean | null
          onboarding_completed?: boolean | null
          phone?: string | null
          preferred_distance_miles?: number | null
          preferred_workouts?: string[] | null
          spotlight_post_ids?: string[] | null
          username?: string | null
          verified?: boolean | null
          vibe?: string | null
          zip_code?: string | null
        }
        Relationships: []
      }
      search_cache: {
        Row: {
          cache_key: string
          created_at: string | null
          expires_at: string | null
          payload: Json
        }
        Insert: {
          cache_key: string
          created_at?: string | null
          expires_at?: string | null
          payload: Json
        }
        Update: {
          cache_key?: string
          created_at?: string | null
          expires_at?: string | null
          payload?: Json
        }
        Relationships: []
      }
      spot_requests: {
        Row: {
          created_at: string
          id: string
          message: string | null
          requestee_id: string
          requester_id: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          message?: string | null
          requestee_id: string
          requester_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string | null
          requestee_id?: string
          requester_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      support_messages: {
        Row: {
          created_at: string | null
          email: string
          id: string
          message: string
          name: string | null
          page: string | null
          subject: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          id?: string
          message: string
          name?: string | null
          page?: string | null
          subject?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          id?: string
          message?: string
          name?: string | null
          page?: string | null
          subject?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      user_favorites: {
        Row: {
          created_at: string | null
          gym_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          gym_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          gym_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_favorites_gym_id_fkey"
            columns: ["gym_id"]
            isOneToOne: false
            referencedRelation: "gyms"
            referencedColumns: ["id"]
          },
        ]
      }
      user_feedback: {
        Row: {
          category: string
          created_at: string | null
          id: string
          message: string
          screenshot_url: string | null
          user_id: string | null
        }
        Insert: {
          category: string
          created_at?: string | null
          id?: string
          message: string
          screenshot_url?: string | null
          user_id?: string | null
        }
        Update: {
          category?: string
          created_at?: string | null
          id?: string
          message?: string
          screenshot_url?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      waitlist_signups: {
        Row: {
          _info: Json | null
          created_at: string
          email: string | null
          first_name: string
          id: string
          invite_sent_at: string | null
          invite_token: string | null
          invite_url: string | null
          last_name: string | null
          notes: string | null
          onboarded_at: string | null
          phone: string | null
          sms_opt_in: boolean
          source: string | null
          status: string
          utm: Json | null
        }
        Insert: {
          _info?: Json | null
          created_at?: string
          email?: string | null
          first_name: string
          id?: string
          invite_sent_at?: string | null
          invite_token?: string | null
          invite_url?: string | null
          last_name?: string | null
          notes?: string | null
          onboarded_at?: string | null
          phone?: string | null
          sms_opt_in?: boolean
          source?: string | null
          status?: string
          utm?: Json | null
        }
        Update: {
          _info?: Json | null
          created_at?: string
          email?: string | null
          first_name?: string
          id?: string
          invite_sent_at?: string | null
          invite_token?: string | null
          invite_url?: string | null
          last_name?: string | null
          notes?: string | null
          onboarded_at?: string | null
          phone?: string | null
          sms_opt_in?: boolean
          source?: string | null
          status?: string
          utm?: Json | null
        }
        Relationships: []
      }
    }
    Views: {
      discoverable_profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          display_name: string | null
          first_name: string | null
          id: string | null
          last_name: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          display_name?: string | null
          first_name?: string | null
          id?: string | null
          last_name?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          display_name?: string | null
          first_name?: string | null
          id?: string | null
          last_name?: string | null
        }
        Relationships: []
      }
      public_profiles: {
        Row: {
          allow_messages: boolean | null
          availability: string[] | null
          avatar_url: string | null
          bio: string | null
          created_at: string | null
          discoverable: boolean | null
          display_name: string | null
          experience_level: string | null
          first_name: string | null
          fitness_goals: string[] | null
          fitness_level: string | null
          followers_count: number | null
          following_count: number | null
          home_gym_name: string | null
          home_gym_place_id: string | null
          id: string | null
          is_visible: boolean | null
          last_name: string | null
          preferred_workouts: string[] | null
          username: string | null
          verified: boolean | null
          vibe: string | null
        }
        Insert: {
          allow_messages?: boolean | null
          availability?: string[] | null
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          discoverable?: boolean | null
          display_name?: string | null
          experience_level?: string | null
          first_name?: string | null
          fitness_goals?: string[] | null
          fitness_level?: string | null
          followers_count?: number | null
          following_count?: number | null
          home_gym_name?: string | null
          home_gym_place_id?: string | null
          id?: string | null
          is_visible?: boolean | null
          last_name?: string | null
          preferred_workouts?: string[] | null
          username?: string | null
          verified?: boolean | null
          vibe?: string | null
        }
        Update: {
          allow_messages?: boolean | null
          availability?: string[] | null
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          discoverable?: boolean | null
          display_name?: string | null
          experience_level?: string | null
          first_name?: string | null
          fitness_goals?: string[] | null
          fitness_level?: string | null
          followers_count?: number | null
          following_count?: number | null
          home_gym_name?: string | null
          home_gym_place_id?: string | null
          id?: string | null
          is_visible?: boolean | null
          last_name?: string | null
          preferred_workouts?: string[] | null
          username?: string | null
          verified?: boolean | null
          vibe?: string | null
        }
        Relationships: []
      }
      v_profile_match: {
        Row: {
          avatar_url: string | null
          bio: string | null
          display_name: string | null
          first_name: string | null
          last_name: string | null
          match_id: string | null
          user_id: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      cleanup_expired_caches: { Args: never; Returns: undefined }
      get_nearby_visible_users: {
        Args: never
        Returns: {
          lat: number
          lng: number
          updated_at: string
          user_id: string
        }[]
      }
      get_post_feed: {
        Args: { p_limit: number; p_offset: number }
        Returns: {
          author_avatar_url: string
          author_display_name: string
          author_id: string
          author_verified: boolean
          author_vibe: string
          comment_count: number
          created_at: string
          like_count: number
          media_urls: string[]
          post_id: string
          text: string
        }[]
      }
      get_public_profile: {
        Args: { profile_id: string }
        Returns: {
          availability: string[]
          avatar_url: string
          bio: string
          display_name: string
          fitness_goals: string[]
          fitness_level: string
          followers_count: number
          following_count: number
          home_gym_place_id: string
          id: string
          preferred_workouts: string[]
          verified: boolean
          vibe: string
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "moderator", "user"],
    },
  },
} as const
