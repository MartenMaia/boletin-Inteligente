import type { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const id = Array.isArray(req.query.id) ? req.query.id[0] : req.query.id as string

  if (req.method === 'GET') {
    const { data, error } = await supabase
      .from('clientes')
      .select('id, name, phone, email, notes, bairro:bairros(id, name)')
      .eq('id', id)
      .single()

    if (error) return res.status(404).json({ error: error.message })
    return res.json(data)
  }

  if (req.method === 'PATCH') {
    const { name, phone, email, notes } = req.body
    if (!name) return res.status(400).json({ error: 'name é obrigatório' })

    const { data, error } = await supabase
      .from('clientes')
      .update({ name, phone: phone || null, email: email || null, notes: notes || null })
      .eq('id', id)
      .select('id, name, phone, email, notes')
      .single()

    if (error) return res.status(500).json({ error: error.message })
    return res.json(data)
  }

  if (req.method === 'DELETE') {
    // Remove from grupo_membros first
    await supabase.from('grupo_membros').delete().eq('cliente_id', id)

    const { error } = await supabase.from('clientes').delete().eq('id', id)
    if (error) return res.status(500).json({ error: error.message })
    return res.status(200).json({ ok: true })
  }

  res.status(405).json({ error: 'Método não permitido' })
}
