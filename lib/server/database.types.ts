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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      ad_campaigns: {
        Row: {
          advertiser: string
          created_at: string
          creative_url: string | null
          ends_at: string
          id: string
          placement: string
          starts_at: string
          status: string
          target_url: string | null
          type: string
          updated_at: string
        }
        Insert: {
          advertiser: string
          created_at?: string
          creative_url?: string | null
          ends_at: string
          id?: string
          placement: string
          starts_at: string
          status?: string
          target_url?: string | null
          type: string
          updated_at?: string
        }
        Update: {
          advertiser?: string
          created_at?: string
          creative_url?: string | null
          ends_at?: string
          id?: string
          placement?: string
          starts_at?: string
          status?: string
          target_url?: string | null
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      media: {
        Row: {
          alt_text: string | null
          bytes: number | null
          created_at: string
          folder: string | null
          format: string | null
          height: number | null
          id: string
          original_name: string | null
          public_id: string
          resource_type: string
          secure_url: string
          updated_at: string
          url: string
          width: number | null
        }
        Insert: {
          alt_text?: string | null
          bytes?: number | null
          created_at?: string
          folder?: string | null
          format?: string | null
          height?: number | null
          id?: string
          original_name?: string | null
          public_id: string
          resource_type?: string
          secure_url: string
          updated_at?: string
          url: string
          width?: number | null
        }
        Update: {
          alt_text?: string | null
          bytes?: number | null
          created_at?: string
          folder?: string | null
          format?: string | null
          height?: number | null
          id?: string
          original_name?: string | null
          public_id?: string
          resource_type?: string
          secure_url?: string
          updated_at?: string
          url?: string
          width?: number | null
        }
        Relationships: []
      }
      opportunities: {
        Row: {
          application_url: string | null
          commercial_status: string
          created_at: string
          deadline: string | null
          description: string
          id: string
          organisation: string
          origin: string
          published_at: string | null
          slug: string
          status: string
          title: string
          type: string
          updated_at: string
        }
        Insert: {
          application_url?: string | null
          commercial_status?: string
          created_at?: string
          deadline?: string | null
          description: string
          id?: string
          organisation: string
          origin: string
          published_at?: string | null
          slug: string
          status?: string
          title: string
          type: string
          updated_at?: string
        }
        Update: {
          application_url?: string | null
          commercial_status?: string
          created_at?: string
          deadline?: string | null
          description?: string
          id?: string
          organisation?: string
          origin?: string
          published_at?: string | null
          slug?: string
          status?: string
          title?: string
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      radar_items: {
        Row: {
          commercial_status: string
          cover_image: string | null
          created_at: string
          event_date: string | null
          id: string
          kind: string
          link: string | null
          location: string | null
          origin: string
          published_at: string | null
          slug: string
          status: string
          summary: string
          title: string
          updated_at: string
        }
        Insert: {
          commercial_status?: string
          cover_image?: string | null
          created_at?: string
          event_date?: string | null
          id?: string
          kind: string
          link?: string | null
          location?: string | null
          origin: string
          published_at?: string | null
          slug: string
          status?: string
          summary: string
          title: string
          updated_at?: string
        }
        Update: {
          commercial_status?: string
          cover_image?: string | null
          created_at?: string
          event_date?: string | null
          id?: string
          kind?: string
          link?: string | null
          location?: string | null
          origin?: string
          published_at?: string | null
          slug?: string
          status?: string
          summary?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      stories: {
        Row: {
          author_id: string | null
          author_name: string
          body: string
          commercial_status: string
          content_type: string
          cover_image: string | null
          created_at: string
          excerpt: string
          featured: boolean
          id: string
          origin: string
          published_at: string | null
          slug: string
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          author_id?: string | null
          author_name: string
          body: string
          commercial_status?: string
          content_type: string
          cover_image?: string | null
          created_at?: string
          excerpt: string
          featured?: boolean
          id?: string
          origin: string
          published_at?: string | null
          slug: string
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          author_id?: string | null
          author_name?: string
          body?: string
          commercial_status?: string
          content_type?: string
          cover_image?: string | null
          created_at?: string
          excerpt?: string
          featured?: boolean
          id?: string
          origin?: string
          published_at?: string | null
          slug?: string
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "stories_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      story_images: {
        Row: {
          alt_text: string | null
          caption: string | null
          created_at: string
          display_order: number
          id: string
          media_id: string | null
          photographer: string | null
          story_id: string
          updated_at: string
          url: string
        }
        Insert: {
          alt_text?: string | null
          caption?: string | null
          created_at?: string
          display_order?: number
          id?: string
          media_id?: string | null
          photographer?: string | null
          story_id: string
          updated_at?: string
          url: string
        }
        Update: {
          alt_text?: string | null
          caption?: string | null
          created_at?: string
          display_order?: number
          id?: string
          media_id?: string | null
          photographer?: string | null
          story_id?: string
          updated_at?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "story_images_story_id_fkey"
            columns: ["story_id"]
            isOneToOne: false
            referencedRelation: "stories"
            referencedColumns: ["id"]
          },
        ]
      }
      story_tags: {
        Row: {
          id: string
          story_id: string
          tag: string
        }
        Insert: {
          id?: string
          story_id: string
          tag: string
        }
        Update: {
          id?: string
          story_id?: string
          tag?: string
        }
        Relationships: [
          {
            foreignKeyName: "story_tags_story_id_fkey"
            columns: ["story_id"]
            isOneToOne: false
            referencedRelation: "stories"
            referencedColumns: ["id"]
          },
        ]
      }
      submissions: {
        Row: {
          body: string
          contact: string | null
          created_at: string
          id: string
          name: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          source: string
          status: string
          title: string | null
          type: string
          updated_at: string
        }
        Insert: {
          body: string
          contact?: string | null
          created_at?: string
          id?: string
          name?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          source?: string
          status?: string
          title?: string | null
          type: string
          updated_at?: string
        }
        Update: {
          body?: string
          contact?: string | null
          created_at?: string
          id?: string
          name?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          source?: string
          status?: string
          title?: string | null
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      users: {
        Row: {
          created_at: string
          email: string
          id: string
          is_active: boolean
          name: string
          password_hash: string
          role: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          is_active?: boolean
          name: string
          password_hash: string
          role?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          is_active?: boolean
          name?: string
          password_hash?: string
          role?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
