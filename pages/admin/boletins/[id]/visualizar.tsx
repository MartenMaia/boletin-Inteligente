import React from 'react'
import { useRouter } from 'next/router'
import useSWR from 'swr'
import {
  Box, Typography, Paper, Button, Divider, Chip, Skeleton,
  Avatar, Table, TableHead, TableRow, TableCell, TableBody,
  Tooltip,
} from '@mui/material'
import ArrowBackIcon     from '@mui/icons-material/ArrowBack'
import CheckCircleIcon   from '@mui/icons-material/CheckCircle'
import EmailIcon         from '@mui/icons-material/Email'
import WhatsAppIcon      from '@mui/icons-material/WhatsApp'
import PersonIcon        from '@mui/icons-material/Person'
import PeopleIcon        from '@mui/icons-material/People'
import SendIcon          from '@mui/icons-material/Send'
import CalendarTodayIcon from '@mui/icons-material/CalendarToday'
import AdminLayout from '../../../../components/AdminLayout'
import { formatDateFull } from '../../../../utils/date'

const fetcher = (url: string) => fetch(url).then(r => r.json())

function initials(name: string) {
  return (name || '?').split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase()
}

function InfoItem({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <Box>
      <Typography variant="caption" color="text.disabled" sx={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>
        {label}
      </Typography>
      <Typography variant="body2" fontWeight={500} sx={{ mt: 0.3 }}>{value}</Typography>
    </Box>
  )
}

export default function VisualizarBoletim() {
  const router = useRouter()
  const { id } = router.query

  const { data: boletim, isLoading } = useSWR(id ? `/api/boletins/${id}` : null, fetcher)

  const canaisEnvio: string[] = boletim?.canais_envio || []
  const members: any[]         = boletim?.grupo?.members || []
  const emailMembers            = members.filter((m: any) => m.email)
  const waMembers               = members.filter((m: any) => m.contact)

  const CANAL_INFO: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
    email:     { label: 'E-mail',    icon: <EmailIcon fontSize="small" />,    color: '#0077B6' },
    whatsapp:  { label: 'WhatsApp',  icon: <WhatsAppIcon fontSize="small" />, color: '#25D366' },
  }

  return (
    <AdminLayout>
      <Box sx={{ p: 3, maxWidth: 900, mx: 'auto' }}>

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
          <Box sx={{ flex: 1 }}>
            <Typography variant="h5" fontWeight={700}>Boletim Enviado</Typography>
            <Typography variant="body2" color="text.secondary">Visualização do conteúdo e destinatários</Typography>
          </Box>
          <Chip
            icon={<CheckCircleIcon />}
            label="Enviado"
            color="success"
            variant="outlined"
            sx={{ fontWeight: 700 }}
          />
        </Box>

        {/* ── Informações Gerais ─────────────────────────────────── */}
        <Paper elevation={0} sx={{ border: (t) => `1px solid ${t.palette.divider}`, borderRadius: 3, overflow: 'hidden', mb: 3 }}>
          <Box sx={{ px: 3, py: 2, bgcolor: (t) => t.palette.mode === 'dark' ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.01)' }}>
            <Typography variant="subtitle2" fontWeight={600} color="text.secondary">INFORMAÇÕES DO BOLETIM</Typography>
          </Box>
          <Divider />
          <Box sx={{ p: 3, display: 'flex', gap: 4, flexWrap: 'wrap' }}>
            {isLoading ? <Skeleton width={500} height={60} /> : <>
              <InfoItem label="Grupo" value={boletim?.grupo?.name ?? '—'} />
              <InfoItem label="Criado por" value={boletim?.criador?.name ?? '—'} />
              <InfoItem
                label="Criado em"
                value={boletim?.created_at
                  ? <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <CalendarTodayIcon sx={{ fontSize: 14, color: 'text.disabled' }} />
                      {formatDateFull(boletim.created_at)}
                    </Box>
                  : '—'}
              />
              <InfoItem
                label="Enviado em"
                value={boletim?.data_envio
                  ? <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <SendIcon sx={{ fontSize: 14, color: 'success.main' }} />
                      <Typography variant="body2" fontWeight={600} color="success.main">
                        {formatDateFull(boletim.data_envio)}
                      </Typography>
                    </Box>
                  : '—'}
              />
              {boletim?.aprovador && (
                <InfoItem label="Aprovado por" value={boletim.aprovador.name} />
              )}
            </>}
          </Box>

          <Divider />

          {/* Canais utilizados */}
          <Box sx={{ px: 3, py: 1.5, display: 'flex', alignItems: 'center', gap: 2 }}>
            <Typography variant="caption" color="text.disabled" sx={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5, minWidth: 120 }}>
              Canais de envio
            </Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              {canaisEnvio.length === 0
                ? <Typography variant="body2" color="text.secondary">—</Typography>
                : canaisEnvio.map(c => {
                    const info = CANAL_INFO[c]
                    if (!info) return null
                    return (
                      <Chip
                        key={c}
                        icon={<Box sx={{ color: 'white', display: 'flex' }}>{info.icon}</Box>}
                        label={info.label}
                        size="small"
                        sx={{ bgcolor: info.color, color: 'white', fontWeight: 700, fontSize: '0.78rem' }}
                      />
                    )
                  })}
            </Box>
          </Box>
        </Paper>

        {/* ── Conteúdo do Boletim ────────────────────────────────── */}
        <Paper elevation={0} sx={{ border: (t) => `1px solid ${t.palette.divider}`, borderRadius: 3, overflow: 'hidden', mb: 3 }}>
          <Box sx={{ px: 3, py: 2, bgcolor: (t) => t.palette.mode === 'dark' ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.01)' }}>
            <Typography variant="subtitle2" fontWeight={600} color="text.secondary">CONTEÚDO</Typography>
          </Box>
          <Divider />
          <Box sx={{ p: 3 }}>
            {isLoading ? (
              <><Skeleton height={24} sx={{ mb: 1 }} /><Skeleton height={24} width="80%" sx={{ mb: 1 }} /><Skeleton height={24} width="90%" /></>
            ) : (
              <>
                <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>{boletim?.title}</Typography>
                <Typography
                  variant="body2"
                  sx={{ whiteSpace: 'pre-wrap', fontFamily: 'monospace', lineHeight: 1.8, color: 'text.primary' }}
                >
                  {boletim?.conteudo}
                </Typography>
              </>
            )}
          </Box>
        </Paper>

        {/* ── Destinatários ──────────────────────────────────────── */}
        <Paper elevation={0} sx={{ border: (t) => `1px solid ${t.palette.divider}`, borderRadius: 3, overflow: 'hidden' }}>
          <Box sx={{
            px: 3, py: 2,
            bgcolor: (t) => t.palette.mode === 'dark' ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.01)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <PeopleIcon sx={{ fontSize: 17, color: 'text.secondary' }} />
              <Typography variant="subtitle2" fontWeight={600} color="text.secondary">DESTINATÁRIOS</Typography>
            </Box>
            {!isLoading && members.length > 0 && (
              <Chip
                label={`${members.length} membro${members.length > 1 ? 's' : ''} no grupo`}
                size="small"
                color="primary"
                variant="outlined"
                sx={{ fontSize: '0.7rem', height: 22 }}
              />
            )}
          </Box>
          <Divider />

          {isLoading ? (
            <Box sx={{ p: 3 }}>
              {[1, 2, 3].map(i => <Skeleton key={i} height={52} sx={{ mb: 0.5 }} />)}
            </Box>
          ) : !boletim?.grupo ? (
            <Box sx={{ p: 4, textAlign: 'center' }}>
              <PeopleIcon sx={{ fontSize: 40, color: 'text.disabled', display: 'block', mx: 'auto', mb: 1 }} />
              <Typography color="text.secondary">Este boletim não está vinculado a nenhum grupo.</Typography>
            </Box>
          ) : members.length === 0 ? (
            <Box sx={{ p: 4, textAlign: 'center' }}>
              <PersonIcon sx={{ fontSize: 40, color: 'text.disabled', display: 'block', mx: 'auto', mb: 1 }} />
              <Typography color="text.secondary">O grupo "{boletim.grupo.name}" não possui membros cadastrados.</Typography>
            </Box>
          ) : (
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: (t) => t.palette.mode === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)' }}>
                  <TableCell sx={{ fontWeight: 600, py: 1.5, pl: 3 }}>Nome</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <EmailIcon sx={{ fontSize: 15 }} />E-mail
                    </Box>
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <WhatsAppIcon sx={{ fontSize: 15 }} />WhatsApp
                    </Box>
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Canais recebidos</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {members.map((m: any) => {
                  const hasEmail = !!m.email && canaisEnvio.includes('email')
                  const hasWa    = !!m.contact && canaisEnvio.includes('whatsapp')
                  return (
                    <TableRow key={m.id} hover>
                      <TableCell sx={{ pl: 3 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                          <Avatar sx={{ width: 30, height: 30, fontSize: '0.7rem', bgcolor: 'primary.main', opacity: 0.85 }}>
                            {initials(m.name)}
                          </Avatar>
                          <Typography variant="body2" fontWeight={500}>{m.name}</Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        {m.email
                          ? <Tooltip title={canaisEnvio.includes('email') ? 'E-mail enviado' : 'Canal não utilizado neste boletim'}>
                              <Typography
                                variant="body2"
                                sx={{ color: canaisEnvio.includes('email') ? 'text.primary' : 'text.disabled' }}
                              >
                                {m.email}
                              </Typography>
                            </Tooltip>
                          : <Typography variant="body2" color="text.disabled">—</Typography>}
                      </TableCell>
                      <TableCell>
                        {m.contact
                          ? <Tooltip title={canaisEnvio.includes('whatsapp') ? 'WhatsApp enviado' : 'Canal não utilizado neste boletim'}>
                              <Typography
                                variant="body2"
                                sx={{ color: canaisEnvio.includes('whatsapp') ? 'text.primary' : 'text.disabled' }}
                              >
                                {m.contact}
                              </Typography>
                            </Tooltip>
                          : <Typography variant="body2" color="text.disabled">—</Typography>}
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', gap: 0.5 }}>
                          {hasEmail && (
                            <Chip
                              icon={<EmailIcon sx={{ fontSize: '13px !important', color: 'white !important' }} />}
                              label="E-mail"
                              size="small"
                              sx={{ bgcolor: '#0077B6', color: 'white', fontWeight: 600, fontSize: '0.68rem', height: 20 }}
                            />
                          )}
                          {hasWa && (
                            <Chip
                              icon={<WhatsAppIcon sx={{ fontSize: '13px !important', color: 'white !important' }} />}
                              label="WhatsApp"
                              size="small"
                              sx={{ bgcolor: '#25D366', color: 'white', fontWeight: 600, fontSize: '0.68rem', height: 20 }}
                            />
                          )}
                          {!hasEmail && !hasWa && (
                            <Typography variant="caption" color="text.disabled">Não recebeu</Typography>
                          )}
                        </Box>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}

          {/* Resumo de totais */}
          {!isLoading && members.length > 0 && (
            <>
              <Divider />
              <Box sx={{ px: 3, py: 1.5, display: 'flex', gap: 3, flexWrap: 'wrap' }}>
                {canaisEnvio.includes('email') && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                    <EmailIcon sx={{ fontSize: 16, color: '#0077B6' }} />
                    <Typography variant="caption" color="text.secondary">
                      <strong style={{ color: '#0077B6' }}>{emailMembers.length}</strong> destinatário(s) por e-mail
                    </Typography>
                  </Box>
                )}
                {canaisEnvio.includes('whatsapp') && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                    <WhatsAppIcon sx={{ fontSize: 16, color: '#25D366' }} />
                    <Typography variant="caption" color="text.secondary">
                      <strong style={{ color: '#25D366' }}>{waMembers.length}</strong> destinatário(s) por WhatsApp
                    </Typography>
                  </Box>
                )}
                <Typography variant="caption" color="text.disabled" sx={{ ml: 'auto' }}>
                  Total: {members.length} membro(s) no grupo
                </Typography>
              </Box>
            </>
          )}
        </Paper>
      </Box>
    </AdminLayout>
  )
}
