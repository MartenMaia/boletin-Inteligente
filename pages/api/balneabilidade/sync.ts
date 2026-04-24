/**
 * POST /api/balneabilidade/sync
 *
 * Força a sincronização dos dados de balneabilidade com o IMA-SC.
 * Busca dados, filtra pelos bairros cadastrados e persiste no banco.
 *
 * Uso interno (cron) e manual (admin).
 * Protegido por CRON_SECRET quando chamado via cron.
 */

import type { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'
import {
  buscarDadosIMA,
  filtrarPontosPorBairro,
  type PontoIMA,
} from '../../../lib/ima-scraper'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? '',
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ''
)

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' })
  }

  // Proteção por secret (opcional — para chamadas via cron)
  const authHeader = req.headers.authorization
  const cronSecret = process.env.CRON_SECRET
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return res.status(401).json({ error: 'Não autorizado' })
  }

  try {
    const resultado = await syncBalneabilidade()
    return res.status(200).json(resultado)
  } catch (err) {
    console.error('[sync] Erro fatal:', err)
    return res.status(500).json({
      error: 'Erro interno durante sincronização',
      detalhes: err instanceof Error ? err.message : String(err),
    })
  }
}

// ─── Função exportada (usada também pelo index.ts via cache) ──────────────────

export async function syncBalneabilidade() {
  // Registra início
  const { data: logEntry } = await supabase
    .from('balneabilidade_sync_log')
    .insert({ status: 'em_andamento', metodo: 'html' })
    .select('id')
    .single()

  const logId = logEntry?.id

  try {
    // 1. Busca dados do IMA
    const { pontos: todosPontos, metodo, erro, totalEncontrados } = await buscarDadosIMA()

    if (erro || todosPontos.length === 0) {
      await atualizarLog(logId, 'erro', 0, erro ?? 'Nenhum ponto retornado pelo IMA')
      return { sucesso: false, erro, totalIMA: 0, totalSalvos: 0, metodo }
    }

    // 2. Carrega bairros e pontos cadastrados no banco
    const { data: bairros } = await supabase.from('bairros').select('id, name')
    const { data: pontosCadastrados } = await supabase
      .from('balneabilidade_pontos')
      .select('id, nome_ima, bairro_id')
      .eq('ativo', true)

    if (!bairros || !pontosCadastrados) {
      throw new Error('Não foi possível carregar bairros/pontos do banco')
    }

    // 3. Para cada bairro, filtra pontos e persiste registros
    let totalSalvos = 0
    const detalhes: Array<{ bairro: string; pontosEncontrados: number; pontosSalvos: number }> = []

    for (const bairro of bairros) {
      const pontosFiltrados = filtrarPontosPorBairro(todosPontos, bairro.name)

      if (pontosFiltrados.length === 0) {
        detalhes.push({ bairro: bairro.name, pontosEncontrados: 0, pontosSalvos: 0 })
        continue
      }

      // Upsert de pontos desconhecidos
      await upsertPontosNovos(pontosFiltrados, bairro.id, pontosCadastrados)

      // Reload pontos após possíveis upserts
      const { data: pontosAtualizados } = await supabase
        .from('balneabilidade_pontos')
        .select('id, nome_ima, bairro_id')
        .eq('bairro_id', bairro.id)
        .eq('ativo', true)

      // Insere registros de balneabilidade
      let pontosSalvos = 0
      for (const ponto of pontosFiltrados) {
        const pontoCadastrado = (pontosAtualizados ?? []).find(
          (pc) => pc.nome_ima.toLowerCase() === ponto.nomeIma.toLowerCase()
        )
        if (!pontoCadastrado) continue

        const { error: insErr } = await supabase.from('balneabilidade_registros').insert({
          ponto_id:          pontoCadastrado.id,
          bairro_id:         bairro.id,
          condicao:          ponto.condicao,
          data_coleta:       ponto.dataColeta,
          data_hora_coleta:  ponto.dataHoraColeta,
          ecoli_valor:       ponto.ecoliValor,
          vento:             ponto.vento,
          mare:              ponto.mare,
          fonte:             'ima_sc',
          raw_data:          ponto.rawData,
          sincronizado_em:   new Date().toISOString(),
        })

        if (!insErr) pontosSalvos++
      }

      totalSalvos += pontosSalvos
      detalhes.push({ bairro: bairro.name, pontosEncontrados: pontosFiltrados.length, pontosSalvos })
    }

    await atualizarLog(logId, 'sucesso', totalSalvos, null, 'html')

    return {
      sucesso: true,
      metodo,
      totalIMA: totalEncontrados,
      totalSalvos,
      detalhes,
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    await atualizarLog(logId, 'erro', 0, msg)
    throw err
  }
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Faz upsert de pontos que ainda não estão cadastrados no banco */
async function upsertPontosNovos(
  pontos: PontoIMA[],
  bairroId: string,
  pontosCadastrados: Array<{ nome_ima: string }>
) {
  const nomesCadastrados = new Set(pontosCadastrados.map((p) => p.nome_ima.toLowerCase()))
  const novos = pontos.filter((p) => !nomesCadastrados.has(p.nomeIma.toLowerCase()))

  if (novos.length === 0) return

  await supabase.from('balneabilidade_pontos').upsert(
    novos.map((p) => ({
      bairro_id:  bairroId,
      nome_ima:   p.nomeIma,
      municipio:  p.municipio || 'Florianópolis',
      ativo:      true,
    })),
    { onConflict: 'nome_ima', ignoreDuplicates: true }
  )
}

async function atualizarLog(
  id: string | undefined,
  status: 'sucesso' | 'erro',
  pontosAtualizados: number,
  erroMensagem: string | null,
  metodo: 'json' | 'html' | 'pdf' = 'html'
) {
  if (!id) return
  await supabase
    .from('balneabilidade_sync_log')
    .update({ status, pontos_atualizados: pontosAtualizados, erro_mensagem: erroMensagem, finalizado_em: new Date().toISOString(), metodo })
    .eq('id', id)
}
