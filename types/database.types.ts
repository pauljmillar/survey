export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      activity_log: {
        Row: {
          id: string
          user_id: string
          activity_type: string
          description: string
          metadata: Json
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          activity_type: string
          description: string
          metadata?: Json
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          activity_type?: string
          description?: string
          metadata?: Json
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "activity_log_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      merchant_offers: {
        Row: {
          id: string
          title: string
          description: string | null
          points_required: number
          merchant_name: string
          offer_details: Json
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          description?: string | null
          points_required: number
          merchant_name: string
          offer_details?: Json
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string | null
          points_required?: number
          merchant_name?: string
          offer_details?: Json
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      panelist_profiles: {
        Row: {
          id: string
          user_id: string
          points_balance: number
          total_points_earned: number
          total_points_redeemed: number
          profile_data: Json
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          points_balance?: number
          total_points_earned?: number
          total_points_redeemed?: number
          profile_data?: Json
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          points_balance?: number
          total_points_earned?: number
          total_points_redeemed?: number
          profile_data?: Json
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "panelist_profiles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      redemptions: {
        Row: {
          id: string
          panelist_id: string
          offer_id: string
          points_spent: number
          status: Database["public"]["Enums"]["redemption_status"]
          redemption_date: string
          created_at: string
        }
        Insert: {
          id?: string
          panelist_id: string
          offer_id: string
          points_spent: number
          status?: Database["public"]["Enums"]["redemption_status"]
          redemption_date?: string
          created_at?: string
        }
        Update: {
          id?: string
          panelist_id?: string
          offer_id?: string
          points_spent?: number
          status?: Database["public"]["Enums"]["redemption_status"]
          redemption_date?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "redemptions_offer_id_fkey"
            columns: ["offer_id"]
            isOneToOne: false
            referencedRelation: "merchant_offers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "redemptions_panelist_id_fkey"
            columns: ["panelist_id"]
            isOneToOne: false
            referencedRelation: "panelist_profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      survey_completions: {
        Row: {
          id: string
          survey_id: string
          panelist_id: string
          points_earned: number
          completed_at: string
          response_data: Json
        }
        Insert: {
          id?: string
          survey_id: string
          panelist_id: string
          points_earned: number
          completed_at?: string
          response_data?: Json
        }
        Update: {
          id?: string
          survey_id?: string
          panelist_id?: string
          points_earned?: number
          completed_at?: string
          response_data?: Json
        }
        Relationships: [
          {
            foreignKeyName: "survey_completions_panelist_id_fkey"
            columns: ["panelist_id"]
            isOneToOne: false
            referencedRelation: "panelist_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "survey_completions_survey_id_fkey"
            columns: ["survey_id"]
            isOneToOne: false
            referencedRelation: "surveys"
            referencedColumns: ["id"]
          }
        ]
      }
      survey_qualifications: {
        Row: {
          id: string
          survey_id: string
          panelist_id: string
          is_qualified: boolean
          created_at: string
        }
        Insert: {
          id?: string
          survey_id: string
          panelist_id: string
          is_qualified?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          survey_id?: string
          panelist_id?: string
          is_qualified?: boolean
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "survey_qualifications_panelist_id_fkey"
            columns: ["panelist_id"]
            isOneToOne: false
            referencedRelation: "panelist_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "survey_qualifications_survey_id_fkey"
            columns: ["survey_id"]
            isOneToOne: false
            referencedRelation: "surveys"
            referencedColumns: ["id"]
          }
        ]
      }
      surveys: {
        Row: {
          id: string
          title: string
          description: string | null
          points_reward: number
          estimated_completion_time: number
          qualification_criteria: Json
          status: Database["public"]["Enums"]["survey_status"]
          created_by: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          description?: string | null
          points_reward: number
          estimated_completion_time: number
          qualification_criteria?: Json
          status?: Database["public"]["Enums"]["survey_status"]
          created_by: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string | null
          points_reward?: number
          estimated_completion_time?: number
          qualification_criteria?: Json
          status?: Database["public"]["Enums"]["survey_status"]
          created_by?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "surveys_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      users: {
        Row: {
          id: string
          email: string
          role: Database["public"]["Enums"]["user_role"]
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          role?: Database["public"]["Enums"]["user_role"]
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          role?: Database["public"]["Enums"]["user_role"]
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      log_activity: {
        Args: {
          p_user_id: string
          p_activity_type: string
          p_description: string
          p_metadata?: Json
        }
        Returns: string
      }
      update_panelist_points: {
        Args: {
          p_panelist_id: string
          p_points_change: number
          p_activity_description: string
        }
        Returns: boolean
      }
    }
    Enums: {
      redemption_status: "pending" | "completed" | "cancelled"
      survey_status: "draft" | "active" | "inactive"
      user_role: "panelist" | "survey_admin" | "system_admin"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (Database["public"]["Tables"] & Database["public"]["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (Database["public"]["Tables"] &
      Database["public"]["Views"])
  ? (Database["public"]["Tables"] &
      Database["public"]["Views"])[PublicTableNameOrOptions] extends {
      Row: infer R
    }
    ? R
    : never
  : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof Database["public"]["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof Database["public"]["Tables"]
  ? Database["public"]["Tables"][PublicTableNameOrOptions] extends {
      Insert: infer I
    }
    ? I
    : never
  : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof Database["public"]["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof Database["public"]["Tables"]
  ? Database["public"]["Tables"][PublicTableNameOrOptions] extends {
      Update: infer U
    }
    ? U
    : never
  : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof Database["public"]["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof Database["public"]["Enums"]
  ? Database["public"]["Enums"][PublicEnumNameOrOptions]
  : never

// Helper types for the application
export type UserRole = Database["public"]["Enums"]["user_role"]
export type SurveyStatus = Database["public"]["Enums"]["survey_status"]
export type RedemptionStatus = Database["public"]["Enums"]["redemption_status"]

export type User = Tables<"users">
export type PanelistProfile = Tables<"panelist_profiles">
export type Survey = Tables<"surveys">
export type SurveyQualification = Tables<"survey_qualifications">
export type SurveyCompletion = Tables<"survey_completions">
export type MerchantOffer = Tables<"merchant_offers">
export type Redemption = Tables<"redemptions">
export type ActivityLog = Tables<"activity_log"> 