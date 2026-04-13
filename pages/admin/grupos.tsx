import React, { useState } from 'react'
import useSWR, { mutate } from 'swr'
import {
  Box, Typography, Paper, Button, Tabs, Tab, Table, TableHead,
  TableRow, TableCell, TableBody, IconButton, Tooltip, Dialog,
  DialogTitle, DialogContent, DialogActions, TextField, Checkbox,
  Chip, Skeleton, Snackbar, Alert, Divider, List, ListItem,
  ListItemText, ListItemButton, ListItemIcon, CircularProgress,
  InputAdornment,
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import EditIcon from '@mui/icons-material/Edit'
import PeopleIcon from '@mui/icons-material/People'
import PersonIcon from '@mui/icons-material/Person'
import SearchIcon from '@mui/icons-material/Search'
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

export default function Grupos() {
  const [tab, setTab] = useState(0)
  const [search, setSearch] = useState('')

  // Grupos
  const { data: grupos, isLoading: gruposLoading } = useSWR('/api/groups', fetcher)
  const [groupModal, setGroupModal] = useState(false)
  const [editingGroup, setEditingGroup] = useState<any>(null)
  const [groupName, setGroupName] = useState('')
  const [groupDesc, setGroupDesc] = useState('')
  const [groupLoading, setGroupLoading] = useState(false)

  // Indivíduos (clientes)
  const { data: clientes, isLoading: clientesLoading } = useSWR('/api/clientes', fetcher)
  const [clienteModal, setClienteModal] = useState(false)
  const [clienteLoading, setClienteLoading] = useState(false)
  const [nome, setNome] = useState('')
  const [telefone, setTelefone] = useState('')
  const [email, setEmail] = useState('')
  const [local, setLocal] = useState('')
  const [notes, setNotes] = useState('')

  // Membros no modal de grupo
  const [selectedMembers, setSelectedMembers] = useState<string[]>([])

  const [snack, setSnack] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({ open: false, message: '', severity: 'success' })
  const showSnack = (message: string, severity: 'success' | 'error' = 'success') => setSnack({ open: true, message, severity })

  // ── Grupos ──────────────────────────────────────────
  const openNewGroup = () => {
    setEditingGroup(null)
    setGroupName('')
    setGroupDesc('')
    setSelectedMembers([])
    setGroupModal(true)
  }

  const openEditGroup = (g: any) => {
    setEditingGroup(g)
    setGroupName(g.name)
    setGroupDesc(g.description || '')
    setSelectedMembers((g.members || []).map((m: any) => m.id))
    setGroupModal(true)
  }

  const handleSaveGroup = async () => {
    if (!groupName.trim()) return showSnack('Nome do grupo é obrigatório', 'error')
    setGroupLoading(true)
    try {
      const url = editingGroup ? `/api/groups/${editingGroup.id}` : '/api/groups'
      const method = editingGroup ? 'PATCH' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: groupName.trim(), description: groupDesc.trim() || null }),
      })
      if (!res.ok) throw new Error()
      await mutate('/api/groups')
      setGroupModal(false)
      showSnack(editingGroup ? 'Grupo atualizado!' : 'Grupo criado!')
    } catch {
      showSnack('Erro ao salvar grupo', 'error')
    } finally {
      setGroupLoading(false)
    }
  }

  // ── Clientes ─────────────────────────────────────────
  const openNewCliente = () => {
    setNome(''); setTelefone(''); setEmail(''); setLocal(''); setNotes('')
    setClienteModal(true)
  }

  const handleSaveCliente = async () => {
    if (!nome.trim()) return showSnack('Nome é obrigatório', 'error')
    if (telefone && !validatePhone(telefone)) return showSnack('Telefone inválido. Ex: (11) 91234-5678', 'error')
    if (email && !validateEmail(email)) return showSnack('E-mail inválido', 'error')
    setClienteLoading(true)
    try {
      const res = await fetch('/api/clientes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: nome.trim(), phone: telefone || null, email: email || null, notes: notes || null }),
      })
      if (!res.ok) throw new Error()
      await mutate('/api/clientes')
      setClienteModal(false)
      showSnack(`"${nome}" cadastrado com sucesso!`)
    } catch {
      showSnack('Erro ao cadastrar', 'error')
    } finally {
      setClienteLoading(false)
    }
  }

  const filteredGrupos = (grupos || []).filter((g: any) =>
    !search || g.name.toLowerCase().includes(search.toLowerCase())
  )
  const filteredClientes = (clientes || []).filter((c: any) =>
    !search || c.name.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <AdminLayout>
      <Box sx={{ p: 3 }}>
        {/* Header */}
        <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Box>
            <Typography variant="h5" fontWeight={700}>Grupos</Typography>
            <Typography variant="body2" color="text.secondary">Gerencie grupos e destinatários dos boletins</Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={tab === 0 ? openNewGroup : openNewCliente}
            sx={{ background: 'linear-gradient(135deg, #0077B6, #00B4D8)', fontWeight: 600, textTransform: 'none', borderRadius: 2 }}
          >
            {tab === 0 ? 'Novo Grupo' : 'Novo Cadastro'}
          </Button>
        </Box>

        <Paper elevation={0} sx={{ border: (t) => `1px solid ${t.palette.divider}`, borderRadius: 3, overflow: 'hidden' }}>
          {/* Tabs + Busca */}
          <Box sx={{ px: 3, pt: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2 }}>
            <Tabs
              value={tab}
              onChange={(_, v) => { setTab(v); setSearch('') }}
              sx={{ '& .MuiTab-root': { textTransform: 'none', fontWeight: 600, minHeight: 40 } }}
            >
              <Tab label={<Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}><PeopleIcon sx={{ fontSize: 18 }} />Grupos {grupos && <Chip label={grupos.length} size="small" sx={{ height: 18, fontSize: '0.65rem', ml: 0.5 }} />}</Box>} />
              <Tab label={<Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}><PersonIcon sx={{ fontSize: 18 }} />Indivíduos {clientes && <Chip label={clientes.length} size="small" sx={{ height: 18, fontSize: '0.65rem', ml: 0.5 }} />}</Box>} />
            </Tabs>
            <TextField
              size="small" placeholder="Buscar..." value={search}
              onChange={(e) => setSearch(e.target.value)}
              InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" sx={{ color: 'text.disabled' }} /></InputAdornment> }}
              sx={{ width: 220 }}
            />
          </Box>
          <Divider sx={{ mt: 1 }} />

          {/* Tab: Grupos */}
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
                    <TableRow key={i}>{[1, 2, 3, 4].map(j => <TableCell key={j}><Skeleton /></TableCell>)}</TableRow>
                  ))
                  : filteredGrupos.length === 0
                    ? (
                      <TableRow>
                        <TableCell colSpan={4} align="center" sx={{ py: 6 }}>
                          <PeopleIcon sx={{ fontSize: 40, color: 'text.disabled', display: 'block', mx: 'auto', mb: 1 }} />
                          <Typography color="text.secondary">Nenhum grupo encontrado</Typography>
                        </TableCell>
                      </TableRow>
                    )
                    : filteredGrupos.map((g: any) => (
                      <TableRow key={g.id} hover>
                        <TableCell sx={{ pl: 3, fontWeight: 500 }}>{g.name}</TableCell>
                        <TableCell><Typography variant="body2" color="text.secondary">{g.description || '—'}</Typography></TableCell>
                        <TableCell>
                          <Chip label={`${g.members?.length ?? 0} membros`} size="small" variant="outlined" sx={{ fontSize: '0.7rem', height: 22 }} />
                        </TableCell>
                        <TableCell align="right" sx={{ pr: 2 }}>
                          <Tooltip title="Editar">
                            <IconButton size="small" onClick={() => openEditGroup(g)}><EditIcon fontSize="small" /></IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    ))
                }
              </TableBody>
            </Table>
          )}

          {/* Tab: Indivíduos */}
          {tab === 1 && (
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: (t) => t.palette.mode === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)' }}>
                  <TableCell sx={{ fontWeight: 600, py: 1.5, pl: 3 }}>Nome</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Telefone</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>E-mail</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Local</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {clientesLoading
                  ? Array.from({ length: 4 }).map((_, i) => (
                    <TableRow key={i}>{[1, 2, 3, 4].map(j => <TableCell key={j}><Skeleton /></TableCell>)}</TableRow>
                  ))
                  : filteredClientes.length === 0
                    ? (
                      <TableRow>
                        <TableCell colSpan={4} align="center" sx={{ py: 6 }}>
                          <PersonIcon sx={{ fontSize: 40, color: 'text.disabled', display: 'block', mx: 'auto', mb: 1 }} />
                          <Typography color="text.secondary">Nenhum indivíduo cadastrado</Typography>
                        </TableCell>
                      </TableRow>
                    )
                    : filteredClientes.map((c: any) => (
                      <TableRow key={c.id} hover>
                        <TableCell sx={{ pl: 3, fontWeight: 500 }}>{c.name}</TableCell>
                        <TableCell><Typography variant="body2" color="text.secondary">{c.phone || '—'}</Typography></TableCell>
                        <TableCell><Typography variant="body2" color="text.secondary">{c.email || '—'}</Typography></TableCell>
                        <TableCell><Typography variant="body2" color="text.secondary">{c.bairro?.name || '—'}</Typography></TableCell>
                      </TableRow>
                    ))
                }
              </TableBody>
            </Table>
          )}
        </Paper>
      </Box>

      {/* Modal Grupo */}
      <Dialog open={groupModal} onClose={() => setGroupModal(false)} fullWidth maxWidth="sm">
        <DialogTitle sx={{ fontWeight: 700 }}>{editingGroup ? 'Editar Grupo' : 'Novo Grupo'}</DialogTitle>
        <Divider />
        <DialogContent sx={{ pt: 2.5 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField label="Nome do grupo *" fullWidth value={groupName} onChange={(e) => setGroupName(e.target.value)} autoFocus />
            <TextField label="Descrição" fullWidth value={groupDesc} onChange={(e) => setGroupDesc(e.target.value)} multiline rows={2} />
          </Box>
        </DialogContent>
        <Divider />
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setGroupModal(false)} disabled={groupLoading} sx={{ textTransform: 'none' }}>Cancelar</Button>
          <Button variant="contained" onClick={handleSaveGroup} disabled={groupLoading || !groupName.trim()}
            sx={{ background: 'linear-gradient(135deg, #0077B6, #00B4D8)', textTransform: 'none' }}>
            {groupLoading ? <CircularProgress size={18} color="inherit" /> : 'Salvar'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Modal Cliente */}
      <Dialog open={clienteModal} onClose={() => setClienteModal(false)} fullWidth maxWidth="sm">
        <DialogTitle sx={{ fontWeight: 700 }}>Novo Indivíduo</DialogTitle>
        <Divider />
        <DialogContent sx={{ pt: 2.5 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField label="Nome *" fullWidth value={nome} onChange={(e) => setNome(e.target.value)} autoFocus />
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
            <TextField label="Local / Bairro" fullWidth value={local} onChange={(e) => setLocal(e.target.value)} />
            <TextField label="Observações" fullWidth multiline rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
          </Box>
        </DialogContent>
        <Divider />
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setClienteModal(false)} disabled={clienteLoading} sx={{ textTransform: 'none' }}>Cancelar</Button>
          <Button variant="contained" onClick={handleSaveCliente}
            disabled={clienteLoading || !nome.trim() || (!!telefone && !validatePhone(telefone)) || (!!email && !validateEmail(email))}
            sx={{ background: 'linear-gradient(135deg, #0077B6, #00B4D8)', textTransform: 'none' }}>
            {clienteLoading ? <CircularProgress size={18} color="inherit" /> : 'Cadastrar'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={snack.open} autoHideDuration={3500} onClose={() => setSnack(s => ({ ...s, open: false }))}>
        <Alert severity={snack.severity} variant="filled">{snack.message}</Alert>
      </Snackbar>
    </AdminLayout>
  )
}
