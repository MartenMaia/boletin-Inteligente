import { NextApiRequest, NextApiResponse } from 'next'

let individuos = [
  { id: 'u1', nome: 'João', email: 'joao@example.com', grupo: 'Centro' },
  { id: 'u2', nome: 'Maria', email: 'maria@example.com', grupo: 'Centro' },
  { id: 'u3', nome: 'Carlos', email: 'carlos@example.com', grupo: 'Norte' }
]

export default function handler(req: NextApiRequest, res: NextApiResponse){
  if(req.method === 'GET'){
    res.status(200).json(individuos)
  }else if(req.method === 'POST'){
    const body = req.body && typeof req.body === 'string' ? JSON.parse(req.body) : req.body
    const id = `u${Date.now()}`
    const inv = { id, nome: body.nome, email: body.email, grupo: body.grupo || '' }
    individuos.push(inv)
    res.status(200).json(inv)
  }else{
    res.status(405).end()
  }
}
