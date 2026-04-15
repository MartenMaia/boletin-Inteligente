import type { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    const { data, error } = await supabase
      .from('grupos')
      .select(`
        id, name, description, created_at, updated_at,
        members:grupo_membros(id, cliente_id, name, contact, email, bairro_id)
      `)
      .order('name')

    if (error) return res.status(500).json({ error: error.message })
    return res.json(data)
  }

  if (req.method === 'POST') {
    const { name, description } = req.body
    if (!name) return res.status(400).json({ error: 'name é obrigatório' })

    const { data, error } = await supabase
      .from('grupos')
      .insert({ name, description: description || null })
      .select()
      .single()

    if (error) return res.status(500).json({ error: error.message })
    return res.status(201).json(data)
  }

  if (req.method === 'PATCH') {
    const id = req.query.id as string
    const { name, description } = req.body
    const { data, error } = await supabase
      .from('grupos')
      .update({ name, description: description || null })
      .eq('id', id)
      .select()
      .single()
    if (error) return res.status(500).json({ error: error.message })
    return res.json(data)
  }

  res.status(405).json({ error: 'Método não permitido' })
}
