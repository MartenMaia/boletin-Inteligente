import { NextApiRequest, NextApiResponse } from 'next'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export default async function handler(req: NextApiRequest, res: NextApiResponse){
  if(req.method === 'GET'){
    const individuos = await prisma.groupMember.findMany()
    res.status(200).json(individuos)
  }else if(req.method === 'POST'){
    const body = req.body && typeof req.body === 'string' ? JSON.parse(req.body) : req.body

    // map incoming fields: nome, telefone, local, email, notes
    const name = body.nome || body.name || ''
    const contact = body.telefone || body.contact || body.email || ''
    let bairroId = null

    // if local (bairro name) provided, try to find or create Bairro
    if(body.local){
      const localName = String(body.local).trim()
      if(localName){
        let bairro = await prisma.bairro.findFirst({ where: { name: localName } })
        if(!bairro){
          bairro = await prisma.bairro.create({ data: { name: localName } })
        }
        bairroId = bairro.id
      }
    }

    const inv = await prisma.groupMember.create({ data: { name, contact, bairroId } })
    res.status(200).json(inv)
  }else{
    res.status(405).end()
  }
}
