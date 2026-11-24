import { useState } from 'react'
import { formatCurrency, normalizeCurrencyCode } from '../../domain/currency'
import { useAuth } from '../auth/authContext'
import { useProfile } from '../settings/useProfile'
import { Button } from '../../shared/Button'
import { Card } from '../../shared/Card'
import { ListRow } from '../../shared/ListRow'
import { LinkButton } from '../../shared/LinkButton'
import { PageHeader } from '../../shared/PageHeader'
import { useAccountBalances, useAccounts, useDeleteAccount } from './useAccounts'

export function AccountsPage() {
  const { session } = useAuth()
  const userId = session!.user.id
  const profile = useProfile(session!.user)
  const accounts = useAccounts(userId)
  const balances = useAccountBalances(userId, accounts.data)
  const remove = useDeleteAccount(userId)
  const [actionError, setActionError] = useState<string | null>(null)

  const handleDelete = async (id: string, name: string) => {
    setActionError(null)
    if (!window.confirm(`Delete account "${name}"? This cannot be undone.`)) return
    try {
      await remove.mutateAsync(id)
    } catch {
      setActionError('Could not delete the account. It may still have records.')
    }
  }

  if (accounts.isLoading || balances.isLoading || profile.isLoading) {
    return <p className="text-sm text-muted">Loading accounts…</p>
  }

  if (accounts.isError || balances.isError || profile.isError || !profile.data) {
    return (
      <Card>
        <p role="alert" className="text-sm text-expense">
          Could not load your accounts. Please try again.
        </p>
        <Button className="mt-4" onClick={() => void accounts.refetch()}>
          Retry
        </Button>
      </Card>
    )
  }

  const currency = normalizeCurrencyCode(profile.data.currency_code)

  return (
    <>
      <PageHeader
        title="Accounts"
        description="Your accounts and their current balances."
        action={<LinkButton to="/accounts/new">New account</LinkButton>}
      />

      {actionError && (
        <p role="alert" className="mb-4 text-sm text-expense">
          {actionError}
        </p>
      )}

      <Card className="p-0">
        {accounts.data?.length ? (
          <ul>
            {accounts.data.map((account) => {
              const balance = balances.balances.get(account.id) ?? account.initial_amount
              return (
                <ListRow
                  key={account.id}
                  title={account.name}
                  subtitle="Opening balance plus records"
                  trailing={
                    <span
                      className={`text-sm font-semibold tabular-nums ${
                        balance < 0 ? 'text-expense' : 'text-text'
                      }`}
                    >
                      {formatCurrency(balance, currency)}
                    </span>
                  }
                  actions={
                    <>
                      <LinkButton to={`/accounts/${account.id}/edit`} variant="secondary">
                        Edit
                      </LinkButton>
                      <Button
                        variant="ghost"
                        aria-label={`Delete ${account.name}`}
                        onClick={() => void handleDelete(account.id, account.name)}
                      >
                        Delete
                      </Button>
                    </>
                  }
                />
              )
            })}
          </ul>
        ) : (
          <div className="p-6 text-center">
            <p className="text-sm text-muted">No accounts yet.</p>
            <LinkButton to="/accounts/new" variant="secondary">
              Add your first account
            </LinkButton>
          </div>
        )}
      </Card>
    </>
  )
}
