import React from 'react'
import { Container, Grid, Paper, Box, Typography, TextField, Button, Checkbox, FormControlLabel, Link as MuiLink } from '@mui/material'
import Image from 'next/image'
import Link from 'next/link'

export default function AdminLogin(){
  return (
    <Container maxWidth="lg" sx={{ height: '100vh', display: 'flex', alignItems: 'center' }}>
      <Paper elevation={6} sx={{ width: '100%', overflow: 'hidden' }}>
        <Grid container>
          <Grid item xs={12} md={6} sx={{ backgroundColor: '#00AEEF', position: 'relative', minHeight: 520 }}>
            {/* Left illustration area - you can replace with project image */}
            <Box sx={{ position: 'absolute', inset: 0, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              <Image src="/images/login-illustration.png" alt="illustration" width={520} height={360} />
            </Box>
          </Grid>

          <Grid item xs={12} md={6} sx={{ p: 6 }}>
            <Box sx={{ maxWidth: 360, mx: 'auto' }}>
              <Typography variant="h4" align="center" gutterBottom sx={{ fontWeight: 700 }}>LOGIN</Typography>

              <Box component="form" noValidate>
                <TextField fullWidth label="Username" margin="normal" placeholder="@mail.com" />
                <TextField fullWidth label="Password" margin="normal" type="password" placeholder="password" />

                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1 }}>
                  <FormControlLabel control={<Checkbox />} label="Remember me" />
                  <MuiLink component={Link} href="#">Esqueceu a Senha?</MuiLink>
                </Box>

                <Button fullWidth variant="contained" color="primary" sx={{ mt: 2, py: 1.2 }}>Entrar</Button>

                <Box sx={{ textAlign: 'center', mt: 2 }}>
                  <Typography variant="body2">Não Tem Uma Conta? <MuiLink component={Link} href="#">Inscrever-se</MuiLink></Typography>
                </Box>

                <Box sx={{ textAlign: 'center', mt: 3 }}>
                  <Typography variant="subtitle1">Logar Com</Typography>
                  <Box sx={{ display: 'flex', justifyContent: 'center', gap: 3, mt: 2 }}>
                    <Image src="/images/social-facebook.png" alt="facebook" width={32} height={32} />
                    <Image src="/images/social-google.png" alt="google" width={32} height={32} />
                    <Image src="/images/social-apple.png" alt="apple" width={32} height={32} />
                  </Box>
                </Box>
              </Box>
            </Box>
          </Grid>
        </Grid>
      </Paper>
    </Container>
  )
}
