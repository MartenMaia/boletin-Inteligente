import type { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    const { data, error } = await supabase
      .from('clientes')
      .select('id, name, phone, email, notes, bairro:bairros(id, name)')
      .order('name')
    if (error) return res.status(500).json({ error: error.message })
    return res.json(data)
  }

  if (req.method === 'POST') {
    const { name, phone, email, notes, bairro_id } = req.body
    if (!name) return res.status(400).json({ error: 'name é obrigatório' })
    const { data, error } = await supabase
      .from('clientes')
      .insert({ name, phone: phone || null, email: email || null, notes: notes || null, bairro_id: bairro_id || null })
      .select()
      .single()
    if (error) return res.status(500).json({ error: error.message })
    return res.status(201).json(data)
  }

  res.status(405).json({ error: 'Método não permitido' })
}
