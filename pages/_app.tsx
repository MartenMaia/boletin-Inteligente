import '../styles/globals.css'
import type { AppProps } from 'next/app'
import { ThemeProvider } from '@mui/material/styles'
import CssBaseline from '@mui/material/CssBaseline'
import { darkTheme, lightTheme } from '../theme'
import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { ThemeContext } from '../context/ThemeContext'
import { supabase } from '../lib/supabase'
import { CircularProgress, Box } from '@mui/material'

// Rotas públicas (não precisam de autenticação)
const PUBLIC_ROUTES = ['/admin/login', '/']

export default function App({ Component, pageProps }: AppProps) {
  const router = useRouter()

  const [mode, setMode] = useState<'dark' | 'light'>(() => {
    try { return (localStorage.getItem('bi_theme') as 'dark' | 'light') || 'light' } catch { return 'light' }
  })

  const [authChecked, setAuthChecked] = useState(false)

  useEffect(() => {
    try { document.documentElement.dataset.theme = mode } catch { /* ignore */ }
  }, [mode])

  // Proteção de rotas
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      const isPublic = PUBLIC_ROUTES.some(r => router.pathname === r || router.pathname.startsWith(r))

      if (!session && !isPublic) {
        router.replace('/admin/login')
      } else {
        setAuthChecked(true)
      }
    }

    checkAuth()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const isPublic = PUBLIC_ROUTES.some(r => router.pathname === r || router.pathname.startsWith(r))
      if (!session && !isPublic) {
        router.replace('/admin/login')
      }
    })

    return () => subscription.unsubscribe()
  }, [router.pathname])

  const toggle = () => {
    const next = mode === 'dark' ? 'light' : 'dark'
    setMode(next)
    try { localStorage.setItem('bi_theme', next) } catch { /* ignore */ }
  }

  const theme = mode === 'dark' ? darkTheme : lightTheme
  const isPublic = PUBLIC_ROUTES.some(r => router.pathname === r || router.pathname.startsWith(r))

  // Mostrar spinner enquanto verifica autenticação em rotas protegidas
  if (!authChecked && !isPublic) {
    return (
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Box sx={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <CircularProgress />
        </Box>
      </ThemeProvider>
    )
  }

  return (
    <ThemeContext.Provider value={{ mode, toggle }}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Component {...pageProps} />
      </ThemeProvider>
    </ThemeContext.Provider>
  )
}
