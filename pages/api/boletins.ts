import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '../../lib/prisma'

// Generate simplified boletim for a given bairroId (or all)
export default async function handler(req: NextApiRequest, res: NextApiResponse){
  if(req.method === 'POST'){
    const { bairroId } = req.body
    const hoje = new Date()
    const start = new Date(hoje)
    start.setHours(0,0,0,0)
    const end = new Date(hoje)
    end.setHours(23,59,59,999)

    const where = bairroId ? { bairroId } : {}
    const avisos = await prisma.aviso.findMany({ where: { ...where, createdAt: { gte: start, lte: end } }, orderBy: { createdAt: 'desc' } })

    const conteudo = avisos.map(a => `- [${a.titulo}] ${a.texto}`).join('\n') || 'Sem informes para hoje.'

    const boletim = await prisma.boletim.create({ data: { bairroId: bairroId || 0, conteudo, status: 'published' } })
    res.json({ boletim, avisos })
    return
  }
  if(req.method === 'GET'){
    const list = await prisma.boletim.findMany({ orderBy: { data: 'desc' } })
    res.json(list)
    return
  }
  res.status(405).end()
}
