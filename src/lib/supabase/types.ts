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
      calls: {
        Row: {
          bant: Json
          contact_id: string | null
          created_at: string
          created_by: string | null
          duracao_min: number | null
          id: string
          notas: string | null
          organization_id: string
          realizada_em: string
          resultado: string | null
          tipo: string
          updated_at: string
        }
        Insert: {
          bant?: Json
          contact_id?: string | null
          created_at?: string
          created_by?: string | null
          duracao_min?: number | null
          id?: string
          notas?: string | null
          organization_id: string
          realizada_em?: string
          resultado?: string | null
          tipo: string
          updated_at?: string
        }
        Update: {
          bant?: Json
          contact_id?: string | null
          created_at?: string
          created_by?: string | null
          duracao_min?: number | null
          id?: string
          notas?: string | null
          organization_id?: string
          realizada_em?: string
          resultado?: string | null
          tipo?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "calls_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "calls_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "calls_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      change_requests: {
        Row: {
          classificacao: string | null
          created_at: string
          descricao: string
          id: string
          module_id: string | null
          project_id: string
          resolvido_em: string | null
          solicitado_por: string | null
          status: string
          updated_at: string
          valor_centavos: number | null
        }
        Insert: {
          classificacao?: string | null
          created_at?: string
          descricao: string
          id?: string
          module_id?: string | null
          project_id: string
          resolvido_em?: string | null
          solicitado_por?: string | null
          status?: string
          updated_at?: string
          valor_centavos?: number | null
        }
        Update: {
          classificacao?: string | null
          created_at?: string
          descricao?: string
          id?: string
          module_id?: string | null
          project_id?: string
          resolvido_em?: string | null
          solicitado_por?: string | null
          status?: string
          updated_at?: string
          valor_centavos?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "change_requests_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "modules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "change_requests_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "change_requests_solicitado_por_fkey"
            columns: ["solicitado_por"]
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
      contacts: {
        Row: {
          created_at: string
          email: string | null
          id: string
          nome: string
          observacoes: string | null
          organization_id: string
          papel: string
          principal: boolean
          updated_at: string
          whatsapp: string | null
        }
        Insert: {
          created_at?: string
          email?: string | null
          id?: string
          nome: string
          observacoes?: string | null
          organization_id: string
          papel?: string
          principal?: boolean
          updated_at?: string
          whatsapp?: string | null
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: string
          nome?: string
          observacoes?: string | null
          organization_id?: string
          papel?: string
          principal?: boolean
          updated_at?: string
          whatsapp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contacts_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      contracts: {
        Row: {
          assinado_em: string | null
          created_at: string
          escopo_retainer: Json
          id: string
          mensalidade_centavos: number
          organization_id: string
          origem: string
          plano_parcelas: Json
          proposal_id: string | null
          status: string
          termos_versao: string | null
          tier_id: string | null
          updated_at: string
          valor_implementacao_centavos: number
          vigencia_inicio: string | null
          vigencia_meses: number
        }
        Insert: {
          assinado_em?: string | null
          created_at?: string
          escopo_retainer?: Json
          id?: string
          mensalidade_centavos?: number
          organization_id: string
          origem?: string
          plano_parcelas?: Json
          proposal_id?: string | null
          status?: string
          termos_versao?: string | null
          tier_id?: string | null
          updated_at?: string
          valor_implementacao_centavos?: number
          vigencia_inicio?: string | null
          vigencia_meses?: number
        }
        Update: {
          assinado_em?: string | null
          created_at?: string
          escopo_retainer?: Json
          id?: string
          mensalidade_centavos?: number
          organization_id?: string
          origem?: string
          plano_parcelas?: Json
          proposal_id?: string | null
          status?: string
          termos_versao?: string | null
          tier_id?: string | null
          updated_at?: string
          valor_implementacao_centavos?: number
          vigencia_inicio?: string | null
          vigencia_meses?: number
        }
        Relationships: [
          {
            foreignKeyName: "contracts_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contracts_proposal_id_fkey"
            columns: ["proposal_id"]
            isOneToOne: true
            referencedRelation: "proposals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contracts_tier_id_fkey"
            columns: ["tier_id"]
            isOneToOne: false
            referencedRelation: "tiers"
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
      events: {
        Row: {
          ator_id: string | null
          ator_tipo: string
          entidade: string
          entidade_id: string | null
          id: string
          ocorrido_em: string
          organization_id: string | null
          payload: Json
          tipo: string
          visivel_cliente: boolean
        }
        Insert: {
          ator_id?: string | null
          ator_tipo: string
          entidade: string
          entidade_id?: string | null
          id?: string
          ocorrido_em?: string
          organization_id?: string | null
          payload?: Json
          tipo: string
          visivel_cliente?: boolean
        }
        Update: {
          ator_id?: string | null
          ator_tipo?: string
          entidade?: string
          entidade_id?: string | null
          id?: string
          ocorrido_em?: string
          organization_id?: string | null
          payload?: Json
          tipo?: string
          visivel_cliente?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "events_organization_id_fkey"
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
      modules: {
        Row: {
          ativo: boolean
          created_at: string
          descricao: string | null
          dores_gatilho: string[]
          horas_estimadas: number
          id: string
          mensalidade_centavos: number
          nome: string
          placeholder: boolean
          preco_implementacao_centavos: number
          slug: string
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          descricao?: string | null
          dores_gatilho?: string[]
          horas_estimadas?: number
          id?: string
          mensalidade_centavos?: number
          nome: string
          placeholder?: boolean
          preco_implementacao_centavos?: number
          slug: string
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          created_at?: string
          descricao?: string | null
          dores_gatilho?: string[]
          horas_estimadas?: number
          id?: string
          mensalidade_centavos?: number
          nome?: string
          placeholder?: boolean
          preco_implementacao_centavos?: number
          slug?: string
          updated_at?: string
        }
        Relationships: []
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
          asaas_customer_id: string | null
          cidade: string | null
          created_at: string
          documento: string | null
          email_faturamento: string | null
          estagio: string
          id: string
          nome: string
          provider_customer_id: string | null
          saude: string | null
          segmento: string | null
          slug: string
          telefone: string | null
          updated_at: string
        }
        Insert: {
          arquivada_em?: string | null
          asaas_customer_id?: string | null
          cidade?: string | null
          created_at?: string
          documento?: string | null
          email_faturamento?: string | null
          estagio?: string
          id?: string
          nome: string
          provider_customer_id?: string | null
          saude?: string | null
          segmento?: string | null
          slug: string
          telefone?: string | null
          updated_at?: string
        }
        Update: {
          arquivada_em?: string | null
          asaas_customer_id?: string | null
          cidade?: string | null
          created_at?: string
          documento?: string | null
          email_faturamento?: string | null
          estagio?: string
          id?: string
          nome?: string
          provider_customer_id?: string | null
          saude?: string | null
          segmento?: string | null
          slug?: string
          telefone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      pains: {
        Row: {
          call_id: string | null
          categoria: string | null
          created_at: string
          custo_mensal_centavos: number | null
          descricao: string
          id: string
          module_id: string | null
          organization_id: string
          tipo_spin: string
          unidade: string | null
          updated_at: string
          valor_numerico: number | null
        }
        Insert: {
          call_id?: string | null
          categoria?: string | null
          created_at?: string
          custo_mensal_centavos?: number | null
          descricao: string
          id?: string
          module_id?: string | null
          organization_id: string
          tipo_spin: string
          unidade?: string | null
          updated_at?: string
          valor_numerico?: number | null
        }
        Update: {
          call_id?: string | null
          categoria?: string | null
          created_at?: string
          custo_mensal_centavos?: number | null
          descricao?: string
          id?: string
          module_id?: string | null
          organization_id?: string
          tipo_spin?: string
          unidade?: string | null
          updated_at?: string
          valor_numerico?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "pains_call_id_fkey"
            columns: ["call_id"]
            isOneToOne: false
            referencedRelation: "calls"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pains_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "modules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pains_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_conditions: {
        Row: {
          ajuste_bps: number
          ativo: boolean
          created_at: string
          descricao: string | null
          id: string
          nome: string
          placeholder: boolean
          slug: string
          updated_at: string
        }
        Insert: {
          ajuste_bps?: number
          ativo?: boolean
          created_at?: string
          descricao?: string | null
          id?: string
          nome: string
          placeholder?: boolean
          slug: string
          updated_at?: string
        }
        Update: {
          ajuste_bps?: number
          ativo?: boolean
          created_at?: string
          descricao?: string | null
          id?: string
          nome?: string
          placeholder?: boolean
          slug?: string
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
          criterio_pronto: string | null
          descricao: string | null
          etapa: string | null
          fechada_em: string | null
          fim_previsto: string | null
          id: string
          inicio_previsto: string | null
          ordem: number
          origem_offer_id: string | null
          project_id: string
          status: string
          titulo: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          criterio_pronto?: string | null
          descricao?: string | null
          etapa?: string | null
          fechada_em?: string | null
          fim_previsto?: string | null
          id?: string
          inicio_previsto?: string | null
          ordem?: number
          origem_offer_id?: string | null
          project_id: string
          status?: string
          titulo: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          criterio_pronto?: string | null
          descricao?: string | null
          etapa?: string | null
          fechada_em?: string | null
          fim_previsto?: string | null
          id?: string
          inicio_previsto?: string | null
          ordem?: number
          origem_offer_id?: string | null
          project_id?: string
          status?: string
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
      projects: {
        Row: {
          contract_id: string | null
          created_at: string
          data_fim_prevista: string | null
          data_inicio_prevista: string | null
          descricao: string | null
          id: string
          na_fila: boolean
          nome: string
          organization_id: string
          previsao_entrega: string | null
          relogio: string
          relogio_dias_pausados: number
          relogio_motivo: string | null
          relogio_pausado_em: string | null
          semana_atual: number | null
          slug: string
          start_date: string | null
          status: string
          updated_at: string
        }
        Insert: {
          contract_id?: string | null
          created_at?: string
          data_fim_prevista?: string | null
          data_inicio_prevista?: string | null
          descricao?: string | null
          id?: string
          na_fila?: boolean
          nome: string
          organization_id: string
          previsao_entrega?: string | null
          relogio?: string
          relogio_dias_pausados?: number
          relogio_motivo?: string | null
          relogio_pausado_em?: string | null
          semana_atual?: number | null
          slug: string
          start_date?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          contract_id?: string | null
          created_at?: string
          data_fim_prevista?: string | null
          data_inicio_prevista?: string | null
          descricao?: string | null
          id?: string
          na_fila?: boolean
          nome?: string
          organization_id?: string
          previsao_entrega?: string | null
          relogio?: string
          relogio_dias_pausados?: number
          relogio_motivo?: string | null
          relogio_pausado_em?: string | null
          semana_atual?: number | null
          slug?: string
          start_date?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "projects_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      proposal_items: {
        Row: {
          created_at: string
          id: string
          module_id: string
          narrativa: string | null
          ordem: number
          pain_id: string | null
          proposal_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          module_id: string
          narrativa?: string | null
          ordem?: number
          pain_id?: string | null
          proposal_id: string
        }
        Update: {
          created_at?: string
          id?: string
          module_id?: string
          narrativa?: string | null
          ordem?: number
          pain_id?: string | null
          proposal_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "proposal_items_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "modules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "proposal_items_pain_id_fkey"
            columns: ["pain_id"]
            isOneToOne: false
            referencedRelation: "pains"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "proposal_items_proposal_id_fkey"
            columns: ["proposal_id"]
            isOneToOne: false
            referencedRelation: "proposals"
            referencedColumns: ["id"]
          },
        ]
      }
      proposals: {
        Row: {
          aceita_em: string | null
          aceite_nome: string | null
          aceite_termos_versao: string | null
          call_id: string | null
          condicao_pagamento_id: string | null
          created_at: string
          created_by: string | null
          enviada_em: string | null
          first_viewed_at: string | null
          id: string
          last_viewed_at: string | null
          narrativa: Json
          organization_id: string
          premissas_roi: Json
          status: string
          tier_id: string | null
          tier_sugerido_id: string | null
          titulo: string | null
          token: string
          updated_at: string
          validade_ate: string | null
          view_count: number
        }
        Insert: {
          aceita_em?: string | null
          aceite_nome?: string | null
          aceite_termos_versao?: string | null
          call_id?: string | null
          condicao_pagamento_id?: string | null
          created_at?: string
          created_by?: string | null
          enviada_em?: string | null
          first_viewed_at?: string | null
          id?: string
          last_viewed_at?: string | null
          narrativa?: Json
          organization_id: string
          premissas_roi?: Json
          status?: string
          tier_id?: string | null
          tier_sugerido_id?: string | null
          titulo?: string | null
          token?: string
          updated_at?: string
          validade_ate?: string | null
          view_count?: number
        }
        Update: {
          aceita_em?: string | null
          aceite_nome?: string | null
          aceite_termos_versao?: string | null
          call_id?: string | null
          condicao_pagamento_id?: string | null
          created_at?: string
          created_by?: string | null
          enviada_em?: string | null
          first_viewed_at?: string | null
          id?: string
          last_viewed_at?: string | null
          narrativa?: Json
          organization_id?: string
          premissas_roi?: Json
          status?: string
          tier_id?: string | null
          tier_sugerido_id?: string | null
          titulo?: string | null
          token?: string
          updated_at?: string
          validade_ate?: string | null
          view_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "proposals_call_id_fkey"
            columns: ["call_id"]
            isOneToOne: false
            referencedRelation: "calls"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "proposals_condicao_pagamento_id_fkey"
            columns: ["condicao_pagamento_id"]
            isOneToOne: false
            referencedRelation: "payment_conditions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "proposals_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "proposals_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "proposals_tier_id_fkey"
            columns: ["tier_id"]
            isOneToOne: false
            referencedRelation: "tiers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "proposals_tier_sugerido_id_fkey"
            columns: ["tier_sugerido_id"]
            isOneToOne: false
            referencedRelation: "tiers"
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
      settings: {
        Row: {
          chave: string
          descricao: string | null
          updated_at: string
          updated_by: string | null
          valor: Json
        }
        Insert: {
          chave: string
          descricao?: string | null
          updated_at?: string
          updated_by?: string | null
          valor: Json
        }
        Update: {
          chave?: string
          descricao?: string | null
          updated_at?: string
          updated_by?: string | null
          valor?: Json
        }
        Relationships: [
          {
            foreignKeyName: "settings_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
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
          bloqueada_por_tier_id: string | null
          categoria: string | null
          concluida_em: string | null
          created_at: string
          descricao: string | null
          dono: string
          email_digest_enviado: boolean
          id: string
          module_id: string | null
          motivo_bloqueio: string | null
          ordem: number
          phase_id: string
          prazo: string | null
          slug: string
          status: string
          titulo: string
          updated_at: string
          vencida_registrada_em: string | null
        }
        Insert: {
          bloqueada_por_tier_id?: string | null
          categoria?: string | null
          concluida_em?: string | null
          created_at?: string
          descricao?: string | null
          dono?: string
          email_digest_enviado?: boolean
          id?: string
          module_id?: string | null
          motivo_bloqueio?: string | null
          ordem?: number
          phase_id: string
          prazo?: string | null
          slug: string
          status?: string
          titulo: string
          updated_at?: string
          vencida_registrada_em?: string | null
        }
        Update: {
          bloqueada_por_tier_id?: string | null
          categoria?: string | null
          concluida_em?: string | null
          created_at?: string
          descricao?: string | null
          dono?: string
          email_digest_enviado?: boolean
          id?: string
          module_id?: string | null
          motivo_bloqueio?: string | null
          ordem?: number
          phase_id?: string
          prazo?: string | null
          slug?: string
          status?: string
          titulo?: string
          updated_at?: string
          vencida_registrada_em?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tasks_bloqueada_por_tier_id_fkey"
            columns: ["bloqueada_por_tier_id"]
            isOneToOne: false
            referencedRelation: "tiers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "modules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_phase_id_fkey1"
            columns: ["phase_id"]
            isOneToOne: false
            referencedRelation: "phases"
            referencedColumns: ["id"]
          },
        ]
      }
      tier_modules: {
        Row: {
          module_id: string
          ordem: number
          tier_id: string
        }
        Insert: {
          module_id: string
          ordem?: number
          tier_id: string
        }
        Update: {
          module_id?: string
          ordem?: number
          tier_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tier_modules_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "modules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tier_modules_tier_id_fkey"
            columns: ["tier_id"]
            isOneToOne: false
            referencedRelation: "tiers"
            referencedColumns: ["id"]
          },
        ]
      }
      tiers: {
        Row: {
          alvo: boolean | null
          ativo: boolean
          created_at: string
          descricao: string | null
          id: string
          nome: string
          ordem: number
          placeholder: boolean
          slug: string
          updated_at: string
        }
        Insert: {
          alvo?: never
          ativo?: boolean
          created_at?: string
          descricao?: string | null
          id?: string
          nome: string
          ordem: number
          placeholder?: boolean
          slug: string
          updated_at?: string
        }
        Update: {
          alvo?: never
          ativo?: boolean
          created_at?: string
          descricao?: string | null
          id?: string
          nome?: string
          ordem?: number
          placeholder?: boolean
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      calc_proposta_preco: {
        Args: { p_proposal_id: string; p_tier_id?: string }
        Returns: {
          horas: number
          implementacao_centavos: number
          mensalidade_centavos: number
        }[]
      }
      calc_tier_preco: {
        Args: { p_tier_id: string }
        Returns: {
          horas: number
          implementacao_centavos: number
          mensalidade_centavos: number
        }[]
      }
      is_admin: { Args: never; Returns: boolean }
      is_org_member: { Args: { org: string }; Returns: boolean }
      is_org_owner: { Args: { org: string }; Returns: boolean }
      proposta_por_token: { Args: { p_token: string }; Returns: Json }
      registrar_visualizacao_proposta: {
        Args: { p_token: string }
        Returns: {
          organization_id: string
          primeira_vez: boolean
          proposal_id: string
          view_count: number
        }[]
      }
      projetos_em_implementacao: { Args: never; Returns: number }
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
