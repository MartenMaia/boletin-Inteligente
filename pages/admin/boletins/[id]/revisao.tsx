import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import useSWR, { mutate } from 'swr'
import {
  Box, Typography, Paper, Button, Divider, Chip, TextField,
  Alert, CircularProgress, Snackbar, Skeleton, Tooltip,
} from '@mui/material'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import SaveIcon from '@mui/icons-material/Save'
import SendIcon from '@mui/icons-material/Send'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import CancelIcon from '@mui/icons-material/Cancel'
import AdminLayout from '../../../../components/AdminLayout'
import { formatDateFull } from '../../../../utils/date'
import { useAuth } from '../../../../hooks/useAuth'

const fetcher = (url: string) => fetch(url).then(r => r.json())

const STATUS_COLOR: Record<string, 'default' | 'warning' | 'info' | 'success' | 'error'> = {
  rascunho: 'default', aguardando_revisao: 'warning',
  aprovado: 'info', enviado: 'success', rejeitado: 'error',
}
const STATUS_LABEL: Record<string, string> = {
  rascunho: 'Rascunho', aguardando_revisao: 'Aguardando Revisão',
  aprovado: 'Aprovado', enviado: 'Enviado', rejeitado: 'Rejeitado',
}

export default function Revisao() {
  const router = useRouter()
  const { id } = router.query
  const { profile } = useAuth()
  const { data: boletim, isLoading } = useSWR(id ? `/api/boletins/${id}` : null, fetcher)

  const [title, setTitle] = useState('')
  const [conteudo, setConteudo] = useState('')
  const [editing, setEditing] = useState(false)
  const [loading, setLoading] = useState(false)
  const [snack, setSnack] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({ open: false, message: '', severity: 'success' })

  useEffect(() => {
    if (boletim) {
      setTitle(boletim.title || '')
      setConteudo(boletim.conteudo || '')
    }
  }, [boletim])

  const canEdit = profile?.role === 'admin' || (profile?.role === 'editor' && boletim?.status === 'rascunho')
  const canApprove = profile?.role === 'admin' || profile?.role === 'aprovador'

  const handleSave = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/boletins/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, conteudo }),
      })
      if (res.ok) {
        await mutate(`/api/boletins/${id}`)
        setEditing(false)
        setSnack({ open: true, message: 'Boletim salvo!', severity: 'success' })
      }
    } finally { setLoading(false) }
  }

  const handleSubmitReview = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/boletins/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'aguardando_revisao' }),
      })
      if (res.ok) {
        await mutate(`/api/boletins/${id}`)
        setSnack({ open: true, message: 'Enviado para revisão!', severity: 'success' })
      }
    } finally { setLoading(false) }
  }

  const handleApprove = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/boletins/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'aprovado', aprovado_por: profile?.id, data_aprovacao: new Date().toISOString() }),
      })
      if (res.ok) {
        await mutate(`/api/boletins/${id}`)
        setSnack({ open: true, message: 'Boletim aprovado!', severity: 'success' })
        setTimeout(() => router.push('/admin/boletins'), 1500)
      }
    } finally { setLoading(false) }
  }

  const handleReject = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/boletins/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'rejeitado' }),
      })
      if (res.ok) {
        await mutate(`/api/boletins/${id}`)
        setSnack({ open: true, message: 'Boletim rejeitado.', severity: 'error' })
      }
    } finally { setLoading(false) }
  }

  return (
    <AdminLayout>
      <Box sx={{ p: 3, maxWidth: 860, mx: 'auto' }}>
        {/* Header */}
        <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
          <Button startIcon={<ArrowBackIcon />} onClick={() => router.push('/admin/boletins')}
            sx={{ textTransform: 'none', color: 'text.secondary' }}>Voltar</Button>
          <Divider orientation="vertical" flexItem />
          <Box sx={{ flex: 1 }}>
            <Typography variant="h5" fontWeight={700}>Revisão do Boletim</Typography>
            <Typography variant="body2" color="text.secondary">Revise e edite o conteúdo antes da aprovação</Typography>
          </Box>
          {boletim && (
            <Chip
              label={STATUS_LABEL[boletim.status] ?? boletim.status}
              color={STATUS_COLOR[boletim.status] ?? 'default'}
              variant="outlined"
            />
          )}
        </Box>

        <Paper elevation={0} sx={{ border: (t) => `1px solid ${t.palette.divider}`, borderRadius: 3, overflow: 'hidden' }}>
          {/* Metadados */}
          <Box sx={{ px: 3, py: 2, bgcolor: (t) => t.palette.mode === 'dark' ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.01)' }}>
            <Typography variant="subtitle2" fontWeight={600} color="text.secondary">INFORMAÇÕES</Typography>
          </Box>
          <Divider />
          <Box sx={{ p: 3, display: 'flex', gap: 4, flexWrap: 'wrap' }}>
            {isLoading ? <Skeleton width={300} /> : <>
              <Box>
                <Typography variant="caption" color="text.disabled">Grupo</Typography>
                <Typography variant="body2" fontWeight={500}>{boletim?.grupo?.name ?? '—'}</Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.disabled">Criado por</Typography>
                <Typography variant="body2" fontWeight={500}>{boletim?.criador?.name ?? '—'}</Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.disabled">Criado em</Typography>
                <Typography variant="body2" fontWeight={500}>{boletim?.created_at ? formatDateFull(boletim.created_at) : '—'}</Typography>
              </Box>
              {boletim?.aprovador && (
                <Box>
                  <Typography variant="caption" color="text.disabled">Aprovado por</Typography>
                  <Typography variant="body2" fontWeight={500}>{boletim.aprovador.name}</Typography>
                </Box>
              )}
            </>}
          </Box>

          <Divider />

          {/* Título */}
          <Box sx={{ px: 3, py: 2, bgcolor: (t) => t.palette.mode === 'dark' ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.01)' }}>
            <Typography variant="subtitle2" fontWeight={600} color="text.secondary">TÍTULO</Typography>
          </Box>
          <Divider />
          <Box sx={{ p: 3 }}>
            {isLoading ? <Skeleton height={56} /> : (
              <TextField fullWidth value={title} onChange={(e) => setTitle(e.target.value)}
                disabled={!editing || loading} variant={editing ? 'outlined' : 'standard'}
                InputProps={{ disableUnderline: !editing }} />
            )}
          </Box>

          <Divider />

          {/* Conteúdo */}
          <Box sx={{ px: 3, py: 2, bgcolor: (t) => t.palette.mode === 'dark' ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.01)' }}>
            <Typography variant="subtitle2" fontWeight={600} color="text.secondary">CONTEÚDO</Typography>
          </Box>
          <Divider />
          <Box sx={{ p: 3 }}>
            {isLoading ? <Skeleton height={200} /> : (
              <TextField fullWidth multiline minRows={8} value={conteudo}
                onChange={(e) => setConteudo(e.target.value)}
                disabled={!editing || loading} variant={editing ? 'outlined' : 'standard'}
                InputProps={{ disableUnderline: !editing, sx: { fontFamily: 'monospace', fontSize: '0.9rem' } }} />
            )}
          </Box>

          <Divider />

          {/* Ações */}
          <Box sx={{ px: 3, py: 2, display: 'flex', gap: 2, justifyContent: 'space-between', flexWrap: 'wrap' }}>
            <Box sx={{ display: 'flex', gap: 1 }}>
              {canEdit && !editing && boletim?.status !== 'enviado' && (
                <Button variant="outlined" startIcon={<SaveIcon />} onClick={() => setEditing(true)}
                  sx={{ textTransform: 'none', borderRadius: 2 }}>Editar</Button>
              )}
              {editing && (
                <>
                  <Button variant="outlined" color="inherit" onClick={() => { setEditing(false); setTitle(boletim?.title || ''); setConteudo(boletim?.conteudo || '') }}
                    sx={{ textTransform: 'none' }}>Cancelar edição</Button>
                  <Button variant="contained" startIcon={loading ? <CircularProgress size={16} color="inherit" /> : <SaveIcon />}
                    onClick={handleSave} disabled={loading} sx={{ textTransform: 'none', background: 'linear-gradient(135deg, #0077B6, #00B4D8)' }}>
                    Salvar alterações
                  </Button>
                </>
              )}
            </Box>
            <Box sx={{ display: 'flex', gap: 1 }}>
              {canEdit && boletim?.status === 'rascunho' && (
                <Button variant="outlined" startIcon={<SendIcon />} onClick={handleSubmitReview}
                  disabled={loading} sx={{ textTransform: 'none', borderRadius: 2 }}>
                  Enviar para Revisão
                </Button>
              )}
              {canApprove && boletim?.status === 'aguardando_revisao' && (
                <>
                  <Button variant="outlined" color="error" startIcon={<CancelIcon />}
                    onClick={handleReject} disabled={loading} sx={{ textTransform: 'none', borderRadius: 2 }}>
                    Rejeitar
                  </Button>
                  <Button variant="contained" color="success" startIcon={loading ? <CircularProgress size={16} color="inherit" /> : <CheckCircleIcon />}
                    onClick={handleApprove} disabled={loading} sx={{ textTransform: 'none', borderRadius: 2 }}>
                    Aprovar
                  </Button>
                </>
              )}
            </Box>
          </Box>
        </Paper>
      </Box>

      <Snackbar open={snack.open} autoHideDuration={3000} onClose={() => setSnack(s => ({ ...s, open: false }))}>
        <Alert severity={snack.severity} variant="filled">{snack.message}</Alert>
      </Snackbar>
    </AdminLayout>
  )
}
