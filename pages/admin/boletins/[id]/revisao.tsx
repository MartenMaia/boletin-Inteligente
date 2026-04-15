import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import useSWR, { mutate } from 'swr'
import {
  Box, Typography, Paper, Button, Divider, Chip, TextField,
  Alert, CircularProgress, Snackbar, Skeleton, Tooltip,
  Dialog, DialogTitle, DialogContent, DialogActions,
} from '@mui/material'
import ArrowBackIcon    from '@mui/icons-material/ArrowBack'
import SaveIcon         from '@mui/icons-material/Save'
import SendIcon         from '@mui/icons-material/Send'
import CheckCircleIcon  from '@mui/icons-material/CheckCircle'
import CancelIcon       from '@mui/icons-material/Cancel'
import EmailIcon        from '@mui/icons-material/Email'
import WhatsAppIcon     from '@mui/icons-material/WhatsApp'
import AutoFixHighIcon  from '@mui/icons-material/AutoFixHigh'
import CheckIcon        from '@mui/icons-material/Check'
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
  const { data: canaisConfig } = useSWR('/api/envio/config', fetcher)

  const canaisAtivos: Array<{ canal: string; label: string; icon: React.ReactNode; color: string }> =
    (canaisConfig || [])
      .filter((c: any) => c.ativo)
      .map((c: any) => ({
        canal: c.canal,
        label: c.canal === 'email' ? 'E-mail' : 'WhatsApp',
        icon:  c.canal === 'email' ? <EmailIcon fontSize="small" /> : <WhatsAppIcon fontSize="small" />,
        color: c.canal === 'email' ? '#0077B6' : '#25D366',
      }))

  const [title, setTitle] = useState('')
  const [conteudo, setConteudo] = useState('')
  const [canaisEnvio, setCanaisEnvio] = useState<string[]>([])
  const [editing, setEditing] = useState(false)
  const [loading, setLoading] = useState(false)
  const [snack, setSnack] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({ open: false, message: '', severity: 'success' })

  // ── IA Editor ──
  const [iaLoading,   setIaLoading]   = useState(false)
  const [iaPreview,   setIaPreview]   = useState('')
  const [iaModalOpen, setIaModalOpen] = useState(false)

  const handleIaReview = async () => {
    if (!conteudo.trim()) {
      setSnack({ open: true, message: 'Adicione conteúdo antes de chamar o Editor IA', severity: 'error' })
      return
    }
    setIaLoading(true)
    try {
      const res = await fetch('/api/ia/revisar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ titulo: title, conteudo }),
      })
      const data = await res.json()
      if (!res.ok) {
        const msg = data.dica ? `${data.error} — ${data.dica}` : (data.error || 'Erro ao chamar o Editor IA')
        setSnack({ open: true, message: msg, severity: 'error' })
        return
      }
      setIaPreview(data.conteudo_revisado || '')
      setIaModalOpen(true)
    } catch {
      setSnack({ open: true, message: 'Erro de conexão ao chamar o Editor IA', severity: 'error' })
    } finally {
      setIaLoading(false)
    }
  }

  const handleApplyIa = () => {
    setConteudo(iaPreview)
    setIaModalOpen(false)
    setEditing(true)
    setSnack({ open: true, message: 'Conteúdo revisado aplicado! Revise e salve quando estiver pronto.', severity: 'success' })
  }

  useEffect(() => {
    if (boletim) {
      setTitle(boletim.title || '')
      setConteudo(boletim.conteudo || '')
      setCanaisEnvio(boletim.canais_envio || [])
    }
  }, [boletim])

  const canEdit = profile?.role === 'admin' || profile?.role === 'suporte' || (profile?.role === 'aprovador' && boletim?.status === 'rascunho')
  const canApprove = profile?.role === 'admin' || profile?.role === 'aprovador' || profile?.role === 'suporte'

  const handleSave = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/boletins/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, conteudo, canais_envio: canaisEnvio }),
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

          {/* Canais de Envio */}
          <Box sx={{ px: 3, py: 2, bgcolor: (t) => t.palette.mode === 'dark' ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.01)', display: 'flex', alignItems: 'center', gap: 1 }}>
            <SendIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
            <Typography variant="subtitle2" fontWeight={600} color="text.secondary">CANAIS DE ENVIO</Typography>
          </Box>
          <Divider />
          <Box sx={{ p: 3 }}>
            {isLoading ? <Skeleton width={200} height={36} /> : (
              canaisAtivos.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  Nenhum canal ativo. Configure em <strong>Configurações → Envio</strong>.
                </Typography>
              ) : (
                <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', alignItems: 'center' }}>
                  {canaisAtivos.map(({ canal, label, icon, color }) => {
                    const selected = canaisEnvio.includes(canal)
                    const isEditable = editing && boletim?.status !== 'enviado'
                    return (
                      <Chip
                        key={canal}
                        icon={<Box sx={{ color: selected ? 'white' : color, display: 'flex' }}>{icon}</Box>}
                        label={label}
                        onClick={isEditable ? () => setCanaisEnvio(prev =>
                          prev.includes(canal) ? prev.filter(c => c !== canal) : [...prev, canal]
                        ) : undefined}
                        variant={selected ? 'filled' : 'outlined'}
                        sx={{
                          fontWeight: selected ? 700 : 400,
                          fontSize: '0.85rem',
                          height: 36,
                          px: 0.5,
                          bgcolor: selected ? color : 'transparent',
                          color: selected ? 'white' : 'text.primary',
                          borderColor: color,
                          cursor: isEditable ? 'pointer' : 'default',
                          '&:hover': isEditable ? { bgcolor: selected ? color : `${color}18` } : {},
                        }}
                      />
                    )
                  })}
                  {!editing && canaisEnvio.length === 0 && (
                    <Typography variant="body2" color="text.secondary">Nenhum canal selecionado</Typography>
                  )}
                </Box>
              )
            )}
          </Box>

          <Divider />

          {/* Ações */}
          <Box sx={{ px: 3, py: 2, display: 'flex', gap: 2, justifyContent: 'space-between', flexWrap: 'wrap' }}>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              {canEdit && !editing && boletim?.status !== 'enviado' && (
                <Button variant="outlined" startIcon={<SaveIcon />} onClick={() => setEditing(true)}
                  sx={{ textTransform: 'none', borderRadius: 2 }}>Editar</Button>
              )}
              {boletim?.status !== 'enviado' && (
                <Tooltip title="O Editor IA analisa o conteúdo e o reformata como uma editora de revista, organizando em tópicos">
                  <span>
                    <Button
                      variant="outlined"
                      onClick={handleIaReview}
                      disabled={iaLoading || !conteudo.trim()}
                      startIcon={iaLoading ? <CircularProgress size={16} /> : <AutoFixHighIcon />}
                      sx={{
                        textTransform: 'none', borderRadius: 2,
                        borderColor: '#7C3AED', color: '#7C3AED',
                        '&:hover': { borderColor: '#6D28D9', bgcolor: 'rgba(124,58,237,0.06)' },
                      }}
                    >
                      {iaLoading ? 'Revisando…' : 'Editor IA'}
                    </Button>
                  </span>
                </Tooltip>
              )}
              {editing && (
                <>
                  <Button variant="outlined" color="inherit" onClick={() => { setEditing(false); setTitle(boletim?.title || ''); setConteudo(boletim?.conteudo || ''); setCanaisEnvio(boletim?.canais_envio || []) }}
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

      {/* ── Modal: Preview do Editor IA ── */}
      <Dialog
        open={iaModalOpen}
        onClose={() => setIaModalOpen(false)}
        fullWidth
        maxWidth="md"
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle sx={{ pb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <AutoFixHighIcon sx={{ color: '#7C3AED' }} />
            <Box>
              <Typography variant="h6" fontWeight={700}>Revisão do Editor IA</Typography>
              <Typography variant="caption" color="text.secondary">
                Conteúdo reformatado pela IA. Confira antes de aplicar.
              </Typography>
            </Box>
          </Box>
        </DialogTitle>
        <Divider />

        <DialogContent sx={{ pt: 2, pb: 1 }}>
          {/* Comparação lado a lado */}
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
            {/* Original */}
            <Box>
              <Typography variant="caption" fontWeight={700} color="text.disabled"
                sx={{ textTransform: 'uppercase', letterSpacing: 0.5, display: 'block', mb: 1 }}>
                Original
              </Typography>
              <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, maxHeight: 440, overflowY: 'auto', bgcolor: (t) => t.palette.mode === 'dark' ? 'rgba(255,255,255,0.02)' : '#fafafa' }}>
                <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', fontFamily: 'monospace', fontSize: '0.82rem', lineHeight: 1.7, color: 'text.secondary' }}>
                  {conteudo}
                </Typography>
              </Paper>
            </Box>

            {/* Revisado */}
            <Box>
              <Typography variant="caption" fontWeight={700}
                sx={{ textTransform: 'uppercase', letterSpacing: 0.5, display: 'block', mb: 1, color: '#7C3AED' }}>
                ✨ Revisado pelo Editor IA
              </Typography>
              <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, maxHeight: 440, overflowY: 'auto', borderColor: '#7C3AED', bgcolor: (t) => t.palette.mode === 'dark' ? 'rgba(124,58,237,0.05)' : 'rgba(124,58,237,0.03)' }}>
                <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', fontFamily: 'monospace', fontSize: '0.82rem', lineHeight: 1.7 }}>
                  {iaPreview}
                </Typography>
              </Paper>
            </Box>
          </Box>

          <Alert severity="info" sx={{ mt: 2, borderRadius: 2, fontSize: '0.82rem' }}>
            Ao aplicar, o conteúdo original será substituído pelo revisado. Você ainda poderá editar e salvar normalmente antes de aprovar.
          </Alert>
        </DialogContent>

        <Divider />
        <DialogActions sx={{ px: 3, py: 2, gap: 1 }}>
          <Button onClick={() => setIaModalOpen(false)} sx={{ textTransform: 'none' }}>
            Descartar
          </Button>
          <Button
            variant="contained"
            startIcon={<CheckIcon />}
            onClick={handleApplyIa}
            sx={{ textTransform: 'none', bgcolor: '#7C3AED', '&:hover': { bgcolor: '#6D28D9' } }}
          >
            Aplicar revisão
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={snack.open} autoHideDuration={3000} onClose={() => setSnack(s => ({ ...s, open: false }))}>
        <Alert severity={snack.severity} variant="filled">{snack.message}</Alert>
      </Snackbar>
    </AdminLayout>
  )
}
