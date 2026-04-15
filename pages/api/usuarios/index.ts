import type { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default async function handler(req: NextApiRequest, res: NextApiResponse) {

  // ── GET: listar todos os usuários ──────────────────────────────────
  if (req.method === 'GET') {
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .select('id, name, email, role, avatar_url, ativo, inativado_em, created_at, updated_at')
      .order('created_at', { ascending: false })

    if (error) return res.status(500).json({ error: error.message })
    return res.status(200).json(data)
  }

  // ── POST: criar novo usuário via função SECURITY DEFINER ───────────
  if (req.method === 'POST') {
    const { name, email, password, role } = req.body

    if (!name?.trim())     return res.status(400).json({ error: 'Nome é obrigatório' })
    if (!email?.trim())    return res.status(400).json({ error: 'E-mail é obrigatório' })
    if (!password?.trim()) return res.status(400).json({ error: 'Senha é obrigatória' })
    if (password.length < 8) return res.status(400).json({ error: 'A senha deve ter pelo menos 8 caracteres' })

    const VALID_ROLES = ['admin', 'aprovador', 'viewer']   // 'suporte' não é criável pela UI
    if (!role || !VALID_ROLES.includes(role)) {
      return res.status(400).json({ error: 'Perfil inválido' })
    }

    // Chama a função SECURITY DEFINER — funciona com anon key
    const { data, error } = await supabaseAdmin.rpc('admin_create_user', {
      p_email:    email.trim(),
      p_password: password,
      p_name:     name.trim(),
      p_role:     role,
    })

    if (error) {
      // Mapear mensagens do PostgreSQL para português amigável
      const msg = error.message ?? ''
      if (msg.includes('já está cadastrado'))    return res.status(409).json({ error: 'Este e-mail já está cadastrado' })
      if (msg.includes('Perfil inválido'))       return res.status(400).json({ error: msg })
      if (msg.includes('senha deve ter'))        return res.status(400).json({ error: msg })
      return res.status(500).json({ error: msg || 'Erro ao criar usuário' })
    }

    // Buscar profile completo para retornar ao frontend
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('id, name, email, role, avatar_url, ativo, inativado_em, created_at, updated_at')
      .eq('id', (data as any).id)
      .maybeSingle()

    return res.status(201).json(profile ?? data)
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
