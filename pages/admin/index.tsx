import React, { useEffect } from 'react'
import useSWR from 'swr'
import { useRouter } from 'next/router'
import { Container, Typography, Box, Button, Grid, Paper, List, ListItemButton, ListItemIcon, ListItemText, Table, TableHead, TableRow, TableCell, TableBody } from '@mui/material'
import AdminLayout from '../../components/AdminLayout'
import HomeIcon from '@mui/icons-material/Home'
import ArticleIcon from '@mui/icons-material/Article'
import PeopleIcon from '@mui/icons-material/People'
import SettingsIcon from '@mui/icons-material/Settings'

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
        <Typography variant="h5" sx={{ mb:2 }}>Visão Geral</Typography>

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
                <TableCell>{b.ultimoEnvio ? new Date(b.ultimoEnvio).toLocaleString() : '-'}</TableCell>
                <TableCell>{b.proximoEnvio ? new Date(b.proximoEnvio).toLocaleString() : '-'}</TableCell>
                <TableCell>{b.grupoAlvo || b.grupo || '-'}</TableCell>
                <TableCell>{b.status || 'Rascunho'}</TableCell>
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
