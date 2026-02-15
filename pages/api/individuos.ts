import { NextApiRequest, NextApiResponse } from 'next'

const individuos = [
  { id: 'u1', nome: 'João', email: 'joao@example.com', grupo: 'Centro' },
  { id: 'u2', nome: 'Maria', email: 'maria@example.com', grupo: 'Centro' },
  { id: 'u3', nome: 'Carlos', email: 'carlos@example.com', grupo: 'Norte' }
]

export default function handler(req: NextApiRequest, res: NextApiResponse){
  res.status(200).json(individuos)
}
