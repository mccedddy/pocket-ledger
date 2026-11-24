import { useState } from 'react'
import type { Transaction } from '../../data/transactionRepository'
import { useAuth } from '../auth/authContext'
import { useAccounts } from '../accounts/useAccounts'
import { useCategories } from '../categories/useCategories'
import { useProfile } from '../settings/useProfile'
import { formatLocalDate } from '../../domain/date'
import { formatCurrency, normalizeCurrencyCode } from '../../domain/currency'
import { Button } from '../../shared/Button'
import { Card } from '../../shared/Card'
import { LinkButton } from '../../shared/LinkButton'
import { ListRow } from '../../shared/ListRow'
import { PageHeader } from '../../shared/PageHeader'
import { useDeleteTransaction, useTransactions } from './useTransactions'

export function TransactionsPage() {
  const { session } = useAuth()
  const userId = session!.user.id
  const transactions = useTransactions(userId)
  const accounts = useAccounts(userId)
  const categories = useCategories(userId)
  const profile = useProfile(session!.user)
  const remove = useDeleteTransaction(userId)
  const [actionError, setActionError] = useState<string | null>(null)

  const handleDelete = async (transaction: Transaction) => {
    setActionError(null)
    if (!window.confirm('Delete this record? This cannot be undone.')) return
    try {
      await remove.mutateAsync(transaction.id)
    } catch {
      setActionError('Could not delete the record. Please try again.')
    }
  }

  if (
    transactions.isLoading ||
    accounts.isLoading ||
    categories.isLoading ||
    profile.isLoading
  ) {
    return <p className="text-sm text-muted">Loading transactions…</p>
  }

  if (
    transactions.isError ||
    accounts.isError ||
    categories.isError ||
    profile.isError ||
    !profile.data
  ) {
    return (
      <Card>
        <p role="alert" className="text-sm text-expense">
          Could not load your ledger. Please try again.
        </p>
        <Button className="mt-4" onClick={() => void transactions.refetch()}>
          Retry
        </Button>
      </Card>
    )
  }

  const currency = normalizeCurrencyCode(profile.data.currency_code)
  const accountNames = new Map(accounts.data?.map((account) => [account.id, account.name]) ?? [])
  const categoryNames = new Map(categories.data?.map((category) => [category.id, category.name]) ?? [])

  const groups: { date: string; items: Transaction[] }[] = []
  for (const transaction of transactions.data ?? []) {
    const last = groups[groups.length - 1]
    if (last?.date === transaction.occurred_on) {
      last.items.push(transaction)
    } else {
      groups.push({ date: transaction.occurred_on, items: [transaction] })
    }
  }

  return (
    <>
      <PageHeader
        title="Transactions"
        description="Your income and expense records, newest first."
        action={<LinkButton to="/transactions/new">New record</LinkButton>}
      />

      {actionError && (
        <p role="alert" className="mb-4 text-sm text-expense">
          {actionError}
        </p>
      )}

      {groups.length === 0 ? (
        <Card>
          <p className="text-sm text-muted">No records yet.</p>
          <LinkButton to="/transactions/new" variant="secondary" >
            Add your first record
          </LinkButton>
        </Card>
      ) : (
        <div className="flex flex-col gap-5">
          {groups.map((group) => (
            <section key={group.date}>
              <h2 className="mb-2 text-sm font-semibold text-muted">
                {formatLocalDate(group.date)}
              </h2>
              <Card className="p-0">
                <ul>
                  {group.items.map((transaction) => {
                    const isIncome = transaction.type === 'income'
                    const details = [
                      isIncome ? 'Income' : 'Expense',
                      accountNames.get(transaction.account_id) ?? 'Account',
                      transaction.payee,
                      transaction.note,
                    ].filter(Boolean)
                    return (
                      <ListRow
                        key={transaction.id}
                        title={categoryNames.get(transaction.category_id) ?? 'Category'}
                        subtitle={details.join(' · ')}
                        trailing={
                          <span
                            className={`text-sm font-semibold tabular-nums ${
                              isIncome ? 'text-income' : 'text-expense'
                            }`}
                          >
                            {isIncome ? '+' : '−'}
                            {formatCurrency(Math.abs(transaction.amount), currency)}
                          </span>
                        }
                        actions={
                          <>
                            <LinkButton
                              to={`/transactions/${transaction.id}/edit`}
                              variant="secondary"
                            >
                              Edit
                            </LinkButton>
                            <Button
                              variant="ghost"
                              aria-label="Delete record"
                              onClick={() => void handleDelete(transaction)}
                            >
                              Delete
                            </Button>
                          </>
                        }
                      />
                    )
                  })}
                </ul>
              </Card>
            </section>
          ))}
        </div>
      )}
    </>
  )
}
