import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { User } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'

const SUPABASE_SESSION_KEY = 'sb-xmnwdxgpojsprxhboebe-auth-token'

interface AuthContextValue {
  user: User | null
  loading: boolean
  signUp: (email: string, password: string) => ReturnType<typeof supabase.auth.signUp>
  signIn: (email: string, password: string) => ReturnType<typeof supabase.auth.signInWithPassword>
  signOut: () => ReturnType<typeof supabase.auth.signOut>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // `mounted` flag: React StrictMode mounts → unmounts → remounts every effect in development.
    // Each run gets its own `mounted` variable. The cleanup sets the FIRST run's mounted to false,
    // so when the first getSession() resolves its result is discarded. The second run's mounted
    // stays true, so only that result is applied. This prevents two concurrent getSession() calls
    // from both trying to apply state — and from racing to acquire the Supabase refresh lock.
    let mounted = true

    console.log('[AuthProvider] Effect running — registering auth listener')

    supabase.auth.getSession().then(({ data, error }) => {
      if (!mounted) return // discard result from StrictMode's abandoned first run

      if (error) {
        const isNetworkError =
          error.message?.toLowerCase().includes('fetch') ||
          error.message?.toLowerCase().includes('network') ||
          error.message?.toLowerCase().includes('failed')

        console.error('[AuthProvider] getSession error:', {
          message: error.message,
          status: error.status,
          isNetworkError,
        })

        if (isNetworkError) {
          // Clear stale token so the SDK lock isn't acquired on every subsequent reload
          console.warn('[AuthProvider] Network error — clearing stored session')
          localStorage.removeItem(SUPABASE_SESSION_KEY)
        }

        setUser(null)
        setLoading(false)
        return
      }

      console.log('[AuthProvider] Session restored:', {
        hasSession: !!data.session,
        userId: data.session?.user?.id ?? null,
      })
      setUser(data.session?.user ?? null)
      setLoading(false)
    })

    // onAuthStateChange drives all auth transitions after the initial load:
    // SIGNED_IN, SIGNED_OUT, TOKEN_REFRESHED, etc.
    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return
      console.log('[AuthProvider] Auth state changed:', event, 'userId:', session?.user?.id ?? null)
      setUser(session?.user ?? null)
    })

    return () => {
      mounted = false
      listener.subscription.unsubscribe()
    }
  }, [])

  const signUp = async (email: string, password: string) => {
    console.log('[AuthProvider] signUp:', email)
    const result = await supabase.auth.signUp({ email, password })
    console.log('[AuthProvider] signUp result:', {
      userId: result.data.user?.id ?? null,
      error: result.error?.message ?? null,
    })
    return result
  }

  const signIn = async (email: string, password: string) => {
    console.log('[AuthProvider] signIn:', email)
    const result = await supabase.auth.signInWithPassword({ email, password })
    if (result.error) {
      console.error('[AuthProvider] signIn failed:', result.error.message)
    } else {
      console.log('[AuthProvider] signIn succeeded, userId:', result.data.user?.id)
    }
    return result
  }

  const signOut = () => {
    console.log('[AuthProvider] signOut')
    return supabase.auth.signOut()
  }

  return (
    <AuthContext.Provider value={{ user, loading, signUp, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within <AuthProvider>')
  return ctx
}
