import { createTheme } from '@mui/material/styles'

export const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: { main: '#90caf9' },
    background: { default: '#0f1720', paper: '#0b1220' },
    divider: 'rgba(255,255,255,0.08)'
  },
  components: {
    MuiPaper: {
      styleOverrides: {
        root: { borderRadius: 8 }
      }
    }
  }
})

export const lightTheme = createTheme({
  palette: {
    mode: 'light',
    primary: { main: '#1976d2' },
    background: { default: '#f5f7fb', paper: '#ffffff' },
    divider: 'rgba(0,0,0,0.08)',
    text: { primary: 'rgba(0,0,0,0.87)', secondary: 'rgba(0,0,0,0.6)' }
  },
  components: {
    MuiPaper: {
      styleOverrides: {
        root: { borderRadius: 8 }
      }
    }
  }
})

export default { darkTheme, lightTheme }
