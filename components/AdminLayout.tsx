import React, { ReactNode } from 'react'
import { Container, Grid, Paper, Typography, Box, List, ListItemButton, ListItemIcon, ListItemText, Button, Avatar, IconButton } from '@mui/material'
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

  const themeCtx = require('../context/ThemeContext').useThemeContext ? require('../context/ThemeContext').useThemeContext() : null
  const currentMode = themeMode || themeCtx?.mode
  const toggle = toggleTheme || themeCtx?.toggle

  return (
    <div>
      {/* Header removed intentionally to let page content align to the top */}

      <Box sx={{ display: 'flex' }}>
        <Box component="aside" sx={{ width: 260, height: '100vh', position: 'fixed', left:0, top:0, pt:2, px:2, backgroundColor: (theme)=>theme.palette.mode==='dark'? '#071627' : '#fff', boxShadow: 3, overflowY: 'auto', borderRight: (theme)=>`1px solid ${theme.palette.divider}` }}>
          <Box sx={{ mb:3, px:1 }}>
            <Typography variant="subtitle1" sx={(theme)=>({ color: theme.palette.mode==='dark' ? '#fff' : 'rgba(0,0,0,0.85)', mb:1 })}>Painel</Typography>
          </Box>

          <List sx={{ display:'flex', flexDirection:'column', gap:1 }}>
            <ListItemButton sx={(theme)=>({ color: theme.palette.mode==='dark' ? 'white' : 'rgba(0,0,0,0.85)', borderRadius:2, bgcolor: router.pathname === '/admin' ? (theme.palette.mode==='dark'? 'rgba(255,255,255,0.04)' : '#e6f7ff') : 'transparent' })} selected={router.pathname === '/admin'} onClick={()=>router.push('/admin')}>
              <ListItemIcon sx={(theme)=>({ color: theme.palette.mode==='dark' ? 'white' : 'rgba(0,0,0,0.6)', minWidth:40 })}><HomeIcon fontSize='medium' /></ListItemIcon>
              <ListItemText primary="Visão Geral" />
            </ListItemButton>

            <ListItemButton sx={(theme)=>({ color: theme.palette.mode==='dark' ? 'white' : 'rgba(0,0,0,0.85)', borderRadius:2, bgcolor: router.pathname.startsWith('/admin/boletins') ? (theme.palette.mode==='dark'? 'rgba(255,255,255,0.04)' : '#e6f7ff') : 'transparent' })} selected={router.pathname.startsWith('/admin/boletins')} onClick={()=>router.push('/admin/boletins')}>
              <ListItemIcon sx={(theme)=>({ color: theme.palette.mode==='dark' ? 'white' : 'rgba(0,0,0,0.6)', minWidth:40 })}><ArticleIcon fontSize='medium' /></ListItemIcon>
              <ListItemText primary="Boletins" />
            </ListItemButton>

            <ListItemButton sx={(theme)=>({ color: theme.palette.mode==='dark' ? 'white' : 'rgba(0,0,0,0.85)', borderRadius:2, bgcolor: router.pathname.startsWith('/admin/grupos') ? (theme.palette.mode==='dark'? 'rgba(255,255,255,0.04)' : '#e6f7ff') : 'transparent' })} selected={router.pathname.startsWith('/admin/grupos')} onClick={()=>router.push('/admin/grupos')}>
              <ListItemIcon sx={(theme)=>({ color: theme.palette.mode==='dark' ? 'white' : 'rgba(0,0,0,0.6)', minWidth:40 })}><PeopleIcon fontSize='medium' /></ListItemIcon>
              <ListItemText primary="Grupos" />
            </ListItemButton>

            <ListItemButton sx={(theme)=>({ color: theme.palette.mode==='dark' ? 'white' : 'rgba(0,0,0,0.85)', borderRadius:2, bgcolor: router.pathname === '/admin/settings' ? (theme.palette.mode==='dark'? 'rgba(255,255,255,0.04)' : '#e6f7ff') : 'transparent' })} selected={router.pathname === '/admin/settings'} onClick={()=>router.push('/admin/settings')}>
              <ListItemIcon sx={(theme)=>({ color: theme.palette.mode==='dark' ? 'white' : 'rgba(0,0,0,0.6)', minWidth:40 })}><SettingsIcon fontSize='medium' /></ListItemIcon>
              <ListItemText primary="Configurações" />
            </ListItemButton>
          </List>

          <Box sx={{ mt:'auto', py:3, display:'flex', flexDirection:'column', gap:2 }}>
            <Button variant="contained" fullWidth sx={{ background:'#0ea5e9', color:'white', borderRadius:2 }} onClick={()=>router.push('/admin/boletins/novo')}>+ Novo Boletim</Button>

            <Box sx={{ mt:1, display:'flex', alignItems:'center', justifyContent:'space-between', gap:2 }}>
              <Box sx={{ display:'flex', alignItems: 'center', gap:2 }}>
                <Avatar alt="Marten" src="/images/avatar-placeholder.png" />
                <Box>
                  <Typography variant="body2">Marten</Typography>
                  <Typography variant="caption" sx={{ opacity:0.8 }}>Administrador</Typography>
                </Box>
              </Box>
              <IconButton onClick={toggle} color="inherit" aria-label="toggle theme" sx={{ bgcolor: (theme)=> theme.palette.mode==='dark'? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)' }}>
                {currentMode === 'dark' ? <Brightness7Icon /> : <Brightness4Icon />}
              </IconButton>
            </Box>
          </Box>
        </Box>

        <Box component="main" sx={{ flex: 1, ml: '260px', p:2, pt:2 }}>
          {children}
        </Box>
      </Box>
    </div>
  )
}
