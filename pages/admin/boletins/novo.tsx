import React, { useState } from 'react'
import { useRouter } from 'next/router'
import useSWR from 'swr'
import {
  Box, Typography, Paper, TextField, Button, MenuItem,
  Divider, Alert, CircularProgress, Chip, Snackbar,
  Checkbox, ListItemText, OutlinedInput, Select, FormControl,
  InputLabel, FormHelperText, Tooltip,
} from '@mui/material'
import ArrowBackIcon   from '@mui/icons-material/ArrowBack'
import SaveIcon        from '@mui/icons-material/Save'
import SendIcon        from '@mui/icons-material/Send'
import LocationOnIcon  from '@mui/icons-material/LocationOn'
import EmailIcon       from '@mui/icons-material/Email'
import WhatsAppIcon    from '@mui/icons-material/WhatsApp'
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined'
import AdminLayout from '../../../components/AdminLayout'
import { useAuth } from '../../../hooks/useAuth'

const fetcher = (url: string) => fetch(url).then(r => r.json())

export default function NovoBoletim() {
  const router = useRouter()
  const { profile } = useAuth()
  const { data: grupos } = useSWR('/api/groups', fetcher)
  const { data: bairros } = useSWR('/api/bairros', fetcher)
  const { data: canaisConfig } = useSWR('/api/envio/config', fetcher)

  const [title, setTitle] = useState('')
  const [conteudo, setConteudo] = useState('')
  const [grupoId, setGrupoId] = useState('')
  const [bairroIds, setBairroIds] = useState<string[]>([])
  const [canaisEnvio, setCanaisEnvio] = useState<string[]>([])
  const [proximoEnvio, setProximoEnvio] = useState('')

  // Canais ativos e configurados
  const canaisAtivos: Array<{ canal: string; label: string; icon: React.ReactNode; color: string }> =
    (canaisConfig || [])
      .filter((c: any) => c.ativo)
      .map((c: any) => ({
        canal: c.canal,
        label: c.canal === 'email' ? 'E-mail' : 'WhatsApp',
        icon:  c.canal === 'email' ? <EmailIcon fontSize="small" /> : <WhatsAppIcon fontSize="small" />,
        color: c.canal === 'email' ? '#0077B6' : '#25D366',
      }))

  const toggleCanal = (canal: string) =>
    setCanaisEnvio(prev => prev.includes(canal) ? prev.filter(c => c !== canal) : [...prev, canal])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [snack, setSnack] = useState(false)

  const handleSave = async (submitStatus: 'rascunho' | 'aguardando_revisao') => {
    if (!title.trim()) return setError('Informe um título para o boletim.')
    if (!conteudo.trim()) return setError('O conteúdo do boletim não pode estar vazio.')
    if (canaisAtivos.length > 0 && canaisEnvio.length === 0)
      return setError('Selecione pelo menos um canal de envio.')
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
          bairro_ids: bairroIds,
          canais_envio: canaisEnvio,
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

  const bairroNome = (id: string) =>
    (bairros || []).find((b: any) => b.id === id)?.name ?? id

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
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <TextField
                select
                label="Grupo destinatário"
                value={grupoId}
                onChange={(e) => setGrupoId(e.target.value)}
                sx={{ flex: 1, minWidth: 200 }}
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
                label="Data e horário de envio"
                type="datetime-local"
                value={proximoEnvio}
                onChange={(e) => setProximoEnvio(e.target.value)}
                InputLabelProps={{ shrink: true }}
                helperText="Quando este boletim deve ser enviado"
                sx={{ width: 260 }}
                disabled={loading}
              />
            </Box>
          </Box>

          <Divider />

          {/* Seção: Bairros */}
          <Box sx={{ px: 3, py: 2, bgcolor: (t) => t.palette.mode === 'dark' ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.01)', display: 'flex', alignItems: 'center', gap: 1 }}>
            <LocationOnIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
            <Typography variant="subtitle2" fontWeight={600} color="text.secondary">BAIRROS / REGIÕES</Typography>
          </Box>
          <Divider />
          <Box sx={{ p: 3 }}>
            <FormControl fullWidth disabled={loading}>
              <InputLabel>Bairros abrangidos pelo boletim</InputLabel>
              <Select
                multiple
                value={bairroIds}
                onChange={(e) => setBairroIds(typeof e.target.value === 'string' ? e.target.value.split(',') : e.target.value as string[])}
                input={<OutlinedInput label="Bairros abrangidos pelo boletim" />}
                renderValue={(selected) => (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {(selected as string[]).map(id => (
                      <Chip
                        key={id}
                        label={bairroNome(id)}
                        size="small"
                        icon={<LocationOnIcon sx={{ fontSize: '14px !important' }} />}
                        sx={{ height: 22, fontSize: '0.72rem' }}
                      />
                    ))}
                  </Box>
                )}
                MenuProps={{ PaperProps: { style: { maxHeight: 280 } } }}
              >
                {(bairros || []).map((b: any) => (
                  <MenuItem key={b.id} value={b.id}>
                    <Checkbox checked={bairroIds.includes(b.id)} size="small" />
                    <ListItemText primary={b.name} />
                  </MenuItem>
                ))}
              </Select>
              <FormHelperText>
                Selecione um ou mais bairros para filtrar as informações do boletim.
                {bairroIds.length > 0 && ` ${bairroIds.length} selecionado${bairroIds.length > 1 ? 's' : ''}.`}
              </FormHelperText>
            </FormControl>
          </Box>

          <Divider />

          {/* Seção: Canais de Envio */}
          <Box sx={{ px: 3, py: 2, bgcolor: (t) => t.palette.mode === 'dark' ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.01)', display: 'flex', alignItems: 'center', gap: 1 }}>
            <SendIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
            <Typography variant="subtitle2" fontWeight={600} color="text.secondary">CANAIS DE ENVIO</Typography>
          </Box>
          <Divider />
          <Box sx={{ p: 3 }}>
            {canaisAtivos.length === 0 ? (
              <Alert severity="info" icon={<InfoOutlinedIcon />} sx={{ borderRadius: 2 }}>
                Nenhum canal de envio configurado. Um administrador deve ativar os canais em{' '}
                <strong>Configurações → Envio</strong>.
              </Alert>
            ) : (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                  Selecione como este boletim será entregue aos destinatários:
                </Typography>
                <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
                  {canaisAtivos.map(({ canal, label, icon, color }) => {
                    const selected = canaisEnvio.includes(canal)
                    return (
                      <Chip
                        key={canal}
                        icon={<Box sx={{ color: selected ? 'white' : color, display: 'flex' }}>{icon}</Box>}
                        label={label}
                        onClick={() => toggleCanal(canal)}
                        variant={selected ? 'filled' : 'outlined'}
                        sx={{
                          fontWeight: selected ? 700 : 400,
                          fontSize: '0.85rem',
                          height: 36,
                          px: 0.5,
                          bgcolor: selected ? color : 'transparent',
                          color: selected ? 'white' : 'text.primary',
                          borderColor: color,
                          '&:hover': { bgcolor: selected ? color : `${color}18` },
                        }}
                      />
                    )
                  })}
                </Box>
                {canaisEnvio.length === 0 && (
                  <Typography variant="caption" color="error" sx={{ mt: 0.5 }}>
                    Selecione pelo menos um canal de envio para continuar.
                  </Typography>
                )}
              </Box>
            )}
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
