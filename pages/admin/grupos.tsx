import React, { useState } from 'react'
import useSWR, { mutate } from 'swr'
import {
  Box, Typography, Paper, Button, Tabs, Tab, Table, TableHead,
  TableRow, TableCell, TableBody, IconButton, Tooltip, Dialog,
  DialogTitle, DialogContent, DialogActions, TextField, Checkbox,
  Chip, Skeleton, Snackbar, Alert, Divider, List,
  ListItemText, ListItemButton, ListItemIcon, CircularProgress,
  InputAdornment, Avatar,
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import EditIcon from '@mui/icons-material/Edit'
import PeopleIcon from '@mui/icons-material/People'
import PersonIcon from '@mui/icons-material/Person'
import PersonAddIcon from '@mui/icons-material/PersonAdd'
import SearchIcon from '@mui/icons-material/Search'
import GroupIcon from '@mui/icons-material/Group'
import AdminLayout from '../../components/AdminLayout'

const fetcher = (url: string) => fetch(url).then(r => r.json())

function validateEmail(em: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em.trim())
}
function validatePhone(v: string) {
  const d = v.replace(/\D/g, '')
  if (d.length === 10) return /^[1-9]{2}\d{8}$/.test(d)
  if (d.length === 11) return /^[1-9]{2}9\d{8}$/.test(d)
  return false
}
function formatPhone(v: string) {
  const d = v.replace(/\D/g, '').slice(0, 11)
  if (d.length <= 2) return d
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`
}
function initials(name: string) {
  return name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase()
}

export default function Grupos() {
  const [tab, setTab] = useState(0)
  const [search, setSearch] = useState('')

  // ── Data ──
  const { data: grupos, isLoading: gruposLoading } = useSWR('/api/groups', fetcher)
  const { data: clientes, isLoading: clientesLoading } = useSWR('/api/clientes', fetcher)

  // ── Group modal ──
  const [groupModal, setGroupModal] = useState(false)
  const [editingGroup, setEditingGroup] = useState<any>(null)
  const [groupName, setGroupName] = useState('')
  const [groupDesc, setGroupDesc] = useState('')
  const [groupLoading, setGroupLoading] = useState(false)
  const [memberSearch, setMemberSearch] = useState('')
  const [selectedMembers, setSelectedMembers] = useState<string[]>([])

  // ── Cliente modal ──
  const [clienteModal, setClienteModal] = useState(false)
  const [editingCliente, setEditingCliente] = useState<any>(null)
  const [clienteLoading, setClienteLoading] = useState(false)
  const [nome, setNome] = useState('')
  const [telefone, setTelefone] = useState('')
  const [email, setEmail] = useState('')
  const [notes, setNotes] = useState('')

  // ── Snack ──
  const [snack, setSnack] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false, message: '', severity: 'success',
  })
  const showSnack = (message: string, severity: 'success' | 'error' = 'success') =>
    setSnack({ open: true, message, severity })

  // ──────────────────────────────────────────────────────────
  //  Group handlers
  // ──────────────────────────────────────────────────────────
  const openNewGroup = () => {
    setEditingGroup(null)
    setGroupName('')
    setGroupDesc('')
    setSelectedMembers([])
    setMemberSearch('')
    setGroupModal(true)
  }

  const openEditGroup = (g: any) => {
    setEditingGroup(g)
    setGroupName(g.name)
    setGroupDesc(g.description || '')
    setSelectedMembers(
      (g.members || []).filter((m: any) => m.cliente_id).map((m: any) => m.cliente_id)
    )
    setMemberSearch('')
    setGroupModal(true)
  }

  const handleSaveGroup = async () => {
    if (!groupName.trim()) return showSnack('Nome do grupo é obrigatório', 'error')
    setGroupLoading(true)
    try {
      // 1. Create or update group
      const url = editingGroup ? `/api/groups/${editingGroup.id}` : '/api/groups'
      const method = editingGroup ? 'PATCH' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: groupName.trim(), description: groupDesc.trim() || null }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || 'Erro ao salvar grupo')
      }
      const saved = await res.json()
      const groupId = saved.id ?? editingGroup?.id

      // 2. Sync members (only for existing clients)
      const existing: Array<{ id: string; cliente_id: string | null }> = editingGroup?.members || []
      const existingCids = existing.filter(m => m.cliente_id).map(m => m.cliente_id as string)
      const toAdd    = selectedMembers.filter(cid => !existingCids.includes(cid))
      const toRemove = existing.filter(m => m.cliente_id && !selectedMembers.includes(m.cliente_id))

      await Promise.all([
        ...toAdd.map(cliente_id =>
          fetch(`/api/groups/${groupId}/members`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ cliente_id }),
          })
        ),
        ...toRemove.map(m =>
          fetch(`/api/groups/${groupId}/members?memberId=${m.id}`, { method: 'DELETE' })
        ),
      ])

      await mutate('/api/groups')
      setGroupModal(false)
      showSnack(editingGroup ? 'Grupo atualizado!' : 'Grupo criado!')
    } catch (e: any) {
      showSnack(e.message || 'Erro ao salvar grupo', 'error')
    } finally {
      setGroupLoading(false)
    }
  }

  const toggleMember = (clienteId: string) =>
    setSelectedMembers(prev =>
      prev.includes(clienteId) ? prev.filter(id => id !== clienteId) : [...prev, clienteId]
    )

  // ──────────────────────────────────────────────────────────
  //  Cliente handlers
  // ──────────────────────────────────────────────────────────
  const openNewCliente = () => {
    setEditingCliente(null)
    setNome(''); setTelefone(''); setEmail(''); setNotes('')
    setClienteModal(true)
  }

  const openEditCliente = (c: any) => {
    setEditingCliente(c)
    setNome(c.name)
    setTelefone(c.phone ? formatPhone(c.phone) : '')
    setEmail(c.email || '')
    setNotes(c.notes || '')
    setClienteModal(true)
  }

  const handleSaveCliente = async () => {
    if (!nome.trim()) return showSnack('Nome é obrigatório', 'error')
    if (telefone && !validatePhone(telefone)) return showSnack('Telefone inválido. Ex: (11) 91234-5678', 'error')
    if (email && !validateEmail(email)) return showSnack('E-mail inválido', 'error')

    setClienteLoading(true)
    try {
      const url    = editingCliente ? `/api/clientes/${editingCliente.id}` : '/api/clientes'
      const method = editingCliente ? 'PATCH' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name:  nome.trim(),
          phone: telefone || null,
          email: email    || null,
          notes: notes    || null,
        }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || 'Erro ao salvar')
      }
      await mutate('/api/clientes')
      setClienteModal(false)
      showSnack(editingCliente ? `"${nome}" atualizado!` : `"${nome}" cadastrado com sucesso!`)
    } catch (e: any) {
      showSnack(e.message || 'Erro ao salvar', 'error')
    } finally {
      setClienteLoading(false)
    }
  }

  // ── Filtered lists ──
  const filteredGrupos = (grupos || []).filter((g: any) =>
    !search || g.name.toLowerCase().includes(search.toLowerCase())
  )
  const filteredClientes = (clientes || []).filter((c: any) =>
    !search || c.name.toLowerCase().includes(search.toLowerCase())
  )
  const filteredClientesForModal = (clientes || []).filter((c: any) =>
    !memberSearch ||
    c.name.toLowerCase().includes(memberSearch.toLowerCase()) ||
    (c.phone || '').includes(memberSearch)
  )

  return (
    <AdminLayout>
      <Box sx={{ p: 3 }}>

        {/* Header */}
        <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Box>
            <Typography variant="h5" fontWeight={700}>Grupos e Indivíduos</Typography>
            <Typography variant="body2" color="text.secondary">
              Gerencie grupos e destinatários dos boletins
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={tab === 0 ? openNewGroup : openNewCliente}
            sx={{
              background: 'linear-gradient(135deg, #0077B6, #00B4D8)',
              fontWeight: 600, textTransform: 'none', borderRadius: 2,
            }}
          >
            {tab === 0 ? 'Novo Grupo' : 'Novo Indivíduo'}
          </Button>
        </Box>

        <Paper elevation={0} sx={{ border: (t) => `1px solid ${t.palette.divider}`, borderRadius: 3, overflow: 'hidden' }}>

          {/* Tabs + Search */}
          <Box sx={{ px: 3, pt: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2 }}>
            <Tabs
              value={tab}
              onChange={(_, v) => { setTab(v); setSearch('') }}
              sx={{ '& .MuiTab-root': { textTransform: 'none', fontWeight: 600, minHeight: 40 } }}
            >
              <Tab label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                  <PeopleIcon sx={{ fontSize: 18 }} />
                  Grupos
                  {grupos && <Chip label={grupos.length} size="small" sx={{ height: 18, fontSize: '0.65rem', ml: 0.5 }} />}
                </Box>
              } />
              <Tab label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                  <PersonIcon sx={{ fontSize: 18 }} />
                  Indivíduos
                  {clientes && <Chip label={clientes.length} size="small" sx={{ height: 18, fontSize: '0.65rem', ml: 0.5 }} />}
                </Box>
              } />
            </Tabs>
            <TextField
              size="small" placeholder="Buscar..." value={search}
              onChange={(e) => setSearch(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon fontSize="small" sx={{ color: 'text.disabled' }} />
                  </InputAdornment>
                ),
              }}
              sx={{ width: 220 }}
            />
          </Box>
          <Divider sx={{ mt: 1 }} />

          {/* ── Tab: Grupos ── */}
          {tab === 0 && (
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: (t) => t.palette.mode === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)' }}>
                  <TableCell sx={{ fontWeight: 600, py: 1.5, pl: 3 }}>Nome</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Descrição</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Membros</TableCell>
                  <TableCell sx={{ fontWeight: 600 }} align="right">Ações</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {gruposLoading
                  ? Array.from({ length: 4 }).map((_, i) => (
                    <TableRow key={i}>{[1,2,3,4].map(j => <TableCell key={j}><Skeleton /></TableCell>)}</TableRow>
                  ))
                  : filteredGrupos.length === 0
                    ? (
                      <TableRow>
                        <TableCell colSpan={4} align="center" sx={{ py: 6 }}>
                          <GroupIcon sx={{ fontSize: 40, color: 'text.disabled', display: 'block', mx: 'auto', mb: 1 }} />
                          <Typography color="text.secondary">Nenhum grupo encontrado</Typography>
                          <Button size="small" startIcon={<AddIcon />} onClick={openNewGroup}
                            sx={{ mt: 1.5, textTransform: 'none' }}>
                            Criar primeiro grupo
                          </Button>
                        </TableCell>
                      </TableRow>
                    )
                    : filteredGrupos.map((g: any) => (
                      <TableRow key={g.id} hover>
                        <TableCell sx={{ pl: 3 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                            <Avatar sx={{ width: 32, height: 32, fontSize: '0.75rem', bgcolor: 'primary.main', opacity: 0.85 }}>
                              {initials(g.name)}
                            </Avatar>
                            <Typography fontWeight={500}>{g.name}</Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" color="text.secondary">{g.description || '—'}</Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            icon={<PeopleIcon sx={{ fontSize: '14px !important' }} />}
                            label={`${g.members?.length ?? 0} membros`}
                            size="small" variant="outlined"
                            sx={{ fontSize: '0.7rem', height: 22 }}
                          />
                        </TableCell>
                        <TableCell align="right" sx={{ pr: 2 }}>
                          <Tooltip title="Editar grupo e membros">
                            <IconButton size="small" onClick={() => openEditGroup(g)}>
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    ))
                }
              </TableBody>
            </Table>
          )}

          {/* ── Tab: Indivíduos ── */}
          {tab === 1 && (
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: (t) => t.palette.mode === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)' }}>
                  <TableCell sx={{ fontWeight: 600, py: 1.5, pl: 3 }}>Nome</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Telefone</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>E-mail</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Observações</TableCell>
                  <TableCell sx={{ fontWeight: 600 }} align="right">Ações</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {clientesLoading
                  ? Array.from({ length: 4 }).map((_, i) => (
                    <TableRow key={i}>{[1,2,3,4,5].map(j => <TableCell key={j}><Skeleton /></TableCell>)}</TableRow>
                  ))
                  : filteredClientes.length === 0
                    ? (
                      <TableRow>
                        <TableCell colSpan={5} align="center" sx={{ py: 6 }}>
                          <PersonAddIcon sx={{ fontSize: 40, color: 'text.disabled', display: 'block', mx: 'auto', mb: 1 }} />
                          <Typography color="text.secondary">Nenhum indivíduo cadastrado</Typography>
                          <Button size="small" startIcon={<AddIcon />} onClick={openNewCliente}
                            sx={{ mt: 1.5, textTransform: 'none' }}>
                            Cadastrar primeiro indivíduo
                          </Button>
                        </TableCell>
                      </TableRow>
                    )
                    : filteredClientes.map((c: any) => (
                      <TableRow key={c.id} hover>
                        <TableCell sx={{ pl: 3 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                            <Avatar sx={{ width: 32, height: 32, fontSize: '0.75rem', bgcolor: 'secondary.main', opacity: 0.8 }}>
                              {initials(c.name)}
                            </Avatar>
                            <Typography fontWeight={500}>{c.name}</Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" color="text.secondary">{c.phone || '—'}</Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" color="text.secondary">{c.email || '—'}</Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" color="text.secondary" noWrap sx={{ maxWidth: 180 }}>
                            {c.notes || '—'}
                          </Typography>
                        </TableCell>
                        <TableCell align="right" sx={{ pr: 2 }}>
                          <Tooltip title="Editar indivíduo">
                            <IconButton size="small" onClick={() => openEditCliente(c)}>
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    ))
                }
              </TableBody>
            </Table>
          )}
        </Paper>
      </Box>

      {/* ──────────────────────────────────────────────────────
          Modal: Grupo (criar / editar)
      ────────────────────────────────────────────────────── */}
      <Dialog open={groupModal} onClose={() => !groupLoading && setGroupModal(false)} fullWidth maxWidth="md">
        <DialogTitle sx={{ fontWeight: 700, pb: 1 }}>
          {editingGroup ? `Editar: ${editingGroup.name}` : 'Novo Grupo'}
        </DialogTitle>
        <Divider />

        <DialogContent sx={{ pt: 2.5, pb: 0 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mb: 3 }}>
            <TextField
              label="Nome do grupo *" fullWidth value={groupName}
              onChange={(e) => setGroupName(e.target.value)} autoFocus
            />
            <TextField
              label="Descrição" fullWidth value={groupDesc}
              onChange={(e) => setGroupDesc(e.target.value)} multiline rows={2}
            />
          </Box>

          {/* Member selection */}
          <Box sx={{ mb: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography variant="subtitle2" fontWeight={600} color="text.secondary">
              MEMBROS DO GRUPO
            </Typography>
            {selectedMembers.length > 0 && (
              <Chip
                label={`${selectedMembers.length} selecionado${selectedMembers.length > 1 ? 's' : ''}`}
                size="small" color="primary"
                sx={{ fontWeight: 600, height: 22, fontSize: '0.7rem' }}
              />
            )}
          </Box>

          <TextField
            fullWidth size="small" placeholder="Buscar por nome ou telefone..."
            value={memberSearch} onChange={(e) => setMemberSearch(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" sx={{ color: 'text.disabled' }} />
                </InputAdornment>
              ),
            }}
            sx={{ mb: 1 }}
          />

          {clientesLoading ? (
            <Box sx={{ py: 2 }}><Skeleton /><Skeleton /><Skeleton /></Box>
          ) : (clientes || []).length === 0 ? (
            <Box sx={{ py: 4, textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                Nenhum indivíduo cadastrado. Cadastre-os na aba "Indivíduos" primeiro.
              </Typography>
            </Box>
          ) : (
            <Paper variant="outlined" sx={{ maxHeight: 260, overflowY: 'auto', borderRadius: 1.5 }}>
              {filteredClientesForModal.length === 0 ? (
                <Box sx={{ py: 3, textAlign: 'center' }}>
                  <Typography variant="body2" color="text.secondary">
                    Nenhum resultado para "{memberSearch}"
                  </Typography>
                </Box>
              ) : (
                <List dense disablePadding>
                  {filteredClientesForModal.map((c: any, i: number) => {
                    const selected = selectedMembers.includes(c.id)
                    return (
                      <React.Fragment key={c.id}>
                        {i > 0 && <Divider component="li" />}
                        <ListItemButton
                          onClick={() => toggleMember(c.id)} dense
                          sx={{
                            px: 2, py: 0.75,
                            bgcolor: selected
                              ? (t) => t.palette.mode === 'dark' ? 'rgba(0,119,182,0.12)' : 'rgba(0,119,182,0.06)'
                              : 'transparent',
                          }}
                        >
                          <ListItemIcon sx={{ minWidth: 36 }}>
                            <Checkbox
                              edge="start" checked={selected} size="small" disableRipple
                              sx={{ p: 0, color: selected ? 'primary.main' : undefined }}
                            />
                          </ListItemIcon>
                          <Avatar sx={{
                            width: 28, height: 28, fontSize: '0.65rem', mr: 1.5,
                            bgcolor: selected ? 'primary.main' : 'action.disabledBackground',
                          }}>
                            {initials(c.name)}
                          </Avatar>
                          <ListItemText
                            primary={c.name}
                            secondary={[c.phone, c.email].filter(Boolean).join(' · ') || undefined}
                            primaryTypographyProps={{ fontWeight: selected ? 600 : 400, fontSize: '0.875rem' }}
                            secondaryTypographyProps={{ fontSize: '0.75rem' }}
                          />
                        </ListItemButton>
                      </React.Fragment>
                    )
                  })}
                </List>
              )}
            </Paper>
          )}
        </DialogContent>

        <Divider sx={{ mt: 2 }} />
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setGroupModal(false)} disabled={groupLoading} sx={{ textTransform: 'none' }}>
            Cancelar
          </Button>
          <Button
            variant="contained" onClick={handleSaveGroup}
            disabled={groupLoading || !groupName.trim()}
            sx={{ background: 'linear-gradient(135deg, #0077B6, #00B4D8)', textTransform: 'none', minWidth: 100 }}
          >
            {groupLoading ? <CircularProgress size={18} color="inherit" /> : 'Salvar'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ──────────────────────────────────────────────────────
          Modal: Indivíduo (criar / editar)
      ────────────────────────────────────────────────────── */}
      <Dialog open={clienteModal} onClose={() => !clienteLoading && setClienteModal(false)} fullWidth maxWidth="sm">
        <DialogTitle sx={{ fontWeight: 700 }}>
          {editingCliente ? `Editar: ${editingCliente.name}` : 'Novo Indivíduo'}
        </DialogTitle>
        <Divider />
        <DialogContent sx={{ pt: 2.5 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="Nome *" fullWidth value={nome}
              onChange={(e) => setNome(e.target.value)} autoFocus
            />
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                label="Telefone" value={telefone}
                onChange={(e) => setTelefone(formatPhone(e.target.value))}
                error={!!telefone && !validatePhone(telefone)}
                helperText={telefone && !validatePhone(telefone) ? 'Ex: (11) 91234-5678' : ''}
                sx={{ flex: 1 }}
              />
              <TextField
                label="E-mail" type="email" value={email}
                onChange={(e) => setEmail(e.target.value.trim())}
                error={!!email && !validateEmail(email)}
                helperText={email && !validateEmail(email) ? 'E-mail inválido' : ''}
                sx={{ flex: 1 }}
              />
            </Box>
            <TextField
              label="Observações" fullWidth multiline rows={2} value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </Box>
        </DialogContent>
        <Divider />
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setClienteModal(false)} disabled={clienteLoading} sx={{ textTransform: 'none' }}>
            Cancelar
          </Button>
          <Button
            variant="contained" onClick={handleSaveCliente}
            disabled={
              clienteLoading || !nome.trim() ||
              (!!telefone && !validatePhone(telefone)) ||
              (!!email && !validateEmail(email))
            }
            sx={{ background: 'linear-gradient(135deg, #0077B6, #00B4D8)', textTransform: 'none', minWidth: 100 }}
          >
            {clienteLoading
              ? <CircularProgress size={18} color="inherit" />
              : editingCliente ? 'Salvar' : 'Cadastrar'
            }
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={snack.open} autoHideDuration={3500} onClose={() => setSnack(s => ({ ...s, open: false }))}>
        <Alert severity={snack.severity} variant="filled">{snack.message}</Alert>
      </Snackbar>
    </AdminLayout>
  )
}
