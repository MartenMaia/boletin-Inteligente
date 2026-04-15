import React, { ReactNode, useState } from 'react'
import {
  Box, Typography, List, ListItemButton, ListItemIcon, ListItemText,
  Button, Avatar, IconButton, Tooltip, Chip, Divider,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField,
  MenuItem, InputAdornment, CircularProgress, Alert,
} from '@mui/material'
import HomeIcon            from '@mui/icons-material/Home'
import ArticleIcon         from '@mui/icons-material/Article'
import GroupsIcon          from '@mui/icons-material/Groups'
import SettingsIcon        from '@mui/icons-material/Settings'
import RepeatIcon          from '@mui/icons-material/Repeat'
import ManageAccountsIcon  from '@mui/icons-material/ManageAccounts'
import AddIcon             from '@mui/icons-material/Add'
import LogoutIcon          from '@mui/icons-material/Logout'
import EditIcon            from '@mui/icons-material/Edit'
import Brightness4Icon     from '@mui/icons-material/Brightness4'
import Brightness7Icon     from '@mui/icons-material/Brightness7'
import NotificationsNoneIcon from '@mui/icons-material/NotificationsNone'
import LockResetIcon       from '@mui/icons-material/LockReset'
import Visibility          from '@mui/icons-material/Visibility'
import VisibilityOff       from '@mui/icons-material/VisibilityOff'
import { useRouter }       from 'next/router'
import { useThemeContext } from '../context/ThemeContext'
import { useAuth }         from '../hooks/useAuth'

const SIDEBAR_WIDTH = 260

const NAV_ITEMS_BASE = [
  { label: 'Visão Geral',   icon: <HomeIcon />,           path: '/admin',             roles: null },
  { label: 'Boletins',      icon: <ArticleIcon />,        path: '/admin/boletins',    roles: null },
  { label: 'Recorrência',   icon: <RepeatIcon />,         path: '/admin/recorrencia', roles: null },
  { label: 'Grupos',        icon: <GroupsIcon />,         path: '/admin/grupos',      roles: null },
  { label: 'Usuários',      icon: <ManageAccountsIcon />, path: '/admin/usuarios',    roles: ['admin', 'suporte'] },
  { label: 'Configurações', icon: <SettingsIcon />,       path: '/admin/settings',    roles: ['admin', 'suporte'] },
]

const roleLabels: Record<string, string> = {
  admin:     'Administrador',
  aprovador: 'Aprovador',
  suporte:   'Suporte',
  viewer:    'Visualizador',
}

const roleColors: Record<string, 'default' | 'primary' | 'secondary' | 'warning' | 'info'> = {
  admin:     'primary',
  aprovador: 'warning',
  suporte:   'info',
  viewer:    'default',
}

const ROLE_OPTIONS = [
  { value: 'admin',     label: 'Administrador' },
  { value: 'aprovador', label: 'Aprovador' },
  { value: 'viewer',    label: 'Visualizador' },
]

