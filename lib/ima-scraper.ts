/**
 * IMA-SC Balneabilidade Scraper
 *
 * Único método disponível: HTML scraping de
 *   GET /relatorio/relatorioBalneabildade
 *
 * Os endpoints JSON (/balneabilidade/listar, /ponto/listar, /municipio/listar)
 * retornam HTTP 404 — confirmado em testes de 20/04/2026.
 *
 * ATENÇÃO: URL usa o typo "Balneabildade" (falta "i") — NÃO corrigir.
 *
 * Stack do IMA: Spring Boot + Thymeleaf (Java).
 * Tabela SSR com ~260 pontos, colunas: MUNICÍPIO | LOCAL | CONDIÇÃO | DATA
 */

const BASE_URL = 'https://balneabilidade.ima.sc.gov.br'
const TIMEOUT_MS = 20_000

// ─── Tipos ────────────────────────────────────────────────────────────────────

export type CondicaoIMA = 'propria' | 'impropria' | 'indeterminada'

export interface PontoIMA {
  nomeIma: string           // Nome exato do LOCAL na tabela do IMA
  municipio: string
  condicao: CondicaoIMA
  dataColeta: string | null  // yyyy-MM-dd
  dataHoraColeta: string | null
  ecoliValor: number | null  // Não disponível no HTML; pode ser adicionado manualmente
  vento: string | null
  mare: string | null
  idBalneario: number | null
  rawData: Record<string, unknown>
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function semAcento(s: string): string {
  return s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
}

function normalizarCondicao(texto: string): CondicaoIMA {
  const t = semAcento(texto)
  if (t.includes('impropria') || t.includes('improp')) return 'impropria'
  if (t.includes('propria'))                            return 'propria'
  return 'indeterminada'
}

function normalizarData(data: string): string | null {
  // dd/mm/yyyy → yyyy-mm-dd
  const br = data.match(/^(\d{2})\/(\d{2})\/(\d{4})/)
  if (br) return `${br[3]}-${br[2]}-${br[1]}`
  // já está em yyyy-mm-dd
  if (/^\d{4}-\d{2}-\d{2}/.test(data)) return data.substring(0, 10)
  return null
}

// ─── Fetch do HTML ────────────────────────────────────────────────────────────

async function fetchHtmlRelatorio(): Promise<string | null> {
  try {
    const ctrl = new AbortController()
    const t = setTimeout(() => ctrl.abort(), TIMEOUT_MS)
    const res = await fetch(`${BASE_URL}/relatorio/relatorioBalneabildade`, {
      signal: ctrl.signal,
      headers: {
        'Accept': 'text/html,*/*',
        'User-Agent': 'BoletimInteligente/1.0 (contato: martennmaia@gmail.com)',
      },
    })
    clearTimeout(t)
    if (!res.ok) return null
    return await res.text()
  } catch {
    return null
  }
}

// ─── Parser da tabela HTML ────────────────────────────────────────────────────

/**
 * Estrutura real confirmada via diagnóstico (20/04/2026):
 *
 * <tr>
 *   <td class="local"><b>PRAIA DE CANASVIEIRAS</b> (Ponto 20)<br>Descrição...</td>
 *   <td class="data">30/03/2026</td>
 *   <td class="situacao"><img src='.../propria.PNG'/></td>
 * </tr>
 *
 * Condição é o filename do <img src>: propria.PNG | impropria.png | indeterminada*.png
 */
export function parseHtmlTabela(html: string): PontoIMA[] {
  const pontos: PontoIMA[] = []
  const trRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/gi

  let trMatch: RegExpExecArray | null
  while ((trMatch = trRegex.exec(html)) !== null) {
    const rowHtml = trMatch[1]

    // Extrai os 3 <td> por classe
    const tdLocal     = rowHtml.match(/<td[^>]*class="local"[^>]*>([\s\S]*?)<\/td>/i)
    const tdData      = rowHtml.match(/<td[^>]*class="data"[^>]*>([\s\S]*?)<\/td>/i)
    const tdSituacao  = rowHtml.match(/<td[^>]*class="situacao"[^>]*>([\s\S]*?)<\/td>/i)

    if (!tdLocal || !tdData || !tdSituacao) continue

    // Nome completo: "PRAIA DE CANASVIEIRAS (Ponto 20) | Em frente à Rua das Flôres"
    const nomeCompleto = tdLocal[1]
      .replace(/<br\s*\/?>/gi, ' | ')
      .replace(/<[^>]+>/g, '')
      .replace(/\s+/g, ' ')
      .trim()

    // Nome da praia apenas (sem ponto e sem descrição) — chave de match no DB
    const nomePraia = nomeCompleto
      .replace(/\s*\(Ponto\s*\d+\).*/i, '')
      .replace(/\s*\|.*$/, '')
      .trim()

    // Número do ponto individual (ex: 20 de "Ponto 20")
    const numPontoMatch = nomeCompleto.match(/Ponto\s*(\d+)/i)
    const numeroPonto = numPontoMatch ? Number(numPontoMatch[1]) : null

    // Descrição da localização (após o <br>)
    const descricao = nomeCompleto.includes('|')
      ? nomeCompleto.split('|').slice(1).join('|').trim()
      : null

    // Data: dd/mm/yyyy
    const dataTx = tdData[1].replace(/<[^>]+>/g, '').trim()

    // Condição: extrai do src do <img>
    const imgSrc = tdSituacao[1].match(/src=['"]([^'"]+)['"]/i)?.[1] ?? ''
    const condicao = normalizarCondicaoImagem(imgSrc)

    if (!nomePraia) continue

    pontos.push({
      nomeIma:        nomePraia,
      municipio:      '',
      condicao,
      dataColeta:     dataTx ? normalizarData(dataTx) : null,
      dataHoraColeta: null,
      ecoliValor:     null,
      vento:          null,
      mare:           null,
      idBalneario:    null,
      rawData:        { nomeCompleto, nomePraia, numeroPonto, descricao, data: dataTx, imgSrc, condicao },
    })
  }

  return pontos
}

/**
 * Determina a condição pelo filename da imagem:
 *   propria.PNG      → propria
 *   impropria.png    → impropria
 *   indeterminada*   → indeterminada
 */
function normalizarCondicaoImagem(src: string): CondicaoIMA {
  const arquivo = semAcento(src.split('/').pop()?.toLowerCase() ?? '')
  if (arquivo.startsWith('impropria'))    return 'impropria'
  if (arquivo.startsWith('propria'))      return 'propria'
  return 'indeterminada'
}

// ─── Mapeamento bairro → keywords ────────────────────────────────────────────

/**
 * Palavras-chave para matching fuzzy com os nomes do IMA.
 * "Jurerê" não pode capturar "Jurerê Internacional" — tratado no filtro.
 */
/**
 * Keywords confirmadas pelo HTML real do IMA (20/04/2026):
 *   "PRAIA DE CANASVIEIRAS"
 *   "PRAIA DE INGLESES" / "PRAIA DOS INGLESES"
 *   "PRAIA DE JURERE"
 *   "PRAIA DE JURERE INTERNACIONAL"
 */
export const KEYWORDS_POR_BAIRRO: Record<string, string[]> = {
  'Canasvieiras':             ['canasvieiras'],
  'Ingleses do Rio Vermelho': ['ingleses'],
  'Jurerê':                   ['jurere'],
  'Jurerê Internacional':     ['jurere internacional'],
}

export function filtrarPontosPorBairro(pontos: PontoIMA[], nomeBairro: string): PontoIMA[] {
  const keywords = KEYWORDS_POR_BAIRRO[nomeBairro]
  if (!keywords) return []

  return pontos.filter((p) => {
    const nome = semAcento(p.nomeIma)
    if (nomeBairro === 'Jurerê') {
      return keywords.some((k) => nome.includes(k)) && !nome.includes('internacional')
    }
    return keywords.some((k) => nome.includes(k))
  })
}

// ─── Ponto de entrada ─────────────────────────────────────────────────────────

export interface ResultadoSync {
  pontos: PontoIMA[]
  metodo: 'html'
  totalEncontrados: number
  erro: string | null
}

/**
 * Busca os dados de balneabilidade do IMA via HTML scraping.
 */
export async function buscarDadosIMA(): Promise<ResultadoSync> {
  const html = await fetchHtmlRelatorio()

  if (!html) {
    return {
      pontos: [],
      metodo: 'html',
      totalEncontrados: 0,
      erro: 'IMA-SC indisponível. Verifique balneabilidade.ima.sc.gov.br',
    }
  }

  const pontos = parseHtmlTabela(html)

  if (pontos.length === 0) {
    return {
      pontos: [],
      metodo: 'html',
      totalEncontrados: 0,
      erro: 'HTML recebido mas nenhum ponto extraído — estrutura da tabela pode ter mudado',
    }
  }

  return {
    pontos,
    metodo: 'html',
    totalEncontrados: pontos.length,
    erro: null,
  }
}

/**
 * Busca dados de um bairro específico.
 */
export async function buscarPorBairro(nomeBairro: string): Promise<{
  bairroNome: string
  pontos: PontoIMA[]
  metodo: 'html'
  erro: string | null
}> {
  const resultado = await buscarDadosIMA()
  if (resultado.erro) {
    return { bairroNome: nomeBairro, pontos: [], metodo: 'html', erro: resultado.erro }
  }

  const pontos = filtrarPontosPorBairro(resultado.pontos, nomeBairro)
  return {
    bairroNome: nomeBairro,
    pontos,
    metodo: 'html',
    erro: pontos.length === 0
      ? `Nenhum ponto encontrado para "${nomeBairro}" na tabela do IMA`
      : null,
  }
}
