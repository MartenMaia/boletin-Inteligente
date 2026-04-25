/**
 * GET /api/balneabilidade/resumo
 *
 * Lê dados já sincronizados. NÃO faz sync automático.
 *
 * Regras de consolidação:
 *  - Status de uma data: 60%+ dos pontos impróprios naquele dia → imprópria
 *  - Status geral do bairro: 3+ das últimas 5 datas impróprias → imprópria
 */

import type { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key'
)

/** Consolida status de UMA data de coleta (60% impróprios → imprópria) */
function consolidarDia(condicoes: string[]): string {
  if (!condicoes.length) return 'sem_dados'
  const total = condicoes.length
  const improprias = condicoes.filter(c => c === 'impropria').length
  const indeterminadas = condicoes.filter(c => c === 'indeterminada').length
  if (improprias / total >= 0.6) return 'impropria'
  if (indeterminadas > 0) return 'indeterminada'
  return 'propria'
}

/** Consolida status geral do bairro (3+ das últimas 5 datas impróprias → imprópria) */
function consolidarGeral(statusDatas: string[]): string {
  if (!statusDatas.length) return 'sem_dados'
  const improprias = statusDatas.filter(s => s === 'impropria').length
  if (improprias >= 3) return 'impropria'
  if (statusDatas[0] === 'impropria' || statusDatas[0] === 'indeterminada') return statusDatas[0]
  if (statusDatas.every(s => s === 'propria')) return 'propria'
  return 'indeterminada'
}

/** Consolida status de um ponto individual ao longo de coletas */
function consolidarPonto(condicoes: string[]): string {
  if (!condicoes.length) return 'sem_dados'
  if (condicoes.includes('impropria')) return 'impropria'
  if (condicoes.includes('indeterminada')) return 'indeterminada'
  return 'propria'
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Método não permitido' })

  try {
    // 1. Busca todos os pontos ativos com bairro
    const { data: pontos, error: errPontos } = await supabase
      .from('balneabilidade_pontos')
      .select('id, nome_ima, descricao, numero_ponto, municipio, bairro_id, bairros(id, name)')
      .eq('ativo', true)
      .order('numero_ponto')

    if (errPontos) {
      console.error('[resumo] Erro ao buscar pontos:', errPontos)
      return res.status(500).json({ error: errPontos.message })
    }

    if (!pontos || pontos.length === 0) {
      return res.status(200).json({ bairros: [], total: 0, ultima_sincronizacao: null })
    }

    // 2. Últimas 5 coletas de cada ponto em paralelo
    const registrosPorPonto: Record<string, any[]> = Object.fromEntries(
      await Promise.all(
        pontos.map(async (ponto) => {
          const { data } = await supabase
            .from('balneabilidade_registros')
            .select('ponto_id, condicao, data_coleta, data_hora_coleta, sincronizado_em')
            .eq('ponto_id', ponto.id)
            .order('data_coleta', { ascending: false })
            .order('sincronizado_em', { ascending: false })
            .limit(5)
          return [ponto.id, data ?? []] as [string, any[]]
        })
      )
    )

    // 3. Última sincronização bem-sucedida
    const { data: ultimoLog } = await supabase
      .from('balneabilidade_sync_log')
      .select('finalizado_em')
      .eq('status', 'sucesso')
      .order('finalizado_em', { ascending: false })
      .limit(1)
      .maybeSingle()

    // 4. Agrupa pontos por bairro_id
    const bairrosMap: Record<string, {
      bairro_id: string
      bairro_nome: string
      cidade: string
      pontos: any[]
      coletasPorData: Record<string, string[]> // data → condicoes dos pontos naquele dia
    }> = {}

    for (const ponto of pontos) {
      const bairro = ponto.bairros as any
      const bairroNome = Array.isArray(bairro) ? bairro[0]?.name : bairro?.name ?? ponto.nome_ima
      const cidade = ponto.municipio ?? 'Florianópolis'

      if (!bairrosMap[ponto.bairro_id]) {
        bairrosMap[ponto.bairro_id] = {
          bairro_id: ponto.bairro_id,
          bairro_nome: bairroNome,
          cidade,
          pontos: [],
          coletasPorData: {},
        }
      }

      const registros = registrosPorPonto[ponto.id] ?? []
      const ultimo = registros[0] ?? null

      // Últimas 5 coletas do ponto (dots individuais do ponto)
      const ultimas5Ponto = registros.map((r: any) => ({
        data: r.data_coleta,
        status: r.condicao ?? 'sem_dados',
      }))

      bairrosMap[ponto.bairro_id].pontos.push({
        ponto_id: ponto.id,
        nome: ponto.nome_ima,
        descricao: ponto.descricao ?? null,
        numero_ponto: ponto.numero_ponto ?? null,
        status_atual: ultimo?.condicao ?? 'sem_dados',
        data_ultima_coleta: ultimo?.data_coleta ?? null,
        data_hora_coleta: ultimo?.data_hora_coleta ?? null,
        ultimas_coletas: ultimas5Ponto,
      })

      // Acumula condições por data para consolidar o bairro
      for (const reg of registros) {
        if (!reg.data_coleta) continue
        const d = bairrosMap[ponto.bairro_id].coletasPorData
        if (!d[reg.data_coleta]) d[reg.data_coleta] = []
        d[reg.data_coleta].push(reg.condicao)
      }
    }

    // 5. Monta resposta final por bairro
    const bairros = Object.values(bairrosMap).map(b => {
      // Últimas 5 datas com status consolidado (regra 60%)
      const ultimas5 = Object.entries(b.coletasPorData)
        .sort(([a], [c]) => c.localeCompare(a))
        .slice(0, 5)
        .map(([data, condicoes]) => ({
          data,
          status: consolidarDia(condicoes),
        }))

      // Status geral (regra 3/5)
      const statusGeral = consolidarGeral(ultimas5.map(u => u.status))

      return {
        bairro_id: b.bairro_id,
        bairro_nome: b.bairro_nome,
        cidade: b.cidade,
        status_atual: statusGeral,
        ultimas_coletas: ultimas5,
        pontos: b.pontos,
        total_pontos: b.pontos.length,
      }
    }).sort((a, b) => a.bairro_nome.localeCompare(b.bairro_nome))

    return res.status(200).json({
      bairros,
      total: bairros.length,
      ultima_sincronizacao: ultimoLog?.finalizado_em ?? null,
    })

  } catch (err: any) {
    console.error('[resumo] Erro inesperado:', err)
    return res.status(500).json({ error: err.message || 'Erro interno' })
  }
}
