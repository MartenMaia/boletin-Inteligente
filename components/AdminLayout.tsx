import React, { ReactNode } from 'react'
import {
  Box, Typography, List, ListItemButton, ListItemIcon,
  ListItemText, Button, Avatar, IconButton, Tooltip, Chip, Divider
} from '@mui/material'
import HomeIcon from '@mui/icons-material/Home'
import ArticleIcon from '@mui/icons-material/Article'
import PeopleIcon from '@mui/icons-material/People'
import SettingsIcon from '@mui/icons-material/Settings'
import AddIcon from '@mui/icons-material/Add'
import LogoutIcon from '@mui/icons-material/Logout'
import Brightness4Icon from '@mui/icons-material/Brightness4'
import Brightness7Icon from '@mui/icons-material/Brightness7'
import NotificationsNoneIcon from '@mui/icons-material/NotificationsNone'
import { useRouter } from 'next/router'
import { useThemeContext } from '../context/ThemeContext'
import { useAuth } from '../hooks/useAuth'

const SIDEBAR_WIDTH = 260

const navItems = [
  { label: 'Visão Geral',    icon: <HomeIcon />,     path: '/admin' },
  { label: 'Boletins',       icon: <ArticleIcon />,  path: '/admin/boletins' },
  { label: 'Grupos',         icon: <PeopleIcon />,   path: '/admin/grupos' },
  { label: 'Configurações',  icon: <SettingsIcon />, path: '/admin/settings' },
]

const roleLabels: Record<string, string> = {
  admin:     'Administrador',
  editor:    'Editor',
  aprovador: 'Aprovador',
  viewer:    'Visualizador',
}

const roleColors: Record<string, 'default' | 'primary' | 'secondary' | 'warning' | 'info'> = {
  admin:     'primary',
  editor:    'info',
  aprovador: 'warning',
  viewer:    'default',
}

