import { NextApiRequest, NextApiResponse } from 'next'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export default async function handler(req: NextApiRequest, res: NextApiResponse){
  const { id } = req.query
  const key = Array.isArray(id) ? id[0] : id as string
  if(req.method === 'GET'){
    const b = await prisma.boletim.findUnique({ where: { id: Number(key) } })
    res.status(200).json(b)
  }else if(req.method === 'POST' && req.url?.endsWith('/approve')){
    // approve
    const updated = await prisma.boletim.update({ where: { id: Number(key) }, data: { status: 'Aprovado' } })
    res.status(200).json(updated)
  }else if(req.method === 'DELETE'){
    await prisma.boletim.delete({ where: { id: Number(key) } })
    res.status(200).json({ ok: true })
  }else{
    res.status(405).end()
  }
}
