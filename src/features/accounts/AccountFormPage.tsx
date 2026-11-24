import { useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import type { Account } from '../../data/accountRepository'
import { useAuth } from '../auth/authContext'
import { normalizeEntityName, validateAmount, validateEntityName } from '../../domain/validation'
import { Button } from '../../shared/Button'
import { Card } from '../../shared/Card'
import { Field } from '../../shared/Field'
import { Input } from '../../shared/Input'
import { PageHeader } from '../../shared/PageHeader'
import { useAccounts, useCreateAccount, useDeleteAccount, useUpdateAccount } from './useAccounts'

export function AccountFormPage() {
  const { id } = useParams()
  const { session } = useAuth()
  const userId = session!.user.id
  const accounts = useAccounts(userId)

  if (accounts.isLoading) return <p className="text-sm text-muted">Loading account…</p>

  const existing = id ? accounts.data?.find((account) => account.id === id) : undefined
  if (id && !existing) {
    return (
      <Card>
        <p role="alert" className="text-sm text-expense">
          That account could not be found.
        </p>
        <Link to="/accounts" className="mt-4 inline-block text-sm text-primary underline">
          Back to accounts
        </Link>
      </Card>
    )
  }

  return <AccountForm key={existing?.id ?? 'new'} userId={userId} existing={existing} />
}

function AccountForm({ userId, existing }: { userId: string; existing?: Account }) {
  const navigate = useNavigate()
  const create = useCreateAccount(userId)
  const update = useUpdateAccount(userId)
  const remove = useDeleteAccount(userId)
  const [name, setName] = useState(existing?.name ?? '')
  const [initialAmount, setInitialAmount] = useState(String(existing?.initial_amount ?? 0))
  const [errors, setErrors] = useState<{ name?: string; amount?: string }>({})
  const [actionError, setActionError] = useState<string | null>(null)

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setActionError(null)

    const nameError = validateEntityName(name, 'Account name')
    const amountError = validateAmount(initialAmount, true)
    if (nameError || amountError) {
      setErrors({ name: nameError ?? undefined, amount: amountError ?? undefined })
      return
    }

    setErrors({})
    const input = {
      name: normalizeEntityName(name),
      initial_amount: Number(initialAmount),
    }

    try {
      if (existing) {
        await update.mutateAsync({ id: existing.id, input })
      } else {
        await create.mutateAsync(input)
      }
      navigate('/accounts')
    } catch {
      setActionError('Could not save the account. Please try again.')
    }
  }

  const handleDelete = async () => {
    if (!existing) return
    setActionError(null)
    if (!window.confirm(`Delete account "${existing.name}"? This cannot be undone.`)) return
    try {
      await remove.mutateAsync(existing.id)
      navigate('/accounts')
    } catch {
      setActionError('Could not delete the account. It may still have records.')
    }
  }

  const isPending = create.isPending || update.isPending || remove.isPending

  return (
    <>
      <PageHeader
        title={existing ? 'Edit account' : 'New account'}
        description="Enter a name and an opening balance."
      />

      <Card>
        <form onSubmit={(event) => void handleSubmit(event)} className="flex flex-col gap-4">
          <Field label="Account name" htmlFor="account-name" error={errors.name}>
            <Input
              id="account-name"
              aria-label="Account name"
              value={name}
              invalid={Boolean(errors.name)}
              onChange={(event) => {
                setName(event.target.value)
                setErrors((current) => ({ ...current, name: undefined }))
              }}
              placeholder="Cash, bank, savings…"
            />
          </Field>

          <Field
            label="Opening balance"
            htmlFor="account-amount"
            hint="Your current balance is calculated from this plus your records."
            error={errors.amount}
          >
            <Input
              id="account-amount"
              aria-label="Opening balance"
              inputMode="decimal"
              value={initialAmount}
              invalid={Boolean(errors.amount)}
              onChange={(event) => {
                setInitialAmount(event.target.value)
                setErrors((current) => ({ ...current, amount: undefined }))
              }}
            />
          </Field>

          {actionError && (
            <p role="alert" className="text-sm text-expense">
              {actionError}
            </p>
          )}

          <div className="flex flex-wrap items-center gap-3">
            <Button type="submit" isLoading={isPending}>
              {existing ? 'Save changes' : 'Create account'}
            </Button>
            {existing && (
              <Button
                variant="destructive"
                onClick={() => void handleDelete()}
                disabled={isPending}
              >
                Delete account
              </Button>
            )}
            <Link to="/accounts" className="text-sm text-muted hover:text-text">
              Cancel
            </Link>
          </div>
        </form>
      </Card>
    </>
  )
}
