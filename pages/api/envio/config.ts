import type { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // GET — retorna os dois registros (email + whatsapp)
  if (req.method === 'GET') {
    const { data, error } = await supabase
      .from('canal_envio_config')
      .select('id, canal, ativo, config, updated_at')
      .order('canal')

    if (error) return res.status(500).json({ error: error.message })

    // Nunca expor senhas/tokens no GET — mascarar campos sensíveis
    const safe = (data || []).map((row: any) => {
      const cfg = { ...row.config }
      if (cfg.password)  cfg.password  = cfg.password  ? '••••••••' : ''
      if (cfg.api_token) cfg.api_token = cfg.api_token ? '••••••••' : ''
      if (cfg.auth_token)cfg.auth_token= cfg.auth_token? '••••••••' : ''
      return { ...row, config: cfg }
    })

    return res.json(safe)
  }

  // PATCH — atualiza config de um canal específico
  if (req.method === 'PATCH') {
    const { canal, ativo, config, updated_by } = req.body
    if (!canal) return res.status(400).json({ error: 'canal é obrigatório' })

    // Buscar config atual para não sobrescrever campos mascarados
    const { data: current } = await supabase
      .from('canal_envio_config')
      .select('config')
      .eq('canal', canal)
      .single()

    // Mesclar: se valor vier mascarado (••••••••), manter o valor original
    const merged: Record<string, any> = { ...(current?.config || {}), ...config }
    const MASK = '••••••••'
    const SENSITIVE = ['password', 'api_token', 'auth_token']
    for (const key of SENSITIVE) {
      if (merged[key] === MASK) {
        merged[key] = current?.config?.[key] ?? ''
      }
    }

    const { data, error } = await supabase
      .from('canal_envio_config')
      .update({
        ativo:      ativo ?? false,
        config:     merged,
        updated_at: new Date().toISOString(),
        updated_by: updated_by || null,
      })
      .eq('canal', canal)
      .select('id, canal, ativo, updated_at')
      .single()

    if (error) return res.status(500).json({ error: error.message })
    return res.json(data)
  }

  res.status(405).json({ error: 'Método não permitido' })
}
