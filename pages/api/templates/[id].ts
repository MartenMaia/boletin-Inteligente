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
      .from('boletim_templates')
      .select(`
        id, title_template, conteudo, recorrencia, dias_semana, dia_mes,
        horas_validacao, ativo, bairro_ids, ultimo_gerado_em, created_at,
        grupo:grupos(id, name),
        criador:profiles!criado_por(id, name)
      `)
      .eq('id', id)
      .single()

    if (error) return res.status(404).json({ error: error.message })
    return res.json(data)
  }

  if (req.method === 'PATCH') {
    const {
      title_template, conteudo, grupo_id, bairro_ids,
      recorrencia, dias_semana, dia_mes, horas_validacao, ativo,
    } = req.body

    const updates: Record<string, any> = { updated_at: new Date().toISOString() }
    if (title_template !== undefined) updates.title_template = title_template
    if (conteudo       !== undefined) updates.conteudo       = conteudo || null
    if (grupo_id       !== undefined) updates.grupo_id       = grupo_id || null
    if (bairro_ids     !== undefined) updates.bairro_ids     = Array.isArray(bairro_ids) ? bairro_ids : []
    if (recorrencia    !== undefined) updates.recorrencia    = recorrencia
    if (dias_semana    !== undefined) updates.dias_semana    = Array.isArray(dias_semana) ? dias_semana : []
    if (dia_mes        !== undefined) updates.dia_mes        = dia_mes || null
    if (horas_validacao !== undefined) updates.horas_validacao = horas_validacao
    if (ativo          !== undefined) updates.ativo          = ativo

    const { data, error } = await supabase
      .from('boletim_templates')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) return res.status(500).json({ error: error.message })
    return res.json(data)
  }

  if (req.method === 'DELETE') {
    const { error } = await supabase
      .from('boletim_templates')
      .delete()
      .eq('id', id)

    if (error) return res.status(500).json({ error: error.message })
    return res.status(200).json({ ok: true })
  }

  res.status(405).json({ error: 'Método não permitido' })
}
