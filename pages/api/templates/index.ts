import type { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    const { data, error } = await supabase
      .from('boletim_templates')
      .select(`
        id, title_template, conteudo, recorrencia, dias_semana, dia_mes,
        horas_validacao, ativo, bairro_ids, ultimo_gerado_em, created_at,
        grupo:grupos(id, name),
        criador:profiles!criado_por(id, name)
      `)
      .order('created_at', { ascending: false })

    if (error) return res.status(500).json({ error: error.message })
    return res.json(data)
  }

  if (req.method === 'POST') {
    const {
      title_template, conteudo, grupo_id, bairro_ids,
      recorrencia, dias_semana, dia_mes, horas_validacao, criado_por,
    } = req.body

    if (!title_template) return res.status(400).json({ error: 'title_template é obrigatório' })
    if (!recorrencia)    return res.status(400).json({ error: 'recorrencia é obrigatório' })

    const { data, error } = await supabase
      .from('boletim_templates')
      .insert({
        title_template,
        conteudo:       conteudo       || null,
        grupo_id:       grupo_id       || null,
        bairro_ids:     Array.isArray(bairro_ids) ? bairro_ids : [],
        recorrencia,
        dias_semana:    Array.isArray(dias_semana) ? dias_semana : [],
        dia_mes:        dia_mes        || null,
        horas_validacao: horas_validacao ?? 8,
        criado_por:     criado_por     || null,
        ativo:          true,
      })
      .select()
      .single()

    if (error) return res.status(500).json({ error: error.message })
    return res.status(201).json(data)
  }

  res.status(405).json({ error: 'Método não permitido' })
}
