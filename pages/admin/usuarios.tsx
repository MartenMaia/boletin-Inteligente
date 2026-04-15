import React, { useState } from 'react'
import useSWR, { mutate } from 'swr'
import {
  Box, Typography, Paper, Button, Table, TableHead, TableRow, TableCell,
  TableBody, IconButton, Tooltip, Dialog, DialogTitle, DialogContent,
  DialogActions, TextField, MenuItem, Chip, Skeleton, Snackbar, Alert,
  Divider, InputAdornment, Avatar, CircularProgress, Switch, FormControlLabel,
} from '@mui/material'
import AddIcon            from '@mui/icons-material/Add'
import EditIcon           from '@mui/icons-material/Edit'
import BlockIcon          from '@mui/icons-material/Block'
import CheckCircleIcon    from '@mui/icons-material/CheckCircle'
import PersonIcon         from '@mui/icons-material/Person'
import PersonOffIcon      from '@mui/icons-material/PersonOff'
import Visibility         from '@mui/icons-material/Visibility'
import VisibilityOff      from '@mui/icons-material/VisibilityOff'
import LockResetIcon      from '@mui/icons-material/LockReset'
import AdminLayout        from '../../components/AdminLayout'
import { useAuth }        from '../../hooks/useAuth'

const fetcher = (url: string) => fetch(url).then(r => r.json())

// 'suporte' é um perfil especial — não aparece nas opções de criação/edição
const ROLE_OPTIONS = [
  { value: 'admin',     label: 'Administrador' },
  { value: 'aprovador', label: 'Aprovador' },
  { value: 'viewer',    label: 'Visualizador' },
]

const ROLE_COLOR: Record<string, 'primary' | 'info' | 'warning' | 'default'> = {
  admin:     'primary',
  suporte:   'info',
  aprovador: 'warning',
  viewer:    'default',
}

const ROLE_LABEL: Record<string, string> = {
  admin:     'Administrador',
  suporte:   'Suporte',
  aprovador: 'Aprovador',
  viewer:    'Visualizador',
}

function getInitials(name: string | null): string {
  if (!name) return '?'
  return name.split(' ').slice(0, 2).map(p => p[0]).join('').toUpperCase()
}

const EMPTY_FORM = {
  name:     '',
  email:    '',
  password: '',
  role:     'viewer' as string,
}

