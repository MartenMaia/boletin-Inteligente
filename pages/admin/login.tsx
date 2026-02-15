import React, { useState } from 'react'
import { useRouter } from 'next/router'
import { Container, Grid, Paper, Box, Typography, TextField, Button, Checkbox, FormControlLabel, Link as MuiLink, Alert } from '@mui/material'
import Image from 'next/image'
import Link from 'next/link'

export default function AdminLogin(){
  const router = useRouter()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [remember, setRemember] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault()
    setError('')
    // simple hardcoded auth for MVP
    if(username === 'admin' && password === 'admin'){
      // store a simple flag and redirect
      try{
        if(remember) localStorage.setItem('bi_admin', '1')
        else sessionStorage.setItem('bi_admin', '1')
      }catch(e){/* ignore */}
      router.push('/admin')
    }else{
      setError('Credenciais inválidas. Use admin / admin para teste.')
    }
  }

  return (
    <Container maxWidth="lg" sx={{ height: '100vh', display: 'flex', alignItems: 'center' }}>
      <Paper elevation={6} sx={{ width: '100%', overflow: 'hidden' }}>
        <Grid container>
          <Grid item xs={12} md={6} sx={{ backgroundColor: '#00AEEF', position: 'relative', minHeight: 520 }}>
            {/* Left illustration area - you can replace with project image */}
            <Box sx={{ position: 'absolute', inset: 0, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              <Image src="/images/report-illustration.png" alt="illustration" width={520} height={360} />
            </Box>
          </Grid>

          <Grid item xs={12} md={6} sx={{ p: 6 }}>
            <Box sx={{ maxWidth: 360, mx: 'auto' }}>
              <Typography variant="h4" align="center" gutterBottom sx={{ fontWeight: 700 }}>LOGIN</Typography>

              {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

              <Box component="form" noValidate onSubmit={handleSubmit}>
                <TextField value={username} onChange={(e)=>setUsername(e.target.value)} fullWidth label="Username" margin="normal" placeholder="@mail.com" />
                <TextField value={password} onChange={(e)=>setPassword(e.target.value)} fullWidth label="Password" margin="normal" type="password" placeholder="password" />

                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1 }}>
                  <FormControlLabel control={<Checkbox checked={remember} onChange={(e)=>setRemember(e.target.checked)} />} label="Remember me" />
                  <MuiLink component={Link} href="#">Esqueceu a Senha?</MuiLink>
                </Box>

                <Button fullWidth type="submit" variant="contained" color="primary" sx={{ mt: 2, py: 1.2 }}>Entrar</Button>

                <Box sx={{ textAlign: 'center', mt: 2 }}>
                  <Typography variant="body2">Não Tem Uma Conta? <MuiLink component={Link} href="#">Inscrever-se</MuiLink></Typography>
                </Box>

                {/* removed social login block as requested */}
              </Box>
            </Box>
          </Grid>
        </Grid>
      </Paper>
    </Container>
  )
}
