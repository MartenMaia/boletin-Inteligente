import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '../../../../lib/prisma'

export default async function handler(req: NextApiRequest, res: NextApiResponse){
  const { id } = req.query
  if(req.method === 'GET'){
    const members = await prisma.groupMember.findMany({ where: { groupId: Number(id) } })
    res.json(members)
    return
  }
  if(req.method === 'POST'){
    const { name, contact, bairroId } = req.body
    const m = await prisma.groupMember.create({ data: { groupId: Number(id), name, contact, bairroId } })
    res.json(m)
    return
  }
  res.status(405).end()
}
