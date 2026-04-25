/**
 * Relatório detalhado dos pontos de coleta do IMA-SC para os 4 bairros.
 *
 *   npx tsx scripts/testar-ima.ts
 */

const BASE_URL = 'https://balneabilidade.ima.sc.gov.br'

function semAcento(s: string) {
  return s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
}

function iconeCondicao(c: string): string {
  if (c === 'propria')   return '🟢 PRÓPRIA    '
  if (c === 'impropria') return '🔴 IMPRÓPRIA  '
  return                        '⚪ INDET.     '
}

interface Ponto {
  nomePraia:   string
  numeroPonto: number | null
  descricao:   string
  condicao:    string
  data:        string
}

function parseTabela(html: string): Ponto[] {
  const pontos: Ponto[] = []
  const trRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/gi

  let trMatch: RegExpExecArray | null
  while ((trMatch = trRegex.exec(html)) !== null) {
    const row = trMatch[1]

    const tdLocal    = row.match(/<td[^>]*class="local"[^>]*>([\s\S]*?)<\/td>/i)
    const tdData     = row.match(/<td[^>]*class="data"[^>]*>([\s\S]*?)<\/td>/i)
    const tdSituacao = row.match(/<td[^>]*class="situacao"[^>]*>([\s\S]*?)<\/td>/i)
    if (!tdLocal || !tdData || !tdSituacao) continue

    // Divide pelo <br>: parte superior = nome+ponto, inferior = descrição
    const partes    = tdLocal[1].split(/<br\s*\/?>/i)
    const nomeParte = partes[0].replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim()
    const descParte = (partes[1] ?? '').replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim()

    const nomePraia = nomeParte.replace(/\s*\(Ponto\s*\d+\).*/i, '').trim()
    const numMatch  = nomeParte.match(/Ponto\s*(\d+)/i)
    const numPonto  = numMatch ? Number(numMatch[1]) : null

    const data   = tdData[1].replace(/<[^>]+>/g, '').trim()
    const imgSrc = tdSituacao[1].match(/src=['"]([^'"]+)['"]/i)?.[1] ?? ''
    const arquivo = imgSrc.split('/').pop()?.toLowerCase().replace(/\.(png|jpg|gif)$/i, '') ?? ''

    if (!nomePraia) continue
    pontos.push({ nomePraia, numeroPonto: numPonto, descricao: descParte, condicao: arquivo, data })
  }
  return pontos
}

const BAIRROS: Record<string, string[]> = {
  'Canasvieiras':             ['canasvieiras'],
  'Ingleses do Rio Vermelho': ['ingleses'],
  'Jurerê':                   ['jurere'],
  'Jurerê Internacional':     ['jurere internacional'],
}

async function main() {
  console.log('\n╔══════════════════════════════════════════════════════════════════════════╗')
  console.log('║        Pontos de Coleta IMA-SC — Florianópolis Norte                    ║')
  console.log('╚══════════════════════════════════════════════════════════════════════════╝\n')

  process.stdout.write('📡 Buscando dados no IMA-SC... ')
  const res = await fetch(`${BASE_URL}/relatorio/relatorioBalneabildade`, {
    headers: { 'User-Agent': 'BoletimInteligente/1.0', 'Accept': 'text/html' },
    signal: AbortSignal.timeout(20_000),
  })
  if (!res.ok) { console.error(`\n❌ HTTP ${res.status}`); process.exit(1) }

  const html  = await res.text()
  const todos = parseTabela(html)
  console.log(`✅  ${todos.length} pontos em SC`)

  // Resumo SC
  const prop = todos.filter(p => p.condicao === 'propria').length
  const imp  = todos.filter(p => p.condicao === 'impropria').length
  const ind  = todos.length - prop - imp
  console.log(`    Estado SC: 🟢 ${prop} próprias  🔴 ${imp} impróprias  ⚪ ${ind} indet.\n`)

  // Detalhes por bairro
  let totalGeral = 0

  for (const [bairro, keywords] of Object.entries(BAIRROS)) {
    const pontos = todos.filter(p => {
      const n = semAcento(p.nomePraia)
      if (bairro === 'Jurerê') return keywords.some(k => n.includes(k)) && !n.includes('internacional')
      return keywords.some(k => n.includes(k))
    })

    const nProp = pontos.filter(p => p.condicao === 'propria').length
    const nImp  = pontos.filter(p => p.condicao === 'impropria').length
    const nInd  = pontos.length - nProp - nImp
    const data  = pontos[0]?.data ?? '—'

    console.log(`┌─ 📍 ${bairro}`)
    console.log(`│  ${pontos.length} ponto(s)  •  Coleta: ${data}  •  🟢 ${nProp}  🔴 ${nImp}  ⚪ ${nInd}`)
    console.log('│')

    if (pontos.length === 0) {
      console.log('│  ⚠️  Nenhum ponto encontrado\n└')
    } else {
      pontos.forEach((p, i) => {
        const isLast  = i === pontos.length - 1
        const prefix  = isLast ? '└──' : '├──'
        const num     = p.numeroPonto != null ? `Ponto ${String(p.numeroPonto).padStart(2, '0')}` : 'Ponto ??'
        const cond    = iconeCondicao(p.condicao)
        const desc    = p.descricao || '(sem descrição)'
        console.log(`│  ${prefix} ${num}  ${cond}  ${desc}`)
      })
      totalGeral += pontos.length
    }
    console.log('')
  }

  console.log('═'.repeat(78))
  console.log(`✅ Total de pontos monitorados nos 4 bairros: ${totalGeral}`)
  console.log('═'.repeat(78) + '\n')
}

main().catch(console.error)
