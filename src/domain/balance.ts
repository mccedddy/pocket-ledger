import type { LedgerType } from '../data/database.types'
import { sumAmounts } from './money'

/** The minimal record shape needed by the D-011 balance rule. */
export type BalanceEntry = { type: LedgerType; amount: number }

/**
 * D-011: initial_amount is the opening balance. Balances are derived, never
 * stored, and are recomputed after edits/deletes by refetching records.
 */
export function calculateBalance(initialAmount: number, entries: readonly BalanceEntry[]): number {
  return sumAmounts([
    initialAmount,
    ...entries.map((entry) => (entry.type === 'income' ? entry.amount : -entry.amount)),
  ])
}
