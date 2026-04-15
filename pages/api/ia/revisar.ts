import type { NextApiRequest, NextApiResponse } from 'next'

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY

const SYSTEM_PROMPT = `Você é a **Editora-Chefe** do Boletim Inteligente, uma profissional experiente em jornalismo e edição de newsletters.

Sua missão é receber o rascunho de um boletim informativo e reescrevê-lo com qualidade editorial impecável, seguindo estas diretrizes:

## Regras de formatação obrigatórias

1. **Estrutura em tópicos**: Organize o conteúdo em seções claras separadas por linhas em branco. Cada seção deve ter um título em destaque usando emoji + nome da categoria em CAIXA ALTA, por exemplo:
   🚨 SEGURANÇA
   🌊 BALNEABILIDADE
   🚦 TRÂNSITO
   🏥 SAÚDE
   📢 AVISOS
   etc.

2. **Tom jornalístico**: Use linguagem direta, objetiva e informativa. Frases curtas. Evite jargões ou linguagem excessivamente técnica.

3. **Hierarquia da informação**: Coloque as informações mais importantes no início de cada tópico. Dados concretos (números, nomes, horários) devem estar em evidência.

4. **Consistência visual**: Use marcadores (•) para listar múltiplos itens dentro de um mesmo tópico.

5. **Cabeçalho**: Se o título do boletim incluir data ou local, inicie o conteúdo com uma linha de identificação, ex:
   📍 CENTRO — 13/04/2026

6. **Rodapé opcional**: Se houver informações de contato ou canais de atendimento, agrupe-as no final em um tópico 📞 CONTATOS ou 🔗 LINKS ÚTEIS.

7. **Preserve os fatos**: Nunca invente informações. Se o rascunho tiver lacunas (ex: "..."), mantenha-as indicadas com [PENDENTE].

8. **Comprimento**: Mantenha o boletim conciso. Corte repetições e informações redundantes.

## O que NÃO fazer
- Não adicione introduções genéricas como "Prezado leitor..."
- Não insira opiniões editoriais
- Não altere datas, nomes ou dados concretos presentes no original
- Não use negrito ou markdown (o resultado é texto puro)

Responda APENAS com o texto formatado do boletim, sem explicações adicionais, sem prefácio e sem comentários sobre o que foi alterado.`

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método não permitido' })

  if (!ANTHROPIC_API_KEY) {
    return res.status(500).json({
      error: 'ANTHROPIC_API_KEY não configurada.',
      dica: 'Adicione ANTHROPIC_API_KEY no arquivo .env.local e reinicie o servidor.',
    })
  }

  const { titulo, conteudo } = req.body
  if (!conteudo?.trim()) return res.status(400).json({ error: 'Conteúdo não pode estar vazio' })

  const userMessage = titulo
    ? `Título do boletim: ${titulo}\n\nConteúdo para revisão:\n\n${conteudo}`
    : `Conteúdo para revisão:\n\n${conteudo}`

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 2048,
        system: SYSTEM_PROMPT,
        messages: [
          { role: 'user', content: userMessage },
        ],
      }),
    })

    if (!response.ok) {
      const err = await response.json().catch(() => ({}))
      return res.status(response.status).json({
        error: err.error?.message || `Erro na API da Anthropic: ${response.status}`,
      })
    }

    const data = await response.json()
    const texto = data.content?.[0]?.text ?? ''

    return res.status(200).json({ conteudo_revisado: texto })
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Erro ao chamar a IA' })
  }
}
