/**
 * Script de diagnóstico do HTML do IMA-SC.
 * Faz o scraping real da tabela e exibe o que encontrou para os 4 bairros.
 *
 *   npx tsx scripts/testar-ima.ts
 */

const BASE_URL = 'https://balneabilidade.ima.sc.gov.br'

function semAcento(s: string) {
  return s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
}

function normalizarCondicao(texto: string): string {
  const t = semAcento(texto)
  if (t.includes('impropria') || t.includes('improp')) return '🔴 IMPRÓPRIA'
  if (t.includes('propria'))                            return '🟢 PRÓPRIA'
  return '⚪ INDETERMINADA'
}

interface LinhaTabela {
  municipio: string
  local: string
  condicao: string
  data: string
  condicaoNorm: string
}

function parseTabela(html: string): LinhaTabela[] {
  const linhas: LinhaTabela[] = []
  const trRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/gi

  let trMatch: RegExpExecArray | null
  while ((trMatch = trRegex.exec(html)) !== null) {
    const rowHtml = trMatch[1]

    const tdLocal    = rowHtml.match(/<td[^>]*class="local"[^>]*>([\s\S]*?)<\/td>/i)
    const tdData     = rowHtml.match(/<td[^>]*class="data"[^>]*>([\s\S]*?)<\/td>/i)
    const tdSituacao = rowHtml.match(/<td[^>]*class="situacao"[^>]*>([\s\S]*?)<\/td>/i)

    if (!tdLocal || !tdData || !tdSituacao) continue

    const nomeCompleto = tdLocal[1].replace(/<br\s*\/?>/gi, ' ').replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim()
    const nomePraia = nomeCompleto.replace(/\s*\(Ponto\s*\d+\).*/i, '').trim()
    const data = tdData[1].replace(/<[^>]+>/g, '').trim()
    const imgSrc = tdSituacao[1].match(/src=['"]([^'"]+)['"]/i)?.[1] ?? ''
    const arquivo = imgSrc.split('/').pop()?.toLowerCase() ?? ''
    const condicaoRaw = arquivo.replace(/\.(png|jpg|gif)$/i, '')
    const condicaoNorm = normalizarCondicao(condicaoRaw)

    if (!nomePraia) continue
    linhas.push({ municipio: '', local: nomePraia, condicao: condicaoRaw, data, condicaoNorm })
  }
  return linhas
}

const BAIRROS_KEYWORDS: Record<string, string[]> = {
  'Canasvieiras':             ['canasvieiras'],
  'Ingleses do Rio Vermelho': ['ingleses'],
  'Jurerê':                   ['jurere'],
  'Jurerê Internacional':     ['jurere internacional'],
}

