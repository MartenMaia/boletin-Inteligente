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
      .from('boletins')
      .select(`
        id, title, conteudo, status, created_at, updated_at,
        proximo_envio, data_envio, data_aprovacao,
        bairro:bairros(id, name),
        grupo:grupos(id, name),
        criador:profiles!criado_por(id, name),
        aprovador:profiles!aprovado_por(id, name)
      `)
      .eq('id', id)
      .single()

    if (error) return res.status(404).json({ error: 'Boletim não encontrado' })
    return res.status(200).json(data)
  }

  if (req.method === 'PATCH') {
    const body = req.body && typeof req.body === 'string' ? JSON.parse(req.body) : req.body

    const { data, error } = await supabase
      .from('boletins')
      .update({ ...body, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()

    if (error) return res.status(500).json({ error: error.message })
    return res.status(200).json(data)
  }

  if (req.method === 'DELETE') {
    const { error } = await supabase.from('boletins').delete().eq('id', id)
    if (error) return res.status(500).json({ error: error.message })
    return res.status(200).json({ ok: true })
  }

  res.status(405).json({ error: 'Método não permitido' })
}
