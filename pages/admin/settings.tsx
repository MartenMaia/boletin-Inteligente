import React, { useEffect, useState } from 'react'
import useSWR from 'swr'
import {
  Box, Typography, Paper, Tabs, Tab, Divider, TextField,
  MenuItem, Alert, Chip, Grid, Skeleton,
} from '@mui/material'
import WaterIcon from '@mui/icons-material/Water'
import SecurityIcon from '@mui/icons-material/Security'
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar'
import DashboardIcon from '@mui/icons-material/Dashboard'
import AdminLayout from '../../components/AdminLayout'

const fetcher = (url: string) => fetch(url).then(r => r.json())

// Bairros de Florianópolis como fallback
const FLORIPA_BAIRROS = [
  'Abraão','Açores','Agronômica','Alto Ribeirão','Alto Ribeirão Leste','Armação',
  'Autódromo','Balneário','Barra da Lagoa','Barra do Sambaqui','Base Aérea',
  'Bom Abrigo','Cachoeira do Bom Jesus','Cachoeira do Bom Jesus Leste','Cacupé',
  'Caiacanga','Caieira','Campeche Central','Campeche Leste','Campeche Norte',
  'Campeche Sul','Canasvieiras','Canto','Canto da Lagoa','Canto do Lamim',
  'Canto dos Araçás','Capoeiras','Carianos','Centro','Coloninha','Córrego Grande',
  'Coqueiros','Costeira do Pirajubaé','Costeiro do Ribeirão','Daniela',
  'Dunas da Lagoa','Estreito','Forte','Ingleses Centro','Ingleses Norte',
  'Ingleses Sul','Itacorubi','Itaguaçu','Jardim Atlântico','João Paulo',
  'José Mendes','Jurerê','Jurere Leste','Jurere Oeste','Lagoa','Lagoa Pequena',
  'Lagoinha do Norte','Moenda','Monte Cristo','Monte Verde','Morro das Pedras',
  'Morro do Peralta','Pantanal','Pântano do Sul','Pedrita','Ponta das Canas',
  'Porto da Lagoa','Praia Brava','Praia Mole','Ratones','Recanto dos Açores',
  'Ressacada','Retiro','Ribeirão da Ilha','Rio Tavares Central',
  'Rio Tavares do Norte','Rio das Pacas','Rio Vermelho','Saco Grande',
  'Saco dos Limões','Sambaqui','Santa Mônica','Santinho','Santo Antônio',
  'Tapera','Tapera da Base','Trindade','Vargem de Fora','Vargem do Bom Jesus',
  'Vargem Grande','Vargem Pequena',
].sort((a, b) => a.localeCompare(b, 'pt-BR'))

const TABS = [
  { label: 'Resumo Geral', icon: <DashboardIcon sx={{ fontSize: 18 }} /> },
  { label: 'Balneabilidade', icon: <WaterIcon sx={{ fontSize: 18 }} /> },
  { label: 'Segurança', icon: <SecurityIcon sx={{ fontSize: 18 }} /> },
  { label: 'Movimentação', icon: <DirectionsCarIcon sx={{ fontSize: 18 }} /> },
]

function ComingSoon({ label }: { label: string }) {
  return (
    <Box sx={{ py: 8, textAlign: 'center' }}>
      <Typography variant="h6" color="text.disabled" gutterBottom>{label}</Typography>
      <Chip label="Em breve" variant="outlined" color="info" />
      <Typography variant="body2" color="text.disabled" sx={{ mt: 1 }}>
        Esta seção está sendo desenvolvida.
      </Typography>
    </Box>
  )
}