export default function AdminLayout({ children }: { children: ReactNode }) {
  const router = useRouter()
  const { mode, toggle } = useThemeContext()
  const { profile, signOut } = useAuth()

  const isActive = (path: string) =>
    path === '/admin' ? router.pathname === '/admin' : router.pathname.startsWith(path)

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      {/* ── Sidebar ── */}
      <Box
        component="aside"
        sx={{
          width: SIDEBAR_WIDTH,
          flexShrink: 0,
          height: '100vh',
          position: 'fixed',
          left: 0,
          top: 0,
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: (t) => t.palette.mode === 'dark' ? '#0d1b2a' : '#ffffff',
          borderRight: (t) => `1px solid ${t.palette.divider}`,
          boxShadow: '2px 0 8px rgba(0,0,0,0.06)',
          overflowY: 'auto',
          zIndex: 100,
        }}
      >
        {/* Logo / Branding */}
        <Box sx={{ px: 3, py: 2.5, display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box
            sx={{
              width: 36, height: 36, borderRadius: 2,
              background: 'linear-gradient(135deg, #0077B6, #00B4D8)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <ArticleIcon sx={{ color: 'white', fontSize: 20 }} />
          </Box>
          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
              Boletim
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Inteligente
            </Typography>
          </Box>
        </Box>

        <Divider />

        {/* Nav Items */}
        <Box sx={{ px: 2, py: 2, flex: 1 }}>
          <Typography
            variant="overline"
            sx={{ px: 1, mb: 1, display: 'block', color: 'text.disabled', fontSize: '0.65rem', fontWeight: 700 }}
          >
            Menu
          </Typography>

          <List disablePadding sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
            {navItems.map(({ label, icon, path }) => {
              const active = isActive(path)
              return (
                <ListItemButton
                  key={path}
                  selected={active}
                  onClick={() => router.push(path)}
                  sx={{
                    borderRadius: 2,
                    px: 1.5,
                    py: 1,
                    transition: 'all 0.15s',
                    ...(active && {
                      bgcolor: (t) => t.palette.mode === 'dark'
                        ? 'rgba(0, 180, 216, 0.15)'
                        : 'rgba(0, 119, 182, 0.08)',
                      '& .MuiListItemIcon-root': { color: '#0077B6' },
                      '& .MuiListItemText-primary': { color: '#0077B6', fontWeight: 600 },
                    }),
                    '&:hover': {
                      bgcolor: (t) => t.palette.mode === 'dark'
                        ? 'rgba(255,255,255,0.05)'
                        : 'rgba(0,0,0,0.04)',
                    },
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 38, color: 'text.secondary', '& svg': { fontSize: 20 } }}>
                    {icon}
                  </ListItemIcon>
                  <ListItemText
                    primary={label}
                    primaryTypographyProps={{ fontSize: '0.875rem' }}
                  />
                  {active && (
                    <Box sx={{ width: 4, height: 4, borderRadius: '50%', bgcolor: '#0077B6' }} />
                  )}
                </ListItemButton>
              )
            })}
          </List>

          {/* Botão Novo Boletim */}
          <Button
            variant="contained"
            fullWidth
            startIcon={<AddIcon />}
            sx={{
              mt: 3,
              background: 'linear-gradient(135deg, #0077B6, #00B4D8)',
              color: 'white',
              borderRadius: 2,
              fontWeight: 600,
              textTransform: 'none',
              boxShadow: '0 2px 8px rgba(0, 119, 182, 0.3)',
              '&:hover': { boxShadow: '0 4px 12px rgba(0, 119, 182, 0.45)' },
            }}
            onClick={() => router.push('/admin/boletins/novo')}
          >
            Novo Boletim
          </Button>
        </Box>

        <Divider />

        {/* Footer: Usuário */}
        <Box sx={{ px: 2, py: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, minWidth: 0 }}>
              <Avatar
                sx={{
                  width: 36, height: 36,
                  background: 'linear-gradient(135deg, #0077B6, #00B4D8)',
                  fontSize: '0.85rem', fontWeight: 700, flexShrink: 0,
                }}
              >
                {profile?.name?.charAt(0).toUpperCase() ?? 'U'}
              </Avatar>
              <Box sx={{ minWidth: 0 }}>
                <Typography variant="body2" noWrap sx={{ fontWeight: 600, lineHeight: 1.3 }}>
                  {profile?.name ?? 'Usuário'}
                </Typography>
                <Chip
                  label={roleLabels[profile?.role ?? 'viewer'] ?? profile?.role}
                  size="small"
                  color={roleColors[profile?.role ?? 'viewer'] ?? 'default'}
                  variant="outlined"
                  sx={{ height: 18, fontSize: '0.65rem', mt: 0.3 }}
                />
              </Box>
            </Box>
          </Box>

          <Box sx={{ display: 'flex', gap: 1 }}>
            <Tooltip title={mode === 'dark' ? 'Modo claro' : 'Modo escuro'}>
              <IconButton size="small" onClick={toggle} sx={{ flex: 1, borderRadius: 1.5, border: (t) => `1px solid ${t.palette.divider}` }}>
                {mode === 'dark' ? <Brightness7Icon fontSize="small" /> : <Brightness4Icon fontSize="small" />}
              </IconButton>
            </Tooltip>
            <Tooltip title="Notificações">
              <IconButton size="small" sx={{ flex: 1, borderRadius: 1.5, border: (t) => `1px solid ${t.palette.divider}` }}>
                <NotificationsNoneIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Sair">
              <IconButton size="small" onClick={signOut} sx={{ flex: 1, borderRadius: 1.5, border: (t) => `1px solid ${t.palette.divider}`, color: 'error.main' }}>
                <LogoutIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>
      </Box>

      {/* ── Conteúdo principal ── */}
      <Box
        component="main"
        sx={{ flex: 1, ml: `${SIDEBAR_WIDTH}px`, minHeight: '100vh', bgcolor: 'background.default' }}
      >
        {children}
      </Box>
    </Box>
  )
}