async function main() {
  console.log('\n═══════════════════════════════════════════════════════')
  console.log('  Diagnóstico HTML IMA-SC — Extração dos 4 bairros')
  console.log('═══════════════════════════════════════════════════════\n')

  console.log('📡 Buscando tabela em /relatorio/relatorioBalneabildade ...')
  const res = await fetch(`${BASE_URL}/relatorio/relatorioBalneabildade`, {
    headers: { 'User-Agent': 'BoletimInteligente/1.0', 'Accept': 'text/html' },
    signal: AbortSignal.timeout(20_000),
  })

  if (!res.ok) { console.error(`❌ HTTP ${res.status}`); process.exit(1) }

  const html = await res.text()
  console.log(`✅ HTML recebido: ${html.length} chars\n`)

  const todas = parseTabela(html)
  console.log(`📊 Total de pontos encontrados na tabela: ${todas.length}\n`)

  // Exibe todos os pontos de Florianópolis para referência
  const floripa = todas.filter(l => semAcento(l.municipio).includes('florianopolis'))
  console.log(`🌊 Pontos de Florianópolis (${floripa.length} total):`)
  console.log('─'.repeat(70))
  floripa.forEach(l => {
    console.log(`  ${l.condicaoNorm.padEnd(20)} | ${l.local.padEnd(35)} | ${l.data}`)
  })

  // Filtra para os 4 bairros do projeto
  console.log('\n\n🎯 RESULTADO PARA OS 4 BAIRROS DO PROJETO:')
  console.log('═'.repeat(70))

  let totalEncontrados = 0
  for (const [bairro, keywords] of Object.entries(BAIRROS_KEYWORDS)) {
    const pontos = todas.filter(l => {
      const nome = semAcento(l.local)
      if (bairro === 'Jurerê') {
        return keywords.some(k => nome.includes(k)) && !nome.includes('internacional')
      }
      return keywords.some(k => nome.includes(k))
    })

    console.log(`\n📍 ${bairro} — ${pontos.length} ponto(s) encontrado(s)`)
    if (pontos.length === 0) {
      console.log('   ⚠️  Nenhum ponto encontrado — verificar keyword de busca')
    } else {
      pontos.forEach(p => {
        console.log(`   ${p.condicaoNorm} | "${p.local}" | Data: ${p.data || '(sem data)'}`)
        console.log(`   Texto original da condição: "${p.condicao}"`)
      })
      totalEncontrados += pontos.length
    }
  }

  console.log('\n' + '═'.repeat(70))
  console.log(`✅ Total de pontos dos 4 bairros: ${totalEncontrados}`)

  // ── Dump bruto: primeiras 20 linhas com TODAS as células
  console.log('\n\n🔍 PRIMEIRAS 20 LINHAS BRUTAS (todas as células):')
  console.log('─'.repeat(80))
  todas.slice(0, 20).forEach((l, i) => {
    console.log(`[${i}] col0="${l.municipio}" | col1="${l.local}" | col2="${l.condicao}" | col3="${l.data}"`)
  })

  // ── Busca por nomes conhecidos em QUALQUER coluna
  console.log('\n\n🔍 LINHAS QUE CONTÊM "canasvieiras" EM QUALQUER COLUNA:')
  console.log('─'.repeat(80))
  const comCanas = todas.filter(l =>
    [l.municipio, l.local, l.condicao, l.data].some(c => semAcento(c).includes('canasvieiras'))
  )
  if (comCanas.length === 0) {
    console.log('  ❌ Nenhuma linha encontrada — palavra pode estar em outra tag HTML')
  } else {
    comCanas.slice(0, 5).forEach((l, i) => {
      console.log(`  [${i}] col0="${l.municipio}" | col1="${l.local}" | col2="${l.condicao}" | col3="${l.data}"`)
    })
  }

  // ── Busca por "jurere" em qualquer coluna
  console.log('\n🔍 LINHAS QUE CONTÊM "jurere" EM QUALQUER COLUNA:')
  console.log('─'.repeat(80))
  const comJurere = todas.filter(l =>
    [l.municipio, l.local, l.condicao, l.data].some(c => semAcento(c).includes('jurere'))
  )
  if (comJurere.length === 0) {
    console.log('  ❌ Nenhuma linha encontrada')
  } else {
    comJurere.slice(0, 5).forEach((l, i) => {
      console.log(`  [${i}] col0="${l.municipio}" | col1="${l.local}" | col2="${l.condicao}" | col3="${l.data}"`)
    })
  }

  // ── HTML BRUTO do td[2] (condição) — para descobrir como a condição é representada
  console.log('\n\n🔍 HTML RAW DO td[2] (COLUNA DE CONDIÇÃO) DAS PRIMEIRAS 10 LINHAS:')
  console.log('─'.repeat(80))
  const trRegexDebug2 = /<tr[^>]*>([\s\S]*?)<\/tr>/gi
  let trCount2 = 0
  let trMatchDebug2: RegExpExecArray | null
  while ((trMatchDebug2 = trRegexDebug2.exec(html)) !== null && trCount2 < 10) {
    const tds = trMatchDebug2[1].match(/<td[^>]*>[\s\S]*?<\/td>/gi) ?? []
    if (tds.length >= 3) {
      // Mostra td[0] resumido e td[2] completo (raw)
      const nome = tds[0].replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim().substring(0, 50)
      const td2raw = tds[2].replace(/\s+/g, ' ').trim()
      console.log(`\n[${trCount2}] LOCAL: "${nome}..."`)
      console.log(`     td[2] RAW: ${td2raw}`)
      trCount2++
    }
  }

  // ── Também busca por "CANASVIEIRAS" no HTML puro (posição exata)
  console.log('\n\n🔍 TRECHO DO HTML EM VOLTA DE "CANASVIEIRAS":')
  console.log('─'.repeat(80))
  const idx = html.indexOf('CANASVIEIRAS')
  if (idx >= 0) {
    // Mostra 300 chars antes e 600 chars depois
    const trecho = html.substring(Math.max(0, idx - 100), idx + 600)
    console.log(trecho)
  } else {
    console.log('  "CANASVIEIRAS" não encontrado no HTML')
  }

  console.log('\n═══════════════════════════════════════════════════════\n')
}

main().catch(console.error)
