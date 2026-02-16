import React, { useState } from 'react'
import useSWR from 'swr'
import { Grid, Paper, Typography, Box, TextField, Button, List, ListItem, ListItemText, IconButton, Checkbox } from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import AdminLayout from '../../components/AdminLayout'

const fetcher = (url:string)=>fetch(url).then(r=>r.json())

export default function Grupos(){
  const { data: grupos } = useSWR('/api/grupos', fetcher)
  const { data: individuos } = useSWR('/api/individuos', fetcher)

  const [groupName, setGroupName] = useState('')
  const [selectedMembers, setSelectedMembers] = useState<string[]>([])

  const [nome, setNome] = useState('')
  const [telefone, setTelefone] = useState('')
  const [local, setLocal] = useState('')

  const toggleMemberSelection = (id:string)=>{
    setSelectedMembers(prev => prev.includes(id) ? prev.filter(x=>x!==id) : [...prev, id])
  }

  const createGroup = async ()=>{
    if(!groupName) return
    await fetch('/api/grupos', { method: 'POST', body: JSON.stringify({ name: groupName, membros: selectedMembers }), headers: { 'Content-Type': 'application/json' } })
    setGroupName('')
    setSelectedMembers([])
  }

  const addIndividuo = async ()=>{
    if(!nome) return
    await fetch('/api/individuos', { method: 'POST', body: JSON.stringify({ nome, telefone, local }), headers: { 'Content-Type': 'application/json' } })
    setNome(''); setTelefone(''); setLocal('')
  }

  return (
    <AdminLayout>
      {/* title outside paper */}
      <Box sx={{ mb:2 }}>
        <Typography variant="h6">Configuração de Grupos</Typography>
      </Box>

      <Paper sx={{ p:3 }} elevation={1}>
        <Grid container spacing={3}>
          {/* Groups configuration - use plain Box instead of nested Paper */}
          <Grid item xs={12} md={6}>
            <Box sx={{ p:3, borderRadius:1 }}>
              <Typography variant="h6" sx={{ mb:2 }}>Configuração de Grupos</Typography>

              <Box sx={{ display:'flex', gap:2, mb:2 }}>
                <TextField placeholder="Nome do grupo" fullWidth value={groupName} onChange={(e)=>setGroupName(e.target.value)} />
                <Button variant="contained" onClick={createGroup}>Salvar</Button>
              </Box>

              <Typography variant="subtitle2" sx={{ mb:1 }}>Selecione membros</Typography>
              <List sx={{ maxHeight:300, overflow:'auto' }}>
                {individuos?.map((i:any)=> (
                  <ListItem key={i.id} button onClick={()=>toggleMemberSelection(i.id)}>
                    <Checkbox checked={selectedMembers.includes(i.id)} />
                    <ListItemText primary={i.nome || i.email} secondary={`${i.telefone || ''} ${i.local? '— '+i.local : ''}`} />
                  </ListItem>
                ))}
              </List>
            </Box>
          </Grid>

          {/* Individuals management - use plain Box */}
          <Grid item xs={12} md={6}>
            <Box sx={{ p:3, borderRadius:1 }}>
              <Typography variant="h6" sx={{ mb:2 }}>Indivíduos</Typography>

              <Box sx={{ display:'flex', gap:2, mb:2 }}>
                <TextField placeholder="Nome" value={nome} onChange={(e)=>setNome(e.target.value)} />
                <TextField placeholder="Telefone" value={telefone} onChange={(e)=>setTelefone(e.target.value)} />
                <TextField placeholder="Local" value={local} onChange={(e)=>setLocal(e.target.value)} />
                <IconButton color="primary" onClick={addIndividuo} aria-label="adicionar">
                  <AddIcon />
                </IconButton>
              </Box>

              <List sx={{ maxHeight:380, overflow:'auto' }}>
                {individuos?.map((i:any)=> (
                  <ListItem key={i.id}>
                    <ListItemText primary={i.nome || i.email} secondary={`${i.telefone || ''} ${i.local? '— '+i.local : ''}`} />
                  </ListItem>
                ))}
              </List>
            </Box>
          </Grid>
        </Grid>
      </Paper>
    </AdminLayout>
  )
}
