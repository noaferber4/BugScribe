import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react'
import type { User } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'

// Supabase localStorage key for this project's stored session.
// Clearing it removes any stale refresh token that could cause lock errors on startup.
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
  // Prevents double-initialization in React StrictMode (mount → unmount → remount)
  const initialized = useRef(false)

  useEffect(() => {
    if (initialized.current) {
      console.log('[AuthProvider] StrictMode remount — skipping duplicate init')
      return
    }
    initialized.current = true

    console.log('[AuthProvider] Initializing auth (single run)')
    console.log('[AuthProvider] Stored session key present:', !!localStorage.getItem(SUPABASE_SESSION_KEY))

    supabase.auth.getSession().then(({ data, error }) => {
      if (error) {
        const isNetworkError = error.message?.toLowerCase().includes('fetch') ||
          error.message?.toLowerCase().includes('network') ||
          error.message?.toLowerCase().includes('failed')

        console.error('[AuthProvider] ❌ getSession error:', {
          message: error.message,
          status: error.status,
          isNetworkError,
        })

        if (isNetworkError) {
          // A network failure here means Supabase is unreachable (project paused, wrong URL, or
          // bad anon key). Clear the stored session so the stale refresh token stops being
          // replayed on every reload — otherwise the SDK lock never releases.
          console.warn('[AuthProvider] Network error on session restore — clearing stored session to prevent lock cascade')
          localStorage.removeItem(SUPABASE_SESSION_KEY)
        }

        setUser(null)
        setLoading(false)
        return
      }

      console.log('[AuthProvider] getSession result:', {
        hasSession: !!data.session,
        userId: data.session?.user?.id ?? null,
        expiresAt: data.session?.expires_at ?? null,
      })
      setUser(data.session?.user ?? null)
      setLoading(false)
    })

    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('[AuthProvider] Auth state changed:', event, {
        userId: session?.user?.id ?? null,
        expiresAt: session?.expires_at ?? null,
      })
      setUser(session?.user ?? null)
    })

    return () => {
      console.log('[AuthProvider] Cleanup — unsubscribing auth listener')
      listener.subscription.unsubscribe()
    }
  }, [])

  const signUp = async (email: string, password: string) => {
    console.log('[AuthProvider] signUp — email:', email)
    const result = await supabase.auth.signUp({ email, password })
    console.log('[AuthProvider] signUp result:', {
      userId: result.data.user?.id ?? null,
      hasSession: !!result.data.session,
      error: result.error ? { message: result.error.message, status: result.error.status } : null,
    })
    return result
  }

  const signIn = async (email: string, password: string) => {
    console.log('[AuthProvider] signIn — email:', email)
    const result = await supabase.auth.signInWithPassword({ email, password })
    if (result.error) {
      console.error('[AuthProvider] ❌ signIn failed:', {
        message: result.error.message,
        status: result.error.status,
        name: result.error.name,
      })
    } else {
      console.log('[AuthProvider] ✅ signIn succeeded — userId:', result.data.user?.id)
    }
    return result
  }

  const signOut = () => {
    console.log('[AuthProvider] signOut called')
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
