export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          username: string
          display_name: string
          avatar_url: string | null
          goal: string
          experience: string
          equipment: string
          is_pro: boolean
          pro_expires_at: string | null
          streak: number
          total_workouts: number
          weight: number | null
          height: number | null
          onboarding_complete: boolean
          questionnaire: Record<string, unknown> | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          username: string
          display_name: string
          avatar_url?: string | null
          goal?: string
          experience?: string
          equipment?: string
          is_pro?: boolean
          pro_expires_at?: string | null
          streak?: number
          total_workouts?: number
          weight?: number | null
          height?: number | null
          onboarding_complete?: boolean
          questionnaire?: Record<string, unknown> | null
        }
        Update: Partial<Database['public']['Tables']['profiles']['Insert']>
      }
      workout_sessions: {
        Row: {
          id: string
          user_id: string
          name: string
          date: string
          duration: number
          exercises: unknown
          total_volume: number
          xp_gained: number
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          date: string
          duration: number
          exercises: unknown
          total_volume?: number
          xp_gained?: number
          notes?: string | null
        }
        Update: Partial<Database['public']['Tables']['workout_sessions']['Insert']>
      }
      muscle_ranks: {
        Row: {
          id: string
          user_id: string
          muscle: string
          tier: string
          percentile: number
          one_rm: number
          xp: number
          next_level_xp: number
        }
        Insert: {
          id?: string
          user_id: string
          muscle: string
          tier?: string
          percentile?: number
          one_rm?: number
          xp?: number
          next_level_xp?: number
        }
        Update: Partial<Database['public']['Tables']['muscle_ranks']['Insert']>
      }
      routines: {
        Row: {
          id: string
          user_id: string
          name: string
          description: string
          exercises: unknown
          frequency: string
          category: string
          difficulty: number
          is_ai_generated: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          description?: string
          exercises: unknown
          frequency?: string
          category?: string
          difficulty?: number
          is_ai_generated?: boolean
        }
        Update: Partial<Database['public']['Tables']['routines']['Insert']>
      }
      social_posts: {
        Row: {
          id: string
          user_id: string
          content: string
          image_url: string | null
          workout_summary: unknown | null
          likes_count: number
          comments_count: number
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          content: string
          image_url?: string | null
          workout_summary?: unknown | null
        }
        Update: Partial<Database['public']['Tables']['social_posts']['Insert']>
      }
      post_likes: {
        Row: { user_id: string; post_id: string; created_at: string }
        Insert: { user_id: string; post_id: string }
        Update: never
      }
      friendships: {
        Row: { follower_id: string; following_id: string; created_at: string }
        Insert: { follower_id: string; following_id: string }
        Update: never
      }
    }
  }
}
