import { useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import type { Account } from '../../data/accountRepository'
import type { CategoryType } from '../../data/database.types'
import { useAuth } from '../auth/authContext'
import { formatCurrency, normalizeCurrencyCode } from '../../domain/currency'
import { todayLocalDateTime } from '../../domain/date'
import { fromCents, toCents } from '../../domain/money'
import { normalizeEntityName, validateAmount, validateEntityName } from '../../domain/validation'
import { Button } from '../../shared/Button'
import { Card } from '../../shared/Card'
import { Field } from '../../shared/Field'
import { Input } from '../../shared/Input'
import { PageHeader } from '../../shared/PageHeader'
import { useCategories, useCreateCategory } from '../categories/useCategories'
import { useProfile } from '../settings/useProfile'
import { useSaveTransaction } from '../transactions/useTransactions'
import {
  useAccountBalances,
  useAccounts,
  useCreateAccount,
  useDeleteAccount,
  useUpdateAccount,
} from './useAccounts'

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

type Correction = {
  corrected: number
  derived: number
  difference: number
  opening: number
}

function AccountForm({ userId, existing }: { userId: string; existing?: Account }) {
  const navigate = useNavigate()
  const { session } = useAuth()
  const profile = useProfile(session!.user)
  const create = useCreateAccount(userId)
  const update = useUpdateAccount(userId)
  const remove = useDeleteAccount(userId)
  const balances = useAccountBalances(userId, existing ? [existing] : undefined)
  const categories = useCategories(userId)
  const createCategory = useCreateCategory(userId)
  const saveTransaction = useSaveTransaction(userId)
  const [name, setName] = useState(existing?.name ?? '')
  const [initialAmount, setInitialAmount] = useState(String(existing?.initial_amount ?? 0))
  const [correctedBalanceOverride, setCorrectedBalanceOverride] = useState<string | null>(null)
  const [correction, setCorrection] = useState<Correction | null>(null)
  const [errors, setErrors] = useState<{ name?: string; amount?: string }>({})
  const [actionError, setActionError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  const derivedBalance = existing ? (balances.balances.get(existing.id) ?? existing.initial_amount) : 0
  const correctedBalance = correctedBalanceOverride ?? String(derivedBalance)
  const currency = normalizeCurrencyCode(profile.data?.currency_code)
  const formatMoney = (value: number) => formatCurrency(value, currency)

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setActionError(null)
    setNotice(null)

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
    setNotice(null)
    if (!window.confirm(`Delete account "${existing.name}"? This cannot be undone.`)) return
    try {
      await remove.mutateAsync(existing.id)
      navigate('/accounts')
    } catch {
      setActionError('Could not delete the account. It may still have records.')
    }
  }

  const handleReviewCorrection = () => {
    if (!existing) return
    setActionError(null)
    setNotice(null)
    const amountError = validateAmount(correctedBalance, true)
    if (amountError) {
      setActionError(amountError)
      return
    }

    const corrected = Number(correctedBalance)
    const difference = fromCents(toCents(corrected) - toCents(derivedBalance))
    if (difference === 0) {
      setNotice('Balance already matches; no correction needed.')
      return
    }

    setCorrection({
      corrected,
      derived: derivedBalance,
      difference,
      opening: existing.initial_amount,
    })
  }

  const handleLogCorrection = async () => {
    if (!existing || !correction) return
    setActionError(null)
    const type: CategoryType = correction.difference > 0 ? 'income' : 'expense'
    const amount = Math.abs(correction.difference)

    try {
      let category = categories.data?.find(
        (item) => item.name === 'Difference' && item.type === type,
      )
      if (!category) {
        category = await createCategory.mutateAsync({ name: 'Difference', type })
      }

      await saveTransaction.mutateAsync({
        input: {
          type,
          occurred_at: todayLocalDateTime(),
          account_id: existing.id,
          to_account_id: null,
          category_id: category.id,
          amount,
          fee_amount: 0,
          payee: null,
          note: 'Modified balance',
        },
      })

      setNotice(
        `${type === 'income' ? 'Income' : 'Expense'} of ${formatMoney(amount)} logged as Difference / Modified balance.`,
      )
      setCorrectedBalanceOverride(String(correction.corrected))
      setCorrection(null)
    } catch {
      setActionError('Could not log the balance correction. Please try again.')
    }
  }

  const handleAdjustOpeningBalance = async () => {
    if (!existing || !correction) return
    setActionError(null)
    const adjustedOpening = fromCents(toCents(correction.opening) + toCents(correction.difference))
    try {
      await update.mutateAsync({
        id: existing.id,
        input: { name: existing.name, initial_amount: adjustedOpening },
      })
      setInitialAmount(String(adjustedOpening))
      setCorrectedBalanceOverride(String(correction.corrected))
      setNotice(
        `Opening balance adjusted to ${formatMoney(adjustedOpening)}; derived balance is now ${formatMoney(correction.corrected)}. No ledger record was created.`,
      )
      setCorrection(null)
    } catch {
      setActionError('Could not update the opening balance. Please try again.')
    }
  }

  const isPending = create.isPending || update.isPending || remove.isPending

  return (
    <>
      <PageHeader
        title={existing ? 'Edit account' : 'New account'}
        description={
          existing
            ? 'Edit the account or correct its derived balance.'
            : 'Enter a name and an opening balance.'
        }
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

      {existing && (
        <Card className="mt-4">
          <div className="flex flex-col gap-4">
            <div>
              <h2 className="text-base font-semibold text-text">Balance correction</h2>
              <p className="mt-1 text-sm text-muted">
                Derived balance: {formatMoney(derivedBalance)}
              </p>
              {balances.isError && (
                <p role="alert" className="mt-1 text-sm text-expense">
                  Could not load your records. Refresh before correcting this balance.
                </p>
              )}
            </div>

            <Field
              label="Final balance"
              htmlFor="account-corrected-balance"
              hint="Enter what this account should be after all records."
            >
              <Input
                id="account-corrected-balance"
                aria-label="Final balance"
                inputMode="decimal"
                value={correctedBalance}
                onChange={(event) => {
                  setCorrectedBalanceOverride(event.target.value)
                  setActionError(null)
                  setNotice(null)
                }}
              />
            </Field>

            <Button
              onClick={handleReviewCorrection}
              variant="secondary"
              disabled={
                isPending ||
                balances.isLoading ||
                balances.isError ||
                saveTransaction.isPending ||
                createCategory.isPending
              }
            >
              Review correction
            </Button>

            {notice && (
              <p role="status" className="text-sm text-income">
                {notice}
              </p>
            )}

            {correction && (
              <div
                role="dialog"
                aria-label="Confirm balance correction"
                className="flex flex-col gap-3 rounded-control border border-border bg-surface p-4"
              >
                <p className="text-sm font-medium text-text">
                  {correction.difference > 0
                    ? `Log ${formatMoney(correction.difference)} as income?`
                    : `Log ${formatMoney(Math.abs(correction.difference))} as expense?`}
                </p>
                <p className="text-sm text-muted">Category Difference · Remarks Modified balance</p>
                <div className="flex flex-wrap items-center gap-3">
                  <Button
                    onClick={() => void handleLogCorrection()}
                    isLoading={saveTransaction.isPending || createCategory.isPending}
                  >
                    Log {correction.difference > 0 ? 'income' : 'expense'}
                  </Button>
                  <Button
                    onClick={() => void handleAdjustOpeningBalance()}
                    variant="secondary"
                    disabled={isPending || saveTransaction.isPending || createCategory.isPending}
                  >
                    Adjust opening balance instead
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => {
                      setCorrection(null)
                      setNotice(null)
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </div>
        </Card>
      )}
    </>
  )
}
