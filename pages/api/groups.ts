import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '../../lib/prisma'

export default async function handler(req: NextApiRequest, res: NextApiResponse){
  if(req.method === 'GET'){
    const groups = await prisma.group.findMany({ include: { members: true } })
    res.json(groups)
    return
  }
  if(req.method === 'POST'){
    const { name, description } = req.body
    const g = await prisma.group.create({ data: { name, description } })
    res.json(g)
    return
  }
  res.status(405).end()
}
