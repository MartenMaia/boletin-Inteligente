import React, { useState, Fragment } from 'react'
import useSWR from 'swr'
import {
  Box, Typography, Paper, Table, TableHead, TableBody,
  TableRow, TableCell, Chip, Tooltip, IconButton,
  CircularProgress, Collapse, Alert, Button, Divider,
} from '@mui/material'
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown'
import KeyboardArrowUpIcon   from '@mui/icons-material/KeyboardArrowUp'
import RefreshIcon           from '@mui/icons-material/Refresh'
import WavesIcon             from '@mui/icons-material/Waves'
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord'

// ── Tipos ────────────────────────────────────────────────────────────────────

interface UltimaColeta { data: string; status: string }

interface Ponto {
  ponto_id: string
  nome: string
  descricao: string | null
  numero_ponto: number | null
  status_atual: string
  data_ultima_coleta: string | null
  data_hora_coleta: string | null
  ultimas_coletas: UltimaColeta[]
}

interface BairroResumo {
  bairro_id: string
  bairro_nome: string
  cidade: string
  status_atual: string
  ultimas_coletas: UltimaColeta[]
  pontos: Ponto[]
  total_pontos: number
}

// ── Helpers ───────────────────────────────────────────────────────────────────

export const STATUS_COR: Record<string, string> = {
  propria:       '#2e7d32',
  impropria:     '#c62828',
  indeterminada: '#e65100',
  sem_dados:     '#9e9e9e',
}

export const STATUS_LABEL: Record<string, string> = {
  propria:       'Própria',
  impropria:     'Imprópria',
  indeterminada: 'Indeterminada',
  sem_dados:     'Sem dados',
}

const STATUS_MUI: Record<string, 'success' | 'error' | 'warning' | 'default'> = {
  propria:       'success',
  impropria:     'error',
  indeterminada: 'warning',
  sem_dados:     'default',
}

function formatarData(iso: string | null): string {
  if (!iso) return '—'
  try { return new Date(iso + (iso.includes('T') ? '' : 'T00:00:00')).toLocaleDateString('pt-BR') }
  catch { return iso }
}

function formatarDataHora(iso: string | null): string {
  if (!iso) return '—'
  try {
    return new Date(iso).toLocaleString('pt-BR', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    })
  } catch { return iso }
}

// ── Dot colorido com tooltip de data ─────────────────────────────────────────

function ColetaDot({ status, data }: { status: string; data: string }) {
  return (
    <Tooltip
      title={
        <Box>
          <Typography variant="caption" sx={{ display: 'block', fontWeight: 600 }}>
            {formatarData(data)}
          </Typography>
          <Typography variant="caption">{STATUS_LABEL[status] ?? status}</Typography>
        </Box>
      }
      placement="top" arrow
    >
      <Box sx={{
        width: 13, height: 13, borderRadius: '3px',
        bgcolor: STATUS_COR[status] ?? '#9e9e9e',
        cursor: 'default', flexShrink: 0,
        boxShadow: '0 1px 3px rgba(0,0,0,0.18)',
        transition: 'transform 0.1s',
        '&:hover': { transform: 'scale(1.3)' },
      }} />
    </Tooltip>
  )
}

// ── Dot vazio — borda contrastante com o tema ─────────────────────────────────

function ColetaDotVazio() {
  return (
    <Box sx={{
      width: 13, height: 13, borderRadius: '3px',
      border: (t) => `2px dashed ${
        t.palette.mode === 'dark'
          ? 'rgba(255,255,255,0.35)'
          : 'rgba(0,0,0,0.28)'
      }`,
      flexShrink: 0,
    }} />
  )
}

// ── Linha de 5 dots (preenche com vazios se < 5) ──────────────────────────────

function Dots5({ coletas }: { coletas: UltimaColeta[] }) {
  const lista = [...coletas]
  while (lista.length < 5) lista.push(null as any)
  return (
    <Box sx={{ display: 'flex', gap: 0.7, alignItems: 'center' }}>
      {lista.map((c, i) =>
        c ? <ColetaDot key={i} status={c.status} data={c.data} />
          : <ColetaDotVazio key={i} />
      )}
    </Box>
  )
}

// ── Sub-tabela de pontos (expandida) ─────────────────────────────────────────

