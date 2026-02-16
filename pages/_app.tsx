import '../styles/globals.css'
import type { AppProps } from 'next/app'
import { ThemeProvider } from '@mui/material/styles'
import CssBaseline from '@mui/material/CssBaseline'
import { darkTheme, lightTheme } from '../theme'
import React from 'react'

import { ThemeContext } from '../context/ThemeContext'

export default function App({ Component, pageProps }: AppProps){
  const [mode, setMode] = React.useState<'dark'|'light'>(() => {
    try{ return (localStorage.getItem('bi_theme') as 'dark'|'light') || 'dark' }catch(e){ return 'dark' }
  })

  React.useEffect(()=>{
    try{ document.documentElement.dataset.theme = mode }catch(e){}
  },[mode])

  const toggle = ()=>{
    const next = mode === 'dark' ? 'light' : 'dark'
    setMode(next)
    try{ localStorage.setItem('bi_theme', next) }catch(e){}
  }

  const theme = mode === 'dark' ? darkTheme : lightTheme

  return (
    <ThemeContext.Provider value={{ mode, toggle }}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Component {...pageProps} />
      </ThemeProvider>
    </ThemeContext.Provider>
  )
}
