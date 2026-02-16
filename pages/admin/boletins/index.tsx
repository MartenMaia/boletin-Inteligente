import React, { useState } from 'react'
import useSWR, { mutate } from 'swr'
import { useRouter } from 'next/router'
import { Paper, Typography, Table, TableHead, TableRow, TableCell, TableBody, IconButton, Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, Tooltip, Button, Box, TextField, Snackbar } from '@mui/material'
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

  const [loadingId, setLoadingId] = useState<string | null>(null)
  const [snack, setSnack] = useState<{open:boolean,message:string}>({open:false,message:''})
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string | null>(null)
  const [groupFilter, setGroupFilter] = useState<string | null>(null)

  const handleDelete = async (id:string)=>{
    setLoadingId(id)
    const res = await fetch(`/api/boletins/${id}`, { method: 'DELETE' })
    if(res.ok){
      mutate('/api/boletins')
      setSnack({open:true,message:'Boletim excluído'})
    }else{
      setSnack({open:true,message:'Erro ao excluir'})
    }
    setOpenId(null)
    setLoadingId(null)
  }

  const handleApprove = async (id:string)=>{
    setLoadingId(id)
    const res = await fetch(`/api/boletins/${id}/approve`, { method: 'POST' })
    if(res.ok){
      mutate('/api/boletins')
      setSnack({open:true,message:'Boletim aprovado'})
    }else{
      setSnack({open:true,message:'Erro ao aprovar'})
    }
    setLoadingId(null)
  }

  const filtered = (boletins||[]).filter((b:any)=>{
    if(query && !(b.nome||b.title||'').toLowerCase().includes(query.toLowerCase())) return false
    if(statusFilter && b.status !== statusFilter) return false
    if(groupFilter && b.grupoAlvo !== groupFilter && b.grupo !== groupFilter) return false
    return true
  })

  return (
    <AdminLayout themeMode={themeMode} toggleTheme={toggleTheme}>
      {/* Page title outside Paper */}
      <Box sx={{ mb:2 }}>
        <Typography variant="h5">Boletins</Typography>
      </Box>

      <Paper sx={{ p:3 }}>
        <Box sx={{ display:'flex', justifyContent:'space-between', alignItems:'center', mb:2 }}>
          <Box>
            <Box>
              <Button variant="contained" color="primary" onClick={()=>router.push('/admin/boletins/novo')}>+ Novo Boletim</Button>
            </Box>
          </Box>
        </Box>

        <Box sx={{ display:'flex', gap:2, mb:2 }}>
          <TextField placeholder="Buscar boletins..." size="small" value={query} onChange={(e)=>setQuery(e.target.value)} />
          <TextField select size="small" value={statusFilter||''} onChange={(e)=>setStatusFilter(e.target.value||null)} SelectProps={{displayEmpty:true}} sx={{ width:160 }}>
            <option value="">Todos os status</option>
            <option value="Rascunho">Rascunho</option>
            <option value="Aguardando revisão">Aguardando revisão</option>
            <option value="Aguardando aprovação">Aguardando aprovação</option>
            <option value="Aprovado">Aprovado</option>
          </TextField>
          <TextField placeholder="Grupo" size="small" value={groupFilter||''} onChange={(e)=>setGroupFilter(e.target.value||null)} sx={{ width:140 }} />
        </Box>

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
                    <span>
                      <IconButton size="small" onClick={()=>setOpenId(`approve-${b.id}`)} disabled={!!loadingId}>
                        <CheckCircleIcon />
                      </IconButton>
                    </span>
                  </Tooltip>
                  <Tooltip title="Excluir">
                    <span>
                      <IconButton size="small" color="error" onClick={()=>setOpenId(b.id)} disabled={!!loadingId}>
                        <DeleteIcon />
                      </IconButton>
                    </span>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        <Dialog open={!!openId && !String(openId).startsWith('approve-')} onClose={()=>setOpenId(null)}>
          <DialogTitle>Confirmar exclusão</DialogTitle>
          <DialogContent>
            <DialogContentText>Tem certeza que deseja excluir este boletim? Esta ação não pode ser desfeita.</DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={()=>setOpenId(null)}>Cancelar</Button>
            <Button color="error" variant="contained" onClick={()=>openId && handleDelete(openId)}>Excluir</Button>
          </DialogActions>
        </Dialog>

        <Dialog open={!!openId && String(openId).startsWith('approve-')} onClose={()=>setOpenId(null)}>
          <DialogTitle>Confirmar aprovação</DialogTitle>
          <DialogContent>
            <DialogContentText>Deseja realmente aprovar e agendar o envio deste boletim?</DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={()=>setOpenId(null)}>Cancelar</Button>
            <Button variant="contained" onClick={()=>{ if(openId){ const id=String(openId).replace('approve-',''); handleApprove(id) } }}>Aprovar</Button>
          </DialogActions>
        </Dialog>

        <Snackbar open={snack.open} autoHideDuration={3000} onClose={()=>setSnack({open:false,message:''})} message={snack.message} />

      </Paper>
    </AdminLayout>
  )
}
