export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          role: 'panelist' | 'survey_admin' | 'system_admin'
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          role?: 'panelist' | 'survey_admin' | 'system_admin'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          role?: 'panelist' | 'survey_admin' | 'system_admin'
          created_at?: string
          updated_at?: string
        }
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
      }
      surveys: {
        Row: {
          id: string
          title: string
          description: string | null
          points_reward: number
          estimated_completion_time: number
          qualification_criteria: Json
          status: 'draft' | 'active' | 'inactive'
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
          status?: 'draft' | 'active' | 'inactive'
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
          status?: 'draft' | 'active' | 'inactive'
          created_by?: string
          created_at?: string
          updated_at?: string
        }
      }
      survey_questions: {
        Row: {
          id: string
          survey_id: string
          question_text: string
          question_type: 'multiple_choice' | 'text' | 'rating' | 'checkbox' | 'yes_no' | 'date_time'
          question_order: number
          is_required: boolean
          options: Json | null
          validation_rules: Json | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          survey_id: string
          question_text: string
          question_type: 'multiple_choice' | 'text' | 'rating' | 'checkbox' | 'yes_no' | 'date_time'
          question_order: number
          is_required?: boolean
          options?: Json | null
          validation_rules?: Json | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          survey_id?: string
          question_text?: string
          question_type?: 'multiple_choice' | 'text' | 'rating' | 'checkbox' | 'yes_no' | 'date_time'
          question_order?: number
          is_required?: boolean
          options?: Json | null
          validation_rules?: Json | null
          created_at?: string
          updated_at?: string
        }
      }
      survey_responses: {
        Row: {
          id: string
          survey_id: string
          panelist_id: string
          question_id: string
          response_value: string | null
          response_metadata: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          survey_id: string
          panelist_id: string
          question_id: string
          response_value?: string | null
          response_metadata?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          survey_id?: string
          panelist_id?: string
          question_id?: string
          response_value?: string | null
          response_metadata?: Json | null
          created_at?: string
        }
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
      }
      redemptions: {
        Row: {
          id: string
          panelist_id: string
          offer_id: string
          points_spent: number
          status: 'pending' | 'completed' | 'cancelled'
          redemption_date: string | null
          created_at: string
        }
        Insert: {
          id?: string
          panelist_id: string
          offer_id: string
          points_spent: number
          status?: 'pending' | 'completed' | 'cancelled'
          redemption_date?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          panelist_id?: string
          offer_id?: string
          points_spent?: number
          status?: 'pending' | 'completed' | 'cancelled'
          redemption_date?: string | null
          created_at?: string
        }
      }
      activity_log: {
        Row: {
          id: string
          user_id: string
          activity_type: string
          description: string
          metadata: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          activity_type: string
          description: string
          metadata?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          activity_type?: string
          description?: string
          metadata?: Json | null
          created_at?: string
        }
      }
      contests: {
        Row: {
          id: string
          title: string
          description: string | null
          start_date: string
          end_date: string
          prize_points: number
          status: 'draft' | 'active' | 'ended' | 'cancelled'
          invite_type: 'all_panelists' | 'selected_panelists'
          created_by: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          description?: string | null
          start_date: string
          end_date: string
          prize_points: number
          status?: 'draft' | 'active' | 'ended' | 'cancelled'
          invite_type?: 'all_panelists' | 'selected_panelists'
          created_by: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string | null
          start_date?: string
          end_date?: string
          prize_points?: number
          status?: 'draft' | 'active' | 'ended' | 'cancelled'
          invite_type?: 'all_panelists' | 'selected_panelists'
          created_by?: string
          created_at?: string
          updated_at?: string
        }
      }
      contest_invitations: {
        Row: {
          id: string
          contest_id: string
          panelist_id: string
          invited_at: string
          invited_by: string
        }
        Insert: {
          id?: string
          contest_id: string
          panelist_id: string
          invited_at?: string
          invited_by: string
        }
        Update: {
          id?: string
          contest_id?: string
          panelist_id?: string
          invited_at?: string
          invited_by?: string
        }
      }
      contest_participants: {
        Row: {
          id: string
          contest_id: string
          panelist_id: string
          joined_at: string
          points_earned: number
          rank: number | null
          prize_awarded: boolean
          prize_awarded_at: string | null
          prize_awarded_by: string | null
        }
        Insert: {
          id?: string
          contest_id: string
          panelist_id: string
          joined_at?: string
          points_earned?: number
          rank?: number | null
          prize_awarded?: boolean
          prize_awarded_at?: string | null
          prize_awarded_by?: string | null
        }
        Update: {
          id?: string
          contest_id?: string
          panelist_id?: string
          joined_at?: string
          points_earned?: number
          rank?: number | null
          prize_awarded?: boolean
          prize_awarded_at?: string | null
          prize_awarded_by?: string | null
        }
      }
      contest_prize_awards: {
        Row: {
          id: string
          contest_id: string
          panelist_id: string
          points_awarded: number
          awarded_at: string
          awarded_by: string
          ledger_entry_id: string | null
        }
        Insert: {
          id?: string
          contest_id: string
          panelist_id: string
          points_awarded: number
          awarded_at?: string
          awarded_by: string
          ledger_entry_id?: string | null
        }
        Update: {
          id?: string
          contest_id?: string
          panelist_id?: string
          points_awarded?: number
          awarded_at?: string
          awarded_by?: string
          ledger_entry_id?: string | null
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      user_role: 'panelist' | 'survey_admin' | 'system_admin'
      survey_status: 'draft' | 'active' | 'inactive'
      question_type: 'multiple_choice' | 'text' | 'rating' | 'checkbox' | 'yes_no' | 'date_time'
      redemption_status: 'pending' | 'completed' | 'cancelled'
      contest_status: 'draft' | 'active' | 'ended' | 'cancelled'
      contest_invite_type: 'all_panelists' | 'selected_panelists'
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
export type ContestStatus = Database["public"]["Enums"]["contest_status"]
export type ContestInviteType = Database["public"]["Enums"]["contest_invite_type"]

export type User = Tables<"users">
export type PanelistProfile = Tables<"panelist_profiles">
export type Survey = Tables<"surveys">
export type SurveyQualification = Tables<"survey_qualifications">
export type SurveyCompletion = Tables<"survey_completions">
export type MerchantOffer = Tables<"merchant_offers">
export type Redemption = Tables<"redemptions">
export type ActivityLog = Tables<"activity_log">
export type Contest = Tables<"contests">
export type ContestInvitation = Tables<"contest_invitations">
export type ContestParticipant = Tables<"contest_participants">
export type ContestPrizeAward = Tables<"contest_prize_awards"> 