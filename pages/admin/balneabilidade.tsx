import React from 'react'
import AdminLayout from '../../components/AdminLayout'
import { useAuth } from '../../hooks/useAuth'
import { BalneabilidadeTabContent } from '../../components/BalneabilidadeTabContent'

export default function BalneabilidadePage() {
  const { loading } = useAuth()
  if (loading) return null

  return (
    <AdminLayout>
      <BalneabilidadeTabContent showHeader />
    </AdminLayout>
  )
}
