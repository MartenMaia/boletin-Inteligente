import React, { useEffect } from 'react'
import { useRouter } from 'next/router'
import { Container, Typography, Box, Button } from '@mui/material'

export default function AdminHome(){
  const router = useRouter()

  useEffect(()=>{
    const ok = typeof window !== 'undefined' && (localStorage.getItem('bi_admin') === '1' || sessionStorage.getItem('bi_admin') === '1')
    if(!ok) router.replace('/admin/login')
  },[])

  const handleLogout = ()=>{
    try{ localStorage.removeItem('bi_admin'); sessionStorage.removeItem('bi_admin') }catch(e){}
    router.replace('/admin/login')
  }

  return (
    <Container maxWidth="lg" sx={{ py: 6 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4">Área do Administrador</Typography>
        <Button variant="outlined" onClick={handleLogout}>Logout</Button>
      </Box>

      <Typography>Bem-vindo ao painel administrativo (MVP).</Typography>
    </Container>
  )
}