function PontosRow({ pontos, open }: { pontos: Ponto[]; open: boolean }) {
  return (
    <TableRow>
      <TableCell colSpan={5} sx={{ p: 0, border: 0 }}>
        <Collapse in={open} timeout="auto" unmountOnExit>
          <Box sx={{
            mx: 3, my: 1.5, borderRadius: 2, overflow: 'hidden',
            border: (t) => `1px solid ${t.palette.divider}`,
          }}>
            <Table size="small">
              <TableHead>
                <TableRow sx={{
                  bgcolor: (t) => t.palette.mode === 'dark'
                    ? 'rgba(255,255,255,0.04)'
                    : 'rgba(0,119,182,0.06)',
                }}>
                  <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', color: '#0077B6', py: 1.2, pl: 2 }}>
                    Ponto de Coleta
                  </TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', color: '#0077B6', py: 1.2 }}>
                    Status
                  </TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', color: '#0077B6', py: 1.2 }}>
                    Últimas 5 Coletas
                  </TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', color: '#0077B6', py: 1.2 }}>
                    Última Coleta
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {pontos.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} sx={{ py: 3, textAlign: 'center' }}>
                      <Typography variant="body2" color="text.secondary">
                        Nenhum ponto de coleta cadastrado
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  pontos.map((ponto) => (
                    <TableRow
                      key={ponto.ponto_id}
                      sx={{
                        '&:last-child td': { borderBottom: 0 },
                        '&:hover': {
                          bgcolor: (t) => t.palette.mode === 'dark'
                            ? 'rgba(255,255,255,0.03)'
                            : 'rgba(0,0,0,0.02)',
                        },
                      }}
                    >
                      {/* Ponto: descrição + tooltip com data */}
                      <TableCell sx={{ pl: 2, py: 1.5, maxWidth: 280 }}>
                        <Tooltip
                          title={
                            <Box>
                              <Typography variant="caption" sx={{ fontWeight: 700, display: 'block' }}>
                                Última coleta
                              </Typography>
                              <Typography variant="caption">
                                {ponto.data_hora_coleta
                                  ? formatarDataHora(ponto.data_hora_coleta)
                                  : formatarData(ponto.data_ultima_coleta)}
                              </Typography>
                            </Box>
                          }
                          placement="right" arrow
                        >
                          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, cursor: 'default' }}>
                            <FiberManualRecordIcon sx={{
                              fontSize: 8, mt: 0.6, flexShrink: 0,
                              color: STATUS_COR[ponto.status_atual] ?? '#9e9e9e',
                            }} />
                            <Box>
                              {ponto.numero_ponto != null && (
                                <Typography variant="caption" color="text.disabled" sx={{ display: 'block', lineHeight: 1.2, mb: 0.2 }}>
                                  Ponto {ponto.numero_ponto}
                                </Typography>
                              )}
                              <Typography variant="body2" sx={{ fontWeight: 500, lineHeight: 1.3 }}>
                                {ponto.descricao ?? ponto.nome}
                              </Typography>
                            </Box>
                          </Box>
                        </Tooltip>
                      </TableCell>

                      {/* Status */}
                      <TableCell sx={{ py: 1.5 }}>
                        <Chip
                          label={STATUS_LABEL[ponto.status_atual] ?? ponto.status_atual}
                          color={STATUS_MUI[ponto.status_atual] ?? 'default'}
                          size="small"
                          sx={{ fontWeight: 600, fontSize: '0.72rem', height: 22 }}
                        />
                      </TableCell>

                      {/* Últimas 5 coletas do ponto */}
                      <TableCell sx={{ py: 1.5 }}>
                        <Dots5 coletas={ponto.ultimas_coletas ?? []} />
                      </TableCell>

                      {/* Data */}
                      <TableCell sx={{ py: 1.5 }}>
                        <Typography variant="body2" color="text.secondary">
                          {formatarData(ponto.data_ultima_coleta)}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </Box>
        </Collapse>
      </TableCell>
    </TableRow>
  )
}

// ── Linha do bairro ───────────────────────────────────────────────────────────

