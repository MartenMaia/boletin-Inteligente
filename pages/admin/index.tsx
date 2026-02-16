import React, { useEffect } from 'react'
import useSWR from 'swr'
import { useRouter } from 'next/router'
import { Container, Typography, Box, Button, Grid, Paper, List, ListItemButton, ListItemIcon, ListItemText, Table, TableHead, TableRow, TableCell, TableBody } from '@mui/material'
import AdminLayout from '../../components/AdminLayout'
import StatusBadge from '../../components/StatusBadge'
import { formatDateShort, formatDateFull } from '../../utils/date'
import EditIcon from '@mui/icons-material/Edit'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import Tooltip from '@mui/material/Tooltip'
import IconButton from '@mui/material/IconButton'
import HomeIcon from '@mui/icons-material/Home'
import ArticleIcon from '@mui/icons-material/Article'
import PeopleIcon from '@mui/icons-material/People'
import SettingsIcon from '@mui/icons-material/Settings'
import { Card, CardContent } from '@mui/material'

const fetcher = (url:string)=>fetch(url).then(r=>r.json())

export default function AdminHome(){
  const router = useRouter()
  const { data: boletins } = useSWR('/api/boletins', fetcher)

  useEffect(()=>{
    const ok = typeof window !== 'undefined' && (localStorage.getItem('bi_admin') === '1' || sessionStorage.getItem('bi_admin') === '1')
    if(!ok) router.replace('/admin/login')
  },[])

  const handleLogout = ()=>{
    try{ localStorage.removeItem('bi_admin'); sessionStorage.removeItem('bi_admin') }catch(e){}
    router.replace('/admin/login')
  }

  return (
    <AdminLayout>
      <Paper sx={{ p:3 }} elevation={1}>
        <Box sx={{ display:'flex', justifyContent:'space-between', alignItems:'center', mb:2 }}>
          <Box>
            <Typography variant="h4" sx={{ display:'flex', alignItems:'center', gap:1 }}>
              <Box component="span" sx={{ fontSize:28, mr:1 }}>👁️</Box> Visão Geral
            </Typography>
            <Box sx={{ mt:1, display:'flex', gap:2 }}>
              <Card sx={{ minWidth:160, background: 'linear-gradient(90deg,#0f1720,#0b1220)', color:'white' }}><CardContent><Typography variant="subtitle2">Total de Boletins</Typography><Typography variant="h5">8</Typography></CardContent></Card>
              <Card sx={{ minWidth:160, background: 'linear-gradient(90deg,#4f46e5,#6d28d9)', color:'white' }}><CardContent><Typography variant="subtitle2">Aguardando Aprovação</Typography><Typography variant="h5">3</Typography></CardContent></Card>
              <Card sx={{ minWidth:160, background: 'linear-gradient(90deg,#065f46,#10b981)', color:'white' }}><CardContent><Typography variant="subtitle2">Enviados Hoje</Typography><Typography variant="h5">2</Typography></CardContent></Card>
              <Card sx={{ minWidth:240, background: 'linear-gradient(90deg,#b45309,#f59e0b)', color:'white' }}><CardContent><Typography variant="subtitle2">Próximo Envio</Typography><Typography variant="h6">Centro em {formatDateShort(new Date(Date.now()+6*24*60*60*1000).toISOString())}</Typography><Typography variant="caption">em 6 dias</Typography></CardContent></Card>
            </Box>
          </Box>

          <Box>
            <Button variant="contained" onClick={()=>router.push('/admin/boletins/novo')}>+ Novo Boletim</Button>
          </Box>
        </Box>

        <Divider sx={{ my:3 }} />

        <Typography sx={{ mb:2 }}>Lista de boletins configurados pelo administrador:</Typography>

        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Nome do Boletim</TableCell>
              <TableCell>Data último envio</TableCell>
              <TableCell>Data próximo envio</TableCell>
              <TableCell>Grupo alvo</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Opções</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {boletins?.filter((b:any)=>b.configurado !== false).map((b:any)=> (
              <TableRow key={b.id}>
                <TableCell>{b.nome || b.title || `Boletim ${b.id}`}</TableCell>
                <TableCell>
                  <Tooltip title={formatDateFull(b.ultimoEnvio)}><span>{formatDateShort(b.ultimoEnvio)}</span></Tooltip>
                </TableCell>
                <TableCell>
                  <Tooltip title={formatDateFull(b.proximoEnvio)}><span>{formatDateShort(b.proximoEnvio)}</span></Tooltip>
                </TableCell>
                <TableCell>{b.grupoAlvo || b.grupo || '-'}</TableCell>
                <TableCell>{b.status || 'Rascunho'}</TableCell>
                <TableCell>
                  <Tooltip title="Revisão"><IconButton size="small" onClick={()=>router.push(`/admin/boletins/${b.id}/revisao`)}><EditIcon /></IconButton></Tooltip>
                  <Tooltip title="Aprovação"><IconButton size="small" onClick={()=>router.push(`/admin/boletins/${b.id}/aprovar`)}><CheckCircleIcon /></IconButton></Tooltip>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

      </Paper>
    </AdminLayout>
  )
}
