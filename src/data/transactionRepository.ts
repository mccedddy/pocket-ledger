import type { Database, LedgerType } from './database.types'
import { getSupabaseClient } from './supabase'

export type Transaction = Database['public']['Tables']['transactions']['Row']

/** One input shape for all three ledger types; unused fields are null/zero. */
export type TransactionInput = {
  type: LedgerType
  occurred_at: string
  account_id: string
  to_account_id: string | null
  category_id: string | null
  amount: number
  fee_amount: number
  payee: string | null
  note: string | null
}

export const transactionsQueryKey = (userId: string) => ['transactions', userId] as const

export async function fetchTransactions(userId: string): Promise<Transaction[]> {
  const { data, error } = await getSupabaseClient()
    .from('transactions')
    .select('*')
    .eq('user_id', userId)
    .order('occurred_at', { ascending: false })
    .order('created_at', { ascending: false })

  if (error) throw error
  return data
}

export async function createTransaction(
  userId: string,
  input: TransactionInput,
): Promise<Transaction> {
  const { data, error } = await getSupabaseClient()
    .from('transactions')
    .insert({ user_id: userId, ...input })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function updateTransaction(
  userId: string,
  id: string,
  input: TransactionInput,
): Promise<Transaction> {
  const { data, error } = await getSupabaseClient()
    .from('transactions')
    .update(input)
    .eq('id', id)
    .eq('user_id', userId)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function deleteTransaction(userId: string, id: string): Promise<void> {
  const { error } = await getSupabaseClient()
    .from('transactions')
    .delete()
    .eq('id', id)
    .eq('user_id', userId)

  if (error) throw error
}
