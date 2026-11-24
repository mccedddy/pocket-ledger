/** Compact row presentation for the headerless unified history (D-019). */

export type DisplayTransaction = {
  type: 'income' | 'expense' | 'transfer'
  occurred_at: string
  account_id: string
  to_account_id: string | null
  category_id: string | null
  amount: number
  fee_amount: number
  payee: string | null
  note: string | null
}

export type TransactionDisplay = {
  category: string
  note: string | null
  accountLine: string
  fee: number | null
  signedAmount: number
}

export function describeTransaction(
  transaction: DisplayTransaction,
  accountNames: ReadonlyMap<string, string>,
  categoryNames: ReadonlyMap<string, string>,
): TransactionDisplay {
  const account = accountNames.get(transaction.account_id) ?? 'Account'
  const payee = transaction.payee?.trim() || null
  const note = transaction.note?.trim() || null

  if (transaction.type === 'transfer') {
    const destination = transaction.to_account_id
      ? accountNames.get(transaction.to_account_id) ?? 'Account'
      : 'Account'
    return {
      category: 'Transfer',
      note,
      accountLine: `${account} → ${destination}`,
      fee: transaction.fee_amount > 0 ? transaction.fee_amount : null,
      signedAmount: -transaction.amount,
    }
  }

  return {
    category: transaction.category_id
      ? categoryNames.get(transaction.category_id) ?? '—'
      : '—',
    note,
    accountLine: [payee, account].filter(Boolean).join(' · '),
    fee: null,
    signedAmount:
      transaction.type === 'income' ? transaction.amount : -transaction.amount,
  }
}
