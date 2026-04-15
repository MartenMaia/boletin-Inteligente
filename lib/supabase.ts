import { createClient } from '@supabase/supabase-js'
import type { Database } from './database.types'

// Fallback vazio evita crash no build do Vercel quando as env vars ainda não estão configuradas.
// Em produção, as variáveis DEVEM estar definidas no painel do Vercel.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key'

// Cliente público (browser)
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey)

// Tipos auxiliares de profile
export type UserRole = 'admin' | 'aprovador' | 'suporte' | 'viewer'

export interface UserProfile {
  id: string
  name: string | null
  email: string | null
  role: UserRole
  avatar_url: string | null
  ativo: boolean
  inativado_em: string | null
  created_at: string
  updated_at: string
}
