import type { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query
  if (typeof id !== 'string') return res.status(400).json({ error: 'ID inválido' })

  // ── GET: buscar perfil específico ──────────────────────────────────
  if (req.method === 'GET') {
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .select('id, name, email, role, avatar_url, ativo, inativado_em, created_at, updated_at')
      .eq('id', id)
      .maybeSingle()

    if (error || !data) return res.status(404).json({ error: 'Usuário não encontrado' })
    return res.status(200).json(data)
  }

  // ── PATCH: atualizar nome, role, senha e/ou inativação ─────────────
  if (req.method === 'PATCH') {
    const { name, role, password, ativo } = req.body

    const VALID_ROLES = ['admin', 'aprovador', 'suporte', 'viewer']
    if (role && !VALID_ROLES.includes(role)) {
      return res.status(400).json({ error: 'Perfil inválido' })
    }

    // Montar payload do profile
    const profileUpdates: Record<string, any> = { updated_at: new Date().toISOString() }
    if (name?.trim())               profileUpdates.name = name.trim()
    if (role)                       profileUpdates.role = role
    if (typeof ativo === 'boolean') {
      profileUpdates.ativo        = ativo
      profileUpdates.inativado_em = ativo ? null : new Date().toISOString()
    }

    // Atualizar profile — política update_open garante que funciona com anon key
    const { data: updatedRows, error: profileError } = await supabaseAdmin
      .from('profiles')
      .update(profileUpdates)
      .eq('id', id)
      .select('id')

    if (profileError) return res.status(500).json({ error: profileError.message })
    if (!updatedRows || updatedRows.length === 0) {
      return res.status(404).json({ error: 'Usuário não encontrado' })
    }

    // Atualizar senha via função SECURITY DEFINER (sem precisar de service role key)
    if (password?.trim()) {
      const { error: pwError } = await supabaseAdmin.rpc('admin_update_password', {
        p_user_id:  id,
        p_password: password,
      })
      if (pwError) return res.status(500).json({ error: pwError.message })
    }

    // Buscar perfil atualizado
    const { data: profile, error: fetchError } = await supabaseAdmin
      .from('profiles')
      .select('id, name, email, role, avatar_url, ativo, inativado_em, created_at, updated_at')
      .eq('id', id)
      .maybeSingle()

    if (fetchError || !profile) return res.status(500).json({ error: 'Erro ao buscar perfil atualizado' })
    return res.status(200).json(profile)
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
