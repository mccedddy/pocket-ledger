import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { TransactionFormPage } from './TransactionFormPage'

const mocks = vi.hoisted(() => ({
  useAuth: vi.fn(),
  useTransactions: vi.fn(),
  useAccounts: vi.fn(),
  useCategories: vi.fn(),
  useSaveTransaction: vi.fn(),
  useDeleteTransaction: vi.fn(),
  mutateAsync: vi.fn(),
}))

vi.mock('../auth/authContext', () => ({ useAuth: mocks.useAuth }))
vi.mock('../accounts/useAccounts', () => ({ useAccounts: mocks.useAccounts }))
vi.mock('../categories/useCategories', () => ({ useCategories: mocks.useCategories }))
vi.mock('./useTransactions', () => ({
  useTransactions: mocks.useTransactions,
  useSaveTransaction: mocks.useSaveTransaction,
  useDeleteTransaction: mocks.useDeleteTransaction,
}))

const accounts = [
  {
    id: 'account-1',
    user_id: 'user-1',
    name: 'Cash',
    initial_amount: 100,
    sort_order: 0,
    created_at: '2026-11-24T00:00:00.000Z',
    updated_at: '2026-11-24T00:00:00.000Z',
  },
  {
    id: 'account-2',
    user_id: 'user-1',
    name: 'Bank',
    initial_amount: 200,
    sort_order: 1,
    created_at: '2026-11-24T00:00:00.000Z',
    updated_at: '2026-11-24T00:00:00.000Z',
  },
]

const categories = [
  {
    id: 'category-expense',
    user_id: 'user-1',
    name: 'Food',
    type: 'expense' as const,
    sort_order: 1,
    created_at: '2026-11-24T00:00:00.000Z',
    updated_at: '2026-11-24T00:00:00.000Z',
  },
  {
    id: 'category-income',
    user_id: 'user-1',
    name: 'Salary',
    type: 'income' as const,
    sort_order: 1,
    created_at: '2026-11-24T00:00:00.000Z',
    updated_at: '2026-11-24T00:00:00.000Z',
  },
]

function renderPage() {
  return render(
    <MemoryRouter>
      <TransactionFormPage />
    </MemoryRouter>,
  )
}

beforeEach(() => {
  mocks.useAuth.mockReturnValue({ session: { user: { id: 'user-1' } } })
  mocks.useTransactions.mockReturnValue({ isLoading: false, data: [] })
  mocks.useAccounts.mockReturnValue({ isLoading: false, data: accounts })
  mocks.useCategories.mockReturnValue({ isLoading: false, data: categories })
  mocks.mutateAsync.mockReset()
  mocks.useSaveTransaction.mockReturnValue({ mutateAsync: mocks.mutateAsync, isPending: false })
  mocks.useDeleteTransaction.mockReturnValue({ mutateAsync: vi.fn(), isPending: false })
})

