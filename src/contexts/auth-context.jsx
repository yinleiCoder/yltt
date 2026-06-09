'use client'

import { createContext, useContext, useEffect, useRef, useState, useCallback, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'

const AuthContext = createContext(null)

export function AuthProvider({ children, initialUser }) {
  const [user, setUser] = useState(initialUser || null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(!initialUser)
  const [ready, setReady] = useState(false)
  const supabaseRef = useRef(null)
  if (!supabaseRef.current) supabaseRef.current = createClient()
  const supabase = supabaseRef.current

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        const currentUser = session?.user ?? null
        setUser(currentUser)
        if (currentUser) {
          try {
            const { data } = await supabase.from('profiles').select('*').eq('id', currentUser.id).maybeSingle()
            if (data) setProfile(data)
          } catch {}
        } else {
          setProfile(null)
        }
        setLoading(false)
        setReady(true)
      }
    )
    return () => subscription.unsubscribe()
  }, [supabase])

  const refreshProfile = useCallback(async () => {
    if (!user) return
    const { data } = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle()
    if (data) setProfile(data)
  }, [user, supabase])

  const isAdmin = profile?.role === 'admin'

  const signOut = useCallback(async () => {
    await supabase.auth.signOut()
    setUser(null)
    setProfile(null)
  }, [supabase])

  const value = useMemo(() => ({
    user, profile, loading, ready, isAdmin, refreshProfile, signOut, supabase,
  }), [user, profile, loading, ready, isAdmin, refreshProfile, signOut, supabase])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider')
  return context
}
