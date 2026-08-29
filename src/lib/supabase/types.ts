// Gerado por `supabase gen types typescript` (via MCP). Não editar à mão —
// regerar após qualquer migration nova.
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.17"
  }
  public: {
    Tables: {
      audit_log: {
        Row: {
          acao: string
          actor_id: string | null
          antes: Json | null
          created_at: string
          depois: Json | null
          entidade: string
          entidade_id: string | null
          id: string
          ip: unknown
        }
        Insert: {
          acao: string
          actor_id?: string | null
          antes?: Json | null
          created_at?: string
          depois?: Json | null
          entidade: string
          entidade_id?: string | null
          id?: string
          ip?: unknown
        }
        Update: {
          acao?: string
          actor_id?: string | null
          antes?: Json | null
          created_at?: string
          depois?: Json | null
          entidade?: string
          entidade_id?: string | null
          id?: string
          ip?: unknown
        }
        Relationships: [
          {
            foreignKeyName: "audit_log_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      charges: {
        Row: {
          checkout_url: string | null
          created_at: string
          data_pagamento: string | null
          id: string
          idempotency_key: string
          metodo: string | null
          motivo_falha: string | null
          organization_id: string
          pix_payload: string | null
          pix_qrcode_base64: string | null
          project_offer_id: string | null
          provider_charge_id: string | null
          status: string
          subscription_id: string | null
          tentativas: number
          tipo: string
          updated_at: string
          valor_centavos: number
          vencimento: string
        }
        Insert: {
          checkout_url?: string | null
          created_at?: string
          data_pagamento?: string | null
          id?: string
          idempotency_key: string
          metodo?: string | null
          motivo_falha?: string | null
          organization_id: string
          pix_payload?: string | null
          pix_qrcode_base64?: string | null
          project_offer_id?: string | null
          provider_charge_id?: string | null
          status?: string
          subscription_id?: string | null
          tentativas?: number
          tipo: string
          updated_at?: string
          valor_centavos: number
          vencimento: string
        }
        Update: {
          checkout_url?: string | null
          created_at?: string
          data_pagamento?: string | null
          id?: string
          idempotency_key?: string
          metodo?: string | null
          motivo_falha?: string | null
          organization_id?: string
          pix_payload?: string | null
          pix_qrcode_base64?: string | null
          project_offer_id?: string | null
          provider_charge_id?: string | null
          status?: string
          subscription_id?: string | null
          tentativas?: number
          tipo?: string
          updated_at?: string
          valor_centavos?: number
          vencimento?: string
        }
        Relationships: [
          {
            foreignKeyName: "charges_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "charges_project_offer_id_fkey"
            columns: ["project_offer_id"]
            isOneToOne: false
            referencedRelation: "project_offers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "charges_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      email_log: {
        Row: {
          assunto: string
          created_at: string
          destinatario: string
          erro: string | null
          id: string
          organization_id: string | null
          provider_message_id: string | null
          status: string
          tag: string
        }
        Insert: {
          assunto: string
          created_at?: string
          destinatario: string
          erro?: string | null
          id?: string
          organization_id?: string | null
          provider_message_id?: string | null
          status: string
          tag: string
        }
        Update: {
          assunto?: string
          created_at?: string
          destinatario?: string
          erro?: string | null
          id?: string
          organization_id?: string | null
          provider_message_id?: string | null
          status?: string
          tag?: string
        }
        Relationships: [
          {
            foreignKeyName: "email_log_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      invitations: {
        Row: {
          aceito_em: string | null
          convidado_por: string | null
          created_at: string
          email: string
          expira_em: string
          id: string
          nome: string | null
          organization_id: string
          revogado_em: string | null
          role: string
          token_hash: string
        }
        Insert: {
          aceito_em?: string | null
          convidado_por?: string | null
          created_at?: string
          email: string
          expira_em?: string
          id?: string
          nome?: string | null
          organization_id: string
          revogado_em?: string | null
          role?: string
          token_hash: string
        }
        Update: {
          aceito_em?: string | null
          convidado_por?: string | null
          created_at?: string
          email?: string
          expira_em?: string
          id?: string
          nome?: string | null
          organization_id?: string
          revogado_em?: string | null
          role?: string
          token_hash?: string
        }
        Relationships: [
          {
            foreignKeyName: "invitations_convidado_por_fkey"
            columns: ["convidado_por"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invitations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      offers: {
        Row: {
          ativa: boolean
          created_at: string
          descricao_entrega: string | null
          id: string
          insight_padrao: string
          prazo_estimado_dias: number | null
          preco_padrao_centavos: number
          recorrencia_centavos: number
          slug: string
          template_fases: Json
          titulo: string
          updated_at: string
        }
        Insert: {
          ativa?: boolean
          created_at?: string
          descricao_entrega?: string | null
          id?: string
          insight_padrao: string
          prazo_estimado_dias?: number | null
          preco_padrao_centavos?: number
          recorrencia_centavos?: number
          slug: string
          template_fases?: Json
          titulo: string
          updated_at?: string
        }
        Update: {
          ativa?: boolean
          created_at?: string
          descricao_entrega?: string | null
          id?: string
          insight_padrao?: string
          prazo_estimado_dias?: number | null
          preco_padrao_centavos?: number
          recorrencia_centavos?: number
          slug?: string
          template_fases?: Json
          titulo?: string
          updated_at?: string
        }
        Relationships: []
      }
      organization_members: {
        Row: {
          created_at: string
          id: string
          organization_id: string
          revogado_em: string | null
          role: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          organization_id: string
          revogado_em?: string | null
          role?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          organization_id?: string
          revogado_em?: string | null
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_members_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          arquivada_em: string | null
          created_at: string
          documento: string | null
          email_faturamento: string | null
          id: string
          nome: string
          provider_customer_id: string | null
          slug: string
          telefone: string | null
          updated_at: string
        }
        Insert: {
          arquivada_em?: string | null
          created_at?: string
          documento?: string | null
          email_faturamento?: string | null
          id?: string
          nome: string
          provider_customer_id?: string | null
          slug: string
          telefone?: string | null
          updated_at?: string
        }
        Update: {
          arquivada_em?: string | null
          created_at?: string
          documento?: string | null
          email_faturamento?: string | null
          id?: string
          nome?: string
          provider_customer_id?: string | null
          slug?: string
          telefone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      payment_events: {
        Row: {
          assinatura_valida: boolean
          erro_processamento: string | null
          id: string
          payload: Json
          processado_em: string | null
          provider: string
          provider_event_id: string
          recebido_em: string
          tipo: string
        }
        Insert: {
          assinatura_valida: boolean
          erro_processamento?: string | null
          id?: string
          payload: Json
          processado_em?: string | null
          provider: string
          provider_event_id: string
          recebido_em?: string
          tipo: string
        }
        Update: {
          assinatura_valida?: boolean
          erro_processamento?: string | null
          id?: string
          payload?: Json
          processado_em?: string | null
          provider?: string
          provider_event_id?: string
          recebido_em?: string
          tipo?: string
        }
        Relationships: []
      }
      phases: {
        Row: {
          created_at: string
          descricao: string | null
          id: string
          ordem: number
          origem_offer_id: string | null
          project_id: string
          titulo: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          descricao?: string | null
          id?: string
          ordem?: number
          origem_offer_id?: string | null
          project_id: string
          titulo: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          descricao?: string | null
          id?: string
          ordem?: number
          origem_offer_id?: string | null
          project_id?: string
          titulo?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "phases_origem_offer_id_fkey"
            columns: ["origem_offer_id"]
            isOneToOne: false
            referencedRelation: "project_offers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "phases_project_id_fkey1"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_offers: {
        Row: {
          cliques: number
          created_at: string
          desbloqueada_em: string | null
          descricao_entrega: string | null
          id: string
          impressoes: number
          insight: string
          offer_id: string | null
          ordem: number
          prazo_estimado_dias: number | null
          preco_centavos: number
          project_id: string
          slug: string
          status: string
          titulo: string
          updated_at: string
        }
        Insert: {
          cliques?: number
          created_at?: string
          desbloqueada_em?: string | null
          descricao_entrega?: string | null
          id?: string
          impressoes?: number
          insight: string
          offer_id?: string | null
          ordem?: number
          prazo_estimado_dias?: number | null
          preco_centavos?: number
          project_id: string
          slug: string
          status?: string
          titulo: string
          updated_at?: string
        }
        Update: {
          cliques?: number
          created_at?: string
          desbloqueada_em?: string | null
          descricao_entrega?: string | null
          id?: string
          impressoes?: number
          insight?: string
          offer_id?: string | null
          ordem?: number
          prazo_estimado_dias?: number | null
          preco_centavos?: number
          project_id?: string
          slug?: string
          status?: string
          titulo?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_offers_offer_id_fkey"
            columns: ["offer_id"]
            isOneToOne: false
            referencedRelation: "offers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_offers_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          email: string
          id: string
          must_change_password: boolean
          nome: string
          notificar_task_concluida: boolean
          ultimo_acesso_em: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          id: string
          must_change_password?: boolean
          nome: string
          notificar_task_concluida?: boolean
          ultimo_acesso_em?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          must_change_password?: boolean
          nome?: string
          notificar_task_concluida?: boolean
          ultimo_acesso_em?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      projects: {
        Row: {
          created_at: string
          descricao: string | null
          id: string
          nome: string
          organization_id: string
          previsao_entrega: string | null
          slug: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          descricao?: string | null
          id?: string
          nome: string
          organization_id: string
          previsao_entrega?: string | null
          slug: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          descricao?: string | null
          id?: string
          nome?: string
          organization_id?: string
          previsao_entrega?: string | null
          slug?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "projects_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      rate_limit_hits: {
        Row: {
          chave: string
          created_at: string
          id: number
        }
        Insert: {
          chave: string
          created_at?: string
          id?: never
        }
        Update: {
          chave?: string
          created_at?: string
          id?: never
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          cancelada_em: string | null
          created_at: string
          dia_vencimento: number
          id: string
          iniciada_em: string
          organization_id: string
          provider_subscription_id: string | null
          status: string
          updated_at: string
          valor_centavos: number
        }
        Insert: {
          cancelada_em?: string | null
          created_at?: string
          dia_vencimento?: number
          id?: string
          iniciada_em?: string
          organization_id: string
          provider_subscription_id?: string | null
          status?: string
          updated_at?: string
          valor_centavos?: number
        }
        Update: {
          cancelada_em?: string | null
          created_at?: string
          dia_vencimento?: number
          id?: string
          iniciada_em?: string
          organization_id?: string
          provider_subscription_id?: string | null
          status?: string
          updated_at?: string
          valor_centavos?: number
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: true
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          concluida_em: string | null
          created_at: string
          descricao: string | null
          email_digest_enviado: boolean
          id: string
          motivo_bloqueio: string | null
          ordem: number
          phase_id: string
          slug: string
          status: string
          titulo: string
          updated_at: string
        }
        Insert: {
          concluida_em?: string | null
          created_at?: string
          descricao?: string | null
          email_digest_enviado?: boolean
          id?: string
          motivo_bloqueio?: string | null
          ordem?: number
          phase_id: string
          slug: string
          status?: string
          titulo: string
          updated_at?: string
        }
        Update: {
          concluida_em?: string | null
          created_at?: string
          descricao?: string | null
          email_digest_enviado?: boolean
          id?: string
          motivo_bloqueio?: string | null
          ordem?: number
          phase_id?: string
          slug?: string
          status?: string
          titulo?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_phase_id_fkey1"
            columns: ["phase_id"]
            isOneToOne: false
            referencedRelation: "phases"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      is_admin: { Args: never; Returns: boolean }
      is_org_member: { Args: { org: string }; Returns: boolean }
      is_org_owner: { Args: { org: string }; Returns: boolean }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database["public"]

export type Tables<T extends keyof DefaultSchema["Tables"]> =
  DefaultSchema["Tables"][T]["Row"]
export type TablesInsert<T extends keyof DefaultSchema["Tables"]> =
  DefaultSchema["Tables"][T]["Insert"]
export type TablesUpdate<T extends keyof DefaultSchema["Tables"]> =
  DefaultSchema["Tables"][T]["Update"]
