import React from 'react'
import AdminLayout from '../../../components/AdminLayout'
import { Paper, Typography, Box, TextField, Button } from '@mui/material'
import { useRouter } from 'next/router'

export default function NovoBoletim(){
  const router = useRouter()
  const handleSave = async ()=>{
    // mock save -> redirect to list
    router.push('/admin/boletins')
  }

  return (
    <AdminLayout>
      <Paper sx={{ p:3 }}>
        <Typography variant="h5" sx={{ mb:2 }}>Novo Boletim (rascunho)</Typography>
        <Box sx={{ display:'flex', flexDirection:'column', gap:2 }}>
          <TextField label="Nome do boletim" />
          <TextField label="Conteúdo" multiline rows={6} />
          <Box sx={{ display:'flex', gap:2 }}>
            <Button variant="contained" onClick={handleSave}>Salvar</Button>
            <Button onClick={()=>router.push('/admin/boletins')}>Cancelar</Button>
          </Box>
        </Box>
      </Paper>
    </AdminLayout>
  )
}
