import { useEffect } from 'react'
import { useRouter } from 'next/router'
import { Box, CircularProgress } from '@mui/material'

// Redirecionamento: aprovação foi unificada na página de revisão
export default function Aprovar() {
  const router = useRouter()
  const { id } = router.query

  useEffect(() => {
    if (id) router.replace(`/admin/boletins/${id}/revisao`)
  }, [id])

  return (
    <Box sx={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <CircularProgress />
    </Box>
  )
}
