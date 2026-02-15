import '../styles/globals.css'
import type { AppProps } from 'next/app'
import { ThemeProvider } from '@mui/material/styles'
import CssBaseline from '@mui/material/CssBaseline'
import { darkTheme, lightTheme } from '../theme'
import React from 'react'

export default function App({ Component, pageProps }: AppProps){
  const [mode, setMode] = React.useState<'dark'|'light'>(() => {
    try{ return (localStorage.getItem('bi_theme') as 'dark'|'light') || 'dark' }catch(e){ return 'dark' }
  })

  const toggle = ()=>{
    const next = mode === 'dark' ? 'light' : 'dark'
    setMode(next)
    try{ localStorage.setItem('bi_theme', next) }catch(e){}
  }

  const theme = mode === 'dark' ? darkTheme : lightTheme

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Component {...pageProps} themeMode={mode} toggleTheme={toggle} />
    </ThemeProvider>
  )
}
