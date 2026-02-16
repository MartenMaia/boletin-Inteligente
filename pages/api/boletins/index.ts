import { NextApiRequest, NextApiResponse } from 'next'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export default async function handler(req: NextApiRequest, res: NextApiResponse){
  if(req.method === 'GET'){
    const boletins = await prisma.boletim.findMany({ orderBy: { proximoEnvio: 'asc' } })
    res.status(200).json(boletins)
  }else if(req.method === 'POST'){
    const body = req.body && typeof req.body === 'string' ? JSON.parse(req.body) : req.body
    const created = await prisma.boletim.create({ data: body })
    res.status(201).json(created)
  }else{
    res.status(405).end()
  }
}
