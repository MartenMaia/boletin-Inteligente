import React, { useEffect, useState } from 'react'
import { Grid, Paper, Typography, Box, TextField, Button, List, ListItem, ListItemText, IconButton, Checkbox, Tabs, Tab, Dialog, DialogTitle, DialogContent, DialogActions, Snackbar, CircularProgress } from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import AdminLayout from '../../components/AdminLayout'

type Individuo = { id: string, name: string, telefone?: string, email?: string, local?: string, notes?: string }
type Grupo = { id: string, name: string, membros: string[] }

const LS_KEY_INDIV = 'bi_individuos_v1'
const LS_KEY_GRUPOS = 'bi_grupos_v1'

export default function Grupos(){
  const [tab, setTab] = useState(0)

  const [grupos, setGrupos] = useState<Grupo[]>([])
  const [individuos, setIndividuos] = useState<Individuo[]>([])

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
  const [email, setEmail] = useState('')
  const [local, setLocal] = useState('')
  const [notes, setNotes] = useState('')
  const [indLoading, setIndLoading] = useState(false)

  // snackbar
  const [snack, setSnack] = useState<{open:boolean,message:string,severity?:'success'|'error'}>({open:false,message:'',severity:'success'})

  useEffect(()=>{
    // load from localStorage or seed sample data
    const sInd = localStorage.getItem(LS_KEY_INDIV)
    const sGrp = localStorage.getItem(LS_KEY_GRUPOS)
    if(sInd){
      try{ setIndividuos(JSON.parse(sInd)) }catch(e){ setIndividuos([]) }
    }else{
      const seed:Individuo[] = [
        { id: 'i1', name: 'Ana Silva', telefone: '(11) 99999-0001', local: 'Centro' },
        { id: 'i2', name: 'João Pereira', telefone: '(11) 98888-0002', local: 'Norte' },
        { id: 'i3', name: 'Maria Costa', telefone: '(11) 97777-0003', local: 'Sul' }
      ]
      setIndividuos(seed)
      localStorage.setItem(LS_KEY_INDIV, JSON.stringify(seed))
    }

    if(sGrp){
      try{ setGrupos(JSON.parse(sGrp)) }catch(e){ setGrupos([]) }
    }else{
      const seedG:Grupo[] = [ { id: 'g1', name: 'Equipe Centro', membros: ['i1','i2'] } ]
      setGrupos(seedG)
      localStorage.setItem(LS_KEY_GRUPOS, JSON.stringify(seedG))
    }
  },[])

  useEffect(()=>{ localStorage.setItem(LS_KEY_INDIV, JSON.stringify(individuos)) },[individuos])
  useEffect(()=>{ localStorage.setItem(LS_KEY_GRUPOS, JSON.stringify(grupos)) },[grupos])

  const toggleMemberSelection = (id:string)=>{
    setSelectedMembers(prev => prev.includes(id) ? prev.filter(x=>x!==id) : [...prev, id])
  }

  const handleCreateGroup = async ()=>{
    if(!groupName) return setSnack({open:true,message:'Nome do grupo obrigatório',severity:'error'})
    setGroupLoading(true)
    try{
      const id = 'g' + Date.now()
      const newG:Grupo = { id, name: groupName, membros: selectedMembers }
      setGrupos(prev=>[...prev, newG])
      setGroupName('')
      setSelectedMembers([])
      setOpenGroupModal(false)
      setSnack({open:true,message:`Grupo "${newG.name}" criado com sucesso`,severity:'success'})
    }catch(e:any){
      console.error(e)
      setSnack({open:true,message:'Erro ao criar grupo',severity:'error'})
    }finally{ setGroupLoading(false) }
  }

  const handleCreateInd = async ()=>{
    if(!nome) return setSnack({open:true,message:'Nome obrigatório',severity:'error'})
    setIndLoading(true)
    try{
      const id = 'i' + Date.now()
      const created:Individuo = { id, name: nome, telefone, email, local, notes }
      setIndividuos(prev=>[created, ...prev])
      setNome(''); setTelefone(''); setEmail(''); setLocal(''); setNotes('')
      setOpenIndModal(false)
      setSnack({open:true,message:`Indivíduo "${created.name}" criado com sucesso`,severity:'success'})
    }catch(e:any){
      console.error(e)
      setSnack({open:true,message:'Erro ao criar indivíduo',severity:'error'})
    }finally{ setIndLoading(false) }
  }

  const isMemberSelected = (id:string)=> selectedMembers.includes(id)

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
                <Button variant="contained" startIcon={groupLoading ? <CircularProgress size={18} color="inherit" /> : <AddIcon />} onClick={()=>setOpenGroupModal(true)} disabled={groupLoading}>Novo Grupo</Button>
              </Box>

              <Paper sx={{ p:3 }} elevation={1}>
                <List>
                  {grupos.map((g)=> (
                    <ListItem key={g.id}>
                      <ListItemText primary={g.name} secondary={`${g.membros.length} membros`} />
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
                <Button variant="contained" startIcon={indLoading ? <CircularProgress size={18} color="inherit" /> : <AddIcon />} onClick={()=>setOpenIndModal(true)} disabled={indLoading}>Novo Cadastro</Button>
              </Box>

              <Paper sx={{ p:3 }} elevation={1}>
                <List sx={{ maxHeight:420, overflow:'auto' }}>
                  {individuos.map((i)=> (
                    <ListItem key={i.id}>
                      <ListItemText primary={i.name} secondary={`${i.telefone || ''} ${i.local? '— '+i.local : ''}`} />
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
            {individuos.map((i)=> (
              <ListItem key={i.id} button onClick={()=>toggleMemberSelection(i.id)}>
                <Checkbox checked={isMemberSelected(i.id)} />
                <ListItemText primary={i.name} secondary={`${i.telefone || ''} ${i.local? '— '+i.local : ''}`} />
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
          <Box component="form" sx={{ display:'flex', flexDirection:'column', gap:2, mt:1, mb:2 }} onSubmit={(e)=>{ e.preventDefault(); handleCreateInd() }}>
            <TextField placeholder="Nome" fullWidth value={nome} onChange={(e)=>setNome(e.target.value)} />
            <Box sx={{ display:'flex', gap:2 }}>
              <TextField placeholder="Telefone" value={telefone} onChange={(e)=>setTelefone(e.target.value)} sx={{ width:200 }} />
              <TextField placeholder="Email" value={email} onChange={(e)=>setEmail(e.target.value)} sx={{ width:240 }} />
              <TextField placeholder="Local" value={local} onChange={(e)=>setLocal(e.target.value)} sx={{ width:200 }} />
            </Box>
            <TextField placeholder="Observações / Notas" value={notes} onChange={(e)=>setNotes(e.target.value)} multiline rows={3} />
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
