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
      admin_employee_data: {
        Row: {
          basic_salary: number | null
          basic_salary_text: string | null
          category: string | null
          created_at: string | null
          department_name: string | null
          employee_id: string
          employment_end_date: string | null
          employment_start_date: string | null
          function: string | null
          id: string
          job_position: string | null
          supervisor: string | null
          updated_at: string | null
        }
        Insert: {
          basic_salary?: number | null
          basic_salary_text?: string | null
          category?: string | null
          created_at?: string | null
          department_name?: string | null
          employee_id: string
          employment_end_date?: string | null
          employment_start_date?: string | null
          function?: string | null
          id?: string
          job_position?: string | null
          supervisor?: string | null
          updated_at?: string | null
        }
        Update: {
          basic_salary?: number | null
          basic_salary_text?: string | null
          category?: string | null
          created_at?: string | null
          department_name?: string | null
          employee_id?: string
          employment_end_date?: string | null
          employment_start_date?: string | null
          function?: string | null
          id?: string
          job_position?: string | null
          supervisor?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "admin_employee_data_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      complete_skill_matrices: {
        Row: {
          created_at: string
          created_by: string | null
          department: string
          description: string | null
          employee_data: Json
          id: string
          matrix_id: string
          name: string
          skill_data: Json
          updated_at: string
          version: number
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          department: string
          description?: string | null
          employee_data: Json
          id?: string
          matrix_id: string
          name: string
          skill_data: Json
          updated_at?: string
          version?: number
        }
        Update: {
          created_at?: string
          created_by?: string | null
          department?: string
          description?: string | null
          employee_data?: Json
          id?: string
          matrix_id?: string
          name?: string
          skill_data?: Json
          updated_at?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "complete_skill_matrices_matrix_id_fkey"
            columns: ["matrix_id"]
            isOneToOne: false
            referencedRelation: "skill_matrices"
            referencedColumns: ["id"]
          },
        ]
      }
      document_acknowledgments: {
        Row: {
          acknowledged_at: string | null
          created_at: string | null
          document_id: string
          id: string
          user_id: string | null
        }
        Insert: {
          acknowledged_at?: string | null
          created_at?: string | null
          document_id: string
          id?: string
          user_id?: string | null
        }
        Update: {
          acknowledged_at?: string | null
          created_at?: string | null
          document_id?: string
          id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "document_acknowledgments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          created_at: string
          error_message: string | null
          extracted_content: Json | null
          file_name: string
          file_size: number
          file_type: string
          id: string
          status: string
          updated_at: string
          uploaded_at: string
          uploaded_by: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          extracted_content?: Json | null
          file_name: string
          file_size: number
          file_type: string
          id?: string
          status: string
          updated_at?: string
          uploaded_at?: string
          uploaded_by: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          extracted_content?: Json | null
          file_name?: string
          file_size?: number
          file_type?: string
          id?: string
          status?: string
          updated_at?: string
          uploaded_at?: string
          uploaded_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "documents_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      employee_documents: {
        Row: {
          created_at: string
          employee_id: string | null
          id: string
          name: string
          type: string
          updated_at: string
          url: string
          verified: boolean | null
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          created_at?: string
          employee_id?: string | null
          id?: string
          name: string
          type: string
          updated_at?: string
          url: string
          verified?: boolean | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          created_at?: string
          employee_id?: string | null
          id?: string
          name?: string
          type?: string
          updated_at?: string
          url?: string
          verified?: boolean | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "employee_documents_verified_by_fkey"
            columns: ["verified_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      employee_skills: {
        Row: {
          assessed_by: string | null
          assessment_date: string
          comments: string | null
          created_at: string
          employee_id: string
          id: string
          skill_id: string
          skill_level: number
          updated_at: string
        }
        Insert: {
          assessed_by?: string | null
          assessment_date?: string
          comments?: string | null
          created_at?: string
          employee_id: string
          id?: string
          skill_id: string
          skill_level?: number
          updated_at?: string
        }
        Update: {
          assessed_by?: string | null
          assessment_date?: string
          comments?: string | null
          created_at?: string
          employee_id?: string
          id?: string
          skill_id?: string
          skill_level?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "employee_skills_assessed_by_fkey"
            columns: ["assessed_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_skills_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      employee_trainings: {
        Row: {
          completed_at: string | null
          completed_by: string | null
          created_at: string
          employee_id: string
          id: string
          training_plan_id: string
        }
        Insert: {
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string
          employee_id: string
          id?: string
          training_plan_id: string
        }
        Update: {
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string
          employee_id?: string
          id?: string
          training_plan_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "employee_trainings_completed_by_fkey"
            columns: ["completed_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_trainings_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_trainings_training_plan_id_fkey"
            columns: ["training_plan_id"]
            isOneToOne: false
            referencedRelation: "training_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      employees: {
        Row: {
          bank_account: string | null
          category: string | null
          citizenship: string | null
          created_at: string
          date_of_birth: string | null
          department_number: string | null
          education_level: string | null
          employee_id: string | null
          employer: string | null
          first_name: string | null
          gender: string | null
          grade: string | null
          health_insurance: string | null
          hire_date: string | null
          id: string
          identification_number: string | null
          last_name: string | null
          maiden_name: string | null
          marital_status: string | null
          nationality: string | null
          permanent_address: Json | null
          phone_number: string | null
          place_of_birth: string | null
          position: string | null
          residence_permit_number: string | null
          state: string | null
          subdepartment: string | null
          supervisor: string | null
          temporary_address: Json | null
          termination_date: string | null
          termination_reason: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          bank_account?: string | null
          category?: string | null
          citizenship?: string | null
          created_at?: string
          date_of_birth?: string | null
          department_number?: string | null
          education_level?: string | null
          employee_id?: string | null
          employer?: string | null
          first_name?: string | null
          gender?: string | null
          grade?: string | null
          health_insurance?: string | null
          hire_date?: string | null
          id?: string
          identification_number?: string | null
          last_name?: string | null
          maiden_name?: string | null
          marital_status?: string | null
          nationality?: string | null
          permanent_address?: Json | null
          phone_number?: string | null
          place_of_birth?: string | null
          position?: string | null
          residence_permit_number?: string | null
          state?: string | null
          subdepartment?: string | null
          supervisor?: string | null
          temporary_address?: Json | null
          termination_date?: string | null
          termination_reason?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          bank_account?: string | null
          category?: string | null
          citizenship?: string | null
          created_at?: string
          date_of_birth?: string | null
          department_number?: string | null
          education_level?: string | null
          employee_id?: string | null
          employer?: string | null
          first_name?: string | null
          gender?: string | null
          grade?: string | null
          health_insurance?: string | null
          hire_date?: string | null
          id?: string
          identification_number?: string | null
          last_name?: string | null
          maiden_name?: string | null
          marital_status?: string | null
          nationality?: string | null
          permanent_address?: Json | null
          phone_number?: string | null
          place_of_birth?: string | null
          position?: string | null
          residence_permit_number?: string | null
          state?: string | null
          subdepartment?: string | null
          supervisor?: string | null
          temporary_address?: Json | null
          termination_date?: string | null
          termination_reason?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "employees_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      legal_documents: {
        Row: {
          content: string
          created_at: string
          document_type: string
          employee_id: string | null
          id: string
          pdf_url: string | null
          signature_data: string | null
          signed_at: string | null
          signed_by: string | null
        }
        Insert: {
          content: string
          created_at?: string
          document_type: string
          employee_id?: string | null
          id?: string
          pdf_url?: string | null
          signature_data?: string | null
          signed_at?: string | null
          signed_by?: string | null
        }
        Update: {
          content?: string
          created_at?: string
          document_type?: string
          employee_id?: string | null
          id?: string
          pdf_url?: string | null
          signature_data?: string | null
          signed_at?: string | null
          signed_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "legal_documents_signed_by_fkey"
            columns: ["signed_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      matrix_history: {
        Row: {
          created_at: string
          created_by: string | null
          employee_skills: Json
          id: string
          matrix_id: string
          snapshot_date: string
          snapshot_name: string | null
          timestamp: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          employee_skills: Json
          id?: string
          matrix_id: string
          snapshot_date?: string
          snapshot_name?: string | null
          timestamp?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          employee_skills?: Json
          id?: string
          matrix_id?: string
          snapshot_date?: string
          snapshot_name?: string | null
          timestamp?: string
        }
        Relationships: [
          {
            foreignKeyName: "matrix_history_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matrix_history_matrix_id_fkey"
            columns: ["matrix_id"]
            isOneToOne: false
            referencedRelation: "skill_matrices"
            referencedColumns: ["id"]
          },
        ]
      }
      news: {
        Row: {
          average_rating: number
          content: string | null
          created_at: string
          created_by: string
          headline: string
          id: string
          image_url: string | null
          importance: string
          pdf_url: string | null
          total_ratings: number
          updated_at: string
        }
        Insert: {
          average_rating?: number
          content?: string | null
          created_at?: string
          created_by?: string
          headline: string
          id?: string
          image_url?: string | null
          importance: string
          pdf_url?: string | null
          total_ratings?: number
          updated_at?: string
        }
        Update: {
          average_rating?: number
          content?: string | null
          created_at?: string
          created_by?: string
          headline?: string
          id?: string
          image_url?: string | null
          importance?: string
          pdf_url?: string | null
          total_ratings?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "news_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      news_comments: {
        Row: {
          content: string
          created_at: string
          id: string
          news_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          news_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          news_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "news_comments_news_id_fkey"
            columns: ["news_id"]
            isOneToOne: false
            referencedRelation: "news"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "news_comments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      news_ratings: {
        Row: {
          created_at: string
          id: string
          news_id: string
          rating: number
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          news_id: string
          rating: number
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          news_id?: string
          rating?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "news_ratings_news_id_fkey"
            columns: ["news_id"]
            isOneToOne: false
            referencedRelation: "news"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "news_ratings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      onboarding_achievements: {
        Row: {
          achievement_id: string
          completed_at: string | null
          created_at: string | null
          id: string
          user_id: string | null
        }
        Insert: {
          achievement_id: string
          completed_at?: string | null
          created_at?: string | null
          id?: string
          user_id?: string | null
        }
        Update: {
          achievement_id?: string
          completed_at?: string | null
          created_at?: string | null
          id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "onboarding_achievements_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      onboarding_progress: {
        Row: {
          created_at: string
          employee_id: string
          has_completed_form: boolean
          has_met_team: boolean
          has_signed_legal_documents: boolean | null
          has_uploaded_documents: boolean
          has_viewed_training: boolean
          has_viewed_welcome: boolean
          id: string
          is_approved: boolean | null
          legal_documents_completed_at: string | null
          onboarding_completed_at: string | null
          updated_at: string
          verified_at: string | null
        }
        Insert: {
          created_at?: string
          employee_id: string
          has_completed_form?: boolean
          has_met_team?: boolean
          has_signed_legal_documents?: boolean | null
          has_uploaded_documents?: boolean
          has_viewed_training?: boolean
          has_viewed_welcome?: boolean
          id?: string
          is_approved?: boolean | null
          legal_documents_completed_at?: string | null
          onboarding_completed_at?: string | null
          updated_at?: string
          verified_at?: string | null
        }
        Update: {
          created_at?: string
          employee_id?: string
          has_completed_form?: boolean
          has_met_team?: boolean
          has_signed_legal_documents?: boolean | null
          has_uploaded_documents?: boolean
          has_viewed_training?: boolean
          has_viewed_welcome?: boolean
          id?: string
          is_approved?: boolean | null
          legal_documents_completed_at?: string | null
          onboarding_completed_at?: string | null
          updated_at?: string
          verified_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "onboarding_progress_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: true
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      skill_assessment_history: {
        Row: {
          assessed_by: string | null
          assessment_date: string
          comments: string | null
          employee_id: string
          id: string
          matrix_snapshot_id: string | null
          new_level: number
          previous_level: number | null
          skill_id: string
        }
        Insert: {
          assessed_by?: string | null
          assessment_date?: string
          comments?: string | null
          employee_id: string
          id?: string
          matrix_snapshot_id?: string | null
          new_level: number
          previous_level?: number | null
          skill_id: string
        }
        Update: {
          assessed_by?: string | null
          assessment_date?: string
          comments?: string | null
          employee_id?: string
          id?: string
          matrix_snapshot_id?: string | null
          new_level?: number
          previous_level?: number | null
          skill_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "skill_assessment_history_assessed_by_fkey"
            columns: ["assessed_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "skill_assessment_history_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "skill_assessment_history_matrix_snapshot_id_fkey"
            columns: ["matrix_snapshot_id"]
            isOneToOne: false
            referencedRelation: "matrix_history"
            referencedColumns: ["id"]
          },
        ]
      }
      skill_matrices: {
        Row: {
          active: boolean | null
          created_at: string
          department: string
          description: string | null
          id: string
          members_data: Json | null
          name: string
          skills_data: Json | null
          updated_at: string
        }
        Insert: {
          active?: boolean | null
          created_at?: string
          department: string
          description?: string | null
          id?: string
          members_data?: Json | null
          name: string
          skills_data?: Json | null
          updated_at?: string
        }
        Update: {
          active?: boolean | null
          created_at?: string
          department?: string
          description?: string | null
          id?: string
          members_data?: Json | null
          name?: string
          skills_data?: Json | null
          updated_at?: string
        }
        Relationships: []
      }
      training_plans: {
        Row: {
          created_at: string
          created_by: string
          id: string
          name: string
          place: string
          start_date: string
          validity_duration: unknown
        }
        Insert: {
          created_at?: string
          created_by: string
          id?: string
          name: string
          place: string
          start_date: string
          validity_duration: unknown
        }
        Update: {
          created_at?: string
          created_by?: string
          id?: string
          name?: string
          place?: string
          start_date?: string
          validity_duration?: unknown
        }
        Relationships: [
          {
            foreignKeyName: "training_plans_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      training_skills: {
        Row: {
          created_at: string
          id: string
          skill_id: string
          training_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          skill_id: string
          training_id: string
        }
        Update: {
          created_at?: string
          id?: string
          skill_id?: string
          training_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "training_skills_training_id_fkey"
            columns: ["training_id"]
            isOneToOne: false
            referencedRelation: "training_plans"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      users: {
        Row: {
          created_at: string | null
          email: string | null
          id: string | null
          raw_user_meta_data: Json | null
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          id?: string | null
          raw_user_meta_data?: Json | null
        }
        Update: {
          created_at?: string | null
          email?: string | null
          id?: string | null
          raw_user_meta_data?: Json | null
        }
        Relationships: []
      }
    }
    Functions: {
      add_employee_without_auth: {
        Args: {
          p_first_name: string
          p_last_name: string
          p_phone_number?: string
          p_email?: string
        }
        Returns: string
      }
      approve_onboarding: {
        Args: { p_employee_id: string }
        Returns: undefined
      }
      create_new_user: {
        Args: {
          email: string
          password: string
          first_name: string
          last_name: string
          user_role?: string
        }
        Returns: string
      }
      generate_legal_documents: {
        Args: { employee_id: string }
        Returns: undefined
      }
      set_claim: {
        Args: { uid: string; claim: string; value: string }
        Returns: undefined
      }
      update_user_metadata: {
        Args: { user_id: string; metadata: Json }
        Returns: undefined
      }
    }
    Enums: {
      legal_document_type:
        | "employment_agreement"
        | "confidentiality_agreement"
        | "code_of_conduct"
        | "data_protection_agreement"
        | "workplace_safety_agreement"
      news_importance: "low" | "medium" | "high"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      legal_document_type: [
        "employment_agreement",
        "confidentiality_agreement",
        "code_of_conduct",
        "data_protection_agreement",
        "workplace_safety_agreement",
      ],
      news_importance: ["low", "medium", "high"],
    },
  },
} as const
