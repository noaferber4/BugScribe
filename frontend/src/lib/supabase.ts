import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string

// DEBUG: verify env vars are present at startup
console.log('[Supabase] Initializing client')
console.log('[Supabase] VITE_SUPABASE_URL:', supabaseUrl ? `"${supabaseUrl}"` : '❌ MISSING')
console.log('[Supabase] VITE_SUPABASE_ANON_KEY:', supabaseAnonKey ? `set (${supabaseAnonKey.length} chars, starts with "${supabaseAnonKey.slice(0, 12)}...")` : '❌ MISSING')

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('[Supabase] ❌ One or more env vars are missing — requests will fail. Check frontend/.env')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
