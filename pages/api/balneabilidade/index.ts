/**
 * GET  /api/balneabilidade
 *   ?bairro_id=<uuid>        — filtra por bairro específico
 *   ?bairro=<nome>           — filtra por nome do bairro (parcial, case-insensitive)
 *   ?refresh=true            — força sincronização com IMA antes de retornar
 *   ?historico=true          — retorna todos os registros (não só o mais recente)
 *
 * Retorna o status mais recente de balneabilidade de cada bairro monitorado.
 */

import type { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'
import { syncBalneabilidade } from './sync'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
)

// Cache simples em memória: evita hammering no IMA (TTL = 30 min)
let ultimaSincronizacao: Date | null = null
const CACHE_TTL_MS = 30 * 60 * 1000

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método não permitido' })
  }

  const { bairro_id, bairro, refresh, historico } = req.query
  const forceRefresh = refresh === 'true'
  const incluirHistorico = historico === 'true'

  // ── Sincronização automática ou forçada ──────────────────────────────────
  const cacheExpirado = !ultimaSincronizacao || Date.now() - ultimaSincronizacao.getTime() > CACHE_TTL_MS
  if (forceRefresh || cacheExpirado) {
    try {
      await syncBalneabilidade()
      ultimaSincronizacao = new Date()
    } catch (err) {
      // Não falha a requisição — retorna dados cacheados do banco
      console.error('[balneabilidade] Erro na sincronização:', err)
    }
  }

  // ── Busca no banco ───────────────────────────────────────────────────────
  try {
    if (incluirHistorico) {
      return await retornarHistorico(req, res, bairro_id as string, bairro as string)
    }
    return await retornarUltimoStatus(res, bairro_id as string, bairro as string)
  } catch (err) {
    console.error('[balneabilidade] Erro na consulta:', err)
    return res.status(500).json({ error: 'Erro interno ao consultar dados de balneabilidade' })
  }
}

/** Retorna o registro mais recente de cada ponto, agrupado por bairro */
async function retornarUltimoStatus(
  res: NextApiResponse,
  bairroId?: string,
  bairroNome?: string
) {
  // Busca os bairros cadastrados
  let query = supabase
    .from('bairros')
    .select('id, name')
    .order('name')

  if (bairroId) {
    query = query.eq('id', bairroId)
  } else if (bairroNome) {
    query = query.ilike('name', `%${bairroNome}%`)
  }

  const { data: bairros, error: errBairros } = await query
  if (errBairros) throw errBairros
  if (!bairros || bairros.length === 0) {
    return res.status(200).json({ bairros: [], total: 0 })
  }

  // Para cada bairro, busca o registro mais recente de cada ponto
  const resultado = await Promise.all(
    bairros.map(async (b) => {
      // Pontos de coleta deste bairro
      const { data: pontos } = await supabase
        .from('balneabilidade_pontos')
        .select('id, nome_ima, id_ima, id_balneario')
        .eq('bairro_id', b.id)
        .eq('ativo', true)

      // Último registro de cada ponto
      const registrosPorPonto = await Promise.all(
        (pontos ?? []).map(async (ponto) => {
          const { data: reg } = await supabase
            .from('balneabilidade_registros')
            .select('id, condicao, data_coleta, data_hora_coleta, ecoli_valor, vento, mare, sincronizado_em')
            .eq('ponto_id', ponto.id)
            .order('sincronizado_em', { ascending: false })
            .limit(1)
            .single()

          return {
            ponto_id: ponto.id,
            nome_ima: ponto.nome_ima,
            registro: reg ?? null,
          }
        })
      )

      // Consolida condição geral do bairro (pior caso entre os pontos)
      const registrosComDado = registrosPorPonto.filter((r) => r.registro)
      const condicaoGeral = consolidarCondicao(registrosComDado.map((r) => r.registro!.condicao))
      const ultimaAtualizacao = registrosComDado
        .map((r) => r.registro!.sincronizado_em)
        .sort()
        .reverse()[0] ?? null

      return {
        bairro_id: b.id,
        bairro_nome: b.name,
        condicao_geral: condicaoGeral,
        ultima_atualizacao: ultimaAtualizacao,
        pontos: registrosPorPonto,
        total_pontos: pontos?.length ?? 0,
        pontos_com_dados: registrosComDado.length,
      }
    })
  )

  return res.status(200).json({
    bairros: resultado,
    total: resultado.length,
    sincronizacao: {
      ultima_vez: ultimaSincronizacao,
      cache_expira_em: ultimaSincronizacao
        ? new Date(ultimaSincronizacao.getTime() + CACHE_TTL_MS)
        : null,
    },
  })
}

/** Retorna histórico completo de registros */
async function retornarHistorico(
  req: NextApiRequest,
  res: NextApiResponse,
  bairroId?: string,
  bairroNome?: string
) {
  const { limit = '30', offset = '0' } = req.query

  let query = supabase
    .from('balneabilidade_registros')
    .select(`
      id,
      condicao,
      data_coleta,
      data_hora_coleta,
      ecoli_valor,
      vento,
      mare,
      sincronizado_em,
      balneabilidade_pontos!inner (
        id,
        nome_ima,
        bairros!inner ( id, name )
      )
    `)
    .order('sincronizado_em', { ascending: false })
    .limit(Number(limit))
    .range(Number(offset), Number(offset) + Number(limit) - 1)

  if (bairroId) {
    query = query.eq('bairro_id', bairroId)
  } else if (bairroNome) {
    // Filtra via join — bairros com nome similar
    query = query.ilike('balneabilidade_pontos.bairros.name', `%${bairroNome}%`)
  }

  const { data, error, count } = await query
  if (error) throw error

  return res.status(200).json({
    registros: data ?? [],
    total: count ?? 0,
    pagina: { limit: Number(limit), offset: Number(offset) },
  })
}

/** Pior condição vence: imprópria > indeterminada > própria */
function consolidarCondicao(condicoes: string[]): string {
  if (condicoes.length === 0) return 'sem_dados'
  if (condicoes.includes('impropria')) return 'impropria'
  if (condicoes.includes('indeterminada')) return 'indeterminada'
  return 'propria'
}
