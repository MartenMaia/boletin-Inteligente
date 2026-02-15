import { NextApiRequest, NextApiResponse } from 'next'

const grupos = [
  { id: 'g1', name: 'Centro', membros: [{id:'u1', nome:'João'}, {id:'u2', nome:'Maria'}] },
  { id: 'g2', name: 'Norte', membros: [{id:'u3', nome:'Carlos'}] }
]

export default function handler(req: NextApiRequest, res: NextApiResponse){
  res.status(200).json(grupos)
}
