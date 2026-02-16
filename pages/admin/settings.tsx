import React from 'react'
import AdminLayout from '../../components/AdminLayout'
import { Box, Typography, Tabs, Tab, Paper, Grid, TextField, Alert } from '@mui/material'

const LS_KEY = 'bi_indicadores_filtros_v1'

type Filters = {
  cidade: string
  bairro: string
}

type Bairro = { id: number; name: string }

// We will use the project's own bairros source (pages/api/bairros.ts)
const CIDADE_DEFAULT = 'Florianópolis'

function TabPanel({ value, index, children }:{ value:number, index:number, children:React.ReactNode }){
  if(value !== index) return null
  return <Box sx={{ mt:2 }}>{children}</Box>
}

export default function Settings(){
  const [tab, setTab] = React.useState(0)
  const [bairros, setBairros] = React.useState<string[]>(['Todos'])
  const [bairrosLoading, setBairrosLoading] = React.useState(false)
  const [bairrosError, setBairrosError] = React.useState<string | null>(null)

  const [filters, setFilters] = React.useState<Filters>(()=>{
    try{
      const raw = localStorage.getItem(LS_KEY)
      if(raw) return JSON.parse(raw)
    }catch(e){}
    return { cidade: CIDADE_DEFAULT, bairro: 'Todos' }
  })

  React.useEffect(()=>{
    try{ localStorage.setItem(LS_KEY, JSON.stringify(filters)) }catch(e){}
  },[filters])

  // Load bairros from backend (DB) and use them as Florianópolis bairros list.
  React.useEffect(()=>{
    let mounted = true
    setBairrosLoading(true)
    setBairrosError(null)
    ;(async ()=>{
      try{
        const res = await fetch('/api/bairros')
        if(!res.ok) throw new Error('Falha ao carregar bairros')
        const data = (await res.json()) as Bairro[]
        const names = Array.from(new Set((data||[]).map(b=>String(b.name).trim()).filter(Boolean))).sort((a,b)=>a.localeCompare(b,'pt-BR'))
        if(mounted){
          setBairros(['Todos', ...names])
        }
      }catch(e:any){
        if(mounted){
          setBairrosError(e?.message || 'Erro ao carregar bairros')
          setBairros(['Todos'])
        }
      }finally{
        if(mounted) setBairrosLoading(false)
      }
    })()
    return ()=>{ mounted = false }
  },[])

  const cidades = [CIDADE_DEFAULT]

  const setCidade = (cidade:string)=>{
    // for now we only support Florianópolis; keep the filter consistent
    setFilters(prev=>({ ...prev, cidade, bairro: 'Todos' }))
  }

  const setBairro = (bairro:string)=>{
    setFilters(prev=>({ ...prev, bairro }))
  }

  return (
    <AdminLayout>
      <Box sx={{ mb:2 }}>
        <Typography variant="h5">Indicadores</Typography>
      </Box>

      <Box sx={{ bgcolor:'transparent' }}>
        <Tabs value={tab} onChange={(_,v)=>setTab(v)} sx={{ mb:2, backgroundColor:'transparent' }}>
          <Tab label="Resumo Geral" />
          <Tab label="Balneabilidade" />
          <Tab label="Segurança" />
          <Tab label="Movimentação" />
        </Tabs>

        <TabPanel value={tab} index={0}>
          <Paper sx={{ p:3 }} elevation={1}>
            <Typography variant="h6" sx={{ mb:2 }}>Resumo Geral</Typography>
            <Typography variant="body2" sx={{ opacity:0.85, mb:2 }}>
              Use os filtros abaixo para definir o recorte (Cidade/Bairro) que será aplicado nas demais abas.
            </Typography>

            {bairrosError && (
              <Alert severity="warning" sx={{ mb:2 }}>
                {bairrosError}
              </Alert>
            )}

            <Grid container spacing={2}>
              <Grid item xs={12} md={4}>
                <TextField
                  select
                  fullWidth
                  label="Cidade"
                  value={filters.cidade}
                  onChange={(e)=>setCidade(String(e.target.value))}
                  SelectProps={{ native: true }}
                >
                  {cidades.map(c=>(
                    <option key={c} value={c}>{c}</option>
                  ))}
                </TextField>
              </Grid>

              <Grid item xs={12} md={4}>
                <TextField
                  select
                  fullWidth
                  label="Bairro"
                  value={filters.bairro}
                  onChange={(e)=>setBairro(String(e.target.value))}
                  SelectProps={{ native: true }}
                  disabled={bairrosLoading}
                  helperText={bairrosLoading ? 'Carregando bairros…' : ' '}
                >
                  {bairros.map(b=>(
                    <option key={b} value={b}>{b}</option>
                  ))}
                </TextField>
              </Grid>

              <Grid item xs={12} md={4}>
                <Paper sx={{ p:2, bgcolor:'rgba(255,255,255,0.03)' }} elevation={0}>
                  <Typography variant="subtitle2">Filtro atual</Typography>
                  <Typography variant="body2" sx={{ mt:0.5 }}>
                    Cidade: <b>{filters.cidade}</b><br />
                    Bairro: <b>{filters.bairro}</b>
                  </Typography>
                </Paper>
              </Grid>
            </Grid>
          </Paper>
        </TabPanel>

        <TabPanel value={tab} index={1}>
          <Paper sx={{ p:3 }} elevation={1}>
            <Typography variant="h6" sx={{ mb:1 }}>Balneabilidade</Typography>
            <Typography variant="body2" sx={{ opacity:0.85 }}>
              Em breve. Recorte atual: <b>{filters.cidade}</b> / <b>{filters.bairro}</b>.
            </Typography>
          </Paper>
        </TabPanel>

        <TabPanel value={tab} index={2}>
          <Paper sx={{ p:3 }} elevation={1}>
            <Typography variant="h6" sx={{ mb:1 }}>Segurança</Typography>
            <Typography variant="body2" sx={{ opacity:0.85 }}>
              Em breve. Recorte atual: <b>{filters.cidade}</b> / <b>{filters.bairro}</b>.
            </Typography>
          </Paper>
        </TabPanel>

        <TabPanel value={tab} index={3}>
          <Paper sx={{ p:3 }} elevation={1}>
            <Typography variant="h6" sx={{ mb:1 }}>Movimentação</Typography>
            <Typography variant="body2" sx={{ opacity:0.85 }}>
              Em breve. Recorte atual: <b>{filters.cidade}</b> / <b>{filters.bairro}</b>.
            </Typography>
          </Paper>
        </TabPanel>
      </Box>
    </AdminLayout>
  )
}
