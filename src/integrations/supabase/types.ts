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
      business_profiles: {
        Row: {
          id: string
          user_id: string
          business_name: string
          business_type: 'llc' | 'corporation' | 'partnership' | 'sole_proprietorship'
          address_line1: string
          address_line2: string | null
          city: string
          state: string
          zip_code: string
          phone: string
          email: string
          tax_id: string | null
          description: string | null
          status: 'draft' | 'submitted' | 'in_review' | 'approved' | 'rejected'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          business_name: string
          business_type: 'llc' | 'corporation' | 'partnership' | 'sole_proprietorship'
          address_line1: string
          address_line2?: string | null
          city: string
          state: string
          zip_code: string
          phone: string
          email: string
          tax_id?: string | null
          description?: string | null
          status?: 'draft' | 'submitted' | 'in_review' | 'approved' | 'rejected'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          business_name?: string
          business_type?: 'llc' | 'corporation' | 'partnership' | 'sole_proprietorship'
          address_line1?: string
          address_line2?: string | null
          city?: string
          state?: string
          zip_code?: string
          phone?: string
          email?: string
          tax_id?: string | null
          description?: string | null
          status?: 'draft' | 'submitted' | 'in_review' | 'approved' | 'rejected'
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "business_profiles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      packages: {
        Row: {
          id: string
          name: string
          business_type: 'llc' | 'corporation' | 'partnership' | 'sole_proprietorship'
          price: number
          features: Json
          processing_time: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          business_type: 'llc' | 'corporation' | 'partnership' | 'sole_proprietorship'
          price: number
          features: Json
          processing_time: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          business_type?: 'llc' | 'corporation' | 'partnership' | 'sole_proprietorship'
          price?: number
          features?: Json
          processing_time?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      orders: {
        Row: {
          id: string
          business_profile_id: string
          package_id: string
          status: 'draft' | 'submitted' | 'in_review' | 'approved' | 'rejected'
          payment_status: 'pending' | 'paid' | 'failed' | 'refunded'
          stripe_payment_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          business_profile_id: string
          package_id: string
          status?: 'draft' | 'submitted' | 'in_review' | 'approved' | 'rejected'
          payment_status?: 'pending' | 'paid' | 'failed' | 'refunded'
          stripe_payment_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          business_profile_id?: string
          package_id?: string
          status?: 'draft' | 'submitted' | 'in_review' | 'approved' | 'rejected'
          payment_status?: 'pending' | 'paid' | 'failed' | 'refunded'
          stripe_payment_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_business_profile_id_fkey"
            columns: ["business_profile_id"]
            isOneToOne: false
            referencedRelation: "business_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_package_id_fkey"
            columns: ["package_id"]
            isOneToOne: false
            referencedRelation: "packages"
            referencedColumns: ["id"]
          }
        ]
      }
      change_history: {
        Row: {
          id: string
          business_profile_id: string
          field_name: string
          old_value: string | null
          new_value: string | null
          changed_by: string
          created_at: string
        }
        Insert: {
          id?: string
          business_profile_id: string
          field_name: string
          old_value?: string | null
          new_value?: string | null
          changed_by: string
          created_at?: string
        }
        Update: {
          id?: string
          business_profile_id?: string
          field_name?: string
          old_value?: string | null
          new_value?: string | null
          changed_by?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "change_history_business_profile_id_fkey"
            columns: ["business_profile_id"]
            isOneToOne: false
            referencedRelation: "business_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "change_history_changed_by_fkey"
            columns: ["changed_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      user_profiles: {
        Row: {
          id: string
          full_name: string
          email: string
          phone: string
          role: string
          profile_picture_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          full_name: string
          email: string
          phone?: string
          role?: string
          profile_picture_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          full_name?: string
          email?: string
          phone?: string
          role?: string
          profile_picture_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_profiles_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      team_members: {
        Row: {
          id: string
          user_id: string
          name: string
          role: string
          email: string
          phone: string
          status: 'active' | 'inactive'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          role?: string
          email?: string
          phone?: string
          status?: 'active' | 'inactive'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          role?: string
          email?: string
          phone?: string
          status?: 'active' | 'inactive'
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      business_type: 'llc' | 'corporation' | 'partnership' | 'sole_proprietorship'
      application_status: 'draft' | 'submitted' | 'in_review' | 'approved' | 'rejected'
      payment_status: 'pending' | 'paid' | 'failed' | 'refunded'
      team_member_status: 'active' | 'inactive'
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
  ? Database["public"]["Tables"][TableName] extends {
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