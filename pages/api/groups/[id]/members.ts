import type { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const grupoId = Array.isArray(req.query.id) ? req.query.id[0] : req.query.id as string

  if (req.method === 'GET') {
    const { data, error } = await supabase
      .from('grupo_membros')
      .select('id, name, contact, bairro:bairros(id, name), created_at')
      .eq('grupo_id', grupoId)
      .order('name')

    if (error) return res.status(500).json({ error: error.message })
    return res.json(data)
  }

  if (req.method === 'POST') {
    const { name, contact, bairro_id } = req.body
    if (!name) return res.status(400).json({ error: 'name é obrigatório' })

    const { data, error } = await supabase
      .from('grupo_membros')
      .insert({ grupo_id: grupoId, name, contact: contact || null, bairro_id: bairro_id || null })
      .select()
      .single()

    if (error) return res.status(500).json({ error: error.message })
    return res.status(201).json(data)
  }

  if (req.method === 'DELETE') {
    const memberId = req.query.memberId as string
    if (!memberId) return res.status(400).json({ error: 'memberId é obrigatório' })

    const { error } = await supabase
      .from('grupo_membros')
      .delete()
      .eq('id', memberId)
      .eq('grupo_id', grupoId)

    if (error) return res.status(500).json({ error: error.message })
    return res.status(200).json({ ok: true })
  }

  res.status(405).json({ error: 'Método não permitido' })
}
