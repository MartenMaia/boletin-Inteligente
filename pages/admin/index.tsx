import React from 'react'
import useSWR from 'swr'
import { useRouter } from 'next/router'
import {
  Typography, Box, Paper, Table, TableHead, TableRow, TableCell,
  TableBody, Card, CardContent, Divider, Chip, IconButton, Tooltip,
  CircularProgress, Skeleton,
} from '@mui/material'
import AdminLayout from '../../components/AdminLayout'
import StatusBadge from '../../components/StatusBadge'
import { formatDateShort, formatDateFull } from '../../utils/date'
import EditIcon from '@mui/icons-material/Edit'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import ArticleIcon from '@mui/icons-material/Article'
import PendingActionsIcon from '@mui/icons-material/PendingActions'
import SendIcon from '@mui/icons-material/Send'
import EventIcon from '@mui/icons-material/Event'
import { useAuth } from '../../hooks/useAuth'

const fetcher = (url: string) => fetch(url).then(r => r.json())

const statusColors: Record<string, 'default' | 'warning' | 'success' | 'error' | 'info'> = {
  rascunho:           'default',
  aguardando_revisao: 'warning',
  aprovado:           'info',
  enviado:            'success',
  rejeitado:          'error',
}

const statusLabels: Record<string, string> = {
  rascunho:           'Rascunho',
  aguardando_revisao: 'Aguardando Revisão',
  aprovado:           'Aprovado',
  enviado:            'Enviado',
  rejeitado:          'Rejeitado',
}

export default function AdminHome() {
  const router = useRouter()
  const { profile, loading: authLoading } = useAuth()
  const { data: boletins, isLoading } = useSWR('/api/boletins', fetcher)

  if (authLoading) {
    return (
      <AdminLayout>
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}>
          <CircularProgress />
        </Box>
      </AdminLayout>
    )
  }

  const total = boletins?.length ?? 0
  const aguardando = boletins?.filter((b: any) => b.status === 'aguardando_revisao').length ?? 0
  const enviados = boletins?.filter((b: any) => b.status === 'enviado').length ?? 0
  const proximo = boletins?.find((b: any) => b.proximo_envio)

  const statCards = [
    {
      label: 'Total de Boletins',
      value: total,
      icon: <ArticleIcon sx={{ fontSize: 28, opacity: 0.8 }} />,
      gradient: 'linear-gradient(135deg, #0077B6, #023E8A)',
    },
    {
      label: 'Aguardando Aprovação',
      value: aguardando,
      icon: <PendingActionsIcon sx={{ fontSize: 28, opacity: 0.8 }} />,
      gradient: 'linear-gradient(135deg, #7B2D8B, #4A1B5E)',
    },
    {
      label: 'Enviados',
      value: enviados,
      icon: <SendIcon sx={{ fontSize: 28, opacity: 0.8 }} />,
      gradient: 'linear-gradient(135deg, #1B8A4A, #0D5C30)',
    },
    {
      label: 'Próximo Envio',
      value: proximo ? formatDateShort(proximo.proximo_envio) : '—',
      icon: <EventIcon sx={{ fontSize: 28, opacity: 0.8 }} />,
      gradient: 'linear-gradient(135deg, #B45309, #78350F)',
      subtitle: proximo?.grupo?.name ?? '',
    },
  ]

  return (
    <AdminLayout>
      <Box sx={{ p: 3 }}>
        {/* Header */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="h5" fontWeight={700}>
            Visão Geral
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Bem-vindo, {profile?.name ?? 'usuário'} — acompanhe o status dos boletins
          </Typography>
        </Box>

        {/* Stat Cards */}
        <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
          {statCards.map((card) => (
            <Card
              key={card.label}
              sx={{
                flex: '1 1 160px',
                minWidth: 160,
                background: card.gradient,
                color: 'white',
                borderRadius: 3,
                boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
              }}
            >
              <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <Box>
                    <Typography variant="caption" sx={{ opacity: 0.8, fontWeight: 500 }}>
                      {card.label}
                    </Typography>
                    <Typography variant="h4" fontWeight={700} sx={{ mt: 0.5, lineHeight: 1 }}>
                      {isLoading ? <Skeleton width={40} sx={{ bgcolor: 'rgba(255,255,255,0.2)' }} /> : card.value}
                    </Typography>
                    {card.subtitle && (
                      <Typography variant="caption" sx={{ opacity: 0.7 }}>
                        {card.subtitle}
                      </Typography>
                    )}
                  </Box>
                  {card.icon}
                </Box>
              </CardContent>
            </Card>
          ))}
        </Box>

        {/* Tabela de Boletins */}
        <Paper elevation={0} sx={{ border: (t) => `1px solid ${t.palette.divider}`, borderRadius: 3, overflow: 'hidden' }}>
          <Box sx={{ px: 3, py: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="subtitle1" fontWeight={600}>
              Boletins Recentes
            </Typography>
          </Box>
          <Divider />

          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: (t) => t.palette.mode === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)' }}>
                <TableCell sx={{ fontWeight: 600, py: 1.5 }}>Título</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Grupo</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Criado em</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Próximo Envio</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 600 }} align="right">Ações</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {isLoading
                ? Array.from({ length: 4 }).map((_, i) => (
                    <TableRow key={i}>
                      {Array.from({ length: 6 }).map((_, j) => (
                        <TableCell key={j}><Skeleton /></TableCell>
                      ))}
                    </TableRow>
                  ))
                : boletins?.length === 0
                  ? (
                    <TableRow>
                      <TableCell colSpan={6} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                        Nenhum boletim encontrado. Crie o primeiro!
                      </TableCell>
                    </TableRow>
                  )
                  : boletins?.map((b: any) => (
                    <TableRow key={b.id} hover>
                      <TableCell sx={{ fontWeight: 500 }}>{b.title || `Boletim #${b.id.slice(0, 8)}`}</TableCell>
                      <TableCell>{b.grupo?.name ?? '—'}</TableCell>
                      <TableCell>
                        <Tooltip title={formatDateFull(b.created_at)}>
                          <span>{formatDateShort(b.created_at)}</span>
                        </Tooltip>
                      </TableCell>
                      <TableCell>
                        {b.proximo_envio
                          ? <Tooltip title={formatDateFull(b.proximo_envio)}><span>{formatDateShort(b.proximo_envio)}</span></Tooltip>
                          : '—'}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={statusLabels[b.status] ?? b.status}
                          size="small"
                          color={statusColors[b.status] ?? 'default'}
                          variant="outlined"
                          sx={{ fontSize: '0.7rem', height: 22 }}
                        />
                      </TableCell>
                      <TableCell align="right">
                        <Tooltip title="Revisar">
                          <IconButton size="small" onClick={() => router.push(`/admin/boletins/${b.id}/revisao`)}>
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        {b.status === 'aguardando_revisao' && (
                          <Tooltip title="Aprovar">
                            <IconButton size="small" color="success" onClick={() => router.push(`/admin/boletins/${b.id}/aprovar`)}>
                              <CheckCircleIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
              }
            </TableBody>
          </Table>
        </Paper>
      </Box>
    </AdminLayout>
  )
}
