/**
 * Testa fontes de dados históricos do IMA-SC.
 * Execute: npx tsx scripts/testar-historico.ts
 */

const BASE = 'https://balneabilidade.ima.sc.gov.br'

async function testar(url: string, label: string) {
  process.stdout.write(`\n📡 ${label}\n   ${url}\n   `)
  try {
    const res = await fetch(url, {
      headers: { 'Accept': 'application/json, text/html, */*', 'User-Agent': 'BoletimInteligente/1.0' },
      signal: AbortSignal.timeout(10_000),
    })
    const ct = res.headers.get('content-type') ?? ''
    process.stdout.write(`HTTP ${res.status} | ${ct.substring(0, 40)}\n`)

    if (res.ok) {
      if (ct.includes('json')) {
        const data = await res.json()
        const arr = Array.isArray(data) ? data : [data]
        console.log(`   ✅ JSON com ${arr.length} item(s)`)
        if (arr.length > 0) console.log('   Primeiros 2:', JSON.stringify(arr.slice(0,2), null, 2).split('\n').map(l => '   ' + l).join('\n'))
      } else if (ct.includes('pdf') || ct.includes('octet')) {
        const buf = await res.arrayBuffer()
        console.log(`   ✅ PDF recebido: ${buf.byteLength} bytes`)
        // Mostra primeiros bytes (deve começar com %PDF)
        const header = new TextDecoder().decode(new Uint8Array(buf).slice(0, 20))
        console.log(`   Header: "${header.replace(/\n/g, '\\n')}"`)
      } else {
        const text = await res.text()
        const has404 = text.includes('404') || text.includes('não encontrado')
        console.log(`   ${has404 ? '❌ Página de erro' : '✅ HTML'} (${text.length} chars)`)
      }
    } else {
      console.log(`   ❌ HTTP ${res.status}`)
    }
  } catch (err: unknown) {
    console.log(`   ❌ ${err instanceof Error ? err.message : String(err)}`)
  }
}

async function main() {
  console.log('\n═══════════════════════════════════════════════════════')
  console.log('  Teste de Fontes Históricas IMA-SC')
  console.log('═══════════════════════════════════════════════════════')

  const ano = 2026
  const idCanasvieiras = 68

  // ── 1. Variações do endpoint de coleta histórica
  console.log('\n\n--- 1. ENDPOINTS DE HISTÓRICO POR BALNEÁRIO ---')
  await testar(`${BASE}/coleta/listar?idBalneario=${idCanasvieiras}&ano=${ano}`,          'coleta/listar (ano)')
  await testar(`${BASE}/coleta/listar/${idCanasvieiras}/${ano}`,                           'coleta/listar (path)')
  await testar(`${BASE}/registro/listar?idBalneario=${idCanasvieiras}&ano=${ano}`,         'registro/listar')
  await testar(`${BASE}/historico/listar?idBalneario=${idCanasvieiras}`,                   'historico/listar')
  await testar(`${BASE}/balneabilidade/historico?idBalneario=${idCanasvieiras}`,           'balneabilidade/historico')
  await testar(`${BASE}/balneabilidade/listar?idBalneario=${idCanasvieiras}&ano=${ano}`,   'balneabilidade/listar (ano)')
  await testar(`${BASE}/anosAnalisados`,                                                    'anosAnalisados')
  await testar(`${BASE}/registro/anosAnalisados`,                                           'registro/anosAnalisados')

  // ── 2. PDFs de relatórios semanais passados
  // Temporada out-mar: semanal. Últimas datas prováveis de Florianópolis
  const datas = [
    '2026-03-30', // atual
    '2026-03-24',
    '2026-03-17',
    '2026-03-10',
    '2026-03-03',
    '2026-02-24',
  ]
  console.log('\n\n--- 2. PDFs POR DATA (/relatorio/downloadPDF/{data}) ---')
  for (const d of datas) {
    await testar(`${BASE}/relatorio/downloadPDF/${d}`, `PDF ${d}`)
  }

  // ── 3. PDF sem data (mais recente)
  console.log('\n\n--- 3. OUTROS FORMATOS ---')
  await testar(`${BASE}/relatorio/pdf`,          'PDF mais recente')
  await testar(`${BASE}/relatorio/csv`,          'CSV')
  await testar(`${BASE}/relatorio/json`,         'JSON geral')
  await testar(`${BASE}/api/pontos`,             'api/pontos')
  await testar(`${BASE}/api/balneabilidade`,     'api/balneabilidade')

  console.log('\n\n═══════════════════════════════════════════════════════\n')
}

main().catch(console.error)
