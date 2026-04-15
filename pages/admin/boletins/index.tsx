import React, { useState } from 'react'
import useSWR, { mutate } from 'swr'
import { useRouter } from 'next/router'
import {
  Typography, Box, Paper, Table, TableHead, TableRow, TableCell, TableBody,
  IconButton, Tooltip, Button, TextField, Chip, Dialog, DialogTitle,
  DialogContent, DialogContentText, DialogActions, Snackbar, Alert,
  Skeleton, Divider, MenuItem, InputAdornment,
} from '@mui/material'
import EditIcon from '@mui/icons-material/Edit'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import DeleteIcon from '@mui/icons-material/Delete'
import SendIcon from '@mui/icons-material/Send'
import SearchIcon from '@mui/icons-material/Search'
import AddIcon from '@mui/icons-material/Add'
import ArticleIcon from '@mui/icons-material/Article'
import VisibilityIcon from '@mui/icons-material/Visibility'
import AdminLayout from '../../../components/AdminLayout'
import { formatDateShort, formatDateFull } from '../../../utils/date'
import { useAuth } from '../../../hooks/useAuth'

const fetcher = (url: string) => fetch(url).then(r => r.json())

const STATUS_OPTIONS = [
  { value: '', label: 'Todos os status' },
  { value: 'rascunho', label: 'Rascunho' },
  { value: 'aguardando_revisao', label: 'Aguardando Revisão' },
  { value: 'aprovado', label: 'Aprovado' },
  { value: 'enviado', label: 'Enviado' },
  { value: 'rejeitado', label: 'Rejeitado' },
]

const STATUS_COLOR: Record<string, 'default' | 'warning' | 'info' | 'success' | 'error'> = {
  rascunho: 'default',
  aguardando_revisao: 'warning',
  aprovado: 'info',
  enviado: 'success',
  rejeitado: 'error',
}

const STATUS_LABEL: Record<string, string> = {
  rascunho: 'Rascunho',
  aguardando_revisao: 'Ag. Revisão',
  aprovado: 'Aprovado',
  enviado: 'Enviado',
  rejeitado: 'Rejeitado',
}

