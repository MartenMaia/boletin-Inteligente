import { NextApiRequest, NextApiResponse } from 'next'

let boletins = [
  { id: '1', nome: 'Boletim Centro', ultimoEnvio: '2026-02-01T10:00:00Z', proximoEnvio: '2026-03-01T10:00:00Z', grupoAlvo: 'Centro', status: 'Aguardando revisão', configurado: true },
  { id: '2', nome: 'Boletim Norte', ultimoEnvio: '2026-02-05T12:00:00Z', proximoEnvio: '2026-03-05T12:00:00Z', grupoAlvo: 'Norte', status: 'Rascunho', configurado: true },
  { id: '3', nome: 'Boletim Sul', ultimoEnvio: null, proximoEnvio: '2026-03-10T09:00:00Z', grupoAlvo: 'Sul', status: 'Aguardando aprovação', configurado: true }
]

export default function handler(req: NextApiRequest, res: NextApiResponse){
  res.status(200).json(boletins)
}
