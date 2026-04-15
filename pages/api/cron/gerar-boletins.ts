/**
 * POST /api/cron/gerar-boletins
 *
 * Gerado automaticamente pelo Vercel Cron às 09:00 BRT (12:00 UTC) todos os dias.
 * Pode ser chamado manualmente via POST com header Authorization: Bearer <CRON_SECRET>
 *
 * Lógica:
 *  1. Busca todos os templates ativos
 *  2. Para cada template, verifica se deve gerar hoje:
 *     - diaria:     sempre
 *     - semanal:    se hoje é o mesmo dia da semana de dias_semana[0]
 *     - mensal:     se hoje é o dia do mês definido em dia_mes
 *     - customizada:se o dia da semana de hoje está em dias_semana
 *  3. Verifica se já foi gerado hoje (evita duplicatas)
 *  4. Cria o boletim com status 'aguardando_revisao' e seta validade_ate
 *  5. Atualiza ultimo_gerado_em no template
 */

import type { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const DIAS_PT = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

function formatDate(date: Date): string {
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

function shouldGenerate(template: any, hoje: Date): boolean {
  const diaSemana  = hoje.getDay()         // 0-6
  const diaMes     = hoje.getDate()        // 1-31

  switch (template.recorrencia) {
    case 'diaria':
      return true

    case 'semanal':
      // gera no dia da semana definido (dias_semana[0])
      return Array.isArray(template.dias_semana) &&
        template.dias_semana.length > 0 &&
        template.dias_semana[0] === diaSemana

    case 'mensal':
      return template.dia_mes === diaMes

    case 'customizada':
      return Array.isArray(template.dias_semana) &&
        template.dias_semana.includes(diaSemana)

    default:
      return false
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método não permitido' })

  // Proteção básica: verificar CRON_SECRET (set no Vercel env vars)
  const cronSecret = process.env.CRON_SECRET
  if (cronSecret) {
    const auth = req.headers.authorization
    if (!auth || auth !== `Bearer ${cronSecret}`) {
      return res.status(401).json({ error: 'Não autorizado' })
    }
  }

  const hoje = new Date()
  const hojeStr = hoje.toISOString().slice(0, 10) // 'YYYY-MM-DD'

  // 1. Buscar templates ativos
  const { data: templates, error: templatesErr } = await supabase
    .from('boletim_templates')
    .select('*')
    .eq('ativo', true)

  if (templatesErr) return res.status(500).json({ error: templatesErr.message })
  if (!templates || templates.length === 0) {
    return res.json({ gerados: 0, mensagem: 'Nenhum template ativo encontrado' })
  }

  const resultados: any[] = []

  for (const template of templates) {
    // 2. Verificar se deve gerar hoje
    if (!shouldGenerate(template, hoje)) {
      resultados.push({ template_id: template.id, title: template.title_template, acao: 'pulado', motivo: 'não é dia de geração' })
      continue
    }

    // 3. Verificar se já foi gerado hoje
    const { count } = await supabase
      .from('boletins')
      .select('id', { count: 'exact', head: true })
      .eq('template_id', template.id)
      .gte('created_at', `${hojeStr}T00:00:00.000Z`)
      .lt( 'created_at', `${hojeStr}T23:59:59.999Z`)

    if ((count ?? 0) > 0) {
      resultados.push({ template_id: template.id, title: template.title_template, acao: 'pulado', motivo: 'já gerado hoje' })
      continue
    }

    // 4. Montar título substituindo {data}
    const nomeDiaSemana = DIAS_PT[hoje.getDay()]
    const titulo = template.title_template
      .replace(/{data}/g,        formatDate(hoje))
      .replace(/{dia_semana}/g,  nomeDiaSemana)
      .replace(/{dia}/g,         String(hoje.getDate()).padStart(2, '0'))
      .replace(/{mes}/g,         String(hoje.getMonth() + 1).padStart(2, '0'))
      .replace(/{ano}/g,         String(hoje.getFullYear()))

    // 5. Calcular validade
    const validadeAte = new Date(hoje.getTime() + template.horas_validacao * 60 * 60 * 1000)

    // 6. Criar boletim
    const { data: boletim, error: boletimErr } = await supabase
      .from('boletins')
      .insert({
        title:           titulo,
        conteudo:        template.conteudo        || '',
        grupo_id:        template.grupo_id        || null,
        bairro_ids:      template.bairro_ids      || [],
        canais_envio:    template.canais_envio    || [],
        template_id:     template.id,
        horas_validacao: template.horas_validacao,
        validade_ate:    validadeAte.toISOString(),
        status:          'aguardando_revisao',
        criado_por:      template.criado_por      || null,
      })
      .select('id, title')
      .single()

    if (boletimErr) {
      resultados.push({ template_id: template.id, title: template.title_template, acao: 'erro', motivo: boletimErr.message })
      continue
    }

    // 7. Atualizar ultimo_gerado_em
    await supabase
      .from('boletim_templates')
      .update({ ultimo_gerado_em: hoje.toISOString(), updated_at: hoje.toISOString() })
      .eq('id', template.id)

    resultados.push({ template_id: template.id, boletim_id: boletim.id, title: boletim.title, acao: 'gerado' })
  }

  const gerados = resultados.filter(r => r.acao === 'gerado').length
  return res.json({ gerados, total_templates: templates.length, resultados })
}
