import type { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'

// Cliente admin (service_role) para operações server-side
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    const { status, grupo_id, limit = '50' } = req.query

    let query = supabaseAdmin
      .from('boletins')
      .select(`
        id, title, conteudo, status, created_at, updated_at,
        proximo_envio, data_envio, data_aprovacao,
        bairro:bairros(id, name),
        grupo:grupos(id, name),
        criador:profiles!criado_por(id, name),
        aprovador:profiles!aprovado_por(id, name)
      `)
      .order('created_at', { ascending: false })
      .limit(Number(limit))

    if (status) query = query.eq('status', status)
    if (grupo_id) query = query.eq('grupo_id', grupo_id)

    const { data, error } = await query

    if (error) return res.status(500).json({ error: error.message })
    return res.status(200).json(data)
  }

  if (req.method === 'POST') {
    const body = req.body && typeof req.body === 'string' ? JSON.parse(req.body) : req.body
    const { title, conteudo, bairro_id, grupo_id, settings_id, criado_por, proximo_envio } = body

    if (!title || !conteudo) {
      return res.status(400).json({ error: 'title e conteudo são obrigatórios' })
    }

    const { data, error } = await supabaseAdmin
      .from('boletins')
      .insert({
        title,
        conteudo,
        bairro_id: bairro_id || null,
        grupo_id: grupo_id || null,
        settings_id: settings_id || null,
        criado_por: criado_por || null,
        proximo_envio: proximo_envio || null,
        status: 'rascunho',
      })
      .select()
      .single()

    if (error) return res.status(500).json({ error: error.message })
    return res.status(201).json(data)
  }

  res.status(405).json({ error: 'Método não permitido' })
}
