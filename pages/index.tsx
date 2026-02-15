import React from 'react'
import useSWR from 'swr'
import Link from 'next/link'
import { Container, Box, Typography, Paper, Button, List, ListItem } from '@mui/material'

const fetcher = (url:string)=>fetch(url).then(r=>r.json())

export default function Home(){
  const { data: bairros } = useSWR('/api/bairros', fetcher)
  const { data: boletins } = useSWR('/api/boletins', fetcher)

  return (
    <Container maxWidth="md" sx={{ py: 6 }}>
      <Box component="header" sx={{ mb: 4 }}>
        <Typography variant="h3" component="h1" gutterBottom>
          Boletim Inteligente
        </Typography>
        <Typography color="text.secondary">Boletins territoriais por bairro — rascunho MVP</Typography>
      </Box>

      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 3 }}>
        <Link href="/admin/login" passHref>
          <Button variant="contained" color="primary">Área do Administrador</Button>
        </Link>
      </Box>

      <Paper sx={{ p: 3, mb: 3 }} elevation={1}>
        <Typography variant="h6">Bairros</Typography>
        <List>
          {bairros?.map((b:any)=> <ListItem key={b.id}>{b.name}</ListItem>)}
        </List>
      </Paper>

      <Paper sx={{ p: 3 }} elevation={1}>
        <Typography variant="h6">Boletins</Typography>
        <List>
          {boletins?.map((b:any)=> <ListItem key={b.id}>{new Date(b.data).toLocaleString()} - {b.conteudo?.substring(0,120)}</ListItem>)}
        </List>
      </Paper>
    </Container>
  )
}
