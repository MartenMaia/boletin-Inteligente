import React, { useState } from 'react'
import { useRouter } from 'next/router'
import {
  Container, Grid, Paper, Box, Typography, TextField,
  Button, Checkbox, FormControlLabel, Alert, CircularProgress
} from '@mui/material'
import Image from 'next/image'
import { supabase } from '../../lib/supabase'

export default function AdminLogin() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [remember, setRemember] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault()
    setError('')
    setLoading(true)

    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (authError) {
        setError('Credenciais inválidas. Verifique seu e-mail e senha.')
        return
      }

      if (data.session) {
        router.push('/admin')
      }
    } catch (err) {
      setError('Erro ao conectar. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Container maxWidth="lg" sx={{ height: '100vh', display: 'flex', alignItems: 'center' }}>
      <Paper elevation={6} sx={{ width: '100%', overflow: 'hidden' }}>
        <Grid container>
          {/* Lado esquerdo — ilustração */}
          <Grid
            item xs={12} md={6}
            sx={{
              background: 'linear-gradient(135deg, #0077B6 0%, #00B4D8 100%)',
              position: 'relative',
              minHeight: 520,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              p: 4,
            }}
          >
            <Box sx={{ position: 'relative', width: '100%', maxWidth: 400, textAlign: 'center' }}>
              <Image
                src="/images/report-illustration.png"
                alt="Boletim Inteligente"
                width={420}
                height={300}
                style={{ objectFit: 'contain' }}
              />
              <Typography variant="h5" sx={{ color: 'white', fontWeight: 700, mt: 3 }}>
                Boletim Inteligente
              </Typography>
              <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)', mt: 1 }}>
                Geração e envio de boletins diários
              </Typography>
            </Box>
          </Grid>

          {/* Lado direito — formulário */}
          <Grid item xs={12} md={6} sx={{ p: { xs: 4, md: 6 } }}>
            <Box sx={{ maxWidth: 380, mx: 'auto' }}>
              <Typography variant="h4" gutterBottom sx={{ fontWeight: 700, mb: 1 }}>
                Entrar
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Acesse o painel de administração
              </Typography>

              {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

              <Box component="form" noValidate onSubmit={handleSubmit}>
                <TextField
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  fullWidth
                  label="E-mail"
                  type="email"
                  margin="normal"
                  placeholder="seu@email.com"
                  autoComplete="email"
                  disabled={loading}
                />
                <TextField
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  fullWidth
                  label="Senha"
                  margin="normal"
                  type="password"
                  placeholder="••••••••"
                  autoComplete="current-password"
                  disabled={loading}
                />

                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1 }}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={remember}
                        onChange={(e) => setRemember(e.target.checked)}
                        disabled={loading}
                      />
                    }
                    label="Lembrar-me"
                  />
                </Box>

                <Button
                  fullWidth
                  type="submit"
                  variant="contained"
                  color="primary"
                  sx={{ mt: 2, py: 1.4, fontWeight: 600, fontSize: '1rem' }}
                  disabled={loading || !email || !password}
                >
                  {loading ? <CircularProgress size={22} color="inherit" /> : 'Entrar'}
                </Button>

                {/* Usuários de teste */}
                <Box sx={{ mt: 3, p: 2, bgcolor: 'action.hover', borderRadius: 2 }}>
                  <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
                    <strong>Usuários de teste</strong> (senha: Teste@123)
                  </Typography>
                  {[
                    { label: 'Admin', email: 'admin@boletim.test' },
                    { label: 'Editor', email: 'editor@boletim.test' },
                    { label: 'Aprovador', email: 'aprovador@boletim.test' },
                    { label: 'Viewer', email: 'viewer@boletim.test' },
                  ].map((u) => (
                    <Button
                      key={u.email}
                      size="small"
                      variant="outlined"
                      sx={{ mr: 0.5, mb: 0.5, fontSize: '0.7rem' }}
                      onClick={() => { setEmail(u.email); setPassword('Teste@123') }}
                    >
                      {u.label}
                    </Button>
                  ))}
                </Box>
              </Box>
            </Box>
          </Grid>
        </Grid>
      </Paper>
    </Container>
  )
}
