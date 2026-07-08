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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      courses: {
        Row: {
          active: boolean
          created_at: string
          icon: string
          id: string
          name: string
          slug: string
          sort_order: number
          tagline: string | null
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          icon?: string
          id?: string
          name: string
          slug: string
          sort_order?: number
          tagline?: string | null
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          icon?: string
          id?: string
          name?: string
          slug?: string
          sort_order?: number
          tagline?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      flashcard_attempts: {
        Row: {
          correct: boolean
          created_at: string
          flashcard_id: string
          id: string
          user_id: string
          xp_awarded: number
        }
        Insert: {
          correct: boolean
          created_at?: string
          flashcard_id: string
          id?: string
          user_id: string
          xp_awarded?: number
        }
        Update: {
          correct?: boolean
          created_at?: string
          flashcard_id?: string
          id?: string
          user_id?: string
          xp_awarded?: number
        }
        Relationships: [
          {
            foreignKeyName: "flashcard_attempts_flashcard_id_fkey"
            columns: ["flashcard_id"]
            isOneToOne: false
            referencedRelation: "flashcards"
            referencedColumns: ["id"]
          },
        ]
      }
      flashcard_topics: {
        Row: {
          area_id: string | null
          course_id: string | null
          created_at: string
          description: string | null
          id: string
          slug: string
          sort_order: number
          title: string
          updated_at: string
        }
        Insert: {
          area_id?: string | null
          course_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          slug: string
          sort_order?: number
          title: string
          updated_at?: string
        }
        Update: {
          area_id?: string | null
          course_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          slug?: string
          sort_order?: number
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "flashcard_topics_area_id_fkey"
            columns: ["area_id"]
            isOneToOne: false
            referencedRelation: "subject_areas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "flashcard_topics_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      flashcards: {
        Row: {
          answer: string
          created_at: string
          id: string
          question: string
          sort_order: number
          topic_id: string
          updated_at: string
        }
        Insert: {
          answer: string
          created_at?: string
          id?: string
          question: string
          sort_order?: number
          topic_id: string
          updated_at?: string
        }
        Update: {
          answer?: string
          created_at?: string
          id?: string
          question?: string
          sort_order?: number
          topic_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "flashcards_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "flashcard_topics"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          course: string | null
          course_id: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          plan: string
          semester: string | null
          university: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          course?: string | null
          course_id?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          plan?: string
          semester?: string | null
          university?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          course?: string | null
          course_id?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          plan?: string
          semester?: string | null
          university?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      question_attempts: {
        Row: {
          answer: string | null
          correct: boolean | null
          created_at: string
          id: string
          question_id: string
          user_id: string
        }
        Insert: {
          answer?: string | null
          correct?: boolean | null
          created_at?: string
          id?: string
          question_id: string
          user_id: string
        }
        Update: {
          answer?: string | null
          correct?: boolean | null
          created_at?: string
          id?: string
          question_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "question_attempts_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
        ]
      }
      question_topics: {
        Row: {
          area_id: string | null
          course_id: string | null
          created_at: string
          description: string | null
          id: string
          slug: string
          sort_order: number
          title: string
          updated_at: string
        }
        Insert: {
          area_id?: string | null
          course_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          slug: string
          sort_order?: number
          title: string
          updated_at?: string
        }
        Update: {
          area_id?: string | null
          course_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          slug?: string
          sort_order?: number
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "question_topics_area_id_fkey"
            columns: ["area_id"]
            isOneToOne: false
            referencedRelation: "subject_areas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "question_topics_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      questions: {
        Row: {
          correct_option: number | null
          created_at: string
          explanation: string | null
          id: string
          options: Json | null
          prompt: string
          sort_order: number
          topic_id: string
          type: string
          updated_at: string
        }
        Insert: {
          correct_option?: number | null
          created_at?: string
          explanation?: string | null
          id?: string
          options?: Json | null
          prompt: string
          sort_order?: number
          topic_id: string
          type?: string
          updated_at?: string
        }
        Update: {
          correct_option?: number | null
          created_at?: string
          explanation?: string | null
          id?: string
          options?: Json | null
          prompt?: string
          sort_order?: number
          topic_id?: string
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "questions_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "question_topics"
            referencedColumns: ["id"]
          },
        ]
      }
      subject_areas: {
        Row: {
          course_id: string | null
          created_at: string
          id: string
          name: string
          sort_order: number
        }
        Insert: {
          course_id?: string | null
          created_at?: string
          id?: string
          name: string
          sort_order?: number
        }
        Update: {
          course_id?: string | null
          created_at?: string
          id?: string
          name?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "subject_areas_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      user_stats: {
        Row: {
          cards_studied: number
          correct_count: number
          created_at: string
          last_study_date: string | null
          level: number
          streak_days: number
          updated_at: string
          user_id: string
          xp: number
        }
        Insert: {
          cards_studied?: number
          correct_count?: number
          created_at?: string
          last_study_date?: string | null
          level?: number
          streak_days?: number
          updated_at?: string
          user_id: string
          xp?: number
        }
        Update: {
          cards_studied?: number
          correct_count?: number
          created_at?: string
          last_study_date?: string | null
          level?: number
          streak_days?: number
          updated_at?: string
          user_id?: string
          xp?: number
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_daily_question_usage: {
        Args: Record<PropertyKey, never>
        Returns: {
          answered_today: number
          is_premium: boolean
          remaining: number
        }[]
      }
      get_leaderboard: {
        Args: { _limit?: number }
        Returns: {
          avatar_url: string
          cards_studied: number
          display_name: string
          level: number
          streak_days: number
          user_id: string
          xp: number
        }[]
      }
      grant_premium_by_email: { Args: { p_email: string }; Returns: undefined }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      list_my_subject_areas: {
        Args: Record<PropertyKey, never>
        Returns: {
          id: string
          name: string
          sort_order: number
        }[]
      }
      list_question_topics: {
        Args: { _area_id?: string; _search?: string }
        Returns: {
          area_id: string
          area_name: string
          description: string
          id: string
          question_count: number
          slug: string
          title: string
        }[]
      }
      list_topic_questions: {
        Args: { _topic_id: string }
        Returns: {
          id: string
          options: Json
          prompt: string
          sort_order: number
          type: string
        }[]
      }
      record_flashcard_attempt: {
        Args: { _correct: boolean; _flashcard_id: string }
        Returns: {
          leveled_up: boolean
          new_level: number
          old_level: number
          streak_days: number
          total_xp: number
          xp_gained: number
        }[]
      }
      record_question_attempt: {
        Args: { _answer: string; _question_id: string }
        Returns: {
          correct: boolean
          correct_option: number
          explanation: string
          is_premium: boolean
          remaining_today: number
        }[]
      }
      unaccent: { Args: { "": string }; Returns: string }
    }
    Enums: {
      app_role: "admin" | "student"
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
      app_role: ["admin", "student"],
    },
  },
} as const
