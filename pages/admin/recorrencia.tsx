import React, { useState } from 'react'
import useSWR, { mutate } from 'swr'
import {
  Box, Typography, Paper, Button, Table, TableHead, TableRow, TableCell,
  TableBody, IconButton, Tooltip, Dialog, DialogTitle, DialogContent,
  DialogActions, TextField, MenuItem, Chip, Skeleton, Snackbar, Alert,
  Divider, CircularProgress, Switch, FormControlLabel, ToggleButton,
  ToggleButtonGroup, FormHelperText, InputAdornment, Select, FormControl,
  InputLabel, OutlinedInput, Checkbox, ListItemText,
} from '@mui/material'
import AddIcon        from '@mui/icons-material/Add'
import EditIcon       from '@mui/icons-material/Edit'
import DeleteIcon     from '@mui/icons-material/Delete'
import PlayArrowIcon  from '@mui/icons-material/PlayArrow'
import RepeatIcon     from '@mui/icons-material/Repeat'
import AccessTimeIcon from '@mui/icons-material/AccessTime'
import AdminLayout    from '../../components/AdminLayout'
import { useAuth }    from '../../hooks/useAuth'

import EmailIcon    from '@mui/icons-material/Email'
import WhatsAppIcon from '@mui/icons-material/WhatsApp'

const fetcher = (url: string) => fetch(url).then(r => r.json())

const DIAS_SEMANA = [
  { value: 1, label: 'Seg' },
  { value: 2, label: 'Ter' },
  { value: 3, label: 'Qua' },
  { value: 4, label: 'Qui' },
  { value: 5, label: 'Sex' },
  { value: 6, label: 'Sáb' },
  { value: 0, label: 'Dom' },
]

const RECORRENCIA_LABEL: Record<string, string> = {
  diaria:     'Diária',
  semanal:    'Semanal',
  mensal:     'Mensal',
  customizada:'Personalizada',
}

const RECORRENCIA_COLOR: Record<string, 'primary' | 'secondary' | 'success' | 'warning'> = {
  diaria:     'primary',
  semanal:    'success',
  mensal:     'secondary',
  customizada:'warning',
}

function recorrenciaDesc(t: any): string {
  switch (t.recorrencia) {
    case 'diaria':
      return 'Todo dia'
    case 'semanal': {
      const d = DIAS_SEMANA.find(d => d.value === (t.dias_semana?.[0] ?? -1))
      return d ? `Toda ${d.label === 'Dom' ? 'domingo' : d.label === 'Sáb' ? 'sábado' : d.label + 'feira'}` : 'Semanal'
    }
    case 'mensal':
      return `Todo dia ${t.dia_mes} do mês`
    case 'customizada': {
      const dias = (t.dias_semana || [])
        .map((v: number) => DIAS_SEMANA.find(d => d.value === v)?.label)
        .filter(Boolean)
      return dias.length ? dias.join(', ') : 'Personalizada'
    }
    default:
      return '—'
  }
}

function proximaGeracao(t: any): string {
  const hoje = new Date()
  const diaSemana = hoje.getDay()
  const diaMes    = hoje.getDate()

  switch (t.recorrencia) {
    case 'diaria':
      return 'Amanhã'
    case 'semanal': {
      const alvo = t.dias_semana?.[0] ?? 1
      let diff = alvo - diaSemana
      if (diff <= 0) diff += 7
      const prox = new Date(hoje); prox.setDate(hoje.getDate() + diff)
      return prox.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: '2-digit' })
    }
    case 'mensal': {
      const alvo = t.dia_mes ?? 1
      const prox = new Date(hoje)
      if (diaMes >= alvo) prox.setMonth(prox.getMonth() + 1)
      prox.setDate(alvo)
      return prox.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
    }
    case 'customizada': {
      const dias: number[] = t.dias_semana || []
      if (!dias.length) return '—'
      let min = 8
      for (const d of dias) {
        let diff = d - diaSemana
        if (diff <= 0) diff += 7
        if (diff < min) min = diff
      }
      const prox = new Date(hoje); prox.setDate(hoje.getDate() + min)
      return prox.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: '2-digit' })
    }
    default: return '—'
  }
}

