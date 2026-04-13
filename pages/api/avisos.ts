import type { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    const { bairro_id, status } = req.query
    let query = supabase
      .from('avisos')
      .select('id, source, titulo, texto, status, created_at, bairro:bairros(id, name)')
      .order('created_at', { ascending: false })

    if (bairro_id) query = query.eq('bairro_id', bairro_id)
    if (status) query = query.eq('status', status)

    const { data, error } = await query
    if (error) return res.status(500).json({ error: error.message })
    return res.json(data)
  }

  if (req.method === 'POST') {
    const { source, titulo, texto, bairro_id } = req.body
    if (!source || !titulo || !texto) {
      return res.status(400).json({ error: 'source, titulo e texto são obrigatórios' })
    }

    const { data, error } = await supabase
      .from('avisos')
      .insert({ source, titulo, texto, bairro_id: bairro_id || null })
      .select()
      .single()

    if (error) return res.status(500).json({ error: error.message })
    return res.status(201).json(data)
  }

  res.status(405).json({ error: 'Método não permitido' })
}
