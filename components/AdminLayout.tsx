import React, { ReactNode } from 'react'
import { Container, Grid, Paper, Typography, Box, List, ListItemButton, ListItemIcon, ListItemText, Button, AppBar, Toolbar, IconButton } from '@mui/material'
import HomeIcon from '@mui/icons-material/Home'
import ArticleIcon from '@mui/icons-material/Article'
import PeopleIcon from '@mui/icons-material/People'
import SettingsIcon from '@mui/icons-material/Settings'
import Brightness4Icon from '@mui/icons-material/Brightness4'
import Brightness7Icon from '@mui/icons-material/Brightness7'
import { useRouter } from 'next/router'

export default function AdminLayout({children, themeMode, toggleTheme}:{children:ReactNode, themeMode?: string, toggleTheme?: ()=>void}){
  const router = useRouter()
  const handleLogout = ()=>{
    try{ localStorage.removeItem('bi_admin'); sessionStorage.removeItem('bi_admin') }catch(e){}
    router.replace('/admin/login')
  }

  // fallback to ThemeContext if props not provided
  const themeCtx = require('../context/ThemeContext').useThemeContext ? require('../context/ThemeContext').useThemeContext() : null
  const currentMode = themeMode || themeCtx?.mode
  const toggle = toggleTheme || themeCtx?.toggle

  return (
    <div>
      <AppBar position="static" color="transparent" elevation={0} sx={{ mb:2 }}>
        <Toolbar sx={{ px:0 }}>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>Boletim Inteligente</Typography>
          <IconButton onClick={toggle} color="inherit" aria-label="toggle theme">
            {currentMode === 'dark' ? <Brightness7Icon /> : <Brightness4Icon />}
          </IconButton>
        </Toolbar>
      </AppBar>

      <Box sx={{ display: 'flex' }}>
        <Box component="aside" sx={{ width: 260, height: '100vh', position: 'fixed', left:0, top:0, pt:8, px:2, backgroundColor: (theme)=>theme.palette.mode==='dark'? '#0b1220' : '#fff', boxShadow: 3, overflowY: 'auto' }}>
          <Paper sx={{ p:2, backgroundColor: '#00AEEF', color: 'white' }} elevation={3}>
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
        </Box>

        <Box component="main" sx={{ flex: 1, ml: '260px', p:3 }}>
          {children}
        </Box>
      </Box>
    </div>
  )
}
