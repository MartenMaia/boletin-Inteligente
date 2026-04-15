export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          name: string | null
          email: string | null
          role: 'admin' | 'aprovador' | 'suporte' | 'viewer'
          avatar_url: string | null
          ativo: boolean
          inativado_em: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          name?: string | null
          email?: string | null
          role?: 'admin' | 'aprovador' | 'suporte' | 'viewer'
          avatar_url?: string | null
          ativo?: boolean
          inativado_em?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          name?: string | null
          email?: string | null
          role?: 'admin' | 'aprovador' | 'suporte' | 'viewer'
          avatar_url?: string | null
          ativo?: boolean
          inativado_em?: string | null
          updated_at?: string
        }
      }
      associations: {
        Row: { id: string; name: string; created_at: string }
        Insert: { id?: string; name: string; created_at?: string }
        Update: { name?: string }
      }
      bairros: {
        Row: { id: string; name: string; association_id: string | null; created_at: string }
        Insert: { id?: string; name: string; association_id?: string | null; created_at?: string }
        Update: { name?: string; association_id?: string | null }
      }
      clientes: {
        Row: {
          id: string; name: string; phone: string | null; email: string | null
          bairro_id: string | null; notes: string | null; created_at: string
        }
        Insert: {
          id?: string; name: string; phone?: string | null; email?: string | null
          bairro_id?: string | null; notes?: string | null; created_at?: string
        }
        Update: {
          name?: string; phone?: string | null; email?: string | null
          bairro_id?: string | null; notes?: string | null
        }
      }
      grupos: {
        Row: { id: string; name: string; description: string | null; created_at: string; updated_at: string }
        Insert: { id?: string; name: string; description?: string | null; created_at?: string; updated_at?: string }
        Update: { name?: string; description?: string | null; updated_at?: string }
      }
      grupo_membros: {
        Row: {
          id: string; grupo_id: string; cliente_id: string | null
          name: string; contact: string | null; email: string | null
          bairro_id: string | null; created_at: string
        }
        Insert: {
          id?: string; grupo_id: string; cliente_id?: string | null
          name: string; contact?: string | null; email?: string | null
          bairro_id?: string | null; created_at?: string
        }
        Update: {
          name?: string; contact?: string | null; email?: string | null; bairro_id?: string | null
        }
      }
      avisos: {
        Row: {
          id: string; source: string; titulo: string; texto: string
          bairro_id: string | null; status: 'draft' | 'publicado' | 'arquivado'
          created_at: string; updated_at: string
        }
        Insert: {
          id?: string; source: string; titulo: string; texto: string
          bairro_id?: string | null; status?: 'draft' | 'publicado' | 'arquivado'
          created_at?: string; updated_at?: string
        }
        Update: {
          source?: string; titulo?: string; texto?: string
          bairro_id?: string | null; status?: 'draft' | 'publicado' | 'arquivado'; updated_at?: string
        }
      }
      boletins: {
        Row: {
          id: string
          title: string
          conteudo: string
          bairro_id: string | null
          bairro_ids: string[]
          canais_envio: string[]
          grupo_id: string | null
          settings_id: string | null
          template_id: string | null
          status: 'rascunho' | 'aguardando_revisao' | 'aprovado' | 'enviado' | 'rejeitado'
          criado_por: string | null
          aprovado_por: string | null
          horas_validacao: number | null
          validade_ate: string | null
          data_aprovacao: string | null
          data_envio: string | null
          proximo_envio: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          conteudo: string
          bairro_id?: string | null
          bairro_ids?: string[]
          canais_envio?: string[]
          grupo_id?: string | null
          settings_id?: string | null
          template_id?: string | null
          status?: 'rascunho' | 'aguardando_revisao' | 'aprovado' | 'enviado' | 'rejeitado'
          criado_por?: string | null
          aprovado_por?: string | null
          horas_validacao?: number | null
          validade_ate?: string | null
          data_aprovacao?: string | null
          data_envio?: string | null
          proximo_envio?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          title?: string
          conteudo?: string
          bairro_id?: string | null
          bairro_ids?: string[]
          canais_envio?: string[]
          grupo_id?: string | null
          settings_id?: string | null
          template_id?: string | null
          status?: 'rascunho' | 'aguardando_revisao' | 'aprovado' | 'enviado' | 'rejeitado'
          aprovado_por?: string | null
          horas_validacao?: number | null
          validade_ate?: string | null
          data_aprovacao?: string | null
          data_envio?: string | null
          proximo_envio?: string | null
          updated_at?: string
        }
      }
      boletim_templates: {
        Row: {
          id: string
          title_template: string
          conteudo: string | null
          grupo_id: string | null
          bairro_ids: string[]
          canais_envio: string[]
          recorrencia: string
          dias_semana: number[]
          dia_mes: number | null
          horas_validacao: number
          hora_envio: string
          ativo: boolean
          criado_por: string | null
          ultimo_gerado_em: string | null
          created_at: string
          updated_at: string | null
        }
        Insert: {
          id?: string
          title_template: string
          conteudo?: string | null
          grupo_id?: string | null
          bairro_ids?: string[]
          canais_envio?: string[]
          recorrencia: string
          dias_semana?: number[]
          dia_mes?: number | null
          horas_validacao?: number
          hora_envio?: string
          ativo?: boolean
          criado_por?: string | null
          ultimo_gerado_em?: string | null
          created_at?: string
          updated_at?: string | null
        }
        Update: {
          title_template?: string
          conteudo?: string | null
          grupo_id?: string | null
          bairro_ids?: string[]
          canais_envio?: string[]
          recorrencia?: string
          dias_semana?: number[]
          dia_mes?: number | null
          horas_validacao?: number
          hora_envio?: string
          ativo?: boolean
          ultimo_gerado_em?: string | null
          updated_at?: string | null
        }
      }
      canal_envio_config: {
        Row: {
          id: string
          canal: string
          ativo: boolean
          config: Json
          updated_by: string | null
          updated_at: string
        }
        Insert: {
          id?: string
          canal: string
          ativo?: boolean
          config?: Json
          updated_by?: string | null
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          config?: Json
          updated_by?: string | null
          updated_at?: string
        }
      }
      boletim_envios: {
        Row: {
          id: string; boletim_id: string; cliente_id: string | null
          canal: 'whatsapp' | 'email' | 'sms'
          status: 'pendente' | 'enviado' | 'entregue' | 'falhou'
          enviado_em: string | null; erro: string | null; created_at: string
        }
        Insert: {
          id?: string; boletim_id: string; cliente_id?: string | null
          canal: 'whatsapp' | 'email' | 'sms'
          status?: 'pendente' | 'enviado' | 'entregue' | 'falhou'
          enviado_em?: string | null; erro?: string | null; created_at?: string
        }
        Update: {
          status?: 'pendente' | 'enviado' | 'entregue' | 'falhou'
          enviado_em?: string | null; erro?: string | null
        }
      }
      bulletin_settings: {
        Row: {
          id: string; title: string; types: Json; sources: Json
          approver_id: string | null; frequency: string; segmentation: Json
          grupo_id: string | null; active: boolean; created_at: string; updated_at: string
        }
        Insert: {
          id?: string; title: string; types?: Json; sources?: Json
          approver_id?: string | null; frequency?: string; segmentation?: Json
          grupo_id?: string | null; active?: boolean; created_at?: string; updated_at?: string
        }
        Update: {
          title?: string; types?: Json; sources?: Json
          approver_id?: string | null; frequency?: string; segmentation?: Json
          grupo_id?: string | null; active?: boolean; updated_at?: string
        }
      }
    }
    Views: {}
    Functions: {
      current_user_role: { Args: Record<string, never>; Returns: string }
      admin_create_user: {
        Args: { p_email: string; p_password: string; p_name: string; p_role: string }
        Returns: Json
      }
      admin_update_password: {
        Args: { p_user_id: string; p_password: string }
        Returns: void
      }
    }
    Enums: {}
  }
}
