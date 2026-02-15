import { NextApiRequest, NextApiResponse } from 'next'

let grupos = [
  { id: 'g1', name: 'Centro', membros: [{id:'u1', nome:'João'}, {id:'u2', nome:'Maria'}] },
  { id: 'g2', name: 'Norte', membros: [{id:'u3', nome:'Carlos'}] }
]

export default function handler(req: NextApiRequest, res: NextApiResponse){
  if(req.method === 'GET'){
    res.status(200).json(grupos)
  }else if(req.method === 'POST'){
    const body = req.body && typeof req.body === 'string' ? JSON.parse(req.body) : req.body
    const id = `g${Date.now()}`
    const g = { id, name: body.name, membros: [] }
    grupos.push(g)
    res.status(200).json(g)
  }else{
    res.status(405).end()
  }
}
