import type { User } from '@supabase/supabase-js'
import { DEFAULT_CURRENCY } from '../domain/currency'
import { normalizeNickname } from '../domain/validation'
import { getSupabaseClient } from './supabase'
import type { Database, ThemeValue } from './database.types'

export type Profile = Database['public']['Tables']['profiles']['Row']
export type ProfileUpdate = Database['public']['Tables']['profiles']['Update']

export const profileQueryKey = (userId: string) => ['profile', userId] as const

/** Idempotent fallback for the auth trigger in the profile migrations. */
export async function ensureProfile(user: User): Promise<void> {
  const { error } = await getSupabaseClient()
    .from('profiles')
    .upsert(
      {
        id: user.id,
        nickname: normalizeNickname(String(user.user_metadata?.nickname ?? '')) || 'Member',
        currency_code: DEFAULT_CURRENCY,
        theme: 'light',
      },
      { onConflict: 'id', ignoreDuplicates: true },
    )

  if (error) throw error
}

export async function fetchProfile(userId: string): Promise<Profile> {
  const { data, error } = await getSupabaseClient()
    .from('profiles')
    .select('id, nickname, currency_code, theme, created_at, updated_at')
    .eq('id', userId)
    .single()

  if (error) throw error
  return data
}

export async function updateProfile(
  userId: string,
  patch: ProfileUpdate,
): Promise<Profile> {
  const { data, error } = await getSupabaseClient()
    .from('profiles')
    .update(patch)
    .eq('id', userId)
    .select('id, nickname, currency_code, theme, created_at, updated_at')
    .single()

  if (error) throw error
  return data
}

export function isThemeValue(value: string | null | undefined): value is ThemeValue {
  return value === 'light' || value === 'dark'
}