// ── Modal de edição do próprio perfil ─────────────────────────────
function EditProfileModal({
  open,
  onClose,
  profile,
  onSaved,
}: {
  open: boolean
  onClose: () => void
  profile: any
  onSaved: () => void
}) {
  const canEditRole = profile?.role === 'admin' || profile?.role === 'suporte'

  const [name, setName]           = useState(profile?.name ?? '')
  const [role, setRole]           = useState(profile?.role ?? 'viewer')
  const [password, setPassword]   = useState('')
  const [showPass, setShowPass]   = useState(false)
  const [changePass, setChangePass] = useState(false)
  const [saving, setSaving]       = useState(false)
  const [error, setError]         = useState('')

  // Sincronizar quando o modal abre
  React.useEffect(() => {
    if (open) {
      setName(profile?.name ?? '')
      setRole(profile?.role ?? 'viewer')
      setPassword('')
      setShowPass(false)
      setChangePass(false)
      setError('')
    }
  }, [open, profile])

  const handleSave = async () => {
    if (!name.trim()) { setError('O nome é obrigatório'); return }
    if (changePass && password && password.length < 8) {
      setError('A senha deve ter pelo menos 8 caracteres')
      return
    }
    setSaving(true)
    setError('')
    try {
      const body: Record<string, any> = { name: name.trim() }
      if (canEditRole)                     body.role = role
      if (changePass && password.trim())   body.password = password

      const res = await fetch(`/api/usuarios/${profile.id}`, {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(body),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || 'Erro ao salvar')
      }
      onSaved()
      onClose()
    } catch (e: any) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onClose={() => !saving && onClose()} fullWidth maxWidth="xs">
      <DialogTitle sx={{ fontWeight: 700, pb: 1 }}>Meu Perfil</DialogTitle>
      <Divider />
      <DialogContent sx={{ pt: 2.5 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>

          {/* Avatar + e-mail (só leitura) */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar
              sx={{
                width: 52, height: 52, fontSize: '1.2rem', fontWeight: 700,
                background: 'linear-gradient(135deg, #0077B6, #00B4D8)',
              }}
            >
              {name.charAt(0).toUpperCase() || '?'}
            </Avatar>
            <Box>
              <Typography variant="body2" fontWeight={600}>{name || '—'}</Typography>
              <Typography variant="caption" color="text.secondary">{profile?.email}</Typography>
            </Box>
          </Box>

          {/* Nome */}
          <TextField
            label="Nome completo"
            fullWidth
            value={name}
            onChange={e => setName(e.target.value)}
            disabled={saving}
            autoFocus
          />

          {/* Perfil — editável só para admin/suporte */}
          {canEditRole ? (
            <TextField
              select
              label="Perfil de acesso"
              value={role}
              onChange={e => setRole(e.target.value)}
              disabled={saving}
              fullWidth
            >
              {ROLE_OPTIONS.map(r => (
                <MenuItem key={r.value} value={r.value}>{r.label}</MenuItem>
              ))}
            </TextField>
          ) : (
            <Box>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                Perfil de acesso
              </Typography>
              <Chip
                label={roleLabels[profile?.role] ?? profile?.role}
                color={roleColors[profile?.role] ?? 'default'}
                size="small"
                sx={{ fontWeight: 600 }}
              />
              <Typography variant="caption" color="text.disabled" sx={{ display: 'block', mt: 0.5 }}>
                Apenas administradores podem alterar o perfil
              </Typography>
            </Box>
          )}

          {/* Alterar senha */}
          {!changePass ? (
            <Button
              size="small"
              variant="outlined"
              startIcon={<LockResetIcon fontSize="small" />}
              onClick={() => setChangePass(true)}
              sx={{ textTransform: 'none', alignSelf: 'flex-start' }}
            >
              Alterar senha
            </Button>
          ) : (
            <TextField
              label="Nova senha"
              type={showPass ? 'text' : 'password'}
              fullWidth
              value={password}
              onChange={e => setPassword(e.target.value)}
              disabled={saving}
              helperText="Mínimo 8 caracteres. Deixe em branco para não alterar."
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton size="small" onClick={() => setShowPass(v => !v)}>
                      {showPass ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
          )}

          {error && <Alert severity="error" sx={{ borderRadius: 2 }}>{error}</Alert>}
        </Box>
      </DialogContent>
      <Divider />
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose} disabled={saving} sx={{ textTransform: 'none' }}>
          Cancelar
        </Button>
        <Button
          variant="contained"
          onClick={handleSave}
          disabled={saving || !name.trim()}
          sx={{ background: 'linear-gradient(135deg, #0077B6, #00B4D8)', textTransform: 'none', minWidth: 100 }}
        >
          {saving ? <CircularProgress size={18} color="inherit" /> : 'Salvar'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

// ── Layout principal ───────────────────────────────────────────────
export default function AdminLayout({ children }: { children: ReactNode }) {
  const router = useRouter()
  const { mode, toggle } = useThemeContext()
  const { profile, signOut, refreshProfile } = useAuth()
  const [editOpen, setEditOpen] = useState(false)

  const isActive = (path: string) =>
    path === '/admin' ? router.pathname === '/admin' : router.pathname.startsWith(path)

  const navItems = NAV_ITEMS_BASE.filter(item =>
    !item.roles || (profile?.role && item.roles.includes(profile.role))
  )

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
        {/* Logo */}
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
            <Typography variant="subtitle1" sx={{ fontWeight: 700, lineHeight: 1.2 }}>Boletim</Typography>
            <Typography variant="caption" color="text.secondary">Inteligente</Typography>
          </Box>
        </Box>

        <Divider />

        {/* Nav */}
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
                    borderRadius: 2, px: 1.5, py: 1, transition: 'all 0.15s',
                    ...(active && {
                      bgcolor: (t) => t.palette.mode === 'dark' ? 'rgba(0,180,216,0.15)' : 'rgba(0,119,182,0.08)',
                      '& .MuiListItemIcon-root': { color: '#0077B6' },
                      '& .MuiListItemText-primary': { color: '#0077B6', fontWeight: 600 },
                    }),
                    '&:hover': {
                      bgcolor: (t) => t.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
                    },
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 38, color: 'text.secondary', '& svg': { fontSize: 20 } }}>
                    {icon}
                  </ListItemIcon>
                  <ListItemText primary={label} primaryTypographyProps={{ fontSize: '0.875rem' }} />
                  {active && <Box sx={{ width: 4, height: 4, borderRadius: '50%', bgcolor: '#0077B6' }} />}
                </ListItemButton>
              )
            })}
          </List>
        </Box>

        {/* Novo Boletim — fixo acima do usuário */}
        <Box sx={{ px: 2, pb: 2 }}>
          <Button
            variant="contained" fullWidth startIcon={<AddIcon />}
            sx={{
              background: 'linear-gradient(135deg, #0077B6, #00B4D8)',
              color: 'white', borderRadius: 2, fontWeight: 600, textTransform: 'none',
              boxShadow: '0 2px 8px rgba(0,119,182,0.3)',
              '&:hover': { boxShadow: '0 4px 12px rgba(0,119,182,0.45)' },
            }}
            onClick={() => router.push('/admin/boletins/novo')}
          >
            Novo Boletim
          </Button>
        </Box>

        <Divider />

        {/* ── Footer: usuário ── */}
        <Box sx={{ px: 2, py: 2 }}>
          <Tooltip title="Editar meu perfil" placement="top" arrow>
            <Box
              onClick={() => setEditOpen(true)}
              sx={{
                display: 'flex', alignItems: 'center', gap: 1.5,
                mb: 1.5, p: 1, borderRadius: 2, cursor: 'pointer',
                transition: 'all 0.15s',
                '&:hover': {
                  bgcolor: (t) => t.palette.mode === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
                  '& .edit-hint': { opacity: 1 },
                },
              }}
            >
              <Box sx={{ position: 'relative', flexShrink: 0 }}>
                <Avatar
                  sx={{
                    width: 36, height: 36,
                    background: 'linear-gradient(135deg, #0077B6, #00B4D8)',
                    fontSize: '0.85rem', fontWeight: 700,
                  }}
                >
                  {profile?.name?.charAt(0).toUpperCase() ?? 'U'}
                </Avatar>
                {/* Ícone de edição aparece no hover */}
                <Box
                  className="edit-hint"
                  sx={{
                    position: 'absolute', inset: 0, borderRadius: '50%',
                    bgcolor: 'rgba(0,0,0,0.45)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    opacity: 0, transition: 'opacity 0.15s',
                  }}
                >
                  <EditIcon sx={{ fontSize: 14, color: 'white' }} />
                </Box>
              </Box>

              <Box sx={{ minWidth: 0, flex: 1 }}>
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
          </Tooltip>

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

      {/* ── Modal editar próprio perfil ── */}
      {profile && (
        <EditProfileModal
          open={editOpen}
          onClose={() => setEditOpen(false)}
          profile={profile}
          onSaved={refreshProfile}
        />
      )}
    </Box>
  )
}