const EMPTY_FORM = {
  title_template: '',
  conteudo:       '',
  grupo_id:       '',
  bairro_ids:     [] as string[],
  canais_envio:   [] as string[],
  recorrencia:    'diaria' as string,
  dias_semana:    [] as number[],
  dia_mes:        1,
  horas_validacao:8,
  hora_envio:     '09:00',
  ativo:          true,
}

export default function Recorrencia() {
  const { profile } = useAuth()
  const { data: templates, isLoading } = useSWR('/api/templates', fetcher)
  const { data: grupos }        = useSWR('/api/groups',      fetcher)
  const { data: bairros }       = useSWR('/api/bairros',     fetcher)
  const { data: canaisConfig }  = useSWR('/api/envio/config', fetcher)

  const canaisAtivos: Array<{ canal: string; label: string; icon: React.ReactNode; color: string }> =
    (canaisConfig || [])
      .filter((c: any) => c.ativo)
      .map((c: any) => ({
        canal: c.canal,
        label: c.canal === 'email' ? 'E-mail' : 'WhatsApp',
        icon:  c.canal === 'email' ? <EmailIcon fontSize="small" /> : <WhatsAppIcon fontSize="small" />,
        color: c.canal === 'email' ? '#0077B6' : '#25D366',
      }))

  const [modal, setModal]     = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const [saving, setSaving]   = useState(false)
  const [simulating, setSimulating] = useState(false)
  const [form, setForm]       = useState({ ...EMPTY_FORM })

  const [confirmDelete, setConfirmDelete] = useState<any>(null)
  const [deleting, setDeleting] = useState(false)

  const [snack, setSnack] = useState<{ open: boolean; message: string; severity: 'success' | 'error' | 'info' }>({
    open: false, message: '', severity: 'success',
  })
  const showSnack = (message: string, severity: typeof snack.severity = 'success') =>
    setSnack({ open: true, message, severity })

  const patchForm = (key: string, value: any) => setForm(f => ({ ...f, [key]: value }))

  // ── Open modal ──
  const openNew = () => {
    setEditing(null)
    setForm({ ...EMPTY_FORM })
    setModal(true)
  }

  const openEdit = (t: any) => {
    setEditing(t)
    setForm({
      title_template:  t.title_template,
      conteudo:        t.conteudo  || '',
      grupo_id:        t.grupo?.id || '',
      bairro_ids:      t.bairro_ids || [],
      canais_envio:    t.canais_envio || [],
      recorrencia:     t.recorrencia,
      dias_semana:     t.dias_semana || [],
      dia_mes:         t.dia_mes ?? 1,
      horas_validacao: t.horas_validacao ?? 8,
      hora_envio:      t.hora_envio ?? '09:00',
      ativo:           t.ativo ?? true,
    })
    setModal(true)
  }

  // ── Save ──
  const handleSave = async () => {
    if (!form.title_template.trim()) return showSnack('Título é obrigatório', 'error')
    if (form.recorrencia === 'semanal' && form.dias_semana.length === 0)
      return showSnack('Selecione o dia da semana', 'error')
    if (form.recorrencia === 'customizada' && form.dias_semana.length === 0)
      return showSnack('Selecione pelo menos um dia', 'error')
    if (canaisAtivos.length > 0 && form.canais_envio.length === 0)
      return showSnack('Selecione pelo menos um canal de envio', 'error')

    setSaving(true)
    try {
      const url    = editing ? `/api/templates/${editing.id}` : '/api/templates'
      const method = editing ? 'PATCH' : 'POST'
      const body   = {
        ...form,
        grupo_id:    form.grupo_id || null,
        canais_envio: form.canais_envio,
        criado_por:  profile?.id  || null,
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
      await mutate('/api/templates')
      setModal(false)
      showSnack(editing ? 'Template atualizado!' : 'Template criado!')
    } catch (e: any) {
      showSnack(e.message, 'error')
    } finally {
      setSaving(false)
    }
  }

  // ── Toggle ativo ──
  const handleToggleAtivo = async (t: any) => {
    await fetch(`/api/templates/${t.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ativo: !t.ativo }),
    })
    mutate('/api/templates')
  }

  // ── Delete ──
  const handleDelete = async () => {
    if (!confirmDelete) return
    setDeleting(true)
    try {
      await fetch(`/api/templates/${confirmDelete.id}`, { method: 'DELETE' })
      await mutate('/api/templates')
      setConfirmDelete(null)
      showSnack('Template removido')
    } catch {
      showSnack('Erro ao remover', 'error')
    } finally {
      setDeleting(false)
    }
  }

  // ── Simulate cron (generate now) ──
  const handleSimulate = async () => {
    setSimulating(true)
    try {
      const res = await fetch('/api/cron/gerar-boletins', { method: 'POST' })
      const data = await res.json()
      showSnack(
        data.gerados > 0
          ? `${data.gerados} boletim(ns) gerado(s) com sucesso!`
          : 'Nenhum boletim gerado (verifique os dias configurados)',
        data.gerados > 0 ? 'success' : 'info'
      )
    } catch {
      showSnack('Erro ao simular geração', 'error')
    } finally {
      setSimulating(false)
    }
  }

  const bairroNome = (id: string) =>
    (bairros || []).find((b: any) => b.id === id)?.name ?? id

  return (
    <AdminLayout>
      <Box sx={{ p: 3 }}>

        {/* Header */}
        <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Box>
            <Typography variant="h5" fontWeight={700}>Boletins Recorrentes</Typography>
            <Typography variant="body2" color="text.secondary">
              Configure templates para geração automática diária, semanal, mensal ou personalizada
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 1.5 }}>
            <Tooltip title="Gerar boletins agora (simular cron)">
              <Button
                variant="outlined" startIcon={simulating ? <CircularProgress size={16} /> : <PlayArrowIcon />}
                onClick={handleSimulate} disabled={simulating}
                sx={{ textTransform: 'none', borderRadius: 2 }}
              >
                Gerar Agora
              </Button>
            </Tooltip>
            <Button
              variant="contained" startIcon={<AddIcon />} onClick={openNew}
              sx={{ background: 'linear-gradient(135deg, #0077B6, #00B4D8)', fontWeight: 600, textTransform: 'none', borderRadius: 2 }}
            >
              Novo Template
            </Button>
          </Box>
        </Box>

        {/* Info banner */}
        <Alert severity="info" icon={<AccessTimeIcon />} sx={{ mb: 2.5, borderRadius: 2 }}>
          Os boletins são gerados automaticamente às <strong>09:00 (horário de Brasília)</strong> e ficam disponíveis
          para revisão pelo prazo de validação configurado em cada template.
          Use <strong>"Gerar Agora"</strong> para testar.
        </Alert>

        {/* Table */}
        <Paper elevation={0} sx={{ border: (t) => `1px solid ${t.palette.divider}`, borderRadius: 3, overflow: 'hidden' }}>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: (t) => t.palette.mode === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)' }}>
                <TableCell sx={{ fontWeight: 600, py: 1.5, pl: 3 }}>Template</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Recorrência</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Próxima Geração</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Validação</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Grupo</TableCell>
                <TableCell sx={{ fontWeight: 600 }} align="center">Ativo</TableCell>
                <TableCell sx={{ fontWeight: 600 }} align="right">Ações</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {isLoading
                ? Array.from({ length: 3 }).map((_, i) => (
                  <TableRow key={i}>{[1,2,3,4,5,6,7].map(j => <TableCell key={j}><Skeleton /></TableCell>)}</TableRow>
                ))
                : (!templates || templates.length === 0)
                  ? (
                    <TableRow>
                      <TableCell colSpan={7} align="center" sx={{ py: 8 }}>
                        <RepeatIcon sx={{ fontSize: 48, color: 'text.disabled', display: 'block', mx: 'auto', mb: 1 }} />
                        <Typography color="text.secondary" gutterBottom>Nenhum template configurado</Typography>
                        <Button size="small" startIcon={<AddIcon />} onClick={openNew} sx={{ textTransform: 'none', mt: 1 }}>
                          Criar primeiro template
                        </Button>
                      </TableCell>
                    </TableRow>
                  )
                  : templates.map((t: any) => (
                    <TableRow key={t.id} hover sx={{ opacity: t.ativo ? 1 : 0.5 }}>
                      <TableCell sx={{ pl: 3 }}>
                        <Typography fontWeight={500} sx={{ fontSize: '0.875rem' }}>{t.title_template}</Typography>
                        {t.bairro_ids?.length > 0 && (
                          <Box sx={{ mt: 0.5, display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                            {t.bairro_ids.slice(0, 3).map((bid: string) => (
                              <Chip key={bid} label={bairroNome(bid)} size="small"
                                sx={{ height: 18, fontSize: '0.65rem' }} />
                            ))}
                            {t.bairro_ids.length > 3 && (
                              <Chip label={`+${t.bairro_ids.length - 3}`} size="small"
                                sx={{ height: 18, fontSize: '0.65rem' }} />
                            )}
                          </Box>
                        )}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={RECORRENCIA_LABEL[t.recorrencia] || t.recorrencia}
                          color={RECORRENCIA_COLOR[t.recorrencia] || 'default'}
                          size="small" sx={{ fontWeight: 600, fontSize: '0.7rem', height: 22 }}
                        />
                        <Typography variant="caption" display="block" color="text.secondary" sx={{ mt: 0.3 }}>
                          {recorrenciaDesc(t)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color={t.ativo ? 'text.primary' : 'text.disabled'}>
                          {t.ativo ? proximaGeracao(t) : '—'}
                        </Typography>
                        {t.hora_envio && t.ativo && (
                          <Typography variant="caption" color="text.secondary">
                            às {t.hora_envio}
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <AccessTimeIcon sx={{ fontSize: 15, color: 'text.secondary' }} />
                          <Typography variant="body2">{t.horas_validacao}h</Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="text.secondary">
                          {t.grupo?.name || '—'}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Switch
                          size="small" checked={t.ativo}
                          onChange={() => handleToggleAtivo(t)}
                          color="primary"
                        />
                      </TableCell>
                      <TableCell align="right" sx={{ pr: 2 }}>
                        <Tooltip title="Editar">
                          <IconButton size="small" onClick={() => openEdit(t)}>
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Remover">
                          <IconButton size="small" color="error" onClick={() => setConfirmDelete(t)}>
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))
              }
            </TableBody>
          </Table>
        </Paper>
      </Box>

      {/* ─────────────────────────────────────────
          Modal: criar / editar template
      ───────────────────────────────────────── */}
      <Dialog open={modal} onClose={() => !saving && setModal(false)} fullWidth maxWidth="md">
        <DialogTitle sx={{ fontWeight: 700 }}>
          {editing ? 'Editar Template' : 'Novo Template de Recorrência'}
        </DialogTitle>
        <Divider />
        <DialogContent sx={{ pt: 3 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>

            {/* Título */}
            <TextField
              label="Título do boletim *" fullWidth value={form.title_template}
              onChange={e => patchForm('title_template', e.target.value)}
              helperText="Use {data}, {dia_semana}, {dia}, {mes}, {ano} para substituição automática"
              placeholder="Ex: Boletim Diário — {data}"
            />

            {/* Grupo + Bairros */}
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                select label="Grupo destinatário" value={form.grupo_id}
                onChange={e => patchForm('grupo_id', e.target.value)} sx={{ flex: 1 }}
              >
                <MenuItem value=""><em>Sem grupo específico</em></MenuItem>
                {(grupos || []).map((g: any) => (
                  <MenuItem key={g.id} value={g.id}>{g.name}</MenuItem>
                ))}
              </TextField>

              <FormControl sx={{ flex: 1 }}>
                <InputLabel>Bairros</InputLabel>
                <Select
                  multiple value={form.bairro_ids}
                  onChange={e => patchForm('bairro_ids', typeof e.target.value === 'string' ? e.target.value.split(',') : e.target.value)}
                  input={<OutlinedInput label="Bairros" />}
                  renderValue={(sel) => (sel as string[]).map(id => bairroNome(id)).join(', ')}
                  MenuProps={{ PaperProps: { style: { maxHeight: 240 } } }}
                >
                  {(bairros || []).map((b: any) => (
                    <MenuItem key={b.id} value={b.id}>
                      <Checkbox checked={form.bairro_ids.includes(b.id)} size="small" />
                      <ListItemText primary={b.name} />
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>

            {/* Recorrência */}
            <Box>
              <Typography variant="subtitle2" fontWeight={600} color="text.secondary" sx={{ mb: 1 }}>
                RECORRÊNCIA
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                {(['diaria','semanal','mensal','customizada'] as const).map(r => (
                  <Chip
                    key={r}
                    label={RECORRENCIA_LABEL[r]}
                    onClick={() => { patchForm('recorrencia', r); patchForm('dias_semana', []) }}
                    color={form.recorrencia === r ? RECORRENCIA_COLOR[r] : 'default'}
                    variant={form.recorrencia === r ? 'filled' : 'outlined'}
                    clickable
                    sx={{ fontWeight: form.recorrencia === r ? 700 : 400 }}
                  />
                ))}
              </Box>
            </Box>

            {/* Semanal: dia da semana (um único dia) */}
            {form.recorrencia === 'semanal' && (
              <Box>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>Dia da semana:</Typography>
                <ToggleButtonGroup
                  value={form.dias_semana[0] ?? null}
                  exclusive
                  onChange={(_, v) => v !== null && patchForm('dias_semana', [v])}
                  size="small"
                >
                  {DIAS_SEMANA.map(d => (
                    <ToggleButton key={d.value} value={d.value} sx={{ minWidth: 52, fontWeight: 600 }}>
                      {d.label}
                    </ToggleButton>
                  ))}
                </ToggleButtonGroup>
              </Box>
            )}

            {/* Mensal: dia do mês */}
            {form.recorrencia === 'mensal' && (
              <TextField
                label="Dia do mês" type="number" value={form.dia_mes}
                onChange={e => patchForm('dia_mes', Math.min(31, Math.max(1, Number(e.target.value))))}
                InputProps={{ inputProps: { min: 1, max: 31 } }}
                sx={{ width: 140 }}
                helperText="Entre 1 e 31"
              />
            )}

            {/* Customizada: múltiplos dias */}
            {form.recorrencia === 'customizada' && (
              <Box>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  Dias da semana (múltiplos):
                </Typography>
                <ToggleButtonGroup
                  value={form.dias_semana}
                  onChange={(_, v) => patchForm('dias_semana', v)}
                  size="small"
                >
                  {DIAS_SEMANA.map(d => (
                    <ToggleButton key={d.value} value={d.value} sx={{ minWidth: 52, fontWeight: 600 }}>
                      {d.label}
                    </ToggleButton>
                  ))}
                </ToggleButtonGroup>
                {form.dias_semana.length > 0 && (
                  <FormHelperText>
                    Selecionados: {form.dias_semana
                      .map(v => DIAS_SEMANA.find(d => d.value === v)?.label)
                      .filter(Boolean).join(', ')}
                  </FormHelperText>
                )}
              </Box>
            )}

            {/* Horário de envio + Horas de validação */}
            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, flexWrap: 'wrap' }}>
              <TextField
                label="Horário de envio"
                type="time"
                value={form.hora_envio}
                onChange={e => patchForm('hora_envio', e.target.value)}
                InputLabelProps={{ shrink: true }}
                inputProps={{ step: 300 }}
                sx={{ width: 160 }}
                helperText="Hora de geração do boletim"
              />
              <TextField
                label="Prazo de validação"
                type="number"
                value={form.horas_validacao}
                onChange={e => patchForm('horas_validacao', Math.max(1, Number(e.target.value)))}
                InputProps={{
                  inputProps: { min: 1 },
                  endAdornment: <InputAdornment position="end">horas</InputAdornment>,
                }}
                sx={{ width: 180 }}
                helperText="Tempo para aprovar após geração"
              />
              <FormControlLabel
                control={
                  <Switch checked={form.ativo} onChange={e => patchForm('ativo', e.target.checked)} />
                }
                label="Template ativo"
                sx={{ mt: 1 }}
              />
            </Box>

            {/* Canais de envio */}
            <Box>
              <Typography variant="subtitle2" fontWeight={600} color="text.secondary" sx={{ mb: 1 }}>
                CANAIS DE ENVIO *
              </Typography>
              {canaisAtivos.length === 0 ? (
                <Alert severity="info" sx={{ borderRadius: 2, fontSize: '0.85rem' }}>
                  Nenhum canal ativo. Configure em <strong>Configurações → Envio</strong>.
                </Alert>
              ) : (
                <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', alignItems: 'center' }}>
                  {canaisAtivos.map(({ canal, label, icon, color }) => {
                    const selected = form.canais_envio.includes(canal)
                    return (
                      <Chip
                        key={canal}
                        icon={<Box sx={{ display: 'flex' }}>{icon}</Box>}
                        label={label}
                        onClick={() => {
                          patchForm('canais_envio', selected
                            ? form.canais_envio.filter((c: string) => c !== canal)
                            : [...form.canais_envio, canal])
                        }}
                        variant={selected ? 'filled' : 'outlined'}
                        sx={{
                          fontWeight: selected ? 700 : 400,
                          fontSize: '0.85rem',
                          height: 36,
                          px: 0.5,
                          bgcolor: selected ? color : 'transparent',
                          color: selected ? 'white' : 'text.primary',
                          borderColor: color,
                          '& .MuiChip-icon': { color: selected ? 'white' : color },
                          '&:hover': { bgcolor: selected ? color : `${color}18` },
                        }}
                      />
                    )
                  })}
                  {form.canais_envio.length === 0 && (
                    <FormHelperText error sx={{ ml: 0 }}>
                      Selecione pelo menos um canal
                    </FormHelperText>
                  )}
                </Box>
              )}
            </Box>

            {/* Conteúdo base */}
            <TextField
              label="Conteúdo base" fullWidth multiline minRows={5}
              value={form.conteudo} onChange={e => patchForm('conteudo', e.target.value)}
              placeholder={`Conteúdo padrão do boletim gerado...\n\nExemplo:\n📍 BOLETIM DIÁRIO — {data}\n\n🚨 Segurança: ...\n🌊 Balneabilidade: ...\n🚦 Trânsito: ...`}
              helperText="Conteúdo inicial do boletim. O aprovador poderá complementar antes de aprovar."
              sx={{ '& .MuiInputBase-root': { fontFamily: 'monospace', fontSize: '0.875rem' } }}
            />
          </Box>
        </DialogContent>
        <Divider />
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setModal(false)} disabled={saving} sx={{ textTransform: 'none' }}>
            Cancelar
          </Button>
          <Button
            variant="contained" onClick={handleSave} disabled={saving || !form.title_template.trim()}
            sx={{ background: 'linear-gradient(135deg, #0077B6, #00B4D8)', textTransform: 'none', minWidth: 100 }}
          >
            {saving ? <CircularProgress size={18} color="inherit" /> : editing ? 'Salvar' : 'Criar Template'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Confirmar deleção ── */}
      <Dialog open={!!confirmDelete} onClose={() => setConfirmDelete(null)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Remover Template</DialogTitle>
        <DialogContent>
          <Typography>
            Tem certeza que deseja remover o template{' '}
            <strong>"{confirmDelete?.title_template}"</strong>?
            Os boletins já gerados não serão afetados.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setConfirmDelete(null)} sx={{ textTransform: 'none' }}>Cancelar</Button>
          <Button variant="contained" color="error" onClick={handleDelete} disabled={deleting}
            sx={{ textTransform: 'none' }}>
            {deleting ? <CircularProgress size={18} color="inherit" /> : 'Remover'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={snack.open} autoHideDuration={4000} onClose={() => setSnack(s => ({ ...s, open: false }))}>
        <Alert severity={snack.severity} variant="filled">{snack.message}</Alert>
      </Snackbar>
    </AdminLayout>
  )
}