export default function Usuarios() {
  const { profile: me } = useAuth()
  const { data: usuarios, isLoading } = useSWR('/api/usuarios', fetcher)

  const [modal, setModal]               = useState(false)
  const [editing, setEditing]           = useState<any>(null)
  const [saving, setSaving]             = useState(false)
  const [showPass, setShowPass]         = useState(false)
  const [changePass, setChangePass]     = useState(false)
  const [form, setForm]                 = useState({ ...EMPTY_FORM })
  const [confirmToggle, setConfirmToggle] = useState<any>(null)  // { user, action: 'inativar'|'reativar' }
  const [toggling, setToggling]         = useState(false)
  const [showInativos, setShowInativos] = useState(false)

  const [snack, setSnack] = useState<{ open: boolean; message: string; severity: 'success' | 'error' | 'info' }>({
    open: false, message: '', severity: 'success',
  })
  const showSnack = (message: string, severity: typeof snack.severity = 'success') =>
    setSnack({ open: true, message, severity })

  const patchForm = (key: string, value: any) => setForm(f => ({ ...f, [key]: value }))

  const canManage    = me?.role === 'admin' || me?.role === 'suporte'
  const canDeactivate = me?.role === 'admin' || me?.role === 'suporte'

  // ── Filtros de visibilidade ────────────────────────────────────────
  const visibleUsuarios = (usuarios || []).filter((u: any) => {
    // Admin não vê usuários de suporte
    if (me?.role === 'admin' && u.role === 'suporte') return false
    // Ocultar inativos quando o toggle está desligado
    if (!showInativos && !u.ativo) return false
    return true
  })

  const totalInativos = (usuarios || []).filter((u: any) => {
    if (me?.role === 'admin' && u.role === 'suporte') return false
    return !u.ativo
  }).length

  // ── Abrir modal ────────────────────────────────────────────────────
  const openNew = () => {
    setEditing(null)
    setForm({ ...EMPTY_FORM })
    setShowPass(false)
    setChangePass(false)
    setModal(true)
  }

  const openEdit = (u: any) => {
    setEditing(u)
    setForm({ name: u.name || '', email: u.email || '', password: '', role: u.role })
    setShowPass(false)
    setChangePass(false)
    setModal(true)
  }

  // ── Salvar ─────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!form.name.trim()) return showSnack('Nome é obrigatório', 'error')
    if (!editing && !form.email.trim())    return showSnack('E-mail é obrigatório', 'error')
    if (!editing && !form.password.trim()) return showSnack('Senha é obrigatória', 'error')
    if (!editing && form.password.length < 8)
      return showSnack('A senha deve ter pelo menos 8 caracteres', 'error')
    if (changePass && form.password && form.password.length < 8)
      return showSnack('A nova senha deve ter pelo menos 8 caracteres', 'error')

    setSaving(true)
    try {
      const url    = editing ? `/api/usuarios/${editing.id}` : '/api/usuarios'
      const method = editing ? 'PATCH' : 'POST'
      const body: Record<string, any> = { name: form.name.trim(), role: form.role }

      if (!editing) {
        body.email    = form.email.trim()
        body.password = form.password
      } else if (changePass && form.password.trim()) {
        body.password = form.password
      }

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || 'Erro ao salvar')
      }

      await mutate('/api/usuarios')
      setModal(false)
      showSnack(editing ? 'Usuário atualizado!' : 'Usuário criado com sucesso!')
    } catch (e: any) {
      showSnack(e.message, 'error')
    } finally {
      setSaving(false)
    }
  }

  // ── Inativar / Reativar ────────────────────────────────────────────
  const handleToggleAtivo = async () => {
    if (!confirmToggle) return
    const { user, action } = confirmToggle
    setToggling(true)
    try {
      const res = await fetch(`/api/usuarios/${user.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ativo: action === 'reativar' }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || 'Erro ao atualizar')
      }
      await mutate('/api/usuarios')
      showSnack(action === 'reativar' ? 'Usuário reativado com sucesso!' : 'Usuário inativado. O acesso foi removido.')
    } catch (e: any) {
      showSnack(e.message, 'error')
    } finally {
      setToggling(false)
      setConfirmToggle(null)
    }
  }

  // ── Guard: só admin e suporte acessam esta página ──────────────────
  if (me && !canManage) {
    return (
      <AdminLayout>
        <Box sx={{ py: 10, textAlign: 'center' }}>
          <PersonIcon sx={{ fontSize: 56, color: 'text.disabled', display: 'block', mx: 'auto', mb: 2 }} />
          <Typography variant="h6" color="text.secondary">Acesso restrito</Typography>
          <Typography variant="body2" color="text.disabled" sx={{ mt: 1 }}>
            Apenas Administradores e Suporte podem gerenciar usuários.
          </Typography>
        </Box>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <Box sx={{ p: 3 }}>

        {/* Header */}
        <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 2 }}>
          <Box>
            <Typography variant="h5" fontWeight={700}>Usuários</Typography>
            <Typography variant="body2" color="text.secondary">
              Gerencie os usuários e perfis de acesso do sistema
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            {totalInativos > 0 && (
              <FormControlLabel
                control={
                  <Switch
                    size="small"
                    checked={showInativos}
                    onChange={e => setShowInativos(e.target.checked)}
                  />
                }
                label={
                  <Typography variant="body2" color="text.secondary">
                    Mostrar inativos {showInativos && `(${totalInativos})`}
                  </Typography>
                }
              />
            )}
            <Button
              variant="contained" startIcon={<AddIcon />} onClick={openNew}
              sx={{ background: 'linear-gradient(135deg, #0077B6, #00B4D8)', fontWeight: 600, textTransform: 'none', borderRadius: 2 }}
            >
              Novo Usuário
            </Button>
          </Box>
        </Box>

        {/* Tabela */}
        <Paper elevation={0} sx={{ border: (t) => `1px solid ${t.palette.divider}`, borderRadius: 3, overflow: 'hidden' }}>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: (t) => t.palette.mode === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)' }}>
                <TableCell sx={{ fontWeight: 600, py: 1.5, pl: 3 }}>Usuário</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Perfil</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Cadastrado em</TableCell>
                <TableCell sx={{ fontWeight: 600 }} align="right">Ações</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {isLoading
                ? Array.from({ length: 4 }).map((_, i) => (
                  <TableRow key={i}>
                    {[1, 2, 3, 4, 5].map(j => <TableCell key={j}><Skeleton /></TableCell>)}
                  </TableRow>
                ))
                : visibleUsuarios.length === 0
                  ? (
                    <TableRow>
                      <TableCell colSpan={5} align="center" sx={{ py: 8 }}>
                        <PersonIcon sx={{ fontSize: 48, color: 'text.disabled', display: 'block', mx: 'auto', mb: 1 }} />
                        <Typography color="text.secondary">Nenhum usuário encontrado</Typography>
                      </TableCell>
                    </TableRow>
                  )
                  : visibleUsuarios.map((u: any) => {
                    const isInativo = !u.ativo
                    return (
                      <TableRow
                        key={u.id}
                        hover
                        sx={{
                          opacity: isInativo ? 0.55 : 1,
                          bgcolor: u.id === me?.id
                            ? (t) => t.palette.mode === 'dark' ? 'rgba(0,180,216,0.05)' : 'rgba(0,119,182,0.04)'
                            : undefined,
                        }}
                      >
                        <TableCell sx={{ pl: 3 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                            <Avatar
                              sx={{
                                width: 34, height: 34, fontSize: '0.8rem',
                                bgcolor: isInativo ? 'action.disabled' : 'primary.main',
                              }}
                            >
                              {isInativo ? <PersonOffIcon sx={{ fontSize: 18 }} /> : getInitials(u.name)}
                            </Avatar>
                            <Box>
                              <Typography
                                variant="body2"
                                fontWeight={600}
                                sx={{ textDecoration: isInativo ? 'line-through' : 'none', color: isInativo ? 'text.disabled' : 'text.primary' }}
                              >
                                {u.name || '—'}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">{u.email}</Typography>
                            </Box>
                            {u.id === me?.id && (
                              <Chip label="você" size="small" sx={{ height: 18, fontSize: '0.65rem' }} />
                            )}
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={ROLE_LABEL[u.role] ?? u.role}
                            color={isInativo ? 'default' : (ROLE_COLOR[u.role] ?? 'default')}
                            size="small"
                            variant={isInativo ? 'outlined' : 'filled'}
                            sx={{ fontWeight: 600, fontSize: '0.7rem', height: 22 }}
                          />
                        </TableCell>
                        <TableCell>
                          {isInativo ? (
                            <Tooltip title={u.inativado_em ? `Inativado em ${new Date(u.inativado_em).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}` : 'Inativado'}>
                              <Chip
                                icon={<BlockIcon sx={{ fontSize: '14px !important' }} />}
                                label="Inativo"
                                size="small"
                                color="error"
                                variant="outlined"
                                sx={{ fontSize: '0.7rem', height: 22, cursor: 'help' }}
                              />
                            </Tooltip>
                          ) : (
                            <Chip
                              icon={<CheckCircleIcon sx={{ fontSize: '14px !important' }} />}
                              label="Ativo"
                              size="small"
                              color="success"
                              variant="outlined"
                              sx={{ fontSize: '0.7rem', height: 22 }}
                            />
                          )}
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" color="text.secondary">
                            {new Date(u.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}
                          </Typography>
                        </TableCell>
                        <TableCell align="right" sx={{ pr: 2 }}>
                          {!isInativo && (
                            <Tooltip title="Editar usuário">
                              <IconButton size="small" onClick={() => openEdit(u)}>
                                <EditIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          )}
                          {canDeactivate && u.id !== me?.id && (
                            isInativo ? (
                              <Tooltip title="Reativar acesso">
                                <IconButton
                                  size="small"
                                  color="success"
                                  onClick={() => setConfirmToggle({ user: u, action: 'reativar' })}
                                >
                                  <CheckCircleIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            ) : (
                              <Tooltip title="Inativar usuário">
                                <IconButton
                                  size="small"
                                  color="error"
                                  onClick={() => setConfirmToggle({ user: u, action: 'inativar' })}
                                >
                                  <BlockIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            )
                          )}
                        </TableCell>
                      </TableRow>
                    )
                  })
              }
            </TableBody>
          </Table>
        </Paper>
      </Box>

      {/* ── Modal criar / editar ─────────────────────────────────────── */}
      <Dialog open={modal} onClose={() => !saving && setModal(false)} fullWidth maxWidth="sm">
        <DialogTitle sx={{ fontWeight: 700 }}>
          {editing ? 'Editar Usuário' : 'Novo Usuário'}
        </DialogTitle>
        <Divider />
        <DialogContent sx={{ pt: 3 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>

            <TextField
              label="Nome completo *" fullWidth value={form.name}
              onChange={e => patchForm('name', e.target.value)}
              disabled={saving} autoFocus
            />

            {!editing && (
              <TextField
                label="E-mail *" type="email" fullWidth value={form.email}
                onChange={e => patchForm('email', e.target.value)}
                disabled={saving}
              />
            )}

            {editing && (
              <TextField
                label="E-mail" fullWidth value={form.email} disabled
                helperText="O e-mail não pode ser alterado por aqui"
                sx={{ '& .MuiInputBase-root': { bgcolor: (t) => t.palette.mode === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.04)' } }}
              />
            )}

            {/* Perfil suporte é somente leitura — não pode ser editado aqui */}
            {editing?.role === 'suporte' ? (
              <Box
                sx={{
                  border: (t) => `1px solid ${t.palette.divider}`,
                  borderRadius: 1, px: 1.75, py: 1.25,
                  bgcolor: (t) => t.palette.mode === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.04)',
                }}
              >
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                  Perfil de acesso
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Chip label="Suporte" color="info" size="small" sx={{ fontWeight: 600, fontSize: '0.75rem' }} />
                  <Typography variant="caption" color="text.disabled">
                    Este perfil é exclusivo e não pode ser alterado
                  </Typography>
                </Box>
              </Box>
            ) : (
              <TextField
                select label="Perfil de acesso *" value={form.role}
                onChange={e => patchForm('role', e.target.value)}
                disabled={saving} fullWidth
                helperText={
                  form.role === 'admin'       ? 'Acesso total ao sistema, incluindo configurações avançadas'
                  : form.role === 'aprovador' ? 'Pode criar, editar e aprovar boletins'
                  : 'Somente visualização de boletins publicados'
                }
              >
                {ROLE_OPTIONS.map(r => (
                  <MenuItem key={r.value} value={r.value}>{r.label}</MenuItem>
                ))}
              </TextField>
            )}

            {!editing && (
              <TextField
                label="Senha *" type={showPass ? 'text' : 'password'} fullWidth
                value={form.password} onChange={e => patchForm('password', e.target.value)}
                disabled={saving} helperText="Mínimo 8 caracteres"
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

            {editing && (
              <Box>
                {!changePass ? (
                  <Button
                    size="small" variant="outlined"
                    startIcon={<LockResetIcon fontSize="small" />}
                    onClick={() => setChangePass(true)}
                    sx={{ textTransform: 'none' }}
                  >
                    Alterar senha
                  </Button>
                ) : (
                  <TextField
                    label="Nova senha" type={showPass ? 'text' : 'password'} fullWidth
                    value={form.password} onChange={e => patchForm('password', e.target.value)}
                    disabled={saving} helperText="Deixe em branco para manter a senha atual"
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
              </Box>
            )}
          </Box>
        </DialogContent>
        <Divider />
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setModal(false)} disabled={saving} sx={{ textTransform: 'none' }}>
            Cancelar
          </Button>
          <Button
            variant="contained" onClick={handleSave} disabled={saving || !form.name.trim()}
            sx={{ background: 'linear-gradient(135deg, #0077B6, #00B4D8)', textTransform: 'none', minWidth: 120 }}
          >
            {saving ? <CircularProgress size={18} color="inherit" /> : editing ? 'Salvar' : 'Criar Usuário'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Confirmar inativação / reativação ───────────────────────── */}
      <Dialog open={!!confirmToggle} onClose={() => !toggling && setConfirmToggle(null)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>
          {confirmToggle?.action === 'reativar' ? 'Reativar usuário?' : 'Inativar usuário?'}
        </DialogTitle>
        <DialogContent>
          {confirmToggle?.action === 'reativar' ? (
            <Typography>
              Deseja reativar o acesso de <strong>{confirmToggle?.user?.name || confirmToggle?.user?.email}</strong>?
              O usuário poderá voltar a fazer login no sistema.
            </Typography>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              <Typography>
                Deseja inativar <strong>{confirmToggle?.user?.name || confirmToggle?.user?.email}</strong>?
              </Typography>
              <Alert severity="warning" sx={{ borderRadius: 2 }}>
                O usuário perderá o acesso imediatamente e não poderá fazer login.
                O registro será mantido no banco de dados.
              </Alert>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setConfirmToggle(null)} disabled={toggling} sx={{ textTransform: 'none' }}>
            Cancelar
          </Button>
          <Button
            variant="contained"
            color={confirmToggle?.action === 'reativar' ? 'success' : 'error'}
            onClick={handleToggleAtivo}
            disabled={toggling}
            startIcon={toggling ? undefined : confirmToggle?.action === 'reativar' ? <CheckCircleIcon /> : <BlockIcon />}
            sx={{ textTransform: 'none' }}
          >
            {toggling
              ? <CircularProgress size={18} color="inherit" />
              : confirmToggle?.action === 'reativar' ? 'Reativar' : 'Inativar'
            }
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={snack.open} autoHideDuration={4500} onClose={() => setSnack(s => ({ ...s, open: false }))}>
        <Alert severity={snack.severity} variant="filled">{snack.message}</Alert>
      </Snackbar>
    </AdminLayout>
  )
}
