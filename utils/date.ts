export function formatDateShort(dateStr?: string | null){
  if(!dateStr) return '-'
  const d = new Date(dateStr)
  const dd = String(d.getDate()).padStart(2,'0')
  const mm = String(d.getMonth()+1).padStart(2,'0')
  const yyyy = d.getFullYear()
  return `${dd}/${mm}/${yyyy}`
}

export function formatDateFull(dateStr?: string | null){
  if(!dateStr) return '-'
  const d = new Date(dateStr)
  return d.toLocaleString()
}
