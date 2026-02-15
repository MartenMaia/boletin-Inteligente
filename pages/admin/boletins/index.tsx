import React, { useState } from 'react'
import useSWR, { mutate } from 'swr'
import { useRouter } from 'next/router'
import { Paper, Typography, Table, TableHead, TableRow, TableCell, TableBody, IconButton, Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, Tooltip } from '@mui/material'
import EditIcon from '@mui/icons-material/Edit'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import DeleteIcon from '@mui/icons-material/Delete'
import AdminLayout from '../../../components/AdminLayout'
import { formatDateShort, formatDateFull } from '../../../utils/date'

const fetcher = (url:string)=>fetch(url).then(r=>r.json())

export default function BoletinsList({themeMode, toggleTheme}:{themeMode?:string, toggleTheme?:()=>void}){
  const router = useRouter()
  const { data: boletins } = useSWR('/api/boletins', fetcher)
  const [openId, setOpenId] = useState<string | null>(null)

  const handleDelete = async (id:string)=>{
    await fetch(`/api/boletins/${id}`, { method: 'DELETE' })
    mutate('/api/boletins')
    setOpenId(null)
  }

  return (
    <AdminLayout themeMode={themeMode} toggleTheme={toggleTheme}>
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
                <TableCell>
                  <Tooltip title={formatDateFull(b.ultimoEnvio)}>
                    <span>{formatDateShort(b.ultimoEnvio)}</span>
                  </Tooltip>
                </TableCell>
                <TableCell>
                  <Tooltip title={formatDateFull(b.proximoEnvio)}>
                    <span>{formatDateShort(b.proximoEnvio)}</span>
                  </Tooltip>
                </TableCell>
                <TableCell>{b.grupoAlvo||b.grupo||'-'}</TableCell>
                <TableCell>{b.status||'Rascunho'}</TableCell>
                <TableCell>
                  <Tooltip title="Revisão">
                    <IconButton size="small" onClick={()=>router.push(`/admin/boletins/${b.id}/revisao`)}>
                      <EditIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Aprovação">
                    <IconButton size="small" onClick={()=>router.push(`/admin/boletins/${b.id}/aprovar`)}>
                      <CheckCircleIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Excluir">
                    <IconButton size="small" color="error" onClick={()=>setOpenId(b.id)}>
                      <DeleteIcon />
                    </IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        <Dialog open={!!openId} onClose={()=>setOpenId(null)}>
          <DialogTitle>Confirmar exclusão</DialogTitle>
          <DialogContent>
            <DialogContentText>Tem certeza que deseja excluir este boletim? Esta ação não pode ser desfeita.</DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={()=>setOpenId(null)}>Cancelar</Button>
            <Button color="error" variant="contained" onClick={()=>openId && handleDelete(openId)}>Excluir</Button>
          </DialogActions>
        </Dialog>

      </Paper>
    </AdminLayout>
  )
}
