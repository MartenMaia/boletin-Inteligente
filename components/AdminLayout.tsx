import React, { ReactNode } from 'react'
import { Container, Grid, Paper, Typography, Box, List, ListItemButton, ListItemIcon, ListItemText, Button } from '@mui/material'
import HomeIcon from '@mui/icons-material/Home'
import ArticleIcon from '@mui/icons-material/Article'
import PeopleIcon from '@mui/icons-material/People'
import SettingsIcon from '@mui/icons-material/Settings'
import { useRouter } from 'next/router'

export default function AdminLayout({children}:{children:ReactNode}){
  const router = useRouter()
  const handleLogout = ()=>{
    try{ localStorage.removeItem('bi_admin'); sessionStorage.removeItem('bi_admin') }catch(e){}
    router.replace('/admin/login')
  }

  return (
    <Container maxWidth="lg" sx={{ py: 6 }}>
      <Grid container spacing={3}>
        <Grid item xs={12} md={3}>
          <Paper sx={{ p:2, backgroundColor: '#00AEEF', color: 'white', position: 'sticky', top: 24 }} elevation={3}>
            <Typography variant="h6" sx={{ fontWeight: 700, mb:2 }}>Painel</Typography>
            <List>
              <ListItemButton sx={{ color: 'white' }} selected={router.pathname === '/admin'} onClick={()=>router.push('/admin')}>
                <ListItemIcon sx={{ color: 'white' }}><HomeIcon /></ListItemIcon>
                <ListItemText primary="Visão Geral" />
              </ListItemButton>

              <ListItemButton sx={{ color: 'white' }} selected={router.pathname.startsWith('/admin/boletins')} onClick={()=>router.push('/admin/boletins')}>
                <ListItemIcon sx={{ color: 'white' }}><ArticleIcon /></ListItemIcon>
                <ListItemText primary="Boletins" />
              </ListItemButton>

              <ListItemButton sx={{ color: 'white' }} selected={router.pathname.startsWith('/admin/grupos')} onClick={()=>router.push('/admin/grupos')}>
                <ListItemIcon sx={{ color: 'white' }}><PeopleIcon /></ListItemIcon>
                <ListItemText primary="Grupos" />
              </ListItemButton>

              <ListItemButton sx={{ color: 'white' }} selected={router.pathname === '/admin/settings'} onClick={()=>router.push('/admin/settings')}>
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
          {children}
        </Grid>
      </Grid>
    </Container>
  )
}
