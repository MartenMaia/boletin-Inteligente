/**
 * GET /api/balneabilidade/[bairroId]
 *
 * Retorna os dados de balneabilidade de um bairro específico.
 *
 * Query params:
 *   ?refresh=true       — força sincronização com IMA antes de retornar
 *   ?historico=true     — retorna histórico completo (padrão: só o mais recente)
 *   ?limit=N            — (com historico=true) quantidade de registros (padrão: 10)
 */

import type { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'
import { syncBalneabilidade } from './sync'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
)

let ultimaSincronizacaoPorBairro: Record<string, Date> = {}
const CACHE_TTL_MS = 30 * 60 * 1000

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método não permitido' })
  }

  const { bairroId, refresh, historico, limit = '10' } = req.query
  const id = Array.isArray(bairroId) ? bairroId[0] : bairroId

  if (!id) {
    return res.status(400).json({ error: 'bairroId é obrigatório' })
  }

  // Verifica se o bairro existe
  const { data: bairro, error: errBairro } = await supabase
    .from('bairros')
    .select('id, name')
    .eq('id', id)
    .single()

  if (errBairro || !bairro) {
    return res.status(404).json({ error: 'Bairro não encontrado' })
  }

  // ── Sincronização ──────────────────────────────────────────────────────────
  const forceRefresh = refresh === 'true'
  const ultima = ultimaSincronizacaoPorBairro[id]
  const cacheExpirado = !ultima || Date.now() - ultima.getTime() > CACHE_TTL_MS

  if (forceRefresh || cacheExpirado) {
    try {
      await syncBalneabilidade()
      ultimaSincronizacaoPorBairro[id] = new Date()
    } catch (err) {
      console.error(`[balneabilidade/${id}] Erro na sincronização:`, err)
      // Continua e retorna dados cacheados
    }
  }

  // ── Busca dados ────────────────────────────────────────────────────────────
  try {
    const incluirHistorico = historico === 'true'

    if (incluirHistorico) {
      const { data: registros, error } = await supabase
        .from('balneabilidade_registros')
        .select(`
          id,
          condicao,
          data_coleta,
          data_hora_coleta,
          ecoli_valor,
          vento,
          mare,
          fonte,
          sincronizado_em,
          balneabilidade_pontos ( id, nome_ima )
        `)
        .eq('bairro_id', id)
        .order('sincronizado_em', { ascending: false })
        .limit(Number(limit))

      if (error) throw error

      return res.status(200).json({
        bairro_id: bairro.id,
        bairro_nome: bairro.name,
        historico: registros ?? [],
        total: registros?.length ?? 0,
      })
    }

    // Retorna apenas o status atual (um registro por ponto)
    const { data: pontos } = await supabase
      .from('balneabilidade_pontos')
      .select('id, nome_ima, numero_ponto, descricao')
      .eq('bairro_id', id)
      .eq('ativo', true)
      .order('nome_ima')
      .order('numero_ponto')

    const pontosComStatus = await Promise.all(
      (pontos ?? []).map(async (ponto) => {
        const { data: reg } = await supabase
          .from('balneabilidade_registros')
          .select('id, condicao, data_coleta, data_hora_coleta, ecoli_valor, vento, mare, sincronizado_em')
          .eq('ponto_id', ponto.id)
          .order('sincronizado_em', { ascending: false })
          .limit(1)
          .single()

        return {
          ponto_id:     ponto.id,
          nome_ima:     ponto.nome_ima,
          numero_ponto: ponto.numero_ponto,
          descricao:    ponto.descricao,
          condicao:     reg?.condicao ?? 'sem_dados',
          data_coleta:  reg?.data_coleta ?? null,
          ecoli_valor:  reg?.ecoli_valor ?? null,
          sincronizado_em: reg?.sincronizado_em ?? null,
        }
      })
    )

    // Condição geral: pior caso
    const condicaoGeral = consolidarCondicao(pontosComStatus.map((p) => p.condicao))
    const ultimaAtualizacao = pontosComStatus
      .map((p) => p.sincronizado_em)
      .filter(Boolean)
      .sort()
      .reverse()[0] ?? null

    return res.status(200).json({
      bairro_id:        bairro.id,
      bairro_nome:      bairro.name,
      condicao_geral:   condicaoGeral,
      ultima_atualizacao: ultimaAtualizacao,
      pontos:           pontosComStatus,
      total_pontos:     pontosComStatus.length,
      cache: {
        expirou: forceRefresh || cacheExpirado,
        proxima_atualizacao: ultimaSincronizacaoPorBairro[id]
          ? new Date(ultimaSincronizacaoPorBairro[id].getTime() + CACHE_TTL_MS).toISOString()
          : null,
      },
    })
  } catch (err) {
    console.error(`[balneabilidade/${id}] Erro:`, err)
    return res.status(500).json({ error: 'Erro ao consultar dados de balneabilidade' })
  }
}

function consolidarCondicao(condicoes: string[]): string {
  if (condicoes.every((c) => c === 'sem_dados')) return 'sem_dados'
  if (condicoes.includes('impropria'))    return 'impropria'
  if (condicoes.includes('indeterminada')) return 'indeterminada'
  return 'propria'
}
