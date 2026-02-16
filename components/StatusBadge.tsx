import React from 'react'
import { Chip } from '@mui/material'

const colorMap:any = {
  'Rascunho': { color: 'default', sx: { backgroundColor: '#f6c84c', color: '#2b2b2b' } },
  'Aguardando revisão': { color: 'primary', sx: { backgroundColor: '#3b82f6', color: 'white' } },
  'Aguardando aprovação': { color: 'secondary', sx: { backgroundColor: '#8b5cf6', color: 'white' } },
  'Aprovado': { color: 'success', sx: { backgroundColor: '#16a34a', color: 'white' } },
  'Rejeitado': { color: 'error', sx: { backgroundColor: '#ef4444', color: 'white' } }
}

export default function StatusBadge({ status }:{status?:string}){
  if(!status) return <Chip label="Rascunho" sx={colorMap['Rascunho'].sx} size="small" />
  const cfg = colorMap[status] || { sx: { backgroundColor: '#9ca3af', color: 'white' } }
  return <Chip label={status} size="small" sx={{ ...cfg.sx }} />
}