export default function BoletinsList() {
  const router = useRouter()
  const { profile } = useAuth()
  const { data: boletins, isLoading } = useSWR('/api/boletins', fetcher)

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)
  const [confirmApprove, setConfirmApprove] = useState<string | null>(null)
  const [confirmSend, setConfirmSend] = useState<string | null>(null)
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const [snack, setSnack] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({ open: false, message: '', severity: 'success' })

  const canApprove = profile?.role === 'admin' || profile?.role === 'aprovador' || profile?.role === 'suporte'
  const canDelete = profile?.role === 'admin' || profile?.role === 'suporte'
  const canCreate = profile?.role === 'admin' || profile?.role === 'aprovador' || profile?.role === 'suporte'
  const canSend = profile?.role === 'admin' || profile?.role === 'suporte'

  const filtered = (boletins || []).filter((b: any) => {
    if (search && !b.title?.toLowerCase().includes(search.toLowerCase())) return false
    if (statusFilter && b.status !== statusFilter) return false
    return true
  })

  const handleDelete = async (id: string) => {
    setLoadingId(id)
    try {
      const res = await fetch(`/api/boletins/${id}`, { method: 'DELETE' })
      if (res.ok) {
        await mutate('/api/boletins')
        setSnack({ open: true, message: 'Boletim excluído com sucesso', severity: 'success' })
      } else {
        setSnack({ open: true, message: 'Erro ao excluir o boletim', severity: 'error' })
      }
    } finally {
      setConfirmDelete(null)
      setLoadingId(null)
    }
  }

  const handleApprove = async (id: string) => {
    setLoadingId(id)
    try {
      const res = await fetch(`/api/boletins/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'aprovado', aprovado_por: profile?.id, data_aprovacao: new Date().toISOString() }),
      })
      if (res.ok) {
        await mutate('/api/boletins')
        setSnack({ open: true, message: 'Boletim aprovado!', severity: 'success' })
      } else {
        setSnack({ open: true, message: 'Erro ao aprovar o boletim', severity: 'error' })
      }
    } finally {
      setConfirmApprove(null)
      setLoadingId(null)
    }
  }

  const handleSend = async (id: string) => {
    setLoadingId(id)
    try {
      const res = await fetch('/api/envio/enviar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ boletim_id: id }),
      })
      const data = await res.json()
      if (res.ok) {
        await mutate('/api/boletins')
        const msg = data.avisos?.length
          ? `Enviado (${data.total_enviados} destinatário(s)). Avisos: ${data.avisos.join('; ')}`
          : `Boletim enviado para ${data.total_enviados} destinatário(s)!`
        setSnack({ open: true, message: msg, severity: data.avisos?.length ? 'error' : 'success' })
      } else {
        setSnack({ open: true, message: data.error || 'Erro ao enviar o boletim', severity: 'error' })
      }
    } finally {
      setConfirmSend(null)
      setLoadingId(null)
    }
  }

  return (
    <AdminLayout>
      <Box sx={{ p: 3 }}>
        {/* Header */}
        <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Box>
            <Typography variant="h5" fontWeight={700}>Boletins</Typography>
            <Typography variant="body2" color="text.secondary">
              Gerencie e acompanhe todos os boletins
            </Typography>
          </Box>
          {canCreate && (
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => router.push('/admin/boletins/novo')}
              sx={{ background: 'linear-gradient(135deg, #0077B6, #00B4D8)', fontWeight: 600, textTransform: 'none', borderRadius: 2 }}
            >
              Novo Boletim
            </Button>
          )}
        </Box>

        {/* Filtros */}
        <Paper elevation={0} sx={{ border: (t) => `1px solid ${t.palette.divider}`, borderRadius: 3, overflow: 'hidden' }}>
          <Box sx={{ px: 3, py: 2, display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
            <TextField
              size="small"
              placeholder="Buscar por título..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" sx={{ color: 'text.disabled' }} /></InputAdornment> }}
              sx={{ width: 260 }}
            />
            <TextField
              select size="small" value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              sx={{ width: 190 }}
            >
              {STATUS_OPTIONS.map((o) => <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>)}
            </TextField>
            <Typography variant="caption" color="text.secondary" sx={{ ml: 'auto' }}>
              {filtered.length} boletim(s)
            </Typography>
          </Box>

          <Divider />

          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: (t) => t.palette.mode === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)' }}>
                <TableCell sx={{ fontWeight: 600, py: 1.5, pl: 3 }}>Título</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Grupo</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Criado por</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Criado em</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Próx. Envio</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 600 }} align="right">Ações</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {isLoading
                ? Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 7 }).map((_, j) => (
                      <TableCell key={j}><Skeleton /></TableCell>
                    ))}
                  </TableRow>
                ))
                : filtered.length === 0
                  ? (
                    <TableRow>
                      <TableCell colSpan={7} align="center" sx={{ py: 6 }}>
                        <ArticleIcon sx={{ fontSize: 40, color: 'text.disabled', mb: 1, display: 'block', mx: 'auto' }} />
                        <Typography color="text.secondary">
                          {search || statusFilter ? 'Nenhum boletim encontrado com esses filtros' : 'Nenhum boletim criado ainda'}
                        </Typography>
                        {canCreate && !search && !statusFilter && (
                          <Button size="small" sx={{ mt: 1 }} onClick={() => router.push('/admin/boletins/novo')}>
                            Criar primeiro boletim
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  )
                  : filtered.map((b: any) => (
                    <TableRow key={b.id} hover>
                      <TableCell sx={{ pl: 3, fontWeight: 500, maxWidth: 200 }}>
                        <Typography variant="body2" noWrap fontWeight={500}>{b.title || `Boletim #${b.id?.slice(0, 8)}`}</Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="text.secondary">{b.grupo?.name ?? '—'}</Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="text.secondary">{b.criador?.name ?? '—'}</Typography>
                      </TableCell>
                      <TableCell>
                        <Tooltip title={formatDateFull(b.created_at)}>
                          <Typography variant="body2" color="text.secondary">{formatDateShort(b.created_at)}</Typography>
                        </Tooltip>
                      </TableCell>
                      <TableCell>
                        {b.proximo_envio
                          ? <Tooltip title={formatDateFull(b.proximo_envio)}>
                            <Typography variant="body2" color="text.secondary">{formatDateShort(b.proximo_envio)}</Typography>
                          </Tooltip>
                          : <Typography variant="body2" color="text.disabled">—</Typography>}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={STATUS_LABEL[b.status] ?? b.status}
                          size="small"
                          color={STATUS_COLOR[b.status] ?? 'default'}
                          variant="outlined"
                          sx={{ fontSize: '0.7rem', height: 22 }}
                        />
                      </TableCell>
                      <TableCell align="right" sx={{ pr: 2 }}>
                        {b.status === 'enviado' ? (
                          /* Boletim enviado: apenas botão de visualização */
                          <Tooltip title="Visualizar boletim enviado">
                            <IconButton size="small" color="primary" onClick={() => router.push(`/admin/boletins/${b.id}/visualizar`)}>
                              <VisibilityIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        ) : (
                          <>
                            <Tooltip title="Revisar / Editar">
                              <IconButton size="small" onClick={() => router.push(`/admin/boletins/${b.id}/revisao`)}>
                                <EditIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            {canApprove && b.status === 'aguardando_revisao' && (
                              <Tooltip title="Aprovar">
                                <IconButton size="small" color="success" disabled={!!loadingId} onClick={() => setConfirmApprove(b.id)}>
                                  <CheckCircleIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            )}
                            {canSend && b.status === 'aprovado' && (
                              <Tooltip title="Enviar manualmente">
                                <IconButton size="small" color="primary" disabled={!!loadingId} onClick={() => setConfirmSend(b.id)}>
                                  <SendIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            )}
                            {canDelete && (
                              <Tooltip title="Excluir">
                                <IconButton size="small" color="error" disabled={!!loadingId} onClick={() => setConfirmDelete(b.id)}>
                                  <DeleteIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            )}
                          </>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
              }
            </TableBody>
          </Table>
        </Paper>
      </Box>

      {/* Dialogs */}
      <Dialog open={!!confirmDelete} onClose={() => setConfirmDelete(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Excluir boletim?</DialogTitle>
        <DialogContent><DialogContentText>Esta ação não pode ser desfeita.</DialogContentText></DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDelete(null)}>Cancelar</Button>
          <Button color="error" variant="contained" onClick={() => confirmDelete && handleDelete(confirmDelete)}>Excluir</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={!!confirmApprove} onClose={() => setConfirmApprove(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Aprovar boletim?</DialogTitle>
        <DialogContent><DialogContentText>O boletim será marcado como aprovado e ficará pronto para envio.</DialogContentText></DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmApprove(null)}>Cancelar</Button>
          <Button color="success" variant="contained" onClick={() => confirmApprove && handleApprove(confirmApprove)}>Aprovar</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={!!confirmSend} onClose={() => setConfirmSend(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Enviar boletim?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            O boletim será marcado como <strong>enviado</strong> manualmente. Esta ação indica que o envio foi realizado.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmSend(null)}>Cancelar</Button>
          <Button color="primary" variant="contained" startIcon={<SendIcon />} onClick={() => confirmSend && handleSend(confirmSend)}>
            Confirmar Envio
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={snack.open} autoHideDuration={3500} onClose={() => setSnack(s => ({ ...s, open: false }))}>
        <Alert severity={snack.severity} variant="filled" sx={{ width: '100%' }}>{snack.message}</Alert>
      </Snackbar>
    </AdminLayout>
  )
}
