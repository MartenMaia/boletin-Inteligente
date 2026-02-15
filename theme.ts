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
    primary: { main: '#1976d2' }
  }
})

export default { darkTheme, lightTheme }
