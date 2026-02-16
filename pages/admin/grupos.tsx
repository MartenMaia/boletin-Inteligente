import React, { useEffect, useState } from 'react'
import useSWR, { mutate } from 'swr'
import { Grid, Paper, Typography, Box, TextField, Button, List, ListItem, ListItemText, IconButton, Checkbox, Tabs, Tab, Dialog, DialogTitle, DialogContent, DialogActions, Snackbar, CircularProgress } from '@mui/material'
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
  const [groupLoading, setGroupLoading] = useState(false)

  // individual form
  const [nome, setNome] = useState('')
  const [telefone, setTelefone] = useState('')
  const [local, setLocal] = useState('')
  const [indLoading, setIndLoading] = useState(false)

  // snackbar
  const [snack, setSnack] = useState<{open:boolean,message:string,severity?:'success'|'error'}>({open:false,message:'',severity:'success'})

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
    if(!groupName) return setSnack({open:true,message:'Nome do grupo obrigatório',severity:'error'})
    setGroupLoading(true)
    try{
      const res = await fetch('/api/grupos', { method: 'POST', body: JSON.stringify({ name: groupName, membros: selectedMembers }), headers: { 'Content-Type': 'application/json' } })
      if(!res.ok) throw new Error('Erro ao criar grupo')
      const created = await res.json()
      const createdName = created?.name || groupName
      setGroupName('')
      setSelectedMembers([])
      setOpenGroupModal(false)
      await mutate('/api/grupos')
      setSnack({open:true,message:`Grupo "${createdName}" criado com sucesso`,severity:'success'})
    }catch(e:any){
      console.error(e)
      setSnack({open:true,message:e?.message || 'Erro',severity:'error'})
    }finally{ setGroupLoading(false) }
  }

  const handleCreateInd = async ()=>{
    if(!nome) return setSnack({open:true,message:'Nome obrigatório',severity:'error'})
    setIndLoading(true)
    try{
      const res = await fetch('/api/individuos', { method: 'POST', body: JSON.stringify({ nome, telefone, local }), headers: { 'Content-Type': 'application/json' } })
      if(!res.ok) throw new Error('Erro ao criar indivíduo')
      const created = await res.json()
      const createdName = created?.nome || nome
      setNome(''); setTelefone(''); setLocal('')
      setOpenIndModal(false)
      await mutate('/api/individuos')
      setSnack({open:true,message:`Indivíduo "${createdName}" criado com sucesso`,severity:'success'})
    }catch(e:any){
      console.error(e)
      setSnack({open:true,message:e?.message || 'Erro',severity:'error'})
    }finally{ setIndLoading(false) }
  }

  return (
    <AdminLayout>
      <Box sx={{ mb:2, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <Typography variant="h6">Configuração de Grupos</Typography>
      </Box>

      <Box sx={{ bgcolor: 'transparent' }}>
        <Tabs value={tab} onChange={(_,v)=>setTab(v)} sx={{ mb:2, backgroundColor: 'transparent' }} TabIndicatorProps={{ style: { backgroundColor: '#90caf9' } }}>
          <Tab label="Grupos" sx={{ background: 'transparent' }} />
          <Tab label="Indivíduos" sx={{ background: 'transparent' }} />
        </Tabs>

        {tab === 0 && (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Box sx={{ display:'flex', justifyContent:'space-between', alignItems:'center', mb:2 }}>
                <Typography variant="h6">Grupos Cadastrados</Typography>
                <Button variant="contained" startIcon={groupLoading ? <CircularProgress size={18} color="inherit" /> : <AddIcon />} onClick={()=>setOpenGroupModal(true)} disabled={groupLoading}>Add +</Button>
              </Box>

              <Paper sx={{ p:3 }} elevation={1}>
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
              <Box sx={{ display:'flex', justifyContent:'space-between', alignItems:'center', mb:2 }}>
                <Typography variant="h6">Indivíduos Cadastrados</Typography>
                <Button variant="contained" startIcon={indLoading ? <CircularProgress size={18} color="inherit" /> : <AddIcon />} onClick={()=>setOpenIndModal(true)} disabled={indLoading}>Add +</Button>
              </Box>

              <Paper sx={{ p:3 }} elevation={1}>
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

      </Box>

      {/* Group Modal */}
      <Dialog open={openGroupModal} onClose={()=>setOpenGroupModal(false)} fullWidth maxWidth="sm">
        <DialogTitle>Novo Grupo</DialogTitle>
        <DialogContent>
          <Box component="form" sx={{ display:'flex', gap:2, mt:1, mb:2 }} onSubmit={(e)=>{ e.preventDefault(); handleCreateGroup() }}>
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
          <Button onClick={()=>setOpenGroupModal(false)} disabled={groupLoading}>Cancelar</Button>
          <Button variant="contained" onClick={handleCreateGroup} disabled={groupLoading}>{groupLoading ? <CircularProgress size={18} color="inherit" /> : 'Salvar'}</Button>
        </DialogActions>
      </Dialog>

      {/* Individual Modal */}
      <Dialog open={openIndModal} onClose={()=>setOpenIndModal(false)} fullWidth maxWidth="sm">
        <DialogTitle>Novo Indivíduo</DialogTitle>
        <DialogContent>
          <Box component="form" sx={{ display:'flex', gap:2, mt:1, mb:2 }} onSubmit={(e)=>{ e.preventDefault(); handleCreateInd() }}>
            <TextField placeholder="Nome" fullWidth value={nome} onChange={(e)=>setNome(e.target.value)} />
          </Box>
          <Box sx={{ display:'flex', gap:2, mb:2 }}>
            <TextField placeholder="Telefone" value={telefone} onChange={(e)=>setTelefone(e.target.value)} sx={{ width:200 }} />
            <TextField placeholder="Local" value={local} onChange={(e)=>setLocal(e.target.value)} sx={{ width:200 }} />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={()=>setOpenIndModal(false)} disabled={indLoading}>Cancelar</Button>
          <Button variant="contained" onClick={handleCreateInd} disabled={indLoading}>{indLoading ? <CircularProgress size={18} color="inherit" /> : 'Salvar'}</Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={snack.open} autoHideDuration={3000} onClose={()=>setSnack(s=>({...s,open:false}))} message={snack.message} />

    </AdminLayout>
  )
}
