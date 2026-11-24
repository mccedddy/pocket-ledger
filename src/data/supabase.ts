import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import type { Database } from './database.types'

const url = import.meta.env.VITE_SUPABASE_URL

// Supabase now issues sb_publishable_* keys; older projects use the anon key.
// Both are public client keys and are safe only because RLS enforces access.
const publicKey =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? import.meta.env.VITE_SUPABASE_ANON_KEY

export const hasSupabaseConfig = Boolean(url && publicKey)

let client: SupabaseClient<Database> | null = null

export function getSupabaseClient(): SupabaseClient<Database> {
  if (!client) {
    if (!url || !publicKey) {
      throw new Error(
        'Supabase is not configured. Copy .env.example to .env.local and set VITE_SUPABASE_URL plus VITE_SUPABASE_PUBLISHABLE_KEY (or VITE_SUPABASE_ANON_KEY).',
      )
    }

    client = createClient<Database>(url, publicKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: false,
      },
    })
  }

  return client
}
