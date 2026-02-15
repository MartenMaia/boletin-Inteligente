import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '../../../lib/prisma'

export default async function handler(req: NextApiRequest, res: NextApiResponse){
  if(req.method === 'GET'){
    const list = await prisma.bulletinSettings.findMany({ include: { group: true } })
    res.json(list)
    return
  }
  if(req.method === 'POST'){
    const { title, types, sources, approver, frequency, segmentation, groupId } = req.body
    const s = await prisma.bulletinSettings.create({ data: { title, types: JSON.stringify(types), sources: JSON.stringify(sources), approver, frequency, segmentation: JSON.stringify(segmentation), groupId } })
    res.json(s)
    return
  }
  res.status(405).end()
}
