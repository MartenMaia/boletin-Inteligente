import { createClient } from '@supabase/supabase-js'
import type { Database } from './database.types'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Cliente público (browser)
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey)

// Tipos auxiliares de profile
export type UserRole = 'admin' | 'editor' | 'aprovador' | 'viewer'

export interface UserProfile {
  id: string
  name: string | null
  email: string | null
  role: UserRole
  avatar_url: string | null
  created_at: string
  updated_at: string
}