export default function Settings() {
  const [tab, setTab] = useState(0)
  const [bairro, setBairro] = useState('Todos')
  const [bairrosList, setBairrosList] = useState<string[]>(['Todos', ...FLORIPA_BAIRROS])
  const [bairrosError, setBairrosError] = useState(false)

  useEffect(() => {
    fetch('/api/bairros')
      .then(r => r.json())
      .then((data: any[]) => {
        const names = [...new Set(data.map(b => b.name).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'pt-BR'))
        if (names.length) setBairrosList(['Todos', ...names])
      })
      .catch(() => setBairrosError(true))
  }, [])

  return (
    <AdminLayout>
      <Box sx={{ p: 3 }}>
        {/* Header */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="h5" fontWeight={700}>Configurações e Indicadores</Typography>
          <Typography variant="body2" color="text.secondary">
            Acompanhe indicadores por cidade e bairro
          </Typography>
        </Box>

        <Paper elevation={0} sx={{ border: (t) => `1px solid ${t.palette.divider}`, borderRadius: 3, overflow: 'hidden' }}>
          {/* Tabs */}
          <Box sx={{ px: 3, pt: 1 }}>
            <Tabs
              value={tab}
              onChange={(_, v) => setTab(v)}
              sx={{ '& .MuiTab-root': { textTransform: 'none', fontWeight: 600, minHeight: 48 } }}
            >
              {TABS.map((t, i) => (
                <Tab
                  key={i}
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                      {t.icon}{t.label}
                    </Box>
                  }
                />
              ))}
            </Tabs>
          </Box>
          <Divider />

          {/* Filtros globais */}
          <Box sx={{ px: 3, py: 2.5, display: 'flex', gap: 2, alignItems: 'flex-end', flexWrap: 'wrap', bgcolor: (t) => t.palette.mode === 'dark' ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.01)' }}>
            <TextField select label="Cidade" value="Florianópolis" size="small" sx={{ width: 200 }}>
              <MenuItem value="Florianópolis">Florianópolis</MenuItem>
            </TextField>
            <TextField
              select label="Bairro" value={bairro}
              onChange={(e) => setBairro(e.target.value)}
              size="small" sx={{ width: 220 }}
            >
              {bairrosList.map(b => <MenuItem key={b} value={b}>{b}</MenuItem>)}
            </TextField>
            {bairrosError && (
              <Typography variant="caption" color="text.secondary">
                ⚠️ Usando lista local
              </Typography>
            )}
          </Box>
          <Divider />

          {/* Conteúdo das abas */}
          <Box sx={{ p: 3 }}>
            {tab === 0 && (
              <Grid container spacing={3}>
                {[
                  { label: 'Boletins enviados hoje', value: '—', color: '#0077B6' },
                  { label: 'Bairros monitorados', value: bairrosList.length - 1, color: '#7B2D8B' },
                  { label: 'Alertas ativos', value: '—', color: '#B45309' },
                  { label: 'Última atualização', value: 'Agora', color: '#1B8A4A' },
                ].map((stat) => (
                  <Grid item xs={12} sm={6} md={3} key={stat.label}>
                    <Paper elevation={0} sx={{ p: 2.5, borderRadius: 2, border: (t) => `1px solid ${t.palette.divider}` }}>
                      <Typography variant="caption" color="text.secondary">{stat.label}</Typography>
                      <Typography variant="h4" fontWeight={700} sx={{ color: stat.color, mt: 0.5 }}>
                        {stat.value}
                      </Typography>
                    </Paper>
                  </Grid>
                ))}
                <Grid item xs={12}>
                  <Alert severity="info" sx={{ borderRadius: 2 }}>
                    Filtro ativo: <strong>Florianópolis — {bairro}</strong>. As demais abas exibirão dados filtrados por este recorte quando implementadas.
                  </Alert>
                </Grid>
              </Grid>
            )}
            {tab === 1 && <ComingSoon label="Balneabilidade" />}
            {tab === 2 && <ComingSoon label="Segurança" />}
            {tab === 3 && <ComingSoon label="Movimentação" />}
          </Box>
        </Paper>
      </Box>
    </AdminLayout>
  )
}
