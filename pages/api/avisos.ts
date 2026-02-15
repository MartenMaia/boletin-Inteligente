import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '../../lib/prisma'

export default async function handler(req: NextApiRequest, res: NextApiResponse){
  if(req.method === 'GET'){
    const avisos = await prisma.aviso.findMany({ orderBy: { createdAt: 'desc' } })
    res.json(avisos)
    return
  }
  if(req.method === 'POST'){
    const { source, titulo, texto, bairroId } = req.body
    const a = await prisma.aviso.create({ data: { source, titulo, texto, bairroId } })
    res.json(a)
    return
  }
  res.status(405).end()
}
