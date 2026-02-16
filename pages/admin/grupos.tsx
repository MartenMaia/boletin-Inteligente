import React, { useEffect, useState } from 'react'
import useSWR, { mutate } from 'swr'
import { Grid, Paper, Typography, Box, TextField, Button, List, ListItem, ListItemText, IconButton, Checkbox, Tabs, Tab, Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import AdminLayout from '../../components/AdminLayout'

const fetcher = (url:string)=>fetch(url).then(r=>r.json())

export default function Grupos(){
  const { data: grupos } = useSWR('/api/grupos', fetcher)
  const { data: individuos } = useSWR('/api/individuos', fetcher)

  const [tab, setTab] = useState(0)

  // modal states
  const [openGroupModal, setOpenGroupModal] = useState(false)
  const [openIndModal, setOpenIndModal] = useState(false)

  // group form
  const [groupName, setGroupName] = useState('')
  const [selectedMembers, setSelectedMembers] = useState<string[]>([])

  // individual form
  const [nome, setNome] = useState('')
  const [telefone, setTelefone] = useState('')
  const [local, setLocal] = useState('')

  useEffect(()=>{
    // seed sample data for simulation if endpoints return empty
    (async ()=>{
      try{
        const ind = await fetch('/api/individuos').then(r=>r.json()).catch(()=>null)
        const gr = await fetch('/api/grupos').then(r=>r.json()).catch(()=>null)
        if((!ind || ind.length===0)){
          await fetch('/api/individuos',{method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({nome:'Ana Silva', telefone:'(11) 99999-0001', local:'Centro'})})
          await fetch('/api/individuos',{method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({nome:'João Pereira', telefone:'(11) 98888-0002', local:'Norte'})})
          await fetch('/api/individuos',{method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({nome:'Maria Costa', telefone:'(11) 97777-0003', local:'Sul'})})
          mutate('/api/individuos')
        }
        if((!gr || gr.length===0)){
          const inds = await fetch('/api/individuos').then(r=>r.json())
          const memberIds = (inds||[]).slice(0,2).map((i:any)=>i.id)
          await fetch('/api/grupos',{method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({name:'Equipe Centro', membros: memberIds})})
          mutate('/api/grupos')
        }
      }catch(e){ /* ignore */ }
    })()
  },[])

  const toggleMemberSelection = (id:string)=>{
    setSelectedMembers(prev => prev.includes(id) ? prev.filter(x=>x!==id) : [...prev, id])
  }

  const handleCreateGroup = async ()=>{
    if(!groupName) return
    await fetch('/api/grupos', { method: 'POST', body: JSON.stringify({ name: groupName, membros: selectedMembers }), headers: { 'Content-Type': 'application/json' } })
    setGroupName('')
    setSelectedMembers([])
    setOpenGroupModal(false)
    mutate('/api/grupos')
  }

  const handleCreateInd = async ()=>{
    if(!nome) return
    await fetch('/api/individuos', { method: 'POST', body: JSON.stringify({ nome, telefone, local }), headers: { 'Content-Type': 'application/json' } })
    setNome(''); setTelefone(''); setLocal('')
    setOpenIndModal(false)
    mutate('/api/individuos')
  }

  return (
    <AdminLayout>
      <Box sx={{ mb:2, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <Typography variant="h6">Configuração de Grupos</Typography>
      </Box>

      <Paper sx={{ p:0 }} elevation={0}>
        <Tabs value={tab} onChange={(_,v)=>setTab(v)} sx={{ mb:2 }}>
          <Tab label="Grupos" />
          <Tab label="Indivíduos" />
        </Tabs>

        {tab === 0 && (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Box sx={{ display:'flex', justifyContent:'flex-end', mb:2 }}>
                <Button variant="contained" startIcon={<AddIcon />} onClick={()=>setOpenGroupModal(true)}>Add +</Button>
              </Box>
              <Paper sx={{ p:3 }} elevation={1}>
                <Typography variant="h6" sx={{ mb:2 }}>Grupos Cadastrados</Typography>
                <List>
                  {grupos?.map((g:any)=> (
                    <ListItem key={g.id}>
                      <ListItemText primary={g.name} secondary={`${(g.membros||[]).length} membros`} />
                    </ListItem>
                  ))}
                </List>
              </Paper>
            </Grid>
          </Grid>
        )}

        {tab === 1 && (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Box sx={{ display:'flex', justifyContent:'flex-end', mb:2 }}>
                <Button variant="contained" startIcon={<AddIcon />} onClick={()=>setOpenIndModal(true)}>Add +</Button>
              </Box>
              <Paper sx={{ p:3 }} elevation={1}>
                <Typography variant="h6" sx={{ mb:2 }}>Indivíduos Cadastrados</Typography>
                <List sx={{ maxHeight:420, overflow:'auto' }}>
                  {individuos?.map((i:any)=> (
                    <ListItem key={i.id}>
                      <ListItemText primary={i.nome || i.email} secondary={`${i.telefone || ''} ${i.local? '— '+i.local : ''}`} />
                    </ListItem>
                  ))}
                </List>
              </Paper>
            </Grid>
          </Grid>
        )}

      </Paper>

      {/* Group Modal */}
      <Dialog open={openGroupModal} onClose={()=>setOpenGroupModal(false)} fullWidth maxWidth="sm">
        <DialogTitle>Novo Grupo</DialogTitle>
        <DialogContent>
          <Box sx={{ display:'flex', gap:2, mt:1, mb:2 }}>
            <TextField placeholder="Nome do grupo" fullWidth value={groupName} onChange={(e)=>setGroupName(e.target.value)} />
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
        </DialogContent>
        <DialogActions>
          <Button onClick={()=>setOpenGroupModal(false)}>Cancelar</Button>
          <Button variant="contained" onClick={handleCreateGroup}>Salvar</Button>
        </DialogActions>
      </Dialog>

      {/* Individual Modal */}
      <Dialog open={openIndModal} onClose={()=>setOpenIndModal(false)} fullWidth maxWidth="sm">
        <DialogTitle>Novo Indivíduo</DialogTitle>
        <DialogContent>
          <Box sx={{ display:'flex', gap:2, mt:1, mb:2 }}>
            <TextField placeholder="Nome" fullWidth value={nome} onChange={(e)=>setNome(e.target.value)} />
          </Box>
          <Box sx={{ display:'flex', gap:2, mb:2 }}>
            <TextField placeholder="Telefone" value={telefone} onChange={(e)=>setTelefone(e.target.value)} sx={{ width:200 }} />
            <TextField placeholder="Local" value={local} onChange={(e)=>setLocal(e.target.value)} sx={{ width:200 }} />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={()=>setOpenIndModal(false)}>Cancelar</Button>
          <Button variant="contained" onClick={handleCreateInd}>Salvar</Button>
        </DialogActions>
      </Dialog>

    </AdminLayout>
  )
}
