import React from 'react'
import useSWR from 'swr'
import { Container, Grid, Paper, Typography, Box, TextField, Button, List, ListItem, ListItemText } from '@mui/material'

const fetcher = (url:string)=>fetch(url).then(r=>r.json())

export default function Grupos(){
  const { data: grupos } = useSWR('/api/grupos', fetcher)
  const { data: individuos } = useSWR('/api/individuos', fetcher)

  return (
    <Container maxWidth="lg" sx={{ py: 6 }}>
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p:3 }} elevation={1}>
            <Typography variant="h6" sx={{ mb:2 }}>Configuração de Grupos</Typography>
            <Box component="form" sx={{ display: 'flex', gap:2 }}>
              <TextField placeholder="Nome do grupo" fullWidth />
              <Button variant="contained">Salvar</Button>
            </Box>

            <Box sx={{ mt:3 }}>
              <List>
                {grupos?.map((g:any)=> (
                  <ListItem key={g.id}>
                    <ListItemText primary={g.name} secondary={`${g.membros?.length || 0} membros`} />
                  </ListItem>
                ))}
              </List>
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p:3 }} elevation={1}>
            <Typography variant="h6" sx={{ mb:2 }}>Indivíduos</Typography>
            <List>
              {individuos?.map((i:any)=> (
                <ListItem key={i.id}>
                  <ListItemText primary={i.nome || i.email} secondary={i.grupo || ''} />
                </ListItem>
              ))}
            </List>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  )
}
