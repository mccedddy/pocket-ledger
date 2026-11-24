import type { Database } from './database.types'
import { getSupabaseClient } from './supabase'

export type Account = Database['public']['Tables']['accounts']['Row']
export type AccountInput = Pick<Account, 'name' | 'initial_amount'>

export const accountsQueryKey = (userId: string) => ['accounts', userId] as const

export async function fetchAccounts(userId: string): Promise<Account[]> {
  const { data, error } = await getSupabaseClient()
    .from('accounts')
    .select('*')
    .eq('user_id', userId)
    .order('sort_order', { ascending: true })
    .order('name', { ascending: true })

  if (error) throw error
  return data
}

export async function createAccount(userId: string, input: AccountInput): Promise<Account> {
  const { data, error } = await getSupabaseClient()
    .from('accounts')
    .insert({ user_id: userId, ...input })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function updateAccount(
  userId: string,
  id: string,
  input: AccountInput,
): Promise<Account> {
  const { data, error } = await getSupabaseClient()
    .from('accounts')
    .update(input)
    .eq('id', id)
    .eq('user_id', userId)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function deleteAccount(userId: string, id: string): Promise<void> {
  const { error } = await getSupabaseClient()
    .from('accounts')
    .delete()
    .eq('id', id)
    .eq('user_id', userId)

  if (error) throw error
}
