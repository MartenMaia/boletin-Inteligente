import React, { useEffect } from 'react'
import { useRouter } from 'next/router'
import { Container, Typography, Box, Button, Grid, Paper, List, ListItemButton, ListItemIcon, ListItemText } from '@mui/material'
import HomeIcon from '@mui/icons-material/Home'
import ArticleIcon from '@mui/icons-material/Article'
import PeopleIcon from '@mui/icons-material/People'
import SettingsIcon from '@mui/icons-material/Settings'

export default function AdminHome(){
  const router = useRouter()

  useEffect(()=>{
    const ok = typeof window !== 'undefined' && (localStorage.getItem('bi_admin') === '1' || sessionStorage.getItem('bi_admin') === '1')
    if(!ok) router.replace('/admin/login')
  },[])

  const handleLogout = ()=>{
    try{ localStorage.removeItem('bi_admin'); sessionStorage.removeItem('bi_admin') }catch(e){}
    router.replace('/admin/login')
  }

  return (
    <Container maxWidth="lg" sx={{ py: 6 }}>
      <Grid container spacing={3}>
        <Grid item xs={12} md={3}>
          <Paper sx={{ p:2, backgroundColor: '#00AEEF', color: 'white' }} elevation={3}>
            <Typography variant="h6" sx={{ fontWeight: 700, mb:2 }}>Painel</Typography>
            <List>
              <ListItemButton sx={{ color: 'white' }} onClick={()=>router.push('/admin')}>
                <ListItemIcon sx={{ color: 'white' }}><HomeIcon /></ListItemIcon>
                <ListItemText primary="Visão Geral" />
              </ListItemButton>

              <ListItemButton sx={{ color: 'white' }} onClick={()=>router.push('/admin/boletins')}>
                <ListItemIcon sx={{ color: 'white' }}><ArticleIcon /></ListItemIcon>
                <ListItemText primary="Boletins" />
              </ListItemButton>

              <ListItemButton sx={{ color: 'white' }} onClick={()=>router.push('/admin/bairros')}>
                <ListItemIcon sx={{ color: 'white' }}><PeopleIcon /></ListItemIcon>
                <ListItemText primary="Bairros" />
              </ListItemButton>

              <ListItemButton sx={{ color: 'white' }} onClick={()=>router.push('/admin/settings')}>
                <ListItemIcon sx={{ color: 'white' }}><SettingsIcon /></ListItemIcon>
                <ListItemText primary="Configurações" />
              </ListItemButton>
            </List>

            <Box sx={{ mt:4 }}>
              <Button variant="outlined" onClick={handleLogout} sx={{ color: 'white', borderColor: 'rgba(255,255,255,0.6)' }}>Logout</Button>
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} md={9}>
          <Paper sx={{ p:3 }} elevation={1}>
            <Typography variant="h5" sx={{ mb:2 }}>Visão Geral</Typography>
            <Typography>Bem-vindo ao painel administrativo (MVP). Use o menu à esquerda para navegar.</Typography>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  )
}
