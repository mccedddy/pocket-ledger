import { useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import type { Account } from '../../data/accountRepository'
import type { Category } from '../../data/categoryRepository'
import type { LedgerType } from '../../data/database.types'
import type { Transaction } from '../../data/transactionRepository'
import { categoriesOfType } from '../../data/categoryRepository'
import { useAuth } from '../auth/authContext'
import { useAccounts } from '../accounts/useAccounts'
import { useCategories } from '../categories/useCategories'
import { todayLocalDateTime } from '../../domain/date'
import {
  validateTransactionDraft,
  type TransactionDraftErrors,
} from '../../domain/validation'
import { Button } from '../../shared/Button'
import { Card } from '../../shared/Card'
import { Field } from '../../shared/Field'
import { Input } from '../../shared/Input'
import { LinkButton } from '../../shared/LinkButton'
import { PageHeader } from '../../shared/PageHeader'
import { SegmentedControl } from '../../shared/SegmentedControl'
import { Select } from '../../shared/Select'
import { useDeleteTransaction, useSaveTransaction, useTransactions } from './useTransactions'

const typeOptions = [
  { value: 'expense' as const, label: 'Expense' },
  { value: 'income' as const, label: 'Income' },
  { value: 'transfer' as const, label: 'Transfer' },
]

export function TransactionFormPage() {
  const { id } = useParams()
  const { session } = useAuth()
  const userId = session!.user.id
  const transactions = useTransactions(userId)
  const accounts = useAccounts(userId)
  const categories = useCategories(userId)

  if (transactions.isLoading || accounts.isLoading || categories.isLoading) {
    return <p className="text-sm text-muted">Loading record…</p>
  }

  const existing = id ? transactions.data?.find((transaction) => transaction.id === id) : undefined
  if (id && !existing) {
    return (
      <Card>
        <p role="alert" className="text-sm text-expense">
          That record could not be found.
        </p>
        <Link to="/transactions" className="mt-4 inline-block text-sm text-primary underline">
          Back to transactions
        </Link>
      </Card>
    )
  }

  return (
    <TransactionForm
      key={existing?.id ?? 'new'}
      userId={userId}
      existing={existing}
      accounts={accounts.data ?? []}
      categories={categories.data ?? []}
    />
  )
}

function TransactionForm({
  userId,
  existing,
  accounts,
  categories,
}: {
  userId: string
  existing?: Transaction
  accounts: Account[]
  categories: Category[]
}) {
  const navigate = useNavigate()
  const save = useSaveTransaction(userId)
  const remove = useDeleteTransaction(userId)
  const [type, setType] = useState<LedgerType>(existing?.type ?? 'expense')
  const [occurredAt, setOccurredAt] = useState(existing?.occurred_at ?? todayLocalDateTime())
  const [accountId, setAccountId] = useState(existing?.account_id ?? '')
  const [toAccountId, setToAccountId] = useState(
    existing?.to_account_id ?? accounts[1]?.id ?? '',
  )
  const [categoryId, setCategoryId] = useState(existing?.category_id ?? '')
  const [amount, setAmount] = useState(existing ? String(existing.amount) : '')
  const [fee, setFee] = useState(
    existing && existing.fee_amount > 0 ? String(existing.fee_amount) : '',
  )
  const [payee, setPayee] = useState(existing?.payee ?? '')
  const [note, setNote] = useState(existing?.note ?? '')
  const [errors, setErrors] = useState<TransactionDraftErrors>({})
  const [actionError, setActionError] = useState<string | null>(null)

  const isTransfer = type === 'transfer'
  const availableCategories =
    type === 'transfer' ? [] : categoriesOfType(categories, type)
  const resolvedAccountId = accountId || accounts[0]?.id || ''
  const resolvedToAccountId =
    toAccountId || accounts.find((account) => account.id !== resolvedAccountId)?.id || ''
  const resolvedCategoryId =
    categoryId && availableCategories.some((category) => category.id === categoryId)
      ? categoryId
      : (availableCategories[0]?.id ?? '')
  const canSave =
    accounts.length > 0 &&
    (isTransfer ? accounts.length >= 2 : availableCategories.length > 0)

  const handleTypeChange = (next: LedgerType) => {
    setType(next)
    setCategoryId('')
    setToAccountId('')
    setFee('')
    setPayee('')
    setErrors({})
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setActionError(null)

    const nextErrors = validateTransactionDraft({
      type,
      occurredAt,
      accountId: resolvedAccountId,
      toAccountId: resolvedToAccountId,
      categoryId: resolvedCategoryId,
      amount,
      fee,
    })
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return

    try {
      await save.mutateAsync({
        id: existing?.id,
        input: {
          type,
          occurred_at: occurredAt,
          account_id: resolvedAccountId,
          to_account_id: isTransfer ? resolvedToAccountId : null,
          category_id: isTransfer ? null : resolvedCategoryId,
          amount: Number(amount),
          fee_amount: isTransfer ? Number(fee.trim() || 0) : 0,
          payee: isTransfer ? null : payee.trim() || null,
          note: note.trim() || null,
        },
      })
      navigate('/transactions')
    } catch {
      setActionError('Could not save the record. Please try again.')
    }
  }

  const handleDelete = async () => {
    if (!existing) return
    setActionError(null)
    if (!window.confirm('Delete this record? This cannot be undone.')) return
    try {
      await remove.mutateAsync(existing.id)
      navigate('/transactions')
    } catch {
      setActionError('Could not delete the record. Please try again.')
    }
  }

  const isPending = save.isPending || remove.isPending
  const missingMessage =
    accounts.length === 0
      ? 'Add an account before recording a transaction.'
      : isTransfer
        ? 'Add at least two accounts before recording a transfer.'
        : `Add a ${type} category before recording a transaction.`

  return (
    <>
      <PageHeader
        title={existing ? 'Edit record' : 'New record'}
        description="Choose Expense, Income, or Transfer. Date and time default to now."
      />

      <Card>
        {!canSave ? (
          <div className="flex flex-col gap-3">
            <p className="text-sm text-muted">{missingMessage}</p>
            <div className="flex flex-wrap gap-3">
              {accounts.length === 0 && (
                <LinkButton to="/accounts/new" variant="secondary">
                  New account
                </LinkButton>
              )}
              {!isTransfer && (
                <LinkButton to="/categories/new" variant="secondary">
                  New category
                </LinkButton>
              )}
            </div>
          </div>
        ) : (
          <form onSubmit={(event) => void handleSubmit(event)} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <span className="text-sm font-medium text-text">Type</span>
              <SegmentedControl
                label="Record type"
                value={type}
                options={typeOptions}
                onChange={handleTypeChange}
                disabled={isPending}
              />
            </div>

            <Field label="Date and time" htmlFor="record-date" error={errors.date}>
              <Input
                id="record-date"
                aria-label="Date and time"
                type="datetime-local"
                value={occurredAt}
                invalid={Boolean(errors.date)}
                onChange={(event) => {
                  setOccurredAt(event.target.value)
                  setErrors((current) => ({ ...current, date: undefined }))
                }}
              />
            </Field>

            {isTransfer ? (
              <div className="grid gap-4 sm:grid-cols-2">
                <Field
                  label="Source account"
                  htmlFor="record-source"
                  error={errors.accounts}
                >
                  <Select
                    id="record-source"
                    aria-label="Source account"
                    value={resolvedAccountId}
                    invalid={Boolean(errors.accounts)}
                    onChange={(event) => {
                      setAccountId(event.target.value)
                      setErrors((current) => ({ ...current, accounts: undefined }))
                    }}
                  >
                    {accounts.map((account) => (
                      <option key={account.id} value={account.id}>
                        {account.name}
                      </option>
                    ))}
                  </Select>
                </Field>

                <Field label="Destination account" htmlFor="record-destination">
                  <Select
                    id="record-destination"
                    aria-label="Destination account"
                    value={resolvedToAccountId}
                    onChange={(event) => {
                      setToAccountId(event.target.value)
                      setErrors((current) => ({ ...current, accounts: undefined }))
                    }}
                  >
                    {accounts.map((account) => (
                      <option key={account.id} value={account.id}>
                        {account.name}
                      </option>
                    ))}
                  </Select>
                </Field>
              </div>
            ) : (
              <>
                <Field label="Account" htmlFor="record-account" error={errors.account}>
                  <Select
                    id="record-account"
                    aria-label="Account"
                    value={resolvedAccountId}
                    invalid={Boolean(errors.account)}
                    onChange={(event) => {
                      setAccountId(event.target.value)
                      setErrors((current) => ({ ...current, account: undefined }))
                    }}
                  >
                    {accounts.map((account) => (
                      <option key={account.id} value={account.id}>
                        {account.name}
                      </option>
                    ))}
                  </Select>
                </Field>

                <Field label="Category" htmlFor="record-category" error={errors.category}>
                  <Select
                    id="record-category"
                    aria-label="Category"
                    value={resolvedCategoryId}
                    invalid={Boolean(errors.category)}
                    onChange={(event) => {
                      setCategoryId(event.target.value)
                      setErrors((current) => ({ ...current, category: undefined }))
                    }}
                  >
                    {availableCategories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </Select>
                </Field>
              </>
            )}

            <Field label="Amount" htmlFor="record-amount" error={errors.amount}>
              <Input
                id="record-amount"
                aria-label="Amount"
                inputMode="decimal"
                value={amount}
                invalid={Boolean(errors.amount)}
                onChange={(event) => {
                  setAmount(event.target.value)
                  setErrors((current) => ({ ...current, amount: undefined }))
                }}
                placeholder="0.00"
              />
            </Field>

            {isTransfer ? (
              <Field label="Fee (optional)" htmlFor="record-fee" error={errors.fee}>
                <Input
                  id="record-fee"
                  aria-label="Fee"
                  inputMode="decimal"
                  value={fee}
                  invalid={Boolean(errors.fee)}
                  onChange={(event) => {
                    setFee(event.target.value)
                    setErrors((current) => ({ ...current, fee: undefined }))
                  }}
                  placeholder="0.00"
                />
              </Field>
            ) : (
              <Field label="Payee (optional)" htmlFor="record-payee">
                <Input
                  id="record-payee"
                  aria-label="Payee"
                  value={payee}
                  onChange={(event) => setPayee(event.target.value)}
                  placeholder="Where the money went or came from"
                />
              </Field>
            )}

            <Field label="Note (optional)" htmlFor="record-note">
              <Input
                id="record-note"
                aria-label="Note"
                value={note}
                onChange={(event) => setNote(event.target.value)}
              />
            </Field>

            {actionError && (
              <p role="alert" className="text-sm text-expense">
                {actionError}
              </p>
            )}

            <div className="flex flex-wrap items-center gap-3">
              <Button type="submit" isLoading={isPending}>
                {existing ? 'Save changes' : 'Save record'}
              </Button>
              {existing && (
                <Button
                  variant="destructive"
                  onClick={() => void handleDelete()}
                  disabled={isPending}
                >
                  Delete record
                </Button>
              )}
              <Link to="/transactions" className="text-sm text-muted hover:text-text">
                Cancel
              </Link>
            </div>
          </form>
        )}
      </Card>
    </>
  )
}
