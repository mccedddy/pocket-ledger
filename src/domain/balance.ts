import { sumAmounts } from './money'

/**
 * D-011 (amended): initial_amount is the opening balance. Deltas come from the
 * single unified transactions table (D-019), including transfer fees. Balances
 * are derived, never stored, and recomputed after edits/deletes by refetching.
 */
export type BalanceEntry =
  | { type: 'income' | 'expense'; amount: number }
  | { type: 'transfer_out'; amount: number; fee: number }
  | { type: 'transfer_in'; amount: number }

function delta(entry: BalanceEntry): number {
  switch (entry.type) {
    case 'income':
      return entry.amount
    case 'expense':
      return -entry.amount
    case 'transfer_out':
      return -(entry.amount + entry.fee)
    case 'transfer_in':
      return entry.amount
  }
}

export type LedgerTransaction = {
  type: 'income' | 'expense' | 'transfer'
  account_id: string
  to_account_id: string | null
  amount: number
  fee_amount: number
}

/** One ledger row produces one or two account-specific balance entries. */
export function balanceEntriesForTransaction(
  transaction: LedgerTransaction,
): { accountId: string; entry: BalanceEntry }[] {
  if (transaction.type === 'transfer') {
    if (!transaction.to_account_id) return []
    return [
      {
        accountId: transaction.account_id,
        entry: {
          type: 'transfer_out',
          amount: transaction.amount,
          fee: transaction.fee_amount,
        },
      },
      {
        accountId: transaction.to_account_id,
        entry: { type: 'transfer_in', amount: transaction.amount },
      },
    ]
  }
  return [
    {
      accountId: transaction.account_id,
      entry: { type: transaction.type, amount: transaction.amount },
    },
  ]
}

export function calculateBalance(initialAmount: number, entries: readonly BalanceEntry[]): number {
  return sumAmounts([initialAmount, ...entries.map(delta)])
}
