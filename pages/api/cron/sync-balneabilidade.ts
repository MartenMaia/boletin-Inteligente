/**
 * GET /api/cron/sync-balneabilidade
 *
 * Chamado pelo Vercel Cron todos os dias às 08:00 BRT.
 * Sincroniza os dados de balneabilidade do IMA-SC com o banco de dados.
 *
 * Temporada (out-mar): dados semanais, publicados às sextas.
 * Fora de temporada (abr-set): dados mensais.
 */

import type { NextApiRequest, NextApiResponse } from 'next'
import { syncBalneabilidade } from '../balneabilidade/sync'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Vercel Cron chama via GET com o header authorization
  const authHeader = req.headers.authorization
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Não autorizado' })
  }

  console.log('[cron/sync-balneabilidade] Iniciando sincronização agendada...')

  try {
    const resultado = await syncBalneabilidade()
    console.log('[cron/sync-balneabilidade] Concluído:', resultado)
    return res.status(200).json({ ok: true, ...resultado })
  } catch (err) {
    console.error('[cron/sync-balneabilidade] Erro:', err)
    return res.status(500).json({
      ok: false,
      error: err instanceof Error ? err.message : String(err),
    })
  }
}
