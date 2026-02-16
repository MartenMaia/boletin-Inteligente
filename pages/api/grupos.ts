import { NextApiRequest, NextApiResponse } from 'next'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export default async function handler(req: NextApiRequest, res: NextApiResponse){
  if(req.method === 'GET'){
    const grupos = await prisma.group.findMany({ include: { membros: true } })
    res.status(200).json(grupos)
  }else if(req.method === 'POST'){
    const body = req.body && typeof req.body === 'string' ? JSON.parse(req.body) : req.body
    const g = await prisma.group.create({ data: { name: body.name, description: body.description || '' } })
    res.status(200).json(g)
  }else{
    res.status(405).end()
  }
}
