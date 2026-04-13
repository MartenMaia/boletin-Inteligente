import React, { useState } from 'react'
import { useRouter } from 'next/router'
import useSWR from 'swr'
import {
  Box, Typography, Paper, TextField, Button, MenuItem,
  Divider, Alert, CircularProgress, Chip, Snackbar,
} from '@mui/material'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import SaveIcon from '@mui/icons-material/Save'
import SendIcon from '@mui/icons-material/Send'
import AdminLayout from '../../../components/AdminLayout'
import { useAuth } from '../../../hooks/useAuth'

const fetcher = (url: string) => fetch(url).then(r => r.json())

export default function NovoBoletim() {
  const router = useRouter()
  const { profile } = useAuth()
  const { data: grupos } = useSWR('/api/groups', fetcher)

  const [title, setTitle] = useState('')
  const [conteudo, setConteudo] = useState('')
  const [grupoId, setGrupoId] = useState('')
  const [proximoEnvio, setProximoEnvio] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [snack, setSnack] = useState(false)

  const handleSave = async (submitStatus: 'rascunho' | 'aguardando_revisao') => {
    if (!title.trim()) return setError('Informe um título para o boletim.')
    if (!conteudo.trim()) return setError('O conteúdo do boletim não pode estar vazio.')
    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/boletins', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          conteudo: conteudo.trim(),
          grupo_id: grupoId || null,
          criado_por: profile?.id || null,
          proximo_envio: proximoEnvio || null,
          status: submitStatus,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        setError(data.error || 'Erro ao salvar o boletim.')
        return
      }

      setSnack(true)
      setTimeout(() => router.push('/admin/boletins'), 1200)
    } catch {
      setError('Erro de conexão. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AdminLayout>
      <Box sx={{ p: 3, maxWidth: 860, mx: 'auto' }}>
        {/* Header */}
        <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
          <Button
            startIcon={<ArrowBackIcon />}
            onClick={() => router.push('/admin/boletins')}
            sx={{ textTransform: 'none', color: 'text.secondary' }}
          >
            Voltar
          </Button>
          <Divider orientation="vertical" flexItem />
          <Box>
            <Typography variant="h5" fontWeight={700}>Novo Boletim</Typography>
            <Typography variant="body2" color="text.secondary">Crie um novo boletim para envio</Typography>
          </Box>
        </Box>

        {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}

        <Paper elevation={0} sx={{ border: (t) => `1px solid ${t.palette.divider}`, borderRadius: 3, overflow: 'hidden' }}>
          {/* Seção: Identificação */}
          <Box sx={{ px: 3, py: 2, bgcolor: (t) => t.palette.mode === 'dark' ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.01)' }}>
            <Typography variant="subtitle2" fontWeight={600} color="text.secondary">IDENTIFICAÇÃO</Typography>
          </Box>
          <Divider />
          <Box sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            <TextField
              label="Título do boletim *"
              fullWidth
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Boletim Diário — Centro — 13/04/2026"
              disabled={loading}
            />
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                select
                label="Grupo destinatário"
                value={grupoId}
                onChange={(e) => setGrupoId(e.target.value)}
                sx={{ flex: 1 }}
                disabled={loading}
              >
                <MenuItem value=""><em>Sem grupo específico</em></MenuItem>
                {(grupos || []).map((g: any) => (
                  <MenuItem key={g.id} value={g.id}>
                    {g.name}
                    <Chip label={`${g.members?.length ?? 0} membros`} size="small" sx={{ ml: 1, height: 18, fontSize: '0.65rem' }} />
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                label="Próximo envio"
                type="datetime-local"
                value={proximoEnvio}
                onChange={(e) => setProximoEnvio(e.target.value)}
                InputLabelProps={{ shrink: true }}
                sx={{ width: 240 }}
                disabled={loading}
              />
            </Box>
          </Box>

          <Divider />

          {/* Seção: Conteúdo */}
          <Box sx={{ px: 3, py: 2, bgcolor: (t) => t.palette.mode === 'dark' ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.01)' }}>
            <Typography variant="subtitle2" fontWeight={600} color="text.secondary">CONTEÚDO</Typography>
          </Box>
          <Divider />
          <Box sx={{ p: 3 }}>
            <TextField
              label="Conteúdo do boletim *"
              fullWidth
              multiline
              minRows={10}
              value={conteudo}
              onChange={(e) => setConteudo(e.target.value)}
              placeholder={`Escreva o conteúdo do boletim aqui...\n\nExemplo:\n📍 CENTRO\n\n🚨 Segurança: Sem ocorrências relevantes nas últimas 24h.\n🌊 Balneabilidade: Praias próprias para banho.\n🚦 Trânsito: Fluxo normal.`}
              disabled={loading}
              sx={{ '& .MuiInputBase-root': { fontFamily: 'monospace', fontSize: '0.9rem' } }}
            />
            <Typography variant="caption" color="text.disabled" sx={{ mt: 0.5, display: 'block' }}>
              {conteudo.length} caracteres
            </Typography>
          </Box>

          <Divider />

          {/* Ações */}
          <Box sx={{ px: 3, py: 2, display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
            <Button
              onClick={() => router.push('/admin/boletins')}
              disabled={loading}
              sx={{ textTransform: 'none' }}
            >
              Cancelar
            </Button>
            <Button
              variant="outlined"
              startIcon={loading ? <CircularProgress size={16} /> : <SaveIcon />}
              onClick={() => handleSave('rascunho')}
              disabled={loading}
              sx={{ textTransform: 'none', borderRadius: 2 }}
            >
              Salvar Rascunho
            </Button>
            <Button
              variant="contained"
              startIcon={loading ? <CircularProgress size={16} color="inherit" /> : <SendIcon />}
              onClick={() => handleSave('aguardando_revisao')}
              disabled={loading}
              sx={{ background: 'linear-gradient(135deg, #0077B6, #00B4D8)', textTransform: 'none', borderRadius: 2, fontWeight: 600 }}
            >
              Enviar para Revisão
            </Button>
          </Box>
        </Paper>
      </Box>

      <Snackbar open={snack} autoHideDuration={2000} onClose={() => setSnack(false)}>
        <Alert severity="success" variant="filled">Boletim salvo com sucesso!</Alert>
      </Snackbar>
    </AdminLayout>
  )
}
