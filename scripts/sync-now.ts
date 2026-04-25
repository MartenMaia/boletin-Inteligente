/**
 * Sincronização manual com o IMA-SC.
 * Raspa a tabela HTML e salva os registros no Supabase.
 *
 * Execute da raiz do projeto:
 *   npx tsx scripts/sync-now.ts
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { resolve } from 'path'
import { buscarDadosIMA, filtrarPontosPorBairro, type PontoIMA } from '../lib/ima-scraper'

// ── Carrega variáveis do .env.local ──────────────────────────────────────────
function loadEnv() {
  try {
    const envPath = resolve(process.cwd(), '.env.local')
    const lines = readFileSync(envPath, 'utf-8').split('\n')
    for (const line of lines) {
      const [key, ...rest] = line.split('=')
      if (key && rest.length) process.env[key.trim()] = rest.join('=').trim()
    }
  } catch { /* .env.local não encontrado — usa variáveis de ambiente do sistema */ }
}

loadEnv()

const supabaseUrl  = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
const supabaseKey  = process.env.SUPABASE_SERVICE_ROLE_KEY
                  || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
                  || ''

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variáveis NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY são necessárias')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

// ── Helpers ───────────────────────────────────────────────────────────────────

function condLabel(c: string) {
  if (c === 'propria')       return '🟢 PRÓPRIA'
  if (c === 'impropria')     return '🔴 IMPRÓPRIA'
  return '⚪ INDETERMINADA'
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log('\n═══════════════════════════════════════════════════════')
  console.log('  Sync IMA-SC → Supabase')
  console.log('═══════════════════════════════════════════════════════\n')

  // 1. Busca bairros e pontos no banco
  const { data: bairros, error: errB } = await supabase.from('bairros').select('id, name')
  if (errB || !bairros) { console.error('❌ Erro ao carregar bairros:', errB); process.exit(1) }

  const { data: pontosCad, error: errP } = await supabase
    .from('balneabilidade_pontos').select('id, nome_ima, bairro_id').eq('ativo', true)
  if (errP || !pontosCad) { console.error('❌ Erro ao carregar pontos:', errP); process.exit(1) }

  console.log(`📦 Banco: ${bairros.length} bairros, ${pontosCad.length} pontos cadastrados`)

  // 2. Scraping do IMA
  console.log('\n📡 Buscando dados no IMA-SC...')
  const { pontos: todosPontos, totalEncontrados, erro } = await buscarDadosIMA()

  if (erro || totalEncontrados === 0) {
    console.error('❌ Falha no scraping:', erro); process.exit(1)
  }
  console.log(`✅ ${totalEncontrados} pontos extraídos do HTML\n`)

  // 3. Log de início
  const { data: logRow } = await supabase
    .from('balneabilidade_sync_log')
    .insert({ status: 'em_andamento', metodo: 'html' })
    .select('id').single()
  const logId = logRow?.id

  // 4. Para cada bairro: filtra, upsert de pontos novos, insere registros
  let totalSalvos = 0
  const agora = new Date().toISOString()

  for (const bairro of bairros) {
    const pontosFiltrados = filtrarPontosPorBairro(todosPontos, bairro.name)
    if (pontosFiltrados.length === 0) {
      console.log(`⏭  ${bairro.name} — nenhum ponto encontrado no IMA`)
      continue
    }

    // Upsert de cada ponto físico individual por (nome_ima, numero_ponto)
    const upsertData = pontosFiltrados.map(p => ({
      bairro_id:    bairro.id,
      nome_ima:     p.nomeIma,
      numero_ponto: p.numeroPonto ?? 0,
      descricao:    p.descricao ?? null,
      municipio:    'Florianópolis',
      ativo:        true,
    }))

    const { error: upsErr } = await supabase.from('balneabilidade_pontos').upsert(
      upsertData,
      { onConflict: 'nome_ima,numero_ponto', ignoreDuplicates: false }
    )
    if (upsErr) console.warn(`  ⚠️  Upsert pontos:`, upsErr.message)

    // Reload pontos após upsert
    const { data: pontosAtt } = await supabase
      .from('balneabilidade_pontos').select('id, nome_ima, numero_ponto')
      .eq('bairro_id', bairro.id).eq('ativo', true)

    // Insere um registro por ponto físico individual
    let salvos = 0
    for (const pt of pontosFiltrados) {
      const numPonto = pt.numeroPonto ?? 0
      const pontoCad = (pontosAtt ?? []).find(
        p => p.nome_ima.toLowerCase() === pt.nomeIma.toLowerCase() && p.numero_ponto === numPonto
      )
      if (!pontoCad) continue

      const { error: insErr } = await supabase.from('balneabilidade_registros').insert({
        ponto_id:        pontoCad.id,
        bairro_id:       bairro.id,
        condicao:        pt.condicao,
        data_coleta:     pt.dataColeta,
        fonte:           'ima_sc',
        raw_data:        pt.rawData,
        sincronizado_em: agora,
      })
      if (!insErr) salvos++
      else console.warn(`    ⚠️  Erro ao inserir ponto ${pt.nomeIma} #${numPonto}:`, insErr.message)
    }

    totalSalvos += salvos

    // Condição geral do bairro
    const temImpropria = pontosFiltrados.some(p => p.condicao === 'impropria')
    const geral = temImpropria ? 'impropria' : 'propria'
    const data = pontosFiltrados[0]?.dataColeta ?? '?'

    console.log(`✅ ${bairro.name.padEnd(28)} ${condLabel(geral).padEnd(18)} ${data}   (${salvos} medições salvas)`)
  }

  // 5. Finaliza log
  await supabase.from('balneabilidade_sync_log').update({
    status: 'sucesso', pontos_atualizados: totalSalvos, finalizado_em: agora, metodo: 'html'
  }).eq('id', logId)

  console.log(`\n✅ Sincronização concluída: ${totalSalvos} registros salvos no Supabase`)
  console.log('═══════════════════════════════════════════════════════\n')
}

main().catch(err => {
  console.error('\n❌ Erro fatal:', err)
  process.exit(1)
})