describe('TransactionFormPage with three types (D-019)', () => {
  it('offers Expense, Income, and Transfer and defaults the local date/time', () => {
    renderPage()

    expect(screen.getByRole('button', { name: 'Expense' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Income' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Transfer' })).toBeInTheDocument()
    const input = screen.getByLabelText('Date and time') as HTMLInputElement
    expect(input.type).toBe('datetime-local')
    expect(input.value).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/)
  })

  it('blocks saving without an amount', async () => {
    renderPage()

    fireEvent.click(screen.getByRole('button', { name: 'Save record' }))

    expect(await screen.findByText('Enter an amount.')).toBeInTheDocument()
    expect(mocks.mutateAsync).not.toHaveBeenCalled()
  })

  it('offers only categories matching the selected income/expense type', () => {
    renderPage()

    expect(screen.getByRole('option', { name: 'Food' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Income' }))

    expect(screen.queryByRole('option', { name: 'Food' })).not.toBeInTheDocument()
    expect(screen.getByRole('option', { name: 'Salary' })).toBeInTheDocument()
  })

  it('saves an expense with normalized optional fields and unified nulls', async () => {
    renderPage()

    fireEvent.change(screen.getByLabelText('Date and time'), {
      target: { value: '2026-11-24T08:30' },
    })
    fireEvent.change(screen.getByLabelText('Amount'), { target: { value: '12.50' } })
    fireEvent.change(screen.getByLabelText('Payee'), { target: { value: '  Shop  ' } })
    fireEvent.change(screen.getByLabelText('Note'), { target: { value: '   ' } })
    fireEvent.click(screen.getByRole('button', { name: 'Save record' }))

    await waitFor(() => {
      expect(mocks.mutateAsync).toHaveBeenCalledWith({
        id: undefined,
        input: {
          type: 'expense',
          occurred_at: '2026-11-24T08:30',
          account_id: 'account-1',
          to_account_id: null,
          category_id: 'category-expense',
          amount: 12.5,
          fee_amount: 0,
          payee: 'Shop',
          note: null,
        },
      })
    })
  })

  it('switches to transfer fields and defaults source/destination accounts', () => {
    renderPage()

    fireEvent.click(screen.getByRole('button', { name: 'Transfer' }))

    expect((screen.getByLabelText('Source account') as HTMLSelectElement).value).toBe('account-1')
    expect((screen.getByLabelText('Destination account') as HTMLSelectElement).value).toBe('account-2')
    expect(screen.getByLabelText('Fee')).toBeInTheDocument()
    expect(screen.queryByLabelText('Category')).not.toBeInTheDocument()
    expect(screen.queryByLabelText('Payee')).not.toBeInTheDocument()
  })

  it('blocks saving a transfer to the same account', async () => {
    renderPage()
    fireEvent.click(screen.getByRole('button', { name: 'Transfer' }))

    fireEvent.change(screen.getByLabelText('Destination account'), {
      target: { value: 'account-1' },
    })
    fireEvent.change(screen.getByLabelText('Amount'), { target: { value: '10' } })
    fireEvent.click(screen.getByRole('button', { name: 'Save record' }))

    expect(await screen.findByText('Choose two different accounts.')).toBeInTheDocument()
    expect(mocks.mutateAsync).not.toHaveBeenCalled()
  })

  it('saves a transfer with an optional fee in the unified input shape', async () => {
    renderPage()
    fireEvent.click(screen.getByRole('button', { name: 'Transfer' }))

    fireEvent.change(screen.getByLabelText('Date and time'), {
      target: { value: '2026-11-24T18:15' },
    })
    fireEvent.change(screen.getByLabelText('Amount'), { target: { value: '50' } })
    fireEvent.change(screen.getByLabelText('Fee'), { target: { value: '2.50' } })
    fireEvent.change(screen.getByLabelText('Note'), { target: { value: '  Savings  ' } })
    fireEvent.click(screen.getByRole('button', { name: 'Save record' }))

    await waitFor(() => {
      expect(mocks.mutateAsync).toHaveBeenCalledWith({
        id: undefined,
        input: {
          type: 'transfer',
          occurred_at: '2026-11-24T18:15',
          account_id: 'account-1',
          to_account_id: 'account-2',
          category_id: null,
          amount: 50,
          fee_amount: 2.5,
          payee: null,
          note: 'Savings',
        },
      })
    })
  })

  it('clears incompatible fields when switching back to income', () => {
    renderPage()
    fireEvent.click(screen.getByRole('button', { name: 'Transfer' }))
    fireEvent.change(screen.getByLabelText('Fee'), { target: { value: '3' } })
    fireEvent.click(screen.getByRole('button', { name: 'Income' }))

    expect(screen.getByLabelText('Category')).toBeInTheDocument()
    expect(screen.getByLabelText('Payee')).toBeInTheDocument()
    expect(screen.queryByLabelText('Fee')).not.toBeInTheDocument()
    expect(screen.queryByLabelText('Destination account')).not.toBeInTheDocument()
  })
})
