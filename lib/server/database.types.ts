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
      admin_invitations: {
        Row: {
          accepted_at: string | null
          created_at: string
          email: string
          expires_at: string
          id: string
          invited_by: string
          revoked_at: string | null
          role: string
          token_hash: string
        }
        Insert: {
          accepted_at?: string | null
          created_at?: string
          email: string
          expires_at: string
          id?: string
          invited_by: string
          revoked_at?: string | null
          role: string
          token_hash: string
        }
        Update: {
          accepted_at?: string | null
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          invited_by?: string
          revoked_at?: string | null
          role?: string
          token_hash?: string
        }
        Relationships: [
          {
            foreignKeyName: "admin_invitations_invited_by_fkey"
            columns: ["invited_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      comment_rate_limits: {
        Row: {
          rate_key: string
          request_count: number
          window_started_at: string
        }
        Insert: {
          rate_key: string
          request_count?: number
          window_started_at?: string
        }
        Update: {
          rate_key?: string
          request_count?: number
          window_started_at?: string
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
      newsletter_deliveries: {
        Row: {
          attempted_at: string | null
          created_at: string
          error_message: string | null
          id: string
          provider_message_id: string | null
          sent_at: string | null
          status: string
          story_id: string
          subscriber_id: string
        }
        Insert: {
          attempted_at?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          provider_message_id?: string | null
          sent_at?: string | null
          status?: string
          story_id: string
          subscriber_id: string
        }
        Update: {
          attempted_at?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          provider_message_id?: string | null
          sent_at?: string | null
          status?: string
          story_id?: string
          subscriber_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "newsletter_deliveries_story_id_fkey"
            columns: ["story_id"]
            isOneToOne: false
            referencedRelation: "stories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "newsletter_deliveries_subscriber_id_fkey"
            columns: ["subscriber_id"]
            isOneToOne: false
            referencedRelation: "newsletter_subscribers"
            referencedColumns: ["id"]
          },
        ]
      }
      newsletter_subscribers: {
        Row: {
          confirmation_token_hash: string | null
          confirmed_at: string | null
          consent_source: string
          created_at: string
          email: string
          email_normalized: string
          id: string
          status: string
          unsubscribe_token_hash: string
          unsubscribed_at: string | null
        }
        Insert: {
          confirmation_token_hash?: string | null
          confirmed_at?: string | null
          consent_source?: string
          created_at?: string
          email: string
          email_normalized: string
          id?: string
          status?: string
          unsubscribe_token_hash: string
          unsubscribed_at?: string | null
        }
        Update: {
          confirmation_token_hash?: string | null
          confirmed_at?: string | null
          consent_source?: string
          created_at?: string
          email?: string
          email_normalized?: string
          id?: string
          status?: string
          unsubscribe_token_hash?: string
          unsubscribed_at?: string | null
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
      password_reset_tokens: {
        Row: {
          created_at: string
          expires_at: string
          id: string
          token_hash: string
          used_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          expires_at: string
          id?: string
          token_hash: string
          used_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          expires_at?: string
          id?: string
          token_hash?: string
          used_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "password_reset_tokens_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
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
      spotlight_edit_history: {
        Row: {
          action: string
          after_snapshot: Json | null
          before_snapshot: Json | null
          created_at: string
          editor_id: string | null
          editor_name: string
          id: string
          spotlight_id: string
        }
        Insert: {
          action: string
          after_snapshot?: Json | null
          before_snapshot?: Json | null
          created_at?: string
          editor_id?: string | null
          editor_name: string
          id?: string
          spotlight_id: string
        }
        Update: {
          action?: string
          after_snapshot?: Json | null
          before_snapshot?: Json | null
          created_at?: string
          editor_id?: string | null
          editor_name?: string
          id?: string
          spotlight_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "spotlight_edit_history_editor_id_fkey"
            columns: ["editor_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "spotlight_edit_history_spotlight_id_fkey"
            columns: ["spotlight_id"]
            isOneToOne: false
            referencedRelation: "spotlights"
            referencedColumns: ["id"]
          },
        ]
      }
      spotlight_submission_links: {
        Row: {
          created_at: string
          created_by: string | null
          expires_at: string
          id: string
          token_hash: string
          used_at: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          expires_at: string
          id?: string
          token_hash: string
          used_at?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          expires_at?: string
          id?: string
          token_hash?: string
          used_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "spotlight_submission_links_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      spotlights: {
        Row: {
          author_name: string
          body: string
          created_at: string
          created_by: string | null
          editing_locked_at: string | null
          editing_locked_by: string | null
          excerpt: string
          id: string
          image_url: string | null
          is_current: boolean
          published_at: string | null
          status: string
          submitted_by: string | null
          title: string
          updated_at: string
        }
        Insert: {
          author_name: string
          body: string
          created_at?: string
          created_by?: string | null
          editing_locked_at?: string | null
          editing_locked_by?: string | null
          excerpt: string
          id?: string
          image_url?: string | null
          is_current?: boolean
          published_at?: string | null
          status?: string
          submitted_by?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          author_name?: string
          body?: string
          created_at?: string
          created_by?: string | null
          editing_locked_at?: string | null
          editing_locked_by?: string | null
          excerpt?: string
          id?: string
          image_url?: string | null
          is_current?: boolean
          published_at?: string | null
          status?: string
          submitted_by?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "spotlights_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "spotlights_editing_locked_by_fkey"
            columns: ["editing_locked_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
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
          editing_locked_at: string | null
          editing_locked_by: string | null
          excerpt: string
          featured: boolean
          id: string
          is_spotlight: boolean
          origin: string
          published_at: string | null
          read_count: number
          short_code: string
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
          editing_locked_at?: string | null
          editing_locked_by?: string | null
          excerpt: string
          featured?: boolean
          id?: string
          is_spotlight?: boolean
          origin: string
          published_at?: string | null
          read_count?: number
          short_code: string
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
          editing_locked_at?: string | null
          editing_locked_by?: string | null
          excerpt?: string
          featured?: boolean
          id?: string
          is_spotlight?: boolean
          origin?: string
          published_at?: string | null
          read_count?: number
          short_code?: string
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
          {
            foreignKeyName: "stories_editing_locked_by_fkey"
            columns: ["editing_locked_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      story_comment_reports: {
        Row: {
          comment_id: string
          created_at: string
          id: string
          reason: string
          reporter_hash: string
        }
        Insert: {
          comment_id: string
          created_at?: string
          id?: string
          reason: string
          reporter_hash: string
        }
        Update: {
          comment_id?: string
          created_at?: string
          id?: string
          reason?: string
          reporter_hash?: string
        }
        Relationships: [
          {
            foreignKeyName: "story_comment_reports_comment_id_fkey"
            columns: ["comment_id"]
            isOneToOne: false
            referencedRelation: "story_comments"
            referencedColumns: ["id"]
          },
        ]
      }
      story_comments: {
        Row: {
          body: string
          created_at: string
          display_name: string
          email: string
          id: string
          status: string
          story_id: string
          updated_at: string
        }
        Insert: {
          body: string
          created_at?: string
          display_name: string
          email: string
          id?: string
          status?: string
          story_id: string
          updated_at?: string
        }
        Update: {
          body?: string
          created_at?: string
          display_name?: string
          email?: string
          id?: string
          status?: string
          story_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "story_comments_story_id_fkey"
            columns: ["story_id"]
            isOneToOne: false
            referencedRelation: "stories"
            referencedColumns: ["id"]
          },
        ]
      }
      story_edit_history: {
        Row: {
          action: string
          after_snapshot: Json | null
          before_snapshot: Json | null
          created_at: string
          editor_id: string | null
          editor_name: string
          id: string
          story_id: string
        }
        Insert: {
          action: string
          after_snapshot?: Json | null
          before_snapshot?: Json | null
          created_at?: string
          editor_id?: string | null
          editor_name: string
          id?: string
          story_id: string
        }
        Update: {
          action?: string
          after_snapshot?: Json | null
          before_snapshot?: Json | null
          created_at?: string
          editor_id?: string | null
          editor_name?: string
          id?: string
          story_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "story_edit_history_editor_id_fkey"
            columns: ["editor_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "story_edit_history_story_id_fkey"
            columns: ["story_id"]
            isOneToOne: false
            referencedRelation: "stories"
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
      story_read_events: {
        Row: {
          created_at: string
          id: number
          read_date: string
          story_id: string
          visitor_hash: string
        }
        Insert: {
          created_at?: string
          id?: never
          read_date: string
          story_id: string
          visitor_hash: string
        }
        Update: {
          created_at?: string
          id?: never
          read_date?: string
          story_id?: string
          visitor_hash?: string
        }
        Relationships: [
          {
            foreignKeyName: "story_read_events_story_id_fkey"
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
      accept_admin_invitation: {
        Args: { p_name: string; p_password_hash: string; p_token_hash: string }
        Returns: string
      }
      check_comment_rate_limit: {
        Args: { p_rate_key: string }
        Returns: boolean
      }
      record_story_read: {
        Args: { p_story_id: string; p_visitor_hash: string }
        Returns: number
      }
      reset_user_password: {
        Args: { p_password_hash: string; p_token_hash: string }
        Returns: boolean
      }
      set_current_spotlight: { Args: { p_story_id: string }; Returns: boolean }
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
