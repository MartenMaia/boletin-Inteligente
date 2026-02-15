import React from 'react'
import useSWR from 'swr'
import { useRouter } from 'next/router'
import { Paper, Typography, Table, TableHead, TableRow, TableCell, TableBody, Button } from '@mui/material'
import AdminLayout from '../../../components/AdminLayout'

const fetcher = (url:string)=>fetch(url).then(r=>r.json())

export default function BoletinsList(){
  const router = useRouter()
  const { data: boletins } = useSWR('/api/boletins', fetcher)

  return (
    <AdminLayout>
      <Paper sx={{ p:3 }}>
        <Typography variant="h5" sx={{ mb:2 }}>Boletins</Typography>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Nome</TableCell>
              <TableCell>Último envio</TableCell>
              <TableCell>Próximo envio</TableCell>
              <TableCell>Grupo</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Opções</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {boletins?.map((b:any)=>(
              <TableRow key={b.id}>
                <TableCell>{b.nome || b.title}</TableCell>
                <TableCell>{b.ultimoEnvio? new Date(b.ultimoEnvio).toLocaleString(): '-'}</TableCell>
                <TableCell>{b.proximoEnvio? new Date(b.proximoEnvio).toLocaleString(): '-'}</TableCell>
                <TableCell>{b.grupoAlvo||b.grupo||'-'}</TableCell>
                <TableCell>{b.status||'Rascunho'}</TableCell>
                <TableCell>
                  <Button size="small" onClick={()=>router.push(`/admin/boletins/${b.id}/revisao`)} sx={{ mr:1 }}>Revisão</Button>
                  <Button size="small" variant="contained" onClick={()=>router.push(`/admin/boletins/${b.id}/aprovar`)}>Aprovação</Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>
    </AdminLayout>
  )
}
