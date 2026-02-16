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

export function relativeDate(dateStr?: string | null){
  if(!dateStr) return ''
  const d = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - d.getTime()
  const diffDays = Math.round(diffMs / (1000*60*60*24))
  if(diffDays === 0) return 'enviado hoje'
  if(diffDays > 0) return `enviado há ${diffDays} dias`
  return `envia em ${Math.abs(diffDays)} dias`
}
