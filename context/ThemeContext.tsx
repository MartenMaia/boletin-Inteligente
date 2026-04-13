import React from 'react'

interface ThemeContextType {
  mode: 'dark' | 'light'
  toggle: () => void
}

export const ThemeContext = React.createContext<ThemeContextType>({
  mode: 'light',
  toggle: () => {},
})

export const useThemeContext = () => React.useContext(ThemeContext)
