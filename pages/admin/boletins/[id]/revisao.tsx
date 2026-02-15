import React from 'react'
import { useRouter } from 'next/router'
import useSWR from 'swr'
import AdminLayout from '../../../../components/AdminLayout'
import { Paper, Typography, Box, Button } from '@mui/material'

const fetcher = (url:string)=>fetch(url).then(r=>r.json())

export default function Revisao(){
  const router = useRouter()
  const { id } = router.query
  const { data: boletim } = useSWR(id? `/api/boletins/${id}` : null, fetcher)

  return (
    <AdminLayout>
      <Paper sx={{ p:3 }}>
        <Typography variant="h5" sx={{ mb:2 }}>Revisão do boletim</Typography>
        <Typography sx={{ mb:2 }}>{boletim?.nome || boletim?.title}</Typography>
        <Box>
          <Button variant="contained" sx={{ mr:2 }} onClick={()=>router.push(`/admin/boletins/${id}/aprovar`)}>Ir para aprovação</Button>
          <Button variant="outlined" onClick={()=>router.push('/admin/boletins')}>Voltar</Button>
        </Box>
      </Paper>
    </AdminLayout>
  )
}
