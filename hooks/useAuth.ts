import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/router'
import { supabase, UserProfile } from '../lib/supabase'
import type { Session } from '@supabase/supabase-js'

export function useAuth(requireAuth = true) {
  const router = useRouter()
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchProfile = useCallback(async (userId: string) => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle()

    if (!data) {
      await supabase.auth.signOut()
      router.push('/admin/login')
      return
    }

    const profileData = data as unknown as UserProfile

    if (profileData.ativo === false) {
      await supabase.auth.signOut()
      router.push('/admin/login?motivo=inativo')
      return
    }

    setProfile(profileData)
    setLoading(false)
  }, [])

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      if (session) fetchProfile(session.user.id)
      else {
        setLoading(false)
        if (requireAuth && !router.pathname.includes('/login')) {
          router.push('/admin/login')
        }
      }
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      if (session) {
        fetchProfile(session.user.id)
      } else {
        setProfile(null)
        setLoading(false)
        if (requireAuth && !router.pathname.includes('/login')) {
          router.push('/admin/login')
        }
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  // Permite que componentes recarreguem o perfil após edição
  const refreshProfile = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (session) await fetchProfile(session.user.id)
  }, [fetchProfile])

  async function signOut() {
    await supabase.auth.signOut()
    router.push('/admin/login')
  }

  return { session, profile, loading, signOut, refreshProfile }
}
