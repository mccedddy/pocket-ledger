import type { Transaction } from '../../data/transactionRepository'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/authContext'
import { useAccounts } from '../accounts/useAccounts'
import { useCategories } from '../categories/useCategories'
import { useProfile } from '../settings/useProfile'
import { formatLocalDate, localDateKey } from '../../domain/date'
import { formatCurrency, normalizeCurrencyCode } from '../../domain/currency'
import { describeTransaction } from '../../domain/transactionDisplay'
import { Button } from '../../shared/Button'
import { Card } from '../../shared/Card'
import { LinkButton } from '../../shared/LinkButton'
import { PageHeader } from '../../shared/PageHeader'
import { useTransactions } from './useTransactions'

type DayGroup = {
  date: string
  items: Transaction[]
  incomeTotal: number
  expenseTotal: number
}

export function TransactionsPage() {
  const { session } = useAuth()
  const navigate = useNavigate()
  const userId = session!.user.id
  const transactions = useTransactions(userId)
  const accounts = useAccounts(userId)
  const categories = useCategories(userId)
  const profile = useProfile(session!.user)

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

  const groups: DayGroup[] = []
  for (const transaction of transactions.data ?? []) {
    const dateKey = localDateKey(transaction.occurred_at)
    let group = groups[groups.length - 1]
    if (group?.date !== dateKey) {
      group = { date: dateKey, items: [], incomeTotal: 0, expenseTotal: 0 }
      groups.push(group)
    }
    group.items.push(transaction)
    if (transaction.type === 'income') group.incomeTotal += transaction.amount
    if (transaction.type === 'expense') group.expenseTotal -= transaction.amount
  }

  const amountText = (amount: number) =>
    `${amount >= 0 ? '+' : '−'}${formatCurrency(Math.abs(amount), currency)}`
  const totalText = (amount: number, sign: '+' | '−') =>
    `${sign}${formatCurrency(Math.abs(amount), currency)}`

  return (
    <>
      <PageHeader
        title="Transactions"
        description="A single ledger, newest first."
        action={<LinkButton to="/transactions/new">New record</LinkButton>}
      />

      {groups.length === 0 ? (
        <Card>
          <p className="text-sm text-muted">No records yet.</p>
          <LinkButton to="/transactions/new" variant="secondary">
            Add your first record
          </LinkButton>
        </Card>
      ) : (
        <div className="flex flex-col gap-5">
          {groups.map((group) => (
            <Card key={group.date} className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[560px] table-fixed text-left text-sm">
                  <colgroup>
                    <col className="w-32" />
                    <col />
                    <col className="w-36" />
                  </colgroup>
                  <tbody className="divide-y divide-border">
                    <tr className="h-16 bg-surface-subtle">
                      <td className="whitespace-nowrap px-4 py-2 align-middle font-semibold">
                        {formatLocalDate(group.date)}
                      </td>
                      <td className="whitespace-nowrap px-4 py-2 align-middle text-right font-semibold tabular-nums text-income">
                        {totalText(group.incomeTotal, '+')}
                      </td>
                      <td className="whitespace-nowrap px-4 py-2 align-middle text-right font-semibold tabular-nums text-expense">
                        {totalText(group.expenseTotal, '−')}
                      </td>
                    </tr>
                    {group.items.map((transaction) => {
                      const display = describeTransaction(transaction, accountNames, categoryNames)
                      const positive = display.signedAmount >= 0
                      const openEditor = () => navigate(`/transactions/${transaction.id}/edit`)
                      return (
                        <tr
                          key={transaction.id}
                          tabIndex={0}
                          aria-label="Edit record"
                          onClick={openEditor}
                          onKeyDown={(event) => {
                            if (event.key === 'Enter' || event.key === ' ') {
                              event.preventDefault()
                              openEditor()
                            }
                          }}
                          className="h-16 cursor-pointer transition-colors hover:bg-surface-subtle focus:bg-surface-subtle focus:outline-none"
                        >
                          <td className="whitespace-nowrap px-4 py-2 align-middle text-muted">
                            {display.category}
                          </td>
                          <td className="px-4 py-2 align-middle">
                            {display.note && (
                              <span className="block truncate" title={display.note}>
                                {display.note}
                              </span>
                            )}
                            <span
                              className={`block truncate text-xs text-muted ${display.note ? 'mt-0.5' : ''}`}
                              title={display.accountLine}
                            >
                              {display.accountLine}
                            </span>
                          </td>
                          <td className="whitespace-nowrap px-4 py-2 align-middle text-right">
                            <span
                              className={`font-semibold tabular-nums ${
                                positive ? 'text-income' : 'text-expense'
                              }`}
                            >
                              {amountText(display.signedAmount)}
                            </span>
                            {display.fee !== null && (
                              <span className="mt-0.5 block text-xs text-muted">
                                Fee {formatCurrency(display.fee, currency)}
                              </span>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </Card>
          ))}
        </div>
      )}
    </>
  )
}
