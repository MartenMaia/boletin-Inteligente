import { NextApiRequest, NextApiResponse } from 'next'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export default async function handler(req: NextApiRequest, res: NextApiResponse){
  if(req.method === 'GET'){
    const individuos = await prisma.groupMember.findMany()
    res.status(200).json(individuos)
  }else if(req.method === 'POST'){
    const body = req.body && typeof req.body === 'string' ? JSON.parse(req.body) : req.body
    const inv = await prisma.groupMember.create({ data: { name: body.nome, contact: body.email || '', groupId: body.groupId || null } })
    res.status(200).json(inv)
  }else{
    res.status(405).end()
  }
}
