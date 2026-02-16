import { NextApiRequest, NextApiResponse } from 'next'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export default async function handler(req: NextApiRequest, res: NextApiResponse){
  if(req.method === 'GET'){
    // cast to any[] to avoid implicit any issues in TS map callback
    const individuos = (await prisma.groupMember.findMany({ include: { bairro: true, group: true } })) as any[]
    // normalize response keys for frontend convenience
    const mapped = individuos.map((i: any) => ({ id: i.id, name: i.name, contact: i.contact, bairroId: i.bairroId, bairroName: i.bairro?.name || null, groupId: i.groupId, groupName: i.group?.name || null }))
    res.status(200).json(mapped)
  }else if(req.method === 'POST'){
    const body = req.body && typeof req.body === 'string' ? JSON.parse(req.body) : req.body

    try{
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

      // ensure there is a groupId (GroupId is required in schema). If none provided, attach to a default group.
      let groupId = body.groupId || null
      if(!groupId){
        let anyGroup = await prisma.group.findFirst()
        if(!anyGroup){
          anyGroup = await prisma.group.create({ data: { name: 'Sem Grupo' } })
        }
        groupId = anyGroup.id
      }

      const inv = await prisma.groupMember.create({ data: { name, contact, bairroId, groupId } })
      // return normalized object
      const obj = { id: inv.id, name: inv.name, contact: inv.contact, bairroId: inv.bairroId, groupId: inv.groupId }
      res.status(200).json(obj)
    }catch(err:any){
      console.error('individuos POST error:', err)
      res.status(500).json({ error: err.message || 'Erro ao criar individuo' })
    }
  }else{
    res.status(405).end()
  }
}
