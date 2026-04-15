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
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          name?: string | null
          email?: string | null
          role?: 'admin' | 'aprovador' | 'suporte' | 'viewer'
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          name?: string | null
          email?: string | null
          role?: 'admin' | 'aprovador' | 'suporte' | 'viewer'
          avatar_url?: string | null
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
          name: string; contact: string | null; email: string | null; bairro_id: string | null; created_at: string
        }
        Insert: {
          id?: string; grupo_id: string; cliente_id?: string | null
          name: string; contact?: string | null; email?: string | null; bairro_id?: string | null; created_at?: string
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
      boletins: {
        Row: {
          id: string; title: string; conteudo: string
          bairro_id: string | null; grupo_id: string | null; settings_id: string | null
          status: 'rascunho' | 'aguardando_revisao' | 'aprovado' | 'enviado' | 'rejeitado'
          criado_por: string | null; aprovado_por: string | null
          data_aprovacao: string | null; data_envio: string | null; proximo_envio: string | null
          created_at: string; updated_at: string
        }
        Insert: {
          id?: string; title: string; conteudo: string
          bairro_id?: string | null; grupo_id?: string | null; settings_id?: string | null
          status?: 'rascunho' | 'aguardando_revisao' | 'aprovado' | 'enviado' | 'rejeitado'
          criado_por?: string | null; aprovado_por?: string | null
          data_aprovacao?: string | null; data_envio?: string | null; proximo_envio?: string | null
          created_at?: string; updated_at?: string
        }
        Update: {
          title?: string; conteudo?: string
          bairro_id?: string | null; grupo_id?: string | null; settings_id?: string | null
          status?: 'rascunho' | 'aguardando_revisao' | 'aprovado' | 'enviado' | 'rejeitado'
          aprovado_por?: string | null; data_aprovacao?: string | null
          data_envio?: string | null; proximo_envio?: string | null; updated_at?: string
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
    }
    Views: {}
    Functions: {
      current_user_role: { Args: {}; Returns: string }
    }
    Enums: {}
  }
}
