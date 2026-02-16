import React from 'react'
import useSWR from 'swr'
import { Grid, Paper, Typography, Box, TextField, Button, List, ListItem, ListItemText, IconButton, Tooltip } from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import RemoveIcon from '@mui/icons-material/Remove'
import AdminLayout from '../../components/AdminLayout'

const fetcher = (url:string)=>fetch(url).then(r=>r.json())

export default function Grupos(){
  const { data: grupos, mutate: mutateGrupos } = useSWR('/api/grupos', fetcher)
  const { data: individuos, mutate: mutateIndividuos } = useSWR('/api/individuos', fetcher)
  const [newName, setNewName] = React.useState('')
  const [selectedGroup, setSelectedGroup] = React.useState<string | null>(null)
  const [newIndNome, setNewIndNome] = React.useState('')
  const [newIndEmail, setNewIndEmail] = React.useState('')

  const createGroup = async ()=>{
    if(!newName) return
    await fetch('/api/grupos', { method: 'POST', body: JSON.stringify({ name: newName }), headers: { 'Content-Type': 'application/json' } })
    setNewName('')
    mutateGrupos()
  }

  const addIndividuo = async ()=>{
    if(!newIndNome) return
    await fetch('/api/individuos', { method: 'POST', body: JSON.stringify({ nome: newIndNome, email: newIndEmail, grupo: selectedGroup }), headers: { 'Content-Type': 'application/json' } })
    setNewIndNome(''); setNewIndEmail('')
    mutateIndividuos(); mutateGrupos()
  }

  const toggleMember = async (groupId:string, individuoId:string)=>{
    await fetch(`/api/grupos/${groupId}`, { method: 'PATCH', body: JSON.stringify({ toggleMember: individuoId }), headers: { 'Content-Type': 'application/json' } })
    mutateGrupos(); mutateIndividuos()
  }

  return (
    <AdminLayout>
      <Paper sx={{ p:3 }} elevation={1}>
        <Typography variant="h6" sx={{ mb:2 }}>Configuração de Grupos</Typography>

        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Paper sx={{ p:3 }} elevation={0}>
              <Box component="form" sx={{ display: 'flex', gap:2, mb:2 }} onSubmit={(e)=>{ e.preventDefault(); createGroup() }}>
                <TextField placeholder="Nome do grupo" fullWidth value={newName} onChange={(e)=>setNewName(e.target.value)} />
                <Button variant="contained" onClick={createGroup}>Salvar</Button>
              </Box>

              <Box sx={{ mt:3 }}>
                <List>
                  {grupos?.map((g:any)=> (
                    <ListItem key={g.id} selected={selectedGroup===g.id} onClick={()=>setSelectedGroup(g.id)} button>
                      <ListItemText primary={g.name} secondary={`${g.membros?.length || 0} membros`} />
                    </ListItem>
                  ))}
                </List>
              </Box>
            </Paper>
          </Grid>

          <Grid item xs={12} md={6}>
            <Paper sx={{ p:3 }} elevation={0}>
              <Typography variant="h6" sx={{ mb:2 }}>Indivíduos</Typography>
              <Box sx={{ display:'flex', gap:2, mb:2 }}>
                <TextField placeholder="Nome" value={newIndNome} onChange={(e)=>setNewIndNome(e.target.value)} />
                <TextField placeholder="Email" value={newIndEmail} onChange={(e)=>setNewIndEmail(e.target.value)} />
                <Button variant="contained" onClick={addIndividuo}>Adicionar</Button>
              </Box>

              <List>
                {individuos?.map((i:any)=> (
                  <ListItem key={i.id} secondaryAction={
                    <Tooltip title={selectedGroup && i.grupo===grupos?.find((g:any)=>g.id===selectedGroup)?.name ? 'Remover membro' : 'Adicionar membro'}>
                      <IconButton edge="end" size="small" onClick={()=>selectedGroup && toggleMember(selectedGroup, i.id)}>
                        {selectedGroup && i.grupo===grupos?.find((g:any)=>g.id===selectedGroup)?.name ? <RemoveIcon /> : <AddIcon />}
                      </IconButton>
                    </Tooltip>
                  }>
                    <ListItemText primary={i.nome || i.email} secondary={i.grupo || ''} />
                  </ListItem>
                ))}
              </List>
            </Paper>
          </Grid>
        </Grid>
      </Paper>
    </AdminLayout>
  )
}