function BairroRow({ bairro }: { bairro: BairroResumo }) {
  const [open, setOpen] = useState(false)

  return (
    <Fragment>
      <TableRow
        sx={{
          cursor: bairro.total_pontos > 0 ? 'pointer' : 'default',
          '&:hover': {
            bgcolor: (t) => t.palette.mode === 'dark'
              ? 'rgba(255,255,255,0.03)'
              : 'rgba(0,119,182,0.03)',
          },
          ...(open && {
            bgcolor: (t) => t.palette.mode === 'dark'
              ? 'rgba(0,180,216,0.08)'
              : 'rgba(0,119,182,0.05)',
          }),
        }}
        onClick={() => bairro.total_pontos > 0 && setOpen(o => !o)}
      >
        {/* Botão expandir */}
        <TableCell sx={{ width: 48, py: 1.2, pl: 2, pr: 0 }}>
          {bairro.total_pontos > 0 ? (
            <IconButton size="small" onClick={(e) => { e.stopPropagation(); setOpen(o => !o) }}>
              {open
                ? <KeyboardArrowUpIcon fontSize="small" sx={{ color: '#0077B6' }} />
                : <KeyboardArrowDownIcon fontSize="small" sx={{ color: 'text.secondary' }} />
              }
            </IconButton>
          ) : <Box sx={{ width: 28 }} />}
        </TableCell>

        {/* Cidade */}
        <TableCell sx={{ py: 1.2 }}>
          <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.82rem' }}>
            {bairro.cidade}
          </Typography>
        </TableCell>

        {/* Bairro + contagem */}
        <TableCell sx={{ py: 1.2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              {bairro.bairro_nome}
            </Typography>
            {bairro.total_pontos > 0 && (
              <Typography variant="caption" color="text.disabled" sx={{ fontSize: '0.7rem' }}>
                {bairro.total_pontos} ponto{bairro.total_pontos !== 1 ? 's' : ''}
              </Typography>
            )}
          </Box>
        </TableCell>

        {/* Últimas 5 coletas do bairro */}
        <TableCell sx={{ py: 1.2 }}>
          <Dots5 coletas={bairro.ultimas_coletas} />
        </TableCell>

        {/* Status atual */}
        <TableCell sx={{ py: 1.2 }}>
          <Chip
            label={STATUS_LABEL[bairro.status_atual] ?? bairro.status_atual}
            color={STATUS_MUI[bairro.status_atual] ?? 'default'}
            size="small"
            sx={{ fontWeight: 700, fontSize: '0.78rem', height: 24 }}
          />
        </TableCell>
      </TableRow>

      <PontosRow pontos={bairro.pontos} open={open} />
    </Fragment>
  )
}

// ── Componente principal (reutilizável) ───────────────────────────────────────

interface Props {
  /** Se true, exibe cabeçalho com título e botão de atualizar */
  showHeader?: boolean
  /** Filtra por nome de bairro (case-insensitive) */
  filtroBairro?: string
}

const fetcher = (url: string) => fetch(url).then(r => r.json())

export function BalneabilidadeTabContent({ showHeader = false, filtroBairro }: Props) {
  const [refreshing, setRefreshing] = useState(false)

  const { data, error, isLoading, mutate } = useSWR<{
    bairros: BairroResumo[]
    total: number
    ultima_sincronizacao: string | null
  }>('/api/balneabilidade/resumo', fetcher, { refreshInterval: 0 })

  async function handleRefresh() {
    setRefreshing(true)
    try {
      await fetch('/api/balneabilidade/sync', { method: 'POST' })
      await mutate()
    } catch { await mutate() }
    finally { setRefreshing(false) }
  }

  const todosBairros = data?.bairros ?? []

  // Filtro opcional por bairro
  const bairros = filtroBairro && filtroBairro !== 'Todos'
    ? todosBairros.filter(b =>
        b.bairro_nome.toLowerCase().includes(filtroBairro.toLowerCase())
      )
    : todosBairros

  const cidades = [...new Set(bairros.map(b => b.cidade))].sort()

  return (
    <Box>
      {/* Cabeçalho opcional */}
      {showHeader && (
        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 3, flexWrap: 'wrap', gap: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box sx={{
              width: 40, height: 40, borderRadius: 2,
              background: 'linear-gradient(135deg, #0077B6, #00B4D8)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <WavesIcon sx={{ color: 'white', fontSize: 22 }} />
            </Box>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.2 }}>Balneabilidade</Typography>
              <Typography variant="caption" color="text.secondary">Condições de banho por bairro</Typography>
            </Box>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            {data?.ultima_sincronizacao && (
              <Typography variant="caption" color="text.secondary">
                Atualizado: {new Date(data.ultima_sincronizacao).toLocaleString('pt-BR', {
                  day: '2-digit', month: '2-digit', year: 'numeric',
                  hour: '2-digit', minute: '2-digit',
                })}
              </Typography>
            )}
            <Button
              variant="outlined" size="small"
              startIcon={refreshing ? <CircularProgress size={14} /> : <RefreshIcon />}
              onClick={handleRefresh}
              disabled={refreshing || isLoading}
              sx={{ textTransform: 'none', borderRadius: 2 }}
            >
              {refreshing ? 'Sincronizando…' : 'Atualizar'}
            </Button>
          </Box>
        </Box>
      )}

      {/* Legenda */}
      <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap', alignItems: 'center' }}>
        {Object.entries(STATUS_LABEL).map(([k, label]) => (
          <Box key={k} sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
            <Box sx={{ width: 11, height: 11, borderRadius: '2px', bgcolor: STATUS_COR[k] }} />
            <Typography variant="caption" color="text.secondary">{label}</Typography>
          </Box>
        ))}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
          <Box sx={{
            width: 11, height: 11, borderRadius: '2px',
            border: (t) => `2px dashed ${t.palette.mode === 'dark' ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.28)'}`,
          }} />
          <Typography variant="caption" color="text.secondary">Sem registro</Typography>
        </Box>
        {!showHeader && (
          <Box sx={{ ml: 'auto' }}>
            <Button
              size="small" variant="text"
              startIcon={refreshing ? <CircularProgress size={12} /> : <RefreshIcon />}
              onClick={handleRefresh}
              disabled={refreshing || isLoading}
              sx={{ textTransform: 'none', fontSize: '0.78rem' }}
            >
              {refreshing ? 'Sincronizando…' : 'Atualizar dados'}
            </Button>
          </Box>
        )}
      </Box>

      {/* Regras de negócio */}
      <Typography variant="caption" color="text.disabled" sx={{ display: 'block', mb: 1.5, fontStyle: 'italic' }}>
        Status impróprio: ≥60% dos pontos impróprios na coleta do dia · Histórico impróprio: ≥3 das últimas 5 datas
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
          Não foi possível carregar os dados de balneabilidade.
        </Alert>
      )}

      <Paper elevation={0} sx={{ border: (t) => `1px solid ${t.palette.divider}`, borderRadius: 2, overflow: 'hidden' }}>
        <Table size="small">
          <TableHead>
            <TableRow sx={{
              bgcolor: (t) => t.palette.mode === 'dark'
                ? 'rgba(255,255,255,0.03)'
                : 'rgba(0,0,0,0.02)',
            }}>
              <TableCell sx={{ width: 48, py: 1.5, pl: 2, pr: 0 }} />
              <TableCell sx={{ fontWeight: 700, py: 1.5, fontSize: '0.82rem' }}>Cidade</TableCell>
              <TableCell sx={{ fontWeight: 700, py: 1.5, fontSize: '0.82rem' }}>Bairro</TableCell>
              <TableCell sx={{ fontWeight: 700, py: 1.5, fontSize: '0.82rem' }}>
                <Tooltip title="Últimas 5 datas de coleta — passe o mouse em cada dot para ver a data" placement="top" arrow>
                  <span style={{ cursor: 'default', borderBottom: '1px dashed', paddingBottom: 1 }}>
                    Últimas 5 Coletas
                  </span>
                </Tooltip>
              </TableCell>
              <TableCell sx={{ fontWeight: 700, py: 1.5, fontSize: '0.82rem' }}>Status Atual</TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} sx={{ py: 3, textAlign: 'center' }}>
                  <CircularProgress size={20} sx={{ mr: 1.5 }} />
                  <Typography variant="body2" color="text.secondary" component="span">
                    Carregando dados…
                  </Typography>
                </TableCell>
              </TableRow>
            ) : bairros.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} sx={{ py: 6, textAlign: 'center' }}>
                  <WavesIcon sx={{ fontSize: 44, color: 'text.disabled', display: 'block', mx: 'auto', mb: 1 }} />
                  <Typography color="text.secondary" gutterBottom>
                    Nenhum dado de balneabilidade encontrado
                  </Typography>
                  <Typography variant="caption" color="text.disabled">
                    Clique em "Atualizar dados" para sincronizar com o IMA-SC
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              cidades.map((cidade, ci) => {
                const lista = bairros.filter(b => b.cidade === cidade)
                return (
                  <Fragment key={cidade}>
                    {ci > 0 && (
                      <TableRow>
                        <TableCell colSpan={5} sx={{ p: 0, border: 0 }}>
                          <Divider />
                        </TableCell>
                      </TableRow>
                    )}
                    {lista.map(b => <BairroRow key={b.bairro_id} bairro={b} />)}
                  </Fragment>
                )
              })
            )}
          </TableBody>
        </Table>

        {/* Rodapé com totais */}
        {!isLoading && bairros.length > 0 && (
          <Box sx={{
            px: 3, py: 1.5,
            borderTop: (t) => `1px solid ${t.palette.divider}`,
            display: 'flex', gap: 2, flexWrap: 'wrap',
            bgcolor: (t) => t.palette.mode === 'dark' ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.01)',
          }}>
            <Typography variant="caption" color="text.secondary">
              {bairros.length} bairro{bairros.length !== 1 ? 's' : ''} monitorado{bairros.length !== 1 ? 's' : ''}
            </Typography>
            {(['propria', 'impropria', 'indeterminada'] as const).map(s => {
              const count = bairros.filter(b => b.status_atual === s).length
              if (!count) return null
              return (
                <Fragment key={s}>
                  <Typography variant="caption" color="text.secondary">•</Typography>
                  <Typography variant="caption" color={
                    s === 'propria' ? 'success.main' : s === 'impropria' ? 'error.main' : 'warning.main'
                  } sx={{ fontWeight: 600 }}>
                    {count} {STATUS_LABEL[s].toLowerCase()}{count !== 1 ? 's' : ''}
                  </Typography>
                </Fragment>
              )
            })}
          </Box>
        )}
      </Paper>
    </Box>
  )
}
