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
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      access_vault: {
        Row: {
          id: string
          service_name: string
          category: string
          project_id: number | null
          url: string | null
          username: string | null
          password: string | null
          notes: string | null
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          service_name: string
          category?: string
          project_id?: number | null
          url?: string | null
          username?: string | null
          password?: string | null
          notes?: string | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          service_name?: string
          category?: string
          project_id?: number | null
          url?: string | null
          username?: string | null
          password?: string | null
          notes?: string | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "access_vault_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "access_vault_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projetos"
            referencedColumns: ["id"]
          },
        ]
      }
      atas_calls: {
        Row: {
          client_id: string | null
          content: string | null
          created_at: string
          id: number
          project_id: number | null
          title: string
          updated_at: string | null
        }
        Insert: {
          client_id?: string | null
          content?: string | null
          created_at?: string
          id?: number
          project_id?: number | null
          title?: string
          updated_at?: string | null
        }
        Update: {
          client_id?: string | null
          content?: string | null
          created_at?: string
          id?: number
          project_id?: number | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "atas_calls_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "atas_calls_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_hours_report"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "atas_calls_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projetos"
            referencedColumns: ["id"]
          },
        ]
      }
      cash_flow: {
        Row: {
          amount: number
          category: string
          client_id: string | null
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
          client_id?: string | null
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
          client_id?: string | null
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
            foreignKeyName: "cash_flow_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
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
          email: string
          email_financeiro: string | null
          id: string
          last_payment: string | null
          name: string
          partner_cpf: string | null
          partner_name: string | null
          payment_method: Database["public"]["Enums"]["payment_method"] | null
          phone: string | null
          responsavel_financeiro: string | null
          responsible_name: string | null
          send_email: boolean | null
          status: Database["public"]["Enums"]["client_status"] | null
          total_billing: number | null
          trade_name: string | null
          type: Database["public"]["Enums"]["client_type"]
          updated_at: string | null
          whatsgroup_id: string | null
        }
        Insert: {
          address?: string | null
          cnpj?: string | null
          company_name?: string | null
          cpf?: string | null
          created_at?: string | null
          email: string
          email_financeiro?: string | null
          id?: string
          last_payment?: string | null
          name: string
          partner_cpf?: string | null
          partner_name?: string | null
          payment_method?: Database["public"]["Enums"]["payment_method"] | null
          phone?: string | null
          responsavel_financeiro?: string | null
          responsible_name?: string | null
          send_email?: boolean | null
          status?: Database["public"]["Enums"]["client_status"] | null
          total_billing?: number | null
          trade_name?: string | null
          type: Database["public"]["Enums"]["client_type"]
          updated_at?: string | null
          whatsgroup_id?: string | null
        }
        Update: {
          address?: string | null
          cnpj?: string | null
          company_name?: string | null
          cpf?: string | null
          created_at?: string | null
          email?: string
          email_financeiro?: string | null
          id?: string
          last_payment?: string | null
          name?: string
          partner_cpf?: string | null
          partner_name?: string | null
          payment_method?: Database["public"]["Enums"]["payment_method"] | null
          phone?: string | null
          responsavel_financeiro?: string | null
          responsible_name?: string | null
          send_email?: boolean | null
          status?: Database["public"]["Enums"]["client_status"] | null
          total_billing?: number | null
          trade_name?: string | null
          type?: Database["public"]["Enums"]["client_type"]
          updated_at?: string | null
          whatsgroup_id?: string | null
        }
        Relationships: []
      }
      contratos: {
        Row: {
          assinante_flowcode: string | null
          client_id: string | null
          contract_id: string | null
          contract_type: Database["public"]["Enums"]["contract_type"] | null
          contractor_type: Database["public"]["Enums"]["contractor_type"] | null
          contrato_externo: boolean | null
          created_at: string
          data_assinatura_flowcode: string | null
          data_de_assinatura: string | null
          end_date: string | null
          Horas: string | null
          id: number
          installment_value: string | null
          installment_value_text: string | null
          installments: number | null
          ip: string | null
          ip_flowcode: string | null
          link_contrato: string | null
          link_contrato_externo: string | null
          obs: string | null
          projeto_relacionado: string | null
          scope: string | null
          start_date: string | null
          status: string | null
          texto_contrato: string | null
          total_value: string | null
          updated_at: string | null
          versao_atual: string | null
        }
        Insert: {
          assinante_flowcode?: string | null
          client_id?: string | null
          contract_id?: string | null
          contract_type?: Database["public"]["Enums"]["contract_type"] | null
          contractor_type?:
            | Database["public"]["Enums"]["contractor_type"]
            | null
          contrato_externo?: boolean | null
          created_at?: string
          data_assinatura_flowcode?: string | null
          data_de_assinatura?: string | null
          end_date?: string | null
          Horas?: string | null
          id?: number
          installment_value?: string | null
          installment_value_text?: string | null
          installments?: number | null
          ip?: string | null
          ip_flowcode?: string | null
          link_contrato?: string | null
          link_contrato_externo?: string | null
          obs?: string | null
          projeto_relacionado?: string | null
          scope?: string | null
          start_date?: string | null
          status?: string | null
          texto_contrato?: string | null
          total_value?: string | null
          updated_at?: string | null
          versao_atual?: string | null
        }
        Update: {
          assinante_flowcode?: string | null
          client_id?: string | null
          contract_id?: string | null
          contract_type?: Database["public"]["Enums"]["contract_type"] | null
          contractor_type?:
            | Database["public"]["Enums"]["contractor_type"]
            | null
          contrato_externo?: boolean | null
          created_at?: string
          data_assinatura_flowcode?: string | null
          data_de_assinatura?: string | null
          end_date?: string | null
          Horas?: string | null
          id?: number
          installment_value?: string | null
          installment_value_text?: string | null
          installments?: number | null
          ip?: string | null
          ip_flowcode?: string | null
          link_contrato?: string | null
          link_contrato_externo?: string | null
          obs?: string | null
          projeto_relacionado?: string | null
          scope?: string | null
          start_date?: string | null
          status?: string | null
          texto_contrato?: string | null
          total_value?: string | null
          updated_at?: string | null
          versao_atual?: string | null
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
          {
            foreignKeyName: "employee_monthly_values_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "project_hours_report"
            referencedColumns: ["employee_id"]
          },
        ]
      }
      employees: {
        Row: {
          address: string | null
          cnpj: string | null
          CPF: string | null
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
          CPF?: string | null
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
          CPF?: string | null
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
      horas_aprovadas_projetos: {
        Row: {
          approved: boolean | null
          created_at: string
          date_aproval: string | null
          id: number
          "link relatorio": string | null
          project_hours: Json | null
          project_id: number | null
        }
        Insert: {
          approved?: boolean | null
          created_at?: string
          date_aproval?: string | null
          id?: number
          "link relatorio"?: string | null
          project_hours?: Json | null
          project_id?: number | null
        }
        Update: {
          approved?: boolean | null
          created_at?: string
          date_aproval?: string | null
          id?: number
          "link relatorio"?: string | null
          project_hours?: Json | null
          project_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "horas_aprovadas_projetos_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_hours_report"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "horas_aprovadas_projetos_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projetos"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          Celular: string | null
          created_at: string
          Email: string | null
          id: number
          Nome: string | null
          Servico: string | null
          Status: Database["public"]["Enums"]["Status_Lead"] | null
          tempo_fechamento: string | null
          Valor: number | null
          valor_texto: string | null
          won_at: string | null
        }
        Insert: {
          Celular?: string | null
          created_at?: string
          Email?: string | null
          id?: number
          Nome?: string | null
          Servico?: string | null
          Status?: Database["public"]["Enums"]["Status_Lead"] | null
          tempo_fechamento?: string | null
          Valor?: number | null
          valor_texto?: string | null
          won_at?: string | null
        }
        Update: {
          Celular?: string | null
          created_at?: string
          Email?: string | null
          id?: number
          Nome?: string | null
          Servico?: string | null
          Status?: Database["public"]["Enums"]["Status_Lead"] | null
          tempo_fechamento?: string | null
          Valor?: number | null
          valor_texto?: string | null
          won_at?: string | null
        }
        Relationships: []
      }
      n8n_chat_histories: {
        Row: {
          id: number
          message: Json
          session_id: string
        }
        Insert: {
          id?: number
          message: Json
          session_id: string
        }
        Update: {
          id?: number
          message?: Json
          session_id?: string
        }
        Relationships: []
      }
      payments: {
        Row: {
          amount: number
          client_id: string
          created_at: string | null
          description: string
          due_date: string | null
          email_template: string | null
          id: string
          installment_number: number | null
          NFe_Emitida: boolean | null
          Pagamento_Por_Entrega: boolean | null
          paid_amount: number | null
          payment_date: string | null
          payment_method: Database["public"]["Enums"]["payment_method"]
          scope_type: string
          service: Database["public"]["Enums"]["service"] | null
          status: Database["public"]["Enums"]["billing_status"] | null
          total_installments: number | null
          updated_at: string | null
        }
        Insert: {
          amount: number
          client_id: string
          created_at?: string | null
          description: string
          due_date?: string | null
          email_template?: string | null
          id?: string
          installment_number?: number | null
          NFe_Emitida?: boolean | null
          Pagamento_Por_Entrega?: boolean | null
          paid_amount?: number | null
          payment_date?: string | null
          payment_method?: Database["public"]["Enums"]["payment_method"]
          scope_type?: string
          service?: Database["public"]["Enums"]["service"] | null
          status?: Database["public"]["Enums"]["billing_status"] | null
          total_installments?: number | null
          updated_at?: string | null
        }
        Update: {
          amount?: number
          client_id?: string
          created_at?: string | null
          description?: string
          due_date?: string | null
          email_template?: string | null
          id?: string
          installment_number?: number | null
          NFe_Emitida?: boolean | null
          Pagamento_Por_Entrega?: boolean | null
          paid_amount?: number | null
          payment_date?: string | null
          payment_method?: Database["public"]["Enums"]["payment_method"]
          scope_type?: string
          service?: Database["public"]["Enums"]["service"] | null
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
      project_access: {
        Row: {
          access_level: string
          created_at: string | null
          created_by: string | null
          employee_id: string | null
          id: string
          project_id: number
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          access_level?: string
          created_at?: string | null
          created_by?: string | null
          employee_id?: string | null
          id?: string
          project_id: number
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          access_level?: string
          created_at?: string | null
          created_by?: string | null
          employee_id?: string | null
          id?: string
          project_id?: number
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "project_access_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_access_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_access_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "project_hours_report"
            referencedColumns: ["employee_id"]
          },
          {
            foreignKeyName: "project_access_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_hours_report"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "project_access_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projetos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_access_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      project_hours: {
        Row: {
          created_at: string | null
          date_worked: string
          description: string | null
          employee_id: string | null
          hours_worked: number
          id: string
          project_id: number | null
        }
        Insert: {
          created_at?: string | null
          date_worked: string
          description?: string | null
          employee_id?: string | null
          hours_worked: number
          id?: string
          project_id?: number | null
        }
        Update: {
          created_at?: string | null
          date_worked?: string
          description?: string | null
          employee_id?: string | null
          hours_worked?: number
          id?: string
          project_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "project_hours_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_hours_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "project_hours_report"
            referencedColumns: ["employee_id"]
          },
          {
            foreignKeyName: "project_hours_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_hours_report"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "project_hours_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projetos"
            referencedColumns: ["id"]
          },
        ]
      }
      project_tasks: {
        Row: {
          assigned_to: string | null
          created_at: string | null
          created_by: string | null
          description: string | null
          due_date: string | null
          id: string
          is_public: boolean | null
          name: string
          position: number
          priority: Database["public"]["Enums"]["task_priority"] | null
          project_id: number
          public_token: string | null
          status_id: string
          updated_at: string | null
        }
        Insert: {
          assigned_to?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          is_public?: boolean | null
          name: string
          position?: number
          priority?: Database["public"]["Enums"]["task_priority"] | null
          project_id: number
          public_token?: string | null
          status_id: string
          updated_at?: string | null
        }
        Update: {
          assigned_to?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          is_public?: boolean | null
          name?: string
          position?: number
          priority?: Database["public"]["Enums"]["task_priority"] | null
          project_id?: number
          public_token?: string | null
          status_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "project_tasks_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_tasks_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "project_hours_report"
            referencedColumns: ["employee_id"]
          },
          {
            foreignKeyName: "project_tasks_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_tasks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_hours_report"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "project_tasks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projetos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_tasks_status_id_fkey"
            columns: ["status_id"]
            isOneToOne: false
            referencedRelation: "task_statuses"
            referencedColumns: ["id"]
          },
        ]
      }
      projetos: {
        Row: {
          client_id: string | null
          contract_id: number | null
          created_at: string
          data_inicio_ciclo: string | null
          description: string | null
          github_last_sync_at: string | null
          github_repo_full_name: string | null
          github_repo_url: string | null
          github_sync_enabled: boolean | null
          id: number
          name: string | null
          prd: string | null
          status: string | null
        }
        Insert: {
          client_id?: string | null
          contract_id?: number | null
          created_at?: string
          data_inicio_ciclo?: string | null
          description?: string | null
          github_last_sync_at?: string | null
          github_repo_full_name?: string | null
          github_repo_url?: string | null
          github_sync_enabled?: boolean | null
          id?: number
          name?: string | null
          prd?: string | null
          status?: string | null
        }
        Update: {
          client_id?: string | null
          contract_id?: number | null
          created_at?: string
          data_inicio_ciclo?: string | null
          description?: string | null
          github_last_sync_at?: string | null
          github_repo_full_name?: string | null
          github_repo_url?: string | null
          github_sync_enabled?: boolean | null
          id?: number
          name?: string | null
          prd?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "Projetos_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projetos_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contratos"
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
      stake_holders: {
        Row: {
          client: string | null
          created_at: string
          email_1: string | null
          email_2: string | null
          id: number
        }
        Insert: {
          client?: string | null
          created_at?: string
          email_1?: string | null
          email_2?: string | null
          id?: number
        }
        Update: {
          client?: string | null
          created_at?: string
          email_1?: string | null
          email_2?: string | null
          id?: number
        }
        Relationships: [
          {
            foreignKeyName: "stake_holders_client_fkey"
            columns: ["client"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      task_comments: {
        Row: {
          content: string
          created_at: string | null
          created_by: string | null
          id: string
          is_public: boolean | null
          task_id: string
          updated_at: string | null
        }
        Insert: {
          content: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_public?: boolean | null
          task_id: string
          updated_at?: string | null
        }
        Update: {
          content?: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_public?: boolean | null
          task_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "task_comments_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_comments_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "project_tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      task_statuses: {
        Row: {
          color: string
          created_at: string | null
          icon: string | null
          id: string
          is_default: boolean | null
          name: string
          position: number
          project_id: number | null
        }
        Insert: {
          color?: string
          created_at?: string | null
          icon?: string | null
          id?: string
          is_default?: boolean | null
          name: string
          position?: number
          project_id?: number | null
        }
        Update: {
          color?: string
          created_at?: string | null
          icon?: string | null
          id?: string
          is_default?: boolean | null
          name?: string
          position?: number
          project_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "task_statuses_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_hours_report"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "task_statuses_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projetos"
            referencedColumns: ["id"]
          },
        ]
      }
      webhooks: {
        Row: {
          assinatura_contrato: string | null
          created_at: string
          criacao_contrato: string | null
          edicao_contrato: string | null
          id: number
        }
        Insert: {
          assinatura_contrato?: string | null
          created_at?: string
          criacao_contrato?: string | null
          edicao_contrato?: string | null
          id?: number
        }
        Update: {
          assinatura_contrato?: string | null
          created_at?: string
          criacao_contrato?: string | null
          edicao_contrato?: string | null
          id?: number
        }
        Relationships: []
      }
      whatsapp_conversations: {
        Row: {
          client_id: string | null
          conteudo: string | null
          created_at: string
          id: number
          remoteJid: string | null
        }
        Insert: {
          client_id?: string | null
          conteudo?: string | null
          created_at?: string
          id?: number
          remoteJid?: string | null
        }
        Update: {
          client_id?: string | null
          conteudo?: string | null
          created_at?: string
          id?: number
          remoteJid?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_conversations_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      global_settings: {
        Row: {
          id: string
          key: string
          value: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          key: string
          value?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          key?: string
          value?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      user_approvals: {
        Row: {
          id: string
          user_id: string
          email: string
          status: string
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          email: string
          status?: string
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          email?: string
          status?: string
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      project_hours_report: {
        Row: {
          client_id: string | null
          client_name: string | null
          date_worked: string | null
          description: string | null
          employee_id: string | null
          employee_name: string | null
          hours_worked: number | null
          month_year: string | null
          project_id: number | null
          project_name: string | null
        }
        Relationships: [
          {
            foreignKeyName: "Projetos_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      check_billing_notifications: { Args: never; Returns: undefined }
      generate_public_token: { Args: never; Returns: string }
      get_payment_reminder_settings: { Args: never; Returns: Json }
      insert_template_if_not_exists: {
        Args: {
          p_content: string
          p_name: string
          p_subject: string
          p_subtype: string
          p_type: string
        }
        Returns: undefined
      }
      invoke_billing_notifications: { Args: never; Returns: undefined }
      sync_github_activities: { Args: never; Returns: undefined }
      trigger_billing_notifications: { Args: never; Returns: Json }
      trigger_notifications: { Args: never; Returns: Json }
      update_payment_reminder_settings: {
        Args: {
          p_active: boolean
          p_days_interval: number
          p_notification_time: string
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
      contract_type: "open_scope" | "closed_scope"
      contractor_type: "individual" | "legal_entity"
      payment_method: "pix" | "boleto" | "credit_card"
      service:
        | "app"
        | "site"
        | "ux research"
        | "ia"
        | "ecommerce"
        | "portal interno"
      Status_Lead:
        | "Income"
        | "Contact Made"
        | "Proposal Sent"
        | "Won"
        | "Lost"
        | "Future"
        | "Contract"
      task_priority: "low" | "medium" | "high"
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
      contract_type: ["open_scope", "closed_scope"],
      contractor_type: ["individual", "legal_entity"],
      payment_method: ["pix", "boleto", "credit_card"],
      service: [
        "app",
        "site",
        "ux research",
        "ia",
        "ecommerce",
        "portal interno",
      ],
      Status_Lead: [
        "Income",
        "Contact Made",
        "Proposal Sent",
        "Won",
        "Lost",
        "Future",
        "Contract",
      ],
      task_priority: ["low", "medium", "high"],
    },
  },
} as const
