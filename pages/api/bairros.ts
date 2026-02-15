import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '../../lib/prisma'

export default async function handler(req: NextApiRequest, res: NextApiResponse){
  if(req.method === 'GET'){
    const bairros = await prisma.bairro.findMany()
    res.json(bairros)
    return
  }
  if(req.method === 'POST'){
    const { name, associationId } = req.body
    const b = await prisma.bairro.create({ data: { name, associationId } })
    res.json(b)
    return
  }
  res.status(405).end()
}
