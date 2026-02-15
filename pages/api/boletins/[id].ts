import { NextApiRequest, NextApiResponse } from 'next'

const boletins: Record<string, any> = {
  '1': { id: '1', nome: 'Boletim Centro', conteudo: 'Conteúdo 1', ultimoEnvio: '2026-02-01T10:00:00Z', proximoEnvio: '2026-03-01T10:00:00Z', grupoAlvo: 'Centro', status: 'Aguardando revisão' },
  '2': { id: '2', nome: 'Boletim Norte', conteudo: 'Conteúdo 2', ultimoEnvio: '2026-02-05T12:00:00Z', proximoEnvio: '2026-03-05T12:00:00Z', grupoAlvo: 'Norte', status: 'Rascunho' },
  '3': { id: '3', nome: 'Boletim Sul', conteudo: 'Conteúdo 3', ultimoEnvio: null, proximoEnvio: '2026-03-10T09:00:00Z', grupoAlvo: 'Sul', status: 'Aguardando aprovação' }
}

export default function handler(req: NextApiRequest, res: NextApiResponse){
  const { id } = req.query
  const key = Array.isArray(id) ? id[0] : id as string
  if(req.method === 'GET'){
    res.status(200).json(boletins[key] || null)
  }else if(req.method === 'POST' && req.url?.endsWith('/approve')){
    // mock approval
    const b = boletins[key]
    if(b){ b.status = 'Aprovado' }
    res.status(200).json({ ok: true })
  }else{
    res.status(405).end()
  }
}
