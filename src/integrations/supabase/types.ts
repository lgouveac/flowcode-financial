export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      cash_flow: {
        Row: {
          amount: number
          category: string
          created_at: string | null
          date: string
          description: string
          employee_id: string | null
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
          employee_id?: string | null
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
          employee_id?: string | null
          id?: string
          payment_id?: string | null
          status?: Database["public"]["Enums"]["cash_flow_status"] | null
          type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cash_flow_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
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
          responsible_name: string | null
          send_email: boolean | null
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
          responsible_name?: string | null
          send_email?: boolean | null
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
          responsible_name?: string | null
          send_email?: boolean | null
          status?: Database["public"]["Enums"]["client_status"] | null
          total_billing?: number | null
          type?: Database["public"]["Enums"]["client_type"]
          updated_at?: string | null
        }
        Relationships: []
      }
      Contratos: {
        Row: {
          client_id: string | null
          contract_id: string | null
          created_at: string
          data_de_assinatura: string | null
          end_date: string | null
          id: number
          installment_value: number | null
          installment_value_text: string | null
          installments: number | null
          ip: string | null
          link_contrato: string | null
          obs: string | null
          scope: string | null
          signing_date_legacy: string | null
          start_date: string | null
          status: string | null
          total_value: number | null
          updated_at: string | null
        }
        Insert: {
          client_id?: string | null
          contract_id?: string | null
          created_at?: string
          data_de_assinatura?: string | null
          end_date?: string | null
          id?: number
          installment_value?: number | null
          installment_value_text?: string | null
          installments?: number | null
          ip?: string | null
          link_contrato?: string | null
          obs?: string | null
          scope?: string | null
          signing_date_legacy?: string | null
          start_date?: string | null
          status?: string | null
          total_value?: number | null
          updated_at?: string | null
        }
        Update: {
          client_id?: string | null
          contract_id?: string | null
          created_at?: string
          data_de_assinatura?: string | null
          end_date?: string | null
          id?: number
          installment_value?: number | null
          installment_value_text?: string | null
          installments?: number | null
          ip?: string | null
          link_contrato?: string | null
          obs?: string | null
          scope?: string | null
          signing_date_legacy?: string | null
          start_date?: string | null
          status?: string | null
          total_value?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "Contratos_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "Contratos_Cliente_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_contratos_client"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      email_cc_recipients: {
        Row: {
          created_at: string | null
          email: string
          id: string
          is_active: boolean | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          id?: string
          is_active?: boolean | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          id?: string
          is_active?: boolean | null
          updated_at?: string | null
        }
        Relationships: []
      }
      email_notification_log: {
        Row: {
          billing_id: string | null
          client_id: string | null
          created_at: string | null
          days_before: number | null
          due_date: string | null
          id: string
          payment_type: string | null
          sent_at: string | null
          updated_at: string | null
        }
        Insert: {
          billing_id?: string | null
          client_id?: string | null
          created_at?: string | null
          days_before?: number | null
          due_date?: string | null
          id?: string
          payment_type?: string | null
          sent_at?: string | null
          updated_at?: string | null
        }
        Update: {
          billing_id?: string | null
          client_id?: string | null
          created_at?: string | null
          days_before?: number | null
          due_date?: string | null
          id?: string
          payment_type?: string | null
          sent_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "email_notification_log_billing_id_fkey"
            columns: ["billing_id"]
            isOneToOne: false
            referencedRelation: "recurring_billing"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_notification_log_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      email_templates: {
        Row: {
          content: string
          created_at: string
          id: string
          is_default: boolean | null
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
          is_default?: boolean | null
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
          is_default?: boolean | null
          name?: string
          subject?: string
          subtype?: string
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      employee_email_settings: {
        Row: {
          created_at: string | null
          id: string
          notification_time: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          notification_time?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          notification_time?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      employee_monthly_values: {
        Row: {
          created_at: string | null
          due_data: number
          due_date: string
          employee_id: string
          id: string
          notes: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          due_data: number
          due_date: string
          employee_id: string
          id?: string
          notes?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          due_data?: number
          due_date?: string
          employee_id?: string
          id?: string
          notes?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "employee_monthly_values_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      employees: {
        Row: {
          address: string | null
          cnpj: string | null
          created_at: string | null
          email: string
          id: string
          last_invoice: string | null
          name: string
          payment_method: string | null
          phone: string | null
          pix: string | null
          position: string | null
          preferred_template: string | null
          status: string
          type: string
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          cnpj?: string | null
          created_at?: string | null
          email: string
          id?: string
          last_invoice?: string | null
          name: string
          payment_method?: string | null
          phone?: string | null
          pix?: string | null
          position?: string | null
          preferred_template?: string | null
          status?: string
          type?: string
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          cnpj?: string | null
          created_at?: string | null
          email?: string
          id?: string
          last_invoice?: string | null
          name?: string
          payment_method?: string | null
          phone?: string | null
          pix?: string | null
          position?: string | null
          preferred_template?: string | null
          status?: string
          type?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      estimated_expenses: {
        Row: {
          amount: number
          category: string
          created_at: string | null
          end_date: string | null
          id: string
          is_recurring: boolean
          name: string
          start_date: string | null
          updated_at: string | null
        }
        Insert: {
          amount: number
          category: string
          created_at?: string | null
          end_date?: string | null
          id?: string
          is_recurring?: boolean
          name: string
          start_date?: string | null
          updated_at?: string | null
        }
        Update: {
          amount?: number
          category?: string
          created_at?: string | null
          end_date?: string | null
          id?: string
          is_recurring?: boolean
          name?: string
          start_date?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      global_settings: {
        Row: {
          created_at: string | null
          employee_emails_send_day: number | null
          id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          employee_emails_send_day?: number | null
          id?: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          employee_emails_send_day?: number | null
          id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      payment_reminder_settings: {
        Row: {
          active: boolean | null
          created_at: string | null
          days_interval: number | null
          id: string
          notification_time: string | null
          updated_at: string | null
        }
        Insert: {
          active?: boolean | null
          created_at?: string | null
          days_interval?: number | null
          id?: string
          notification_time?: string | null
          updated_at?: string | null
        }
        Update: {
          active?: boolean | null
          created_at?: string | null
          days_interval?: number | null
          id?: string
          notification_time?: string | null
          updated_at?: string | null
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
          email_template: string | null
          id: string
          installment_number: number | null
          paid_amount: number | null
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
          email_template?: string | null
          id?: string
          installment_number?: number | null
          paid_amount?: number | null
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
          email_template?: string | null
          id?: string
          installment_number?: number | null
          paid_amount?: number | null
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
          {
            foreignKeyName: "payments_email_template_fkey"
            columns: ["email_template"]
            isOneToOne: false
            referencedRelation: "email_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          full_name: string | null
          id: string
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          full_name?: string | null
          id: string
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      recurring_billing: {
        Row: {
          amount: number
          client_id: string
          created_at: string | null
          current_installment: number
          description: string
          disable_notifications: boolean
          due_day: number
          email_template: string | null
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
          disable_notifications?: boolean
          due_day: number
          email_template?: string | null
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
          disable_notifications?: boolean
          due_day?: number
          email_template?: string | null
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
          {
            foreignKeyName: "recurring_billing_email_template_fkey"
            columns: ["email_template"]
            isOneToOne: false
            referencedRelation: "email_templates"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      check_billing_notifications: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      get_payment_reminder_settings: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      insert_template_if_not_exists: {
        Args: {
          p_type: string
          p_subtype: string
          p_name: string
          p_subject: string
          p_content: string
        }
        Returns: undefined
      }
      invoke_billing_notifications: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      trigger_billing_notifications: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      trigger_notifications: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      update_payment_reminder_settings: {
        Args: {
          p_notification_time: string
          p_days_interval: number
          p_active: boolean
        }
        Returns: undefined
      }
    }
    Enums: {
      billing_status:
        | "pending"
        | "billed"
        | "awaiting_invoice"
        | "paid"
        | "overdue"
        | "cancelled"
        | "partially_paid"
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
      billing_status: [
        "pending",
        "billed",
        "awaiting_invoice",
        "paid",
        "overdue",
        "cancelled",
        "partially_paid",
      ],
      cash_flow_status: ["pending", "approved", "rejected"],
      client_status: ["active", "inactive", "overdue"],
      client_type: ["pf", "pj"],
      payment_method: ["pix", "boleto", "credit_card"],
    },
  },
} as const
