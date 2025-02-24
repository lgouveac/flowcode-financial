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
      cash_flow: {
        Row: {
          amount: number
          category: string
          created_at: string | null
          date: string
          description: string
          id: string
          payment_id: string | null
          status: Database["public"]["Enums"]["cash_flow_status"] | null
          type: string
          updated_at: string | null
        }
        Insert: {
          amount: number
          category: string
          created_at?: string | null
          date: string
          description: string
          id?: string
          payment_id?: string | null
          status?: Database["public"]["Enums"]["cash_flow_status"] | null
          type: string
          updated_at?: string | null
        }
        Update: {
          amount?: number
          category?: string
          created_at?: string | null
          date?: string
          description?: string
          id?: string
          payment_id?: string | null
          status?: Database["public"]["Enums"]["cash_flow_status"] | null
          type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cash_flow_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "payments"
            referencedColumns: ["id"]
          },
        ]
      }
      clients: {
        Row: {
          address: string | null
          cnpj: string | null
          company_name: string | null
          cpf: string | null
          created_at: string | null
          due_date: string | null
          email: string
          id: string
          last_payment: string | null
          name: string
          partner_cpf: string | null
          partner_name: string | null
          payment_method: Database["public"]["Enums"]["payment_method"] | null
          phone: string | null
          status: Database["public"]["Enums"]["client_status"] | null
          total_billing: number | null
          type: Database["public"]["Enums"]["client_type"]
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          cnpj?: string | null
          company_name?: string | null
          cpf?: string | null
          created_at?: string | null
          due_date?: string | null
          email: string
          id?: string
          last_payment?: string | null
          name: string
          partner_cpf?: string | null
          partner_name?: string | null
          payment_method?: Database["public"]["Enums"]["payment_method"] | null
          phone?: string | null
          status?: Database["public"]["Enums"]["client_status"] | null
          total_billing?: number | null
          type: Database["public"]["Enums"]["client_type"]
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          cnpj?: string | null
          company_name?: string | null
          cpf?: string | null
          created_at?: string | null
          due_date?: string | null
          email?: string
          id?: string
          last_payment?: string | null
          name?: string
          partner_cpf?: string | null
          partner_name?: string | null
          payment_method?: Database["public"]["Enums"]["payment_method"] | null
          phone?: string | null
          status?: Database["public"]["Enums"]["client_status"] | null
          total_billing?: number | null
          type?: Database["public"]["Enums"]["client_type"]
          updated_at?: string | null
        }
        Relationships: []
      }
      email_templates: {
        Row: {
          content: string
          created_at: string
          id: string
          name: string
          subject: string
          subtype: string
          type: string
          updated_at: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          name: string
          subject: string
          subtype: string
          type: string
          updated_at?: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          name?: string
          subject?: string
          subtype?: string
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      payments: {
        Row: {
          amount: number
          client_id: string
          created_at: string | null
          description: string
          due_date: string
          id: string
          installment_number: number | null
          payment_date: string | null
          payment_method: Database["public"]["Enums"]["payment_method"]
          status: Database["public"]["Enums"]["billing_status"] | null
          total_installments: number | null
          updated_at: string | null
        }
        Insert: {
          amount: number
          client_id: string
          created_at?: string | null
          description: string
          due_date: string
          id?: string
          installment_number?: number | null
          payment_date?: string | null
          payment_method?: Database["public"]["Enums"]["payment_method"]
          status?: Database["public"]["Enums"]["billing_status"] | null
          total_installments?: number | null
          updated_at?: string | null
        }
        Update: {
          amount?: number
          client_id?: string
          created_at?: string | null
          description?: string
          due_date?: string
          id?: string
          installment_number?: number | null
          payment_date?: string | null
          payment_method?: Database["public"]["Enums"]["payment_method"]
          status?: Database["public"]["Enums"]["billing_status"] | null
          total_installments?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      recurring_billing: {
        Row: {
          amount: number
          client_id: string
          created_at: string | null
          current_installment: number
          description: string
          due_day: number
          end_date: string | null
          id: string
          installments: number
          payment_date: string | null
          payment_method: Database["public"]["Enums"]["payment_method"]
          start_date: string
          status: Database["public"]["Enums"]["billing_status"] | null
          updated_at: string | null
        }
        Insert: {
          amount: number
          client_id: string
          created_at?: string | null
          current_installment?: number
          description: string
          due_day: number
          end_date?: string | null
          id?: string
          installments?: number
          payment_date?: string | null
          payment_method?: Database["public"]["Enums"]["payment_method"]
          start_date: string
          status?: Database["public"]["Enums"]["billing_status"] | null
          updated_at?: string | null
        }
        Update: {
          amount?: number
          client_id?: string
          created_at?: string | null
          current_installment?: number
          description?: string
          due_day?: number
          end_date?: string | null
          id?: string
          installments?: number
          payment_date?: string | null
          payment_method?: Database["public"]["Enums"]["payment_method"]
          start_date?: string
          status?: Database["public"]["Enums"]["billing_status"] | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "recurring_billing_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
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
      billing_status:
        | "pending"
        | "billed"
        | "awaiting_invoice"
        | "paid"
        | "overdue"
        | "cancelled"
      cash_flow_status: "pending" | "approved" | "rejected"
      client_status: "active" | "inactive" | "overdue"
      client_type: "pf" | "pj"
      payment_method: "pix" | "boleto" | "credit_card"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never
