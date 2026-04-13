import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { supabase, UserProfile } from '../lib/supabase'
import type { Session } from '@supabase/supabase-js'

export function useAuth(requireAuth = true) {
  const router = useRouter()
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Carregar sessão atual
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

    // Escutar mudanças de autenticação
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

  async function fetchProfile(userId: string) {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    setProfile(data as UserProfile)
    setLoading(false)
  }

  async function signOut() {
    await supabase.auth.signOut()
    router.push('/admin/login')
  }

  return { session, profile, loading, signOut }
}
