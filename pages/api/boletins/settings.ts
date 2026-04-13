import type { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    const { data, error } = await supabase
      .from('bulletin_settings')
      .select(`
        id, title, types, sources, frequency, segmentation, active, created_at,
        approver:profiles!approver_id(id, name),
        grupo:grupos(id, name)
      `)
      .eq('active', true)
      .order('title')

    if (error) return res.status(500).json({ error: error.message })
    return res.json(data)
  }

  if (req.method === 'POST') {
    const body = req.body && typeof req.body === 'string' ? JSON.parse(req.body) : req.body
    const { title, types, sources, approver_id, frequency, segmentation, grupo_id } = body

    if (!title || !frequency) {
      return res.status(400).json({ error: 'title e frequency são obrigatórios' })
    }

    const { data, error } = await supabase
      .from('bulletin_settings')
      .insert({
        title,
        types: types || [],
        sources: sources || [],
        approver_id: approver_id || null,
        frequency,
        segmentation: segmentation || [],
        grupo_id: grupo_id || null,
      })
      .select()
      .single()

    if (error) return res.status(500).json({ error: error.message })
    return res.status(201).json(data)
  }

  res.status(405).json({ error: 'Método não permitido' })
}
