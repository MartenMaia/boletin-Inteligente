import React from 'react'

export const ThemeContext = React.createContext<{ mode: 'dark'|'light', toggle: ()=>void } | null>(null)

export const useThemeContext = ()=> React.useContext(ThemeContext)
