import { NextApiRequest, NextApiResponse } from 'next'

import groupsModule from '../grupos'

let grupos = []
try{ // try to require the module file to keep same in-memory array
  const mod = require('./../grupos')
  grupos = mod.default || mod
}catch(e){/* ignore */}

export default function handler(req: NextApiRequest, res: NextApiResponse){
  const { id } = req.query
  const key = Array.isArray(id) ? id[0] : id as string
  if(req.method === 'PATCH'){
    const body = req.body && typeof req.body === 'string' ? JSON.parse(req.body) : req.body
    if(body.toggleMember){
      const indId = body.toggleMember
      // toggle: find individuo via in-memory individuos module
      let individuos = []
      try{ individuos = require('./../individuos').default || require('./../individuos') }catch(e){}
      const individuo = individuos.find((i:any)=>i.id===indId)
      const g = grupos.find((gr:any)=>gr.id===key)
      if(!g) return res.status(404).json({ error: 'group not found' })
      const exists = g.membros.find((m:any)=>m.id===indId)
      if(exists){ g.membros = g.membros.filter((m:any)=>m.id!==indId); if(individuo) individuo.grupo = '' }
      else { g.membros.push({ id: individuo.id, nome: individuo.nome }); if(individuo) individuo.grupo = g.name }
      return res.status(200).json(g)
    }
  }
  res.status(405).end()
}
